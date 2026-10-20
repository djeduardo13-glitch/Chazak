  // Chazak — backup na nuvem via GitHub Gist

  // ══════════════════════════════════════════
  // BACKUP NA NUVEM — GitHub Gist (FASE 1)
  // Só cria/atualiza um Gist privado quando o utilizador pede.
  // NÃO substitui o localStorage nem o export/import JSON existentes.
  // ══════════════════════════════════════════
  const GIST_TOKEN_KEY = 'chazak_gh_token';
  const GIST_ID_KEY = 'chazak_gist_id';
  const GIST_LAST_KEY = 'chazak_gist_last_backup';
  const GIST_FILENAME = 'chazak_backup.json';

  function getGistToken() {
    return localStorage.getItem(GIST_TOKEN_KEY) || '';
  }

  async function saveGistToken() {
    const input = document.getElementById('gist-token-input');
    const val = (input?.value || '').trim();
    if (!val) { chzAlert('Cola o token primeiro.'); return; }
    localStorage.setItem(GIST_TOKEN_KEY, val);
    renderGistStatus(); // já preenche o campo com o token guardado (mostrado como ●●●)

    // Tenta encontrar automaticamente um Gist já existente desta conta
    // (útil depois de reinstalar a app / limpar a cache — não é preciso
    // fazer backup manual outra vez para o "Restaurar" voltar a funcionar)
    if (!localStorage.getItem(GIST_ID_KEY)) {
      const encontrado = await tentarDescobrirGist(val);
      if (encontrado) {
        if (dispositivoSemDados()) { restoreFromGist(); return; }
        chzAlert('✅ Token guardado — encontrei automaticamente um backup existente na tua conta! Já podes usar "Restaurar do Gist".');
        return;
      }
    }
    chzAlert('✅ Token guardado neste dispositivo.');
  }

  function dispositivoSemDados() {
    return !(db.jovens && db.jovens.length);
  }

  function mostrarBoasVindasSeVazio() {
    if (dispositivoSemDados() && !localStorage.getItem('chazak_bv_dispensado')) openModal('modal-boasvindas');
  }

  function dispensarBoasVindas() {
    localStorage.setItem('chazak_bv_dispensado', '1');
    closeModal('modal-boasvindas');
  }

  async function iniciarComGist() {
    const input = document.getElementById('bv-token-input');
    const btn = document.getElementById('bv-gist-btn');
    const token = (input?.value || '').trim();
    if (!token) { chzAlert('Cola o token primeiro.'); return; }
    if (btn) { btn.disabled = true; btn.textContent = '☁️ A procurar o backup...'; }
    localStorage.setItem(GIST_TOKEN_KEY, token);
    const encontrado = localStorage.getItem(GIST_ID_KEY) || await tentarDescobrirGist(token);
    if (btn) { btn.disabled = false; btn.textContent = '☁️ Carregar do Gist'; }
    if (!encontrado) {
      chzAlert('Não encontrei nenhum backup do Chazak nesta conta.\n\nVerifica se o token tem acesso a Gists, ou usa "Importar ficheiro JSON".');
      return;
    }
    closeModal('modal-boasvindas');
    restoreFromGist();
  }

  async function tentarDescobrirGist(token) {
    try {
      const res = await fetch('https://api.github.com/gists', {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' }
      });
      if (!res.ok) return false;
      const gists = await res.json();
      const match = gists.find(g => g.files && g.files[GIST_FILENAME]);
      if (match) {
        localStorage.setItem(GIST_ID_KEY, match.id);
        renderGistStatus();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function ligarGistManual() {
    const input = document.getElementById('gist-link-input');
    const val = (input?.value || '').trim();
    if (!val) { chzAlert('Cola o link ou o ID do Gist primeiro.'); return; }
    // Aceita tanto um link completo (https://gist.github.com/user/ID) como só o ID
    const match = val.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i);
    const gistId = match ? match[1] : val.replace(/[^a-f0-9]/gi, '');
    if (!gistId) { chzAlert('Não consegui identificar o ID do Gist nesse texto.'); return; }
    localStorage.setItem(GIST_ID_KEY, gistId);
    if (input) input.value = '';
    renderGistStatus();
    chzAlert('✅ Gist ligado! Já podes usar "Restaurar do Gist".');
  }

  async function removeGistToken() {
    if (!(await chzConfirm('Remover o token guardado? Deixarás de poder fazer backup/restauro até configurares outro.', 'Remover'))) return;
    localStorage.removeItem(GIST_TOKEN_KEY);
    const input = document.getElementById('gist-token-input');
    if (input) input.value = '';
    renderGistStatus();
  }

  function renderGistStatus() {
    const token = getGistToken();
    const statusEl = document.getElementById('gist-token-status');
    const backupBtn = document.getElementById('gist-backup-btn');
    const restoreBtn = document.getElementById('gist-restore-btn');
    const lastEl = document.getElementById('gist-last-backup');
    const tokenInput = document.getElementById('gist-token-input');
    const linkWrap = document.getElementById('gist-link-wrap');
    if (statusEl) {
      statusEl.textContent = token ? '🟢 Token configurado' : '⚪ Nenhum token configurado';
      statusEl.style.color = token ? '#2E7D52' : 'var(--muted)';
    }
    // O campo nunca fica vazio depois de guardado — mostra o token
    // guardado (o browser exibe-o como ●●●● por ser type="password")
    if (tokenInput && document.activeElement !== tokenInput) {
      tokenInput.value = token;
    }
    const disabled = !token;
    if (backupBtn) { backupBtn.disabled = disabled; backupBtn.style.opacity = disabled ? '0.5' : '1'; backupBtn.style.cursor = disabled ? 'not-allowed' : 'pointer'; }
    const hasGist = !!localStorage.getItem(GIST_ID_KEY);
    if (restoreBtn) {
      const rDisabled = disabled || !hasGist;
      restoreBtn.disabled = rDisabled; restoreBtn.style.opacity = rDisabled ? '0.5' : '1'; restoreBtn.style.cursor = rDisabled ? 'not-allowed' : 'pointer';
    }
    // Só mostra a ligação manual se ainda não houver nenhum Gist associado
    if (linkWrap) linkWrap.style.display = (token && !hasGist) ? 'block' : 'none';
    if (lastEl) {
      const last = localStorage.getItem(GIST_LAST_KEY);
      lastEl.textContent = last ? `Último backup: ${new Date(last).toLocaleString('pt-BR')}` : '';
    }
  }

  async function backupToGist() {
    const token = getGistToken();
    if (!token) { chzAlert('Configura primeiro o token do GitHub.'); return; }
    // Proteção: um dispositivo vazio nunca deve apagar o backup bom do Gist
    if (dispositivoSemDados()) {
      const ok = await chzConfirm('⚠️ Este dispositivo não tem nenhum jovem registado.\n\nSe continuares, o backup do Gist vai ser SUBSTITUÍDO por dados vazios. Queres mesmo enviar?', 'Enviar mesmo assim');
      if (!ok) return;
    }
    const btn = document.getElementById('gist-backup-btn');
    if (btn) { btn.disabled = true; btn.textContent = '☁️ A enviar...'; }
    try {
      const payload = JSON.stringify(db, null, 2);
      const gistId = localStorage.getItem(GIST_ID_KEY);
      let res;
      if (gistId) {
        // Atualizar Gist existente
        res = await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' },
          body: JSON.stringify({ files: { [GIST_FILENAME]: { content: payload } } })
        });
      } else {
        // Criar novo Gist privado
        res = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' },
          body: JSON.stringify({
            description: 'Chazak — backup automático',
            public: false,
            files: { [GIST_FILENAME]: { content: payload } }
          })
        });
      }
      if (!res.ok) {
        if (res.status === 401) throw new Error('Token inválido ou sem permissão. Verifica se tem acesso a Gists (Read and write).');
        if (res.status === 404 && gistId) {
          // Gist referenciado já não existe — limpa e tenta criar de novo
          localStorage.removeItem(GIST_ID_KEY);
          throw new Error('O Gist anterior já não existe. Tenta novamente para criar um novo.');
        }
        throw new Error(`Erro do GitHub (${res.status}).`);
      }
      const data = await res.json();
      localStorage.setItem(GIST_ID_KEY, data.id);
      localStorage.setItem(GIST_LAST_KEY, new Date().toISOString());
      renderGistStatus();
      chzAlert('✅ Backup enviado para o Gist privado com sucesso!');
    } catch (err) {
      chzAlert('❌ Falha no backup: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '☁️ Backup agora'; }
      renderGistStatus();
    }
  }

  async function restoreFromGist() {
    const token = getGistToken();
    let gistId = localStorage.getItem(GIST_ID_KEY);
    if (!token) { chzAlert('Configura primeiro o token do GitHub.'); return; }
    // Se ainda não temos referência local, tenta encontrar automaticamente antes de desistir
    if (!gistId) {
      const encontrado = await tentarDescobrirGist(token);
      if (!encontrado) { chzAlert('Ainda não existe nenhum backup no Gist. Faz um "Backup agora" primeiro, ou liga manualmente um Gist existente.'); return; }
      gistId = localStorage.getItem(GIST_ID_KEY);
    }
    const btn = document.getElementById('gist-restore-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⬇️ A ler...'; }
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' }
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Token inválido ou sem permissão.');
        if (res.status === 404) throw new Error('Gist não encontrado (pode ter sido apagado no GitHub).');
        throw new Error(`Erro do GitHub (${res.status}).`);
      }
      const data = await res.json();
      const file = data.files && data.files[GIST_FILENAME];
      if (!file || !file.content) throw new Error('O Gist não contém um backup válido.');
      const imported = JSON.parse(file.content);
      const erroVal = validarBackup(imported);
      if (erroVal) throw new Error('O backup do Gist não parece válido: ' + erroVal);

      // Resumo antes de confirmar (mesmo espírito do importData já existente)
      const counts = Object.entries(imported).filter(([,v]) => Array.isArray(v)).map(([k,v]) => `${k}: ${v.length}`).join('\n');
      const dataGist = data.updated_at ? new Date(data.updated_at).toLocaleString('pt-BR') : 'desconhecida';
      const ok = await chzConfirm(`Restaurar este backup do Gist?\n\nData do backup: ${dataGist}\n\n${counts}\n\nIsto vai substituir os dados atuais deste dispositivo.`, 'Restaurar');
      if (!ok) return;

      db = { ...db, ...imported };
      initJovens();
      saveDB();
      const count = Object.values(imported).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0);
      logImport('Gist (' + dataGist + ')', count);
      await chzAlert('✅ Dados restaurados do Gist com sucesso!');
      location.reload();
    } catch (err) {
      chzAlert('❌ Falha ao restaurar: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '⬇️ Restaurar do Gist'; }
      renderGistStatus();
    }
  }

