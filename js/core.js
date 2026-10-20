  // Chazak — núcleo: escape de texto, diálogos, localidades, autocomplete, modais, base de dados (db/loadDB/saveDB)

  // ══════════════════════════════════════════
  // SEGURANÇA DE TEXTO — todo o texto escrito pelo utilizador (ou vindo de
  // um backup / da API) passa por aqui antes de entrar em innerHTML.
  // esc()   → texto seguro dentro de HTML e de atributos value="..."
  // escJs() → texto seguro dentro de 'aspas' num onclick="...('...')"
  // ══════════════════════════════════════════
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }
  function escJs(s) {
    return esc(String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n'));
  }

  // ══════════════════════════════════════════
  // DIÁLOGOS PERSONALIZADOS — substituem os alert/confirm nativos do navegador (D10)
  // Reutilizam o mesmo estilo visual dos outros modais da app.
  // ══════════════════════════════════════════
  function chzAlert(message) {
    return new Promise(resolve => {
      const msgEl = document.getElementById('chz-dialog-message');
      const actions = document.getElementById('chz-dialog-actions');
      if (!msgEl || !actions) { resolve(true); return; }
      msgEl.textContent = message;
      actions.innerHTML = '';
      const btnOk = document.createElement('button');
      btnOk.className = 'btn-save';
      btnOk.style.flex = '1';
      btnOk.textContent = 'OK';
      btnOk.onclick = () => { closeModal('modal-chz-dialog'); resolve(true); };
      actions.appendChild(btnOk);
      openModal('modal-chz-dialog');
      setTimeout(() => btnOk.focus(), 50);
    });
  }

  function chzConfirm(message, okLabel, cancelLabel) {
    return new Promise(resolve => {
      const msgEl = document.getElementById('chz-dialog-message');
      const actions = document.getElementById('chz-dialog-actions');
      if (!msgEl || !actions) { resolve(window.confirm(message)); return; }
      msgEl.textContent = message;
      actions.innerHTML = '';
      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn-cancel';
      btnCancel.textContent = cancelLabel || 'Cancelar';
      btnCancel.onclick = () => { closeModal('modal-chz-dialog'); resolve(false); };
      const btnOk = document.createElement('button');
      btnOk.className = 'btn-save';
      btnOk.style.background = '#E07B54';
      btnOk.textContent = okLabel || 'Confirmar';
      btnOk.onclick = () => { closeModal('modal-chz-dialog'); resolve(true); };
      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      openModal('modal-chz-dialog');
    });
  }

  // Versão para usar dentro de onclick="..." inline (não pode usar await diretamente)
  async function chzConfirmDelete(message, onYes, okLabel) {
    if (await chzConfirm(message, okLabel || 'Remover')) onYes();
  }

  // Os dados dos jovens NÃO ficam no código (repo pública).
  // Vêm sempre do Gist privado ou de um backup JSON.

  const DEFAULT_LUOGHI = [
    'Altedo (Bologna)','Aosta','Barberino Val d\'Elsa (Siena)','Baronissi (Salerno)',
    'Beinette (Mondovì)','Belvedere Marittimo','Belvedere M. (Malafarina)',
    'Biella','Bianzone (Sondrio)','Busto Arsizio','Cerenzia','Chorio',
    'Codogno','Collecchio (Parma)','Dueville','Ferrara','Firenze',
    'Frosinone','Genova','Guardia Piemontese','Inverigo','Isola d\'Elba',
    'Lioni','Lodi','Messina','Oppeano (Verona)','Palermo',
    'Petrella Tifernina','Piacenza','Pianezza (Torino)','Portoferraio (Isola d\'Elba)',
    'Ragusa','Roma','Roncade','Roseto degli Abruzzi','San Giorgio Bigarello (Mantova)',
    'Sardegna','Sesto San Giovanni (Milano)','Spinetta Marengo (Alessandria)',
    'Spoltore (Pescara)','Statte (Taranto)','Teramo','Torre Boldone (Bergamo)',
    'Trento','Trentola Ducenta (Aversa)','Trieste',
  ];

  function initLuoghi() {
    if (!db.luoghi) db.luoghi = [];
    // Garantir locals padrão para Palavras
    ['Collechio (Parma)'].forEach(l => {
      if (!db.luoghi.includes(l)) { db.luoghi.push(l); }
    });
    let changed = false;
    DEFAULT_LUOGHI.forEach(l => {
      if (!db.luoghi.includes(l)) { db.luoghi.push(l); changed = true; }
    });
    if (changed) { db.luoghi.sort(); saveDB(); }
    refreshLuoghiSelects();
  }

  // ── LOCAL AUTOCOMPLETE ──
  // Shared ac for all local inputs: ev-local-input, nv-dest-input, serv-local-input
  function acLocal(inp, dropId) {
    const box = document.getElementById(dropId);
    if (!box) return;
    const q = (typeof inp === 'string' ? inp : inp.value).trim().toLowerCase();
    const matches = (db.luoghi||[]).filter(l => !q || l.toLowerCase().includes(q));
    if (!matches.length) { box.style.display = 'none'; return; }
    box.innerHTML = matches.slice(0,7).map(l =>
      `<div class="ac-item" onmousedown="selectLocal('${escJs(l)}','${dropId}')">${esc(l)}</div>`
    ).join('');
    box.style.display = 'block';
  }

  function selectLocal(val, dropId) {
    const box = document.getElementById(dropId);
    if (!box) return;
    const inp = box.previousElementSibling;
    if (inp) inp.value = val;
    hideAc(dropId);
    if (dropId === 'ac-vde-local') saveViagemField('destino', val);
  }

  // Stub helpers kept for serv modal (still uses select pattern) 
  function refreshLuoghiSelects() {
    // serv modal still uses select
    const sel = document.getElementById('sel-local-serv');
    if (sel) {
      const cur = sel.value;
      const opts = (db.luoghi||[]).map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
      sel.innerHTML = `<option value="">— Selecionar —</option>${opts}<option value="__altro__">Outro (escrever...)</option>`;
      if (cur) sel.value = cur;
    }
  }

  function onLocalSelect(selId, inputId) {
    const sel = document.getElementById(selId);
    const inp = document.getElementById(inputId);
    if (!sel || !inp) return;
    if (sel.value === '__altro__') { inp.style.display = 'block'; inp.focus(); }
    else { inp.style.display = 'none'; inp.value = ''; }
  }

  function getLocalValue(selId, inputId) {
    const sel = document.getElementById(selId);
    if (!sel) {
      // ac-based inputs — read directly by known id map
      const map = { 'sel-local-evento':'ev-local-input', 'sel-local-viagem':'nv-dest-input' };
      const inputEl = document.getElementById(map[selId] || selId);
      return inputEl ? inputEl.value.trim() : '';
    }
    if (sel.value === '__altro__') return (document.getElementById(inputId)||{}).value?.trim()||'';
    return sel.value;
  }

  function setLocalSelect(selId, inputId, value) {
    // For ac-based: just set the input value
    const map = { 'sel-local-evento':'ev-local-input', 'sel-local-viagem':'nv-dest-input' };
    const acId = map[selId];
    if (acId) {
      const inp = document.getElementById(acId);
      if (inp) inp.value = value || '';
      return;
    }
    // Legacy select path (serv)
    const sel = document.getElementById(selId);
    const inp = document.getElementById(inputId);
    if (!sel || !inp) return;
    if (!value) { sel.value = ''; inp.style.display = 'none'; return; }
    const exists = [...sel.options].some(o => o.value === value);
    if (exists) { sel.value = value; inp.style.display = 'none'; }
    else { sel.value = '__altro__'; inp.style.display = 'block'; inp.value = value; }
  }

  // ── TAG AUTOCOMPLETE (shared for ideias + curiosidades) ──
  function acTag(inp, dropId, ctx) {
    const box = document.getElementById(dropId);
    if (!box) return;
    const q = inp.value.trim().toLowerCase();
    // Get all existing tags for this context
    const allTags = ctx === 'cur'
      ? getAllCurTags()
      : getAllTags();
    const pending = ctx === 'cur' ? pendingCurTags : pendingTags;
    const matches = allTags.filter(t => t !== '' && !pending.includes(t) && (!q || t.includes(q)));
    if (!matches.length) { box.style.display = 'none'; return; }
    box.innerHTML = matches.slice(0,6).map(t =>
      `<div class="ac-item" onmousedown="selectTag('${escJs(t)}','${ctx}')">${esc(t)}</div>`
    ).join('');
    box.style.display = 'block';
  }

  function selectTag(tag, ctx) {
    if (ctx === 'cur') {
      if (!pendingCurTags.includes(tag)) { pendingCurTags.push(tag); renderCurModalTags(); }
      const inp = document.getElementById('cur-tag-input');
      if (inp) inp.value = '';
    } else {
      if (!pendingTags.includes(tag)) { pendingTags.push(tag); renderModalTags(); renderSavedTagSuggestions(); }
      const inp = document.getElementById('ideia-tag-input');
      if (inp) inp.value = '';
    }
    hideAc(ctx === 'cur' ? 'ac-cur-tag' : 'ac-ideia-tag');
  }

  // ══════════════════════════════════════════
  // AUTOCOMPLETE DE JOVEM — função única, reaproveitada por:
  // acPessoa (convidados/passageiros), acMotorista (motorista do carro),
  // acEncontro (presentes num encontro), acIrmao (ligação de irmãos).
  // Cada uma só passa a sua configuração — a lógica de busca/desenho é uma só.
  // ══════════════════════════════════════════
  function acJovemPicker(query, opts) {
    const box = document.getElementById(opts.boxId);
    if (!box) return;
    const empty = opts.emptyId ? document.getElementById(opts.emptyId) : null;
    const q = (query || '').trim().toLowerCase();

    let jovens = db.jovens || [];
    if (opts.onlyAtivos !== false) jovens = jovens.filter(j => j.ativo !== false);
    if (opts.excluirSelfId) jovens = jovens.filter(j => j.id !== opts.excluirSelfId);

    const excluidos = opts.excluir || [];
    const chave = opts.excluirPor || 'name';
    let matches = jovens.filter(j => !q || j.name.toLowerCase().includes(q));
    if (!opts.dimInsteadOfHide) matches = matches.filter(j => !excluidos.includes(j[chave]));
    matches = matches.slice(0, 8);

    box.innerHTML = '';
    if (!matches.length) {
      box.style.display = 'none';
      if (empty) { empty.style.display = 'block'; empty.textContent = q ? `Nenhum resultado para "${q}"` : 'Começa a escrever para buscar...'; }
      return;
    }
    if (empty) empty.style.display = 'none';

    let _picking = false;
    const inp = opts.inputId ? document.getElementById(opts.inputId) : null;
    if (opts.useTouchFix && inp) {
      if (inp._acBlur) inp.removeEventListener('blur', inp._acBlur);
      inp._acBlur = () => { if (!_picking) box.style.display = 'none'; };
      inp.addEventListener('blur', inp._acBlur);
    }

    matches.forEach(j => {
      const dimmed = !!(opts.dimInsteadOfHide && excluidos.includes(j[chave]));
      const item = document.createElement('div');
      item.className = 'ac-item';
      if (opts.style === 'simples') {
        item.style.cssText = 'padding:10px 14px;font-size:14px;border-bottom:1px solid var(--border)';
        item.textContent = j.name;
      } else {
        const compacta = opts.style === 'compacta';
        item.style.cssText = (dimmed ? 'opacity:0.5;' : '') + `padding:${compacta ? '10px 12px' : '12px 4px'};border-bottom:1px solid var(--border)`;
        item.innerHTML = `<div style="font-size:${compacta ? '14px' : '15px'};font-weight:500">${esc(j.name)}${dimmed && opts.dimLabel ? ` <span style="font-size:11px;color:var(--muted)">${opts.dimLabel}</span>` : ''}</div>
          <div style="font-size:${compacta ? '11px' : '12px'};color:var(--muted)">${esc(j.cat||'')}</div>`;
      }
      const pick = (e) => {
        e.preventDefault();
        _picking = true;
        opts.onSelect(j, dimmed);
        setTimeout(() => { _picking = false; }, 300);
      };
      item.addEventListener('mousedown', pick);
      if (opts.useTouchFix) item.addEventListener('touchstart', pick, { passive: false });
      box.appendChild(item);
    });
    box.style.display = 'block';
  }

  // ── AUTOCOMPLETE HELPERS ──
  function hideAc(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  // Evento autocomplete (in modal)
  function acEvento(val) {
    const box = document.getElementById('ac-evento');
    if (!box) return;
    const q = val.trim().toLowerCase();
    const today = new Date().toISOString().slice(0,10);
    const all = (db.eventos||[])
      .filter(e => e.data >= today)
      .sort((a,b) => a.data.localeCompare(b.data));
    const matches = q
      ? all.filter(e => (e.tipo+' '+e.local).toLowerCase().includes(q))
      : all.slice(0, 6);
    if (!matches.length) { box.style.display = 'none'; return; }
    box.innerHTML = matches.slice(0,6).map(e =>
      `<div class="ac-item" onmousedown="selectAcEvento('${escJs(e.tipo+' — '+(e.local||'')+' ('+fmtDate(e.data)+')')}', '${escJs(e.data)}')">
        <div>${esc(e.tipo)}${e.local ? ' — '+esc(e.local) : ''}</div>
        <div class="ac-sub">${fmtDate(e.data)}</div>
      </div>`
    ).join('');
    box.style.display = 'block';
  }

  function selectAcEvento(label, date) {
    document.getElementById('nv-evento-input').value = label;
    hideAc('ac-evento');
    if (date) {
      document.getElementById('nv-data-ida').value = date;
      document.getElementById('nv-data-volta').value = date;
    }
  }

  // Pessoa autocomplete (convidados + passageiros)
  let pessoaCtx = null; // { type: 'convidado' | 'passageiro', carroIdx: null | number }

  function openPessoaPicker(type, carroIdx = null) {
    pessoaCtx = { type, carroIdx };
    const title = type === 'convidado' ? '👥 Adicionar convidado' : '🚗 Adicionar passageiro';
    document.getElementById('pessoa-modal-title').textContent = title;
    document.getElementById('pessoa-search').value = '';
    document.getElementById('pessoa-outro').value = '';
    hideAc('ac-pessoa');
    acPessoa('');
    openModal('modal-pessoa');
    setTimeout(() => document.getElementById('pessoa-search').focus(), 200);
  }

  function acPessoa(val) {
    if (currentViagemIdx === null) {
      const box = document.getElementById('ac-pessoa');
      const empty = document.getElementById('pessoa-empty');
      if (box) box.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    const v = db.viagens[currentViagemIdx];
    acJovemPicker(val, {
      boxId: 'ac-pessoa',
      emptyId: 'pessoa-empty',
      excluir: (v.convidados||[]).map(c=>c.nome),
      excluirPor: 'name',
      dimInsteadOfHide: true,
      dimLabel: '(já convidado)',
      style: 'card',
      onSelect: (j, dimmed) => selectPessoa(j.name, dimmed, j.id)
    });
  }

  function selectPessoa(nome, alreadyInv, jovemId) {
    if (!pessoaCtx || currentViagemIdx === null) return;
    const v = db.viagens[currentViagemIdx];
    if (pessoaCtx.type === 'convidado') {
      if (!alreadyInv) {
        v.convidados.push({ id:'inv_'+Date.now(), nome, confirmado: false, jovemId: jovemId || null });
        saveDB(); renderConvidados();
      }
    } else {
      // passageiro — add to right car
      const ci = pessoaCtx.carroIdx;
      if (ci === null) {
        // meu carro — find first empty slot
        if (!v.meuCarro.passageiros) v.meuCarro.passageiros = [];
        if (!v.meuCarro.passageirosIds) v.meuCarro.passageirosIds = [];
        const maxP = (v.meuCarro.lugares||6) - 1;
        const emptySlot = v.meuCarro.passageiros.findIndex((p,i) => i < maxP && !p);
        const idx = emptySlot >= 0 ? emptySlot : v.meuCarro.passageiros.length;
        if (idx < maxP) { v.meuCarro.passageiros[idx] = nome; v.meuCarro.passageirosIds[idx] = jovemId || null; saveDB(); renderCarros(); }
        else { chzAlert('Meu carro está cheio!'); }
      } else {
        const carro = v.carros[ci];
        if (!carro.passageiros) carro.passageiros = [];
        if (!carro.passageirosIds) carro.passageirosIds = [];
        const maxP = carro.lugares - 1;
        const emptySlot = carro.passageiros.findIndex((p,i) => i < maxP && !p);
        const idx = emptySlot >= 0 ? emptySlot : carro.passageiros.length;
        if (idx < maxP) { carro.passageiros[idx] = nome; carro.passageirosIds[idx] = jovemId || null; saveDB(); renderCarros(); }
        else { chzAlert('Este carro está cheio!'); }
      }
    }
    // Keep modal open for more additions
    document.getElementById('pessoa-search').value = '';
    acPessoa('');
  }

  function addPessoaOutro() {
    const nome = document.getElementById('pessoa-outro').value.trim();
    if (!nome || currentViagemIdx === null) return;
    const v = db.viagens[currentViagemIdx];
    if (pessoaCtx?.type === 'convidado') {
      v.convidados.push({ id:'inv_'+Date.now(), nome, confirmado: false, jovemId: null });
      saveDB(); renderConvidados();
    } else {
      const ci = pessoaCtx?.carroIdx;
      if (ci === null) {
        if (!v.meuCarro.passageiros) v.meuCarro.passageiros = [];
        if (!v.meuCarro.passageirosIds) v.meuCarro.passageirosIds = [];
        v.meuCarro.passageiros.push(nome);
        v.meuCarro.passageirosIds.push(null);
        saveDB(); renderCarros();
      } else {
        if (!v.carros[ci].passageiros) v.carros[ci].passageiros = [];
        if (!v.carros[ci].passageirosIds) v.carros[ci].passageirosIds = [];
        v.carros[ci].passageiros.push(nome);
        v.carros[ci].passageirosIds.push(null);
        saveDB(); renderCarros();
      }
    }
    document.getElementById('pessoa-outro').value = '';
  }

  function openNovaViagem() {
    const today = new Date().toISOString().slice(0,10);
    document.getElementById('nv-evento-input').value = '';
    hideAc('ac-evento');
    const destInp = document.getElementById('nv-dest-input');
    if (destInp) destInp.value = '';
    document.getElementById('nv-data-ida').value = today;
    document.getElementById('nv-data-volta').value = today;
    document.getElementById('nv-mesmo-dia').checked = false;
    document.getElementById('nv-volta-wrap').style.opacity = '1';
    openModal('modal-viagem');
  }

  // ── MODAL CONTROLS ──
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    document.body.appendChild(el); // garante que este modal fica sempre por cima de qualquer outro já aberto
    el.classList.add('show');
  }
  function closeModal(id) { document.getElementById(id).classList.remove('show'); }
  // Use delegation so modals added after script also work
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
  });

  // ── DATA STORE ──
  let db = {
    jovens: [],
    servicos: [],
    viagens: [],
    leituras: [],
    curiosidades: [],
    livros: [],
    favoritos: [],
    plannerLidos: {},
    luoghi: [],
    ideias: [],
    encontros: [],
    presencas: []
  };

  function loadDB() {
    try {
      const saved = localStorage.getItem('cooperador_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Don't let an empty luoghi from old backups wipe the defaults
        if (Array.isArray(parsed.luoghi) && parsed.luoghi.length === 0) delete parsed.luoghi;
        db = { ...db, ...parsed };
      }
    } catch(e) {}
    if (!db.encontros) db.encontros = [];
    if (!db.presencas) db.presencas = [];
    if (!db.versiculosCache) db.versiculosCache = {};
    // updateStats called after DOMContentLoaded, not here
  }

  // Avisa só uma vez por sessão, para não encher o ecrã de alertas
  let _avisoMemoriaMostrado = false;

  function saveDB() {
    let ok = false;
    try {
      localStorage.setItem('cooperador_db', JSON.stringify(db));
      ok = true;
    } catch (e) {
      // Memória do navegador cheia: a cache dos versículos é só uma cópia do que
      // vem da internet, por isso pode ser esvaziada sem perder dados.
      const cacheTinhaDados = db.versiculosCache && Object.keys(db.versiculosCache).length > 0;
      if (cacheTinhaDados) {
        db.versiculosCache = {};
        try {
          localStorage.setItem('cooperador_db', JSON.stringify(db));
          ok = true;
        } catch (e2) { /* continua cheio — trata abaixo */ }
      }
      if (!ok) {
        console.error('saveDB falhou:', e);
        if (!_avisoMemoriaMostrado) {
          _avisoMemoriaMostrado = true;
          chzAlert('⚠️ Não foi possível guardar as alterações: a memória do navegador está cheia.\n\nFaz já um backup (Exportar ou Gist) para não perder dados, e depois apaga conteúdos que já não precisas.');
        }
      }
    }
    if (ok) { _avisoMemoriaMostrado = false; sbMarcarAlterado(); }
    // Only update stats if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') { updateStats(); atualizarBadgeAniversarios(); }
    return ok;
  }

  function updateStats() {
    const active = (db.jovens||[]).filter(j => j.ativo !== false).length;
    const alumni = (db.jovens||[]).filter(j => j.ativo === false).length;
    const el = id => document.getElementById(id);
    if (el('stat-jovens'))   el('stat-jovens').textContent   = active;
    if (el('stat-inativos')) el('stat-inativos').textContent = alumni;
  }

