  // Chazak — aba Dados: perfil pessoal, histórico de importações, localidades, exportar/importar

  // ── PERFIL PESSOAL ──
  function savePerfil() {
    const p = {
      nome: document.getElementById('perf-nome')?.value || '',
      congregacao: document.getElementById('perf-congregacao')?.value || ''
    };
    localStorage.setItem('cooperador_perfil', JSON.stringify(p));
  }

  function loadPerfil() {
    try {
      const p = JSON.parse(localStorage.getItem('cooperador_perfil') || '{}');
      const nome = document.getElementById('perf-nome');
      const cong = document.getElementById('perf-congregacao');
      if (nome) nome.value = p.nome || '';
      if (cong) cong.value = p.congregacao || '';
    } catch(e) {}
  }

  // ── HISTÓRICO DE IMPORTAÇÕES ──
  function logImport(filename, count) {
    const hist = JSON.parse(localStorage.getItem('cooperador_imports') || '[]');
    hist.unshift({ date: new Date().toISOString(), filename, count });
    if (hist.length > 20) hist.splice(20);
    localStorage.setItem('cooperador_imports', JSON.stringify(hist));
  }

  function renderImportHistory() {
    const container = document.getElementById('histimport-list');
    if (!container) return;
    const hist = JSON.parse(localStorage.getItem('cooperador_imports') || '[]');
    if (!hist.length) {
      container.innerHTML = '<div style="font-size:13px;color:var(--muted);text-align:center;padding:12px 0">Nenhuma importação ainda.</div>';
      return;
    }
    container.innerHTML = hist.map(h => {
      const d = new Date(h.date);
      const dateStr = d.toLocaleDateString('pt-BR', {day:'numeric',month:'short',year:'numeric'});
      const timeStr = d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
        <div>
          <div style="font-weight:500">${esc(h.filename)}</div>
          <div style="font-size:11px;color:var(--muted)">${dateStr} às ${timeStr}</div>
        </div>
        <span style="font-size:11px;color:var(--accent);font-weight:600">${h.count} registros</span>
      </div>`;
    }).join('');
  }

  // ── GENERIC PANEL TOGGLE (for perfil, histimport) ──
  function togglePanel(id) {
    const panel = document.getElementById(id + '-panel');
    const arrow = document.getElementById(id + '-arrow');
    const header = document.getElementById(id + '-header');
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    arrow.classList.toggle('open', !isOpen);
    header.classList.toggle('closed', isOpen);
    if (!isOpen) {
      if (id === 'perfil') loadPerfil();
      if (id === 'histimport') renderImportHistory();
      if (id === 'gisttoken') renderGistStatus();
    }
  }

  // ── GESTÃO DE LOCALIDADES ──
  function toggleLuoghiPanel() {
    const panel = document.getElementById('luoghi-panel');
    const arrow = document.getElementById('luoghi-arrow');
    const header = document.getElementById('luoghi-header');
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    arrow.classList.toggle('open', !isOpen);
    header.classList.toggle('closed', isOpen);
    if (!isOpen) renderLuoghi();
  }

  function renderLuoghi() {
    const container = document.getElementById('luoghi-list');
    if (!container) return;
    const list = db.luoghi || [];
    if (!list.length) {
      container.innerHTML = `<div style="font-size:13px;color:var(--muted);text-align:center;padding:16px 0">Nenhuma localidade cadastrada.</div>`;
      return;
    }
    container.innerHTML = list.map((l, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px;font-size:13px">
        <span>📍 ${esc(l)}</span>
        <button onclick="delLuogo(${i})" style="background:none;border:none;color:#E07B54;font-size:16px;cursor:pointer;padding:0 4px;line-height:1">×</button>
      </div>`).join('');
  }

  function addLuogo() {
    const inp = document.getElementById('new-luogo-input');
    const val = inp.value.trim();
    if (!val) return;
    if (!db.luoghi) db.luoghi = [];
    if (db.luoghi.includes(val)) { chzAlert('Esta localidade já existe!'); return; }
    db.luoghi.push(val);
    db.luoghi.sort();
    inp.value = '';
    saveDB();
    refreshLuoghiSelects();
    renderLuoghi();
    updateStats();
  }

  async function delLuogo(idx) {
    if (await chzConfirm(`Remover "${db.luoghi[idx]}"?`, 'Remover')) {
      db.luoghi.splice(idx, 1);
      saveDB();
      refreshLuoghiSelects();
      renderLuoghi();
      updateStats();
    }
  }

  // ── EXPORT / IMPORT ──
  function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'_');
    a.download = `Chazak_backup_${today}_(v5.8.0).json`;
    a.click();
  }

  // Verifica se um objeto tem a forma de um backup do Chazak.
  // Devolve '' se estiver tudo bem, ou uma frase a explicar o problema.
  function validarBackup(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'O conteúdo não é um objeto de dados.';
    const LISTAS = ['jovens','servicos','viagens','leituras','curiosidades','livros','favoritos','luoghi','ideias','encontros','presencas','eventos'];
    const conhecidas = LISTAS.filter(k => k in obj);
    if (!conhecidas.length) return 'Não tem nenhuma das secções da app (jovens, palavras, agenda, …).';
    for (const k of conhecidas) {
      if (!Array.isArray(obj[k])) return `A secção "${k}" não é uma lista.`;
    }
    if (Array.isArray(obj.jovens)) {
      const mau = obj.jovens.findIndex(j => !j || typeof j !== 'object' || typeof j.name !== 'string' || !j.name.trim());
      if (mau !== -1) return `O jovem nº ${mau + 1} não tem nome válido.`;
    }
    if (Array.isArray(obj.luoghi) && obj.luoghi.some(l => typeof l !== 'string')) return 'A lista de localidades tem valores inválidos.';
    return '';
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async ev => {
        let imported;
        try {
          imported = JSON.parse(ev.target.result);
        } catch {
          chzAlert('❌ Arquivo inválido: não é um ficheiro JSON.');
          return;
        }
        const erro = validarBackup(imported);
        if (erro) {
          chzAlert('❌ Este ficheiro não parece um backup do Chazak.\n\n' + erro + '\n\nNada foi alterado.');
          return;
        }
        const NOMES = { jovens:'Jovens', servicos:'Palavras', viagens:'Viagens', leituras:'Leituras', curiosidades:'Curiosidades',
                        livros:'Livros', favoritos:'Favoritos', luoghi:'Localidades', ideias:'Ideias', encontros:'Encontros',
                        presencas:'Presenças', eventos:'Eventos' };
        const resumo = Object.keys(NOMES)
          .filter(k => Array.isArray(imported[k]))
          .map(k => `${NOMES[k]}: ${imported[k].length}`)
          .join('\n');
        const ok = await chzConfirm(`Importar "${file.name}"?\n\n${resumo}\n\nAs secções presentes no ficheiro vão SUBSTITUIR as deste dispositivo. Se tiveres dúvidas, faz primeiro um backup.`, 'Importar');
        if (!ok) return;
        try {
          db = { ...db, ...imported };
          if (!db.versiculosCache || typeof db.versiculosCache !== 'object') db.versiculosCache = {};
          initJovens(); // garante ID único mesmo em jovens vindos de um backup mais antigo
          const guardado = saveDB();
          // Count total records
          const count = Object.values(imported).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0);
          logImport(file.name, count);
          if (guardado) chzAlert('✅ Dados importados com sucesso!');
          renderTracker();
        } catch (e) {
          console.error(e);
          chzAlert('❌ Erro ao importar: ' + (e.message || e));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }


