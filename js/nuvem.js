  // Chazak — nuvem Supabase (login + sincronização)

  // ══════════════════════════════════════════
  // NUVEM — Supabase (login + sincronização automática)
  // O localStorage continua a ser a cópia local (funciona offline);
  // a nuvem guarda uma cópia de tudo numa única linha da tabela "backups",
  // protegida por RLS (cada conta só vê a sua própria linha).
  // ══════════════════════════════════════════
  const SB_URL = 'https://lqrmnkbcahtxhvxpgjag.supabase.co';
  const SB_KEY = 'sb_publishable_v-XBmyHbNHJa0t9fuCD4KQ_HF_kc5hw'; // chave pública: a proteção vem da RLS
  const SB_SESSION_KEY = 'chazak_sb_session';
  const SB_REMOTE_TS_KEY = 'chazak_sb_remote_ts';   // versão da nuvem que este dispositivo conhece
  const SB_DIRTY_KEY = 'chazak_sb_dirty';           // há alterações locais por enviar
  const SB_LAST_SYNC_KEY = 'chazak_sb_last_sync';
  // var (não let/const) porque saveDB pode chamar sbMarcarAlterado antes desta parte correr
  var _sbSuspendDirty = false, _sbPushTimer = null, _sbBusy = false, _sbErro = '', _sbRecarregando = false;

  function sbGetSession() {
    try { return JSON.parse(localStorage.getItem('chazak_sb_session') || 'null'); } catch { return null; }
  }
  function sbSetSession(data) {
    if (!data) { localStorage.removeItem(SB_SESSION_KEY); return; }
    const antiga = sbGetSession() || {};
    localStorage.setItem(SB_SESSION_KEY, JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      email: data.user?.email || antiga.email || '',
      user_id: data.user?.id || antiga.user_id || ''
    }));
  }

  async function sbAuth(grant, body) {
    const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=${grant}`, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error_description || data.msg || data.message || `Erro ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // Devolve um access token válido (renova-o se estiver a expirar)
  async function sbToken() {
    const s = sbGetSession();
    if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try {
      const data = await sbAuth('refresh_token', { refresh_token: s.refresh_token });
      sbSetSession(data);
      return data.access_token;
    } catch (e) {
      if (e.status) { sbSetSession(null); _sbErro = 'Sessão terminada — entra outra vez.'; } // sem e.status = sem rede
      return null;
    }
  }

  async function sbRest(path, opts = {}) {
    const token = await sbToken();
    if (!token) throw new Error(sbGetSession() ? 'Sem ligação ao servidor.' : 'Sessão terminada — entra outra vez.');
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      ...opts,
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const err = new Error(`Erro do servidor (${res.status}). ${txt.slice(0, 120)}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  async function sbLerNuvem(comDados) {
    const rows = await sbRest(`backups?select=${comDados ? 'dati,updated_at' : 'updated_at'}&limit=1`);
    return (rows && rows[0]) || null;
  }

  // A cache dos versículos vem da internet — não vale a pena ir para a nuvem
  function sbPayload() {
    const { versiculosCache, ...resto } = db;
    return resto;
  }

  function sbMarcarAlterado() {
    if (_sbSuspendDirty) return;
    try { localStorage.setItem('chazak_sb_dirty', '1'); } catch {}
    if (!localStorage.getItem('chazak_sb_session')) return;
    clearTimeout(_sbPushTimer);
    _sbPushTimer = setTimeout(() => { _sbPushTimer = null; sbEnviar(); }, 4000);
    sbRenderStatus();
  }

  async function sbEnviar({ forcar = false } = {}) {
    const s = sbGetSession();
    if (!s || _sbBusy) return false;
    if (!navigator.onLine) { sbRenderStatus(); return false; }
    if (dispositivoSemDados() && !forcar) return false; // nunca apagar a nuvem com um dispositivo vazio
    _sbBusy = true; sbRenderStatus();
    let conflito = false, ok = false;
    try {
      if (!forcar) {
        const remoto = await sbLerNuvem(false);
        const conhecido = localStorage.getItem(SB_REMOTE_TS_KEY);
        if (remoto && remoto.updated_at !== conhecido) conflito = true;
      }
      if (!conflito) {
        const rows = await sbRest('backups?on_conflict=user_id&select=updated_at', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({ user_id: s.user_id, dati: sbPayload(), updated_at: new Date().toISOString() })
        });
        const ts = rows && rows[0] && rows[0].updated_at;
        if (ts) localStorage.setItem(SB_REMOTE_TS_KEY, ts);
        localStorage.removeItem(SB_DIRTY_KEY);
        localStorage.setItem(SB_LAST_SYNC_KEY, new Date().toISOString());
        _sbErro = '';
        ok = true;
      }
    } catch (e) {
      console.warn('Supabase (enviar):', e);
      _sbErro = e instanceof TypeError ? 'Sem ligação ao servidor.' : e.message;
    } finally {
      _sbBusy = false;
      sbRenderStatus();
    }
    if (conflito) await sbConflito();
    return ok;
  }

  async function sbAplicarNuvem(remoto) {
    const erro = validarBackup(remoto.dati);
    if (erro) { _sbErro = 'Os dados na nuvem não parecem válidos: ' + erro; sbRenderStatus(); return false; }
    const cache = db.versiculosCache || {};
    db = { ...db, ...remoto.dati, versiculosCache: cache };
    _sbSuspendDirty = true;
    initJovens();
    saveDB();
    _sbSuspendDirty = false;
    localStorage.setItem(SB_REMOTE_TS_KEY, remoto.updated_at);
    localStorage.removeItem(SB_DIRTY_KEY);
    localStorage.setItem(SB_LAST_SYNC_KEY, new Date().toISOString());
    _sbRecarregando = true;
    location.reload();
    return true;
  }

  async function sbConflito() {
    const usarNuvem = await chzConfirm(
      '☁️ Há uma versão mais recente na nuvem (de outro dispositivo) e também alterações neste dispositivo que ainda não foram enviadas.\n\n' +
      'Qual queres manter?\n\n' +
      '☁️ Nuvem — carrega a versão da nuvem; as alterações deste dispositivo perdem-se.\n\n' +
      '📱 Este dispositivo — envia esta versão e substitui a da nuvem.',
      '☁️ Nuvem', '📱 Este dispositivo');
    try {
      if (usarNuvem) {
        const remoto = await sbLerNuvem(true);
        if (remoto) await sbAplicarNuvem(remoto);
      } else {
        await sbEnviar({ forcar: true });
      }
    } catch (e) {
      _sbErro = e.message; sbRenderStatus();
    }
  }

  // Ao abrir a app (e no "Sincronizar agora"): compara com a nuvem e decide
  async function sbSincronizar() {
    if (!sbGetSession() || !navigator.onLine) { sbRenderStatus(); return; }
    try {
      const remoto = await sbLerNuvem(false);
      const conhecido = localStorage.getItem(SB_REMOTE_TS_KEY);
      const alterado = !!localStorage.getItem(SB_DIRTY_KEY);
      if (!remoto) {                                   // conta ainda vazia na nuvem
        if (!dispositivoSemDados()) await sbEnviar({ forcar: true });
        return;
      }
      if (remoto.updated_at === conhecido) {          // a nuvem não mudou
        if (alterado) await sbEnviar();
        return;
      }
      if (!alterado || dispositivoSemDados()) {       // a nuvem mudou e aqui não há nada por enviar
        const completo = await sbLerNuvem(true);
        if (completo) await sbAplicarNuvem(completo);
        return;
      }
      await sbConflito();                              // mudou nos dois lados
    } catch (e) {
      console.warn('Supabase (sincronizar):', e);
      _sbErro = e instanceof TypeError ? 'Sem ligação ao servidor.' : e.message;
    } finally {
      sbRenderStatus();
    }
  }

  async function sbSincronizarAgora() {
    _sbErro = '';
    await sbSincronizar();
    if (_sbErro) chzAlert('❌ ' + _sbErro);
  }

  async function sbEntrar(emailId, passId, btnId) {
    const emailEl = document.getElementById(emailId);
    const passEl = document.getElementById(passId);
    const btn = document.getElementById(btnId);
    const email = (emailEl?.value || '').trim();
    const pass = passEl?.value || '';
    if (!email || !pass) { chzAlert('Escreve o email e a palavra-passe.'); return false; }
    const txtOriginal = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'A entrar…'; }
    try {
      const data = await sbAuth('password', { email, password: pass });
      sbSetSession(data);
      if (passEl) passEl.value = '';
      _sbErro = '';
      await sbSincronizar();
      return true;
    } catch (e) {
      const msg = e instanceof TypeError ? 'sem ligação à internet.'
                : e.status === 400 ? 'email ou palavra-passe errados.'
                : e.message;
      chzAlert('❌ Não foi possível entrar: ' + msg);
      return false;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = txtOriginal; }
      sbRenderStatus();
    }
  }

  async function entrarBoasVindas() {
    const ok = await sbEntrar('bv-email', 'bv-pass', 'bv-login-btn');
    if (!ok || _sbRecarregando) return;
    if (dispositivoSemDados()) {
      chzAlert('✅ Sessão iniciada!\n\nAinda não há dados na tua conta na nuvem. Carrega-os uma vez pelo Gist ou por um ficheiro JSON (em "Outras formas de carregar os dados") — a partir daí ficam sincronizados automaticamente.');
    } else {
      closeModal('modal-boasvindas');
    }
  }

  async function sbSair() {
    const pendente = localStorage.getItem(SB_DIRTY_KEY) ? '\n\n⚠️ Há alterações que ainda não foram enviadas para a nuvem.' : '';
    if (!(await chzConfirm('Sair da conta? Os dados ficam neste dispositivo, mas deixam de ser sincronizados.' + pendente, 'Sair'))) return;
    const s = sbGetSession();
    try {
      await fetch(`${SB_URL}/auth/v1/logout`, { method: 'POST', headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${s?.access_token}` } });
    } catch {}
    sbSetSession(null);
    localStorage.removeItem(SB_REMOTE_TS_KEY);
    _sbErro = '';
    sbRenderStatus();
  }

  function sbRenderStatus() {
    const out = document.getElementById('sb-logged-out');
    const inn = document.getElementById('sb-logged-in');
    if (!out || !inn) return;
    const s = sbGetSession();
    out.style.display = s ? 'none' : 'block';
    inn.style.display = s ? 'block' : 'none';
    if (!s) return;
    const userEl = document.getElementById('sb-user');
    if (userEl) userEl.textContent = '👤 ' + (s.email || 'Sessão iniciada');
    const st = document.getElementById('sb-status');
    if (!st) return;
    const last = localStorage.getItem(SB_LAST_SYNC_KEY);
    const quando = last ? new Date(last).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    if (!navigator.onLine) st.textContent = '📴 Sem internet — as alterações são enviadas quando a ligação voltar';
    else if (_sbBusy) st.textContent = '🔄 A sincronizar…';
    else if (_sbErro) st.textContent = '🔴 ' + _sbErro;
    else if (localStorage.getItem(SB_DIRTY_KEY)) st.textContent = '🟡 Alterações por enviar';
    else st.textContent = '🟢 Sincronizado' + (quando ? ' · ' + quando : '');
  }

  window.addEventListener('online', () => { if (localStorage.getItem('chazak_sb_dirty')) sbEnviar(); else sbRenderStatus(); });
  window.addEventListener('offline', () => sbRenderStatus());
  document.addEventListener('visibilitychange', () => {
    // ao sair da app, envia já o que estava à espera
    if (document.visibilityState === 'hidden' && _sbPushTimer) { clearTimeout(_sbPushTimer); _sbPushTimer = null; sbEnviar(); }
  });

