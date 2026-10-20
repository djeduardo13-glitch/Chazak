  // Chazak — aba Mocidade: jovens, presença, tracker, perfil, viagens, FAB, interações, migração A3, ideias, encontros

  let mocFilter = 'todos';
  let interCtx = null; // { jovemIdx, tipo }

  // ══════════════════════════════════════════
  // ID ÚNICO DO JOVEM (A3 — Etapa 1)
  // Usado internamente para ligações estáveis entre jovens (ex: irmãos)
  // que não se partem se o nome for editado depois. Nunca aparece no ecrã.
  // ══════════════════════════════════════════
  function gerarIdJovem() {
    let id;
    do {
      id = 'j_' + Math.random().toString(36).slice(2, 8);
    } while ((db.jovens||[]).some(j => j.id === id));
    return id;
  }

  function getJovemById(id) {
    return (db.jovens||[]).find(j => j.id === id) || null;
  }

  // A3 — resolve o nome ATUAL do jovem ligado por ID; sem ligação (ou jovem já
  // não existe), devolve o texto que estava guardado, tal como sempre foi.
  function nomeAtualDoJovem(nomeGuardado, jovemId) {
    if (!jovemId) return nomeGuardado;
    const j = getJovemById(jovemId);
    return j ? j.name : nomeGuardado;
  }

  function initJovens() {
    if (!db.jovens || db.jovens.length === 0) {
      db.jovens = [];   // dispositivo novo: os dados chegam pelo Gist / JSON
    } else {
      let changed = false;
      db.jovens.forEach(j => {
        // Infer genero from legacy cat if not set
        if (!j.genero && j.cat) {
          const masc = ['Jovem Moço','Criança Menino','Menino menor de 6','Menor de 5 anos'];
          // Also handle legacy "Criança" by name heuristic — default female unless explicitly masc
          j.genero = masc.includes(j.cat) ? 'M' : 'F';
          changed = true;
        }
        // A3 — Etapa 1: dar ID único a jovens que ainda não têm (retrocompatibilidade)
        if (!j.id) { j.id = gerarIdJovem(); changed = true; }
        if (!j.irmaosIds) { j.irmaosIds = []; changed = true; }
      });
      if (changed) saveDB();
    }
  }

  // ── MOC TABS ──
  function setMocTab(el, name) {
    document.querySelectorAll('.moc-inner-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('moc-tracker').style.display   = name === 'tracker'   ? 'block' : 'none';
    document.getElementById('moc-presenca').style.display  = name === 'presenca'  ? 'block' : 'none';
    document.getElementById('moc-viagens').style.display   = name === 'viagens'   ? 'block' : 'none';
    document.getElementById('moc-encontros').style.display = name === 'encontros' ? 'block' : 'none';
    document.getElementById('moc-ideias').style.display    = name === 'ideias'    ? 'block' : 'none';
    // Hide scroll-to-top when not on tracker
    const btn = document.getElementById('scroll-top-btn');
    if (btn && name !== 'tracker') btn.classList.remove('visible');
    if (name === 'tracker')   renderTracker();
    if (name === 'presenca')  renderPresenca();
    if (name === 'ideias')    renderIdeias();
    if (name === 'encontros') renderEncontros();
    if (name === 'viagens') { currentViagemIdx = null; renderViagens(); }
  }

  function setMocFilter(el, filter) {
    document.querySelectorAll('#sec-mocidade .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    mocFilter = filter;
    renderTracker();
  }

  // ══════════════════════════════════════════
  // PRESENÇA (RDJ)
  // ══════════════════════════════════════════
  let presencaSubTab = 'sessoes';
  let rankingFilter = 'todos';
  let sessaoEditId = null;
  let sessaoStatusMap = {}; // { nomeJovem: 'presente'|'ausente'|'justificada' }

  function setPresencaSubTab(name) {
    presencaSubTab = name;
    document.getElementById('pres-subtab-sessoes').classList.toggle('active', name === 'sessoes');
    document.getElementById('pres-subtab-ranking').classList.toggle('active', name === 'ranking');
    document.getElementById('presenca-sessoes-view').style.display = name === 'sessoes' ? 'block' : 'none';
    document.getElementById('presenca-ranking-view').style.display = name === 'ranking' ? 'block' : 'none';
    renderPresenca();
  }

  function renderPresenca() {
    if (presencaSubTab === 'sessoes') renderSessoesPresenca();
    else renderRankingPresenca();
  }

  function renderSessoesPresenca() {
    const container = document.getElementById('presenca-sessoes-list');
    if (!container) return;
    const list = (db.presencas || []).slice().sort((a,b) => b.data.localeCompare(a.data));

    if (!list.length) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 0">
        <div class="empty-icon">🙋</div>
        <div class="empty-title">Nenhuma RDJ registada</div>
        <div class="empty-desc">Toca no + para registar a presença de hoje.</div>
      </div>`;
      return;
    }

    container.innerHTML = list.map(s => {
      const { presentes, ausentes, justificadas } = contarVisiveis(s.registros);
      const d = new Date(s.data + 'T00:00:00');
      const dateStr = d.toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
      return `<div onclick="openEditSessaoPresenca('${s.id}')" style="background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--tab-moc);border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;cursor:pointer">
        <div style="font-weight:600;font-size:14px;margin-bottom:4px;text-transform:capitalize">${dateStr}</div>
        <div style="font-size:12px;color:var(--muted);display:flex;gap:12px">
          <span style="color:#2E7D52">✓ ${presentes} presentes</span>
          <span style="color:#E07B54">✗ ${ausentes} ausentes</span>
          ${justificadas ? `<span style="color:#C07D14">⚠ ${justificadas} justif.</span>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  function openNovaSessaoPresenca() {
    sessaoEditId = null;
    document.getElementById('sessao-modal-title').textContent = 'Nova RDJ';
    document.getElementById('sessao-data').value = new Date().toISOString().slice(0,10);
    document.getElementById('sessao-del-btn').style.display = 'none';
    // Pré-preencher todos os jovens ativos como 'ausente' por padrão
    sessaoStatusMap = {};
    (db.jovens || []).filter(j => j.ativo !== false).forEach(j => { sessaoStatusMap[j.name] = 'ausente'; });
    renderSessaoJovensList();
    openModal('modal-sessao-presenca');
  }

  // Resolve um nome guardado (possivelmente antigo/curto) para o nome atual do jovem.
  // Retorna o nome atual se encontrar correspondência exata ou por primeiro nome único; senão null.
  function resolverNomeJovem(nomeArmazenado) {
    if ((db.jovens||[]).some(j => j.name === nomeArmazenado)) return nomeArmazenado;
    const primeira = nomeArmazenado.trim().split(' ')[0].toLowerCase();
    const candidatos = (db.jovens||[]).filter(j => j.name.trim().split(' ')[0].toLowerCase() === primeira);
    return candidatos.length === 1 ? candidatos[0].name : null;
  }

  function openEditSessaoPresenca(id) {
    const sessao = (db.presencas || []).find(s => s.id === id);
    if (!sessao) return;
    sessaoEditId = id;
    document.getElementById('sessao-modal-title').textContent = 'Editar RDJ';
    document.getElementById('sessao-data').value = sessao.data;
    document.getElementById('sessao-del-btn').style.display = 'inline-block';
    // Só os jovens que já tinham registo nesta sessão (não injeta jovens novos retroativamente)
    // Auto-corrige nomes antigos/curtos para o nome atual (ex: "Alice" → "Alice Coelho")
    sessaoStatusMap = {};
    Object.entries(sessao.registros || {}).forEach(([nome, status]) => {
      const nomeResolvido = resolverNomeJovem(nome) || nome; // mantém original se não resolver (mostra "removido")
      sessaoStatusMap[nomeResolvido] = status;
    });
    renderSessaoJovensList();
    openModal('modal-sessao-presenca');
  }

  // Conta só registos que resolvem a um jovem ATIVO atual (ignora ocultos/ambíguos/inativos)
  function contarVisiveis(registros) {
    let presentes = 0, ausentes = 0, justificadas = 0, total = 0;
    Object.entries(registros || {}).forEach(([nome, status]) => {
      const resolvido = resolverNomeJovem(nome);
      if (!resolvido) return; // ambíguo/não resolvido — não conta
      const j = (db.jovens||[]).find(x => x.name === resolvido);
      if (!j || j.ativo === false) return; // inativo — não conta
      total++;
      if (status === 'presente') presentes++;
      else if (status === 'ausente') ausentes++;
      else if (status === 'justificada') justificadas++;
    });
    return { presentes, ausentes, justificadas, total };
  }

  function renderSessaoJovensList() {
    const container = document.getElementById('sessao-jovens-list');
    if (!container) return;
    // Só mostra jovens que existem E estão ativos. Removidos/ambíguos/inativos ficam ocultos
    // (os dados continuam guardados no registo, só não aparecem para marcar)
    const nomes = Object.keys(sessaoStatusMap).filter(nome => {
      const j = (db.jovens||[]).find(x => x.name === nome);
      return j && j.ativo !== false;
    }).sort((a,b) => a.localeCompare(b, 'pt'));

    if (!nomes.length) {
      container.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:10px 0">Nenhum jovem ativo encontrado.</div>`;
    } else {
      const STATUS_INFO = {
        presente:    { label: 'Presente',   color: '#2E7D52' },
        ausente:     { label: 'Ausente',    color: '#E07B54' },
        justificada: { label: 'Justif.',    color: '#C07D14' }
      };
      container.innerHTML = nomes.map(nome => {
        const status = sessaoStatusMap[nome] || 'ausente';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);gap:8px">
          <span style="font-size:13px;font-weight:500">${esc(nome)}</span>
          <div style="display:flex;gap:4px;flex-shrink:0">
            ${Object.entries(STATUS_INFO).map(([key, info]) => `
              <button type="button" onclick="setSessaoStatus('${escJs(nome)}','${key}')"
                style="padding:5px 9px;border-radius:8px;border:1.5px solid ${status===key?info.color:'var(--border)'};background:${status===key?info.color:'transparent'};color:${status===key?'#fff':'var(--muted)'};font-size:10px;font-weight:600;cursor:pointer">
                ${info.label}
              </button>`).join('')}
          </div>
        </div>`;
      }).join('');
    }
    renderSessaoConflitos();
  }

  // Identifica chaves em sessaoStatusMap que não resolvem automaticamente a um jovem atual
  function getConflitosSessao() {
    return Object.keys(sessaoStatusMap).filter(nome => resolverNomeJovem(nome) === null);
  }

  function renderSessaoConflitos() {
    const wrap = document.getElementById('sessao-conflitos-wrap');
    const list = document.getElementById('sessao-conflitos-list');
    if (!wrap || !list) return;
    const conflitos = getConflitosSessao();
    if (!conflitos.length) { wrap.style.display = 'none'; list.innerHTML = ''; return; }
    wrap.style.display = 'block';

    const ativos = (db.jovens||[]).filter(j => j.ativo !== false).sort((a,b) => a.name.localeCompare(b.name,'pt'));
    const STATUS_LABEL = { presente:'Presente', ausente:'Ausente', justificada:'Justificada' };

    list.innerHTML = conflitos.map(nome => {
      const status = sessaoStatusMap[nome] || 'ausente';
      const selId = 'conf-sel-' + nome.replace(/[^a-zA-Z0-9]/g,'');
      return `<div style="background:var(--surface);border:1px solid #f0d9a8;border-radius:10px;padding:10px 12px;margin-bottom:8px">
        <div style="font-size:13px;font-weight:600;margin-bottom:2px">${esc(nome)}</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Estava marcado como: <strong>${STATUS_LABEL[status]||status}</strong></div>
        <div style="display:flex;gap:6px">
          <select id="${selId}" style="flex:1;padding:6px 8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:12px">
            <option value="">Selecionar jovem...</option>
            ${ativos.map(j => `<option value="${esc(j.name)}">${esc(j.name)}</option>`).join('')}
          </select>
          <button type="button" onclick="aplicarConflito('${escJs(nome)}','${selId}')" style="padding:6px 12px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:11px;font-weight:600;cursor:pointer">Aplicar</button>
          <button type="button" onclick="ignorarConflito('${escJs(nome)}')" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--muted);font-size:11px;cursor:pointer">Ignorar</button>
        </div>
      </div>`;
    }).join('');
  }

  function aplicarConflito(nomeAntigo, selId) {
    const select = document.getElementById(selId);
    const alvo = select ? select.value : '';
    if (!alvo) { chzAlert('Seleciona um jovem primeiro!'); return; }
    const statusAntigo = sessaoStatusMap[nomeAntigo];
    const PRIORIDADE = { presente: 3, justificada: 2, ausente: 1 };
    // Se o alvo já tem entrada (colisão), mantém o status de maior prioridade
    if (sessaoStatusMap[alvo] !== undefined) {
      const atual = sessaoStatusMap[alvo];
      sessaoStatusMap[alvo] = (PRIORIDADE[statusAntigo] > PRIORIDADE[atual]) ? statusAntigo : atual;
    } else {
      sessaoStatusMap[alvo] = statusAntigo;
    }
    delete sessaoStatusMap[nomeAntigo];
    renderSessaoJovensList();
  }

  async function ignorarConflito(nome) {
    if (!(await chzConfirm(`Descartar permanentemente o registo antigo "${nome}"?`, 'Descartar'))) return;
    delete sessaoStatusMap[nome];
    renderSessaoJovensList();
  }

  function setSessaoStatus(nome, status) {
    sessaoStatusMap[nome] = status;
    renderSessaoJovensList();
  }

  function saveSessaoPresenca() {
    const data = document.getElementById('sessao-data').value;
    if (!data) { chzAlert('Selecione uma data!'); return; }
    if (sessaoEditId !== null) {
      const sessao = db.presencas.find(s => s.id === sessaoEditId);
      if (sessao) { sessao.data = data; sessao.registros = { ...sessaoStatusMap }; }
    } else {
      db.presencas.push({ id: 'p_' + Date.now(), data, registros: { ...sessaoStatusMap } });
    }
    saveDB();
    closeModal('modal-sessao-presenca');
    renderPresenca();
  }

  async function delSessaoPresenca() {
    if (sessaoEditId === null) return;
    if (!(await chzConfirm('Remover esta sessão de presença permanentemente?', 'Remover'))) return;
    db.presencas = db.presencas.filter(s => s.id !== sessaoEditId);
    saveDB();
    closeModal('modal-sessao-presenca');
    renderPresenca();
  }

  function setRankingFilter(el, filter) {
    document.querySelectorAll('#presenca-ranking-view .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    rankingFilter = filter;
    renderRankingPresenca();
  }

  function renderRankingPresenca() {
    const container = document.getElementById('presenca-ranking-list');
    if (!container) return;

    let jovens = (db.jovens || []).filter(j => j.ativo !== false && !j.excluirRankingPresenca);
    if (rankingFilter === 'jovens') {
      jovens = jovens.filter(j => ['Jovem Moça','Jovem Moço'].includes(getGrupoAuto(j)));
    }

    const comDados = [];
    const semDados = [];

    jovens.forEach(j => {
      let total = 0, presentes = 0;
      (db.presencas || []).forEach(s => {
        const regs = s.registros || {};
        let st = regs[j.name];
        if (st === undefined) {
          const chaveAntiga = Object.keys(regs).find(k => resolverNomeJovem(k) === j.name);
          if (chaveAntiga) st = regs[chaveAntiga];
        }
        if (st !== undefined) {
          total++;
          if (st === 'presente') presentes++;
        }
      });
      if (total > 0) {
        comDados.push({ nome: j.name, total, presentes, pct: Math.round((presentes/total)*100) });
      } else {
        semDados.push({ nome: j.name });
      }
    });

    if (!comDados.length && !semDados.length) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 0">
        <div class="empty-icon">📊</div>
        <div class="empty-title">Sem dados ainda</div>
        <div class="empty-desc">Regista sessões de RDJ para veres o ranking.</div>
      </div>`;
      return;
    }

    // ── Faixas ──
    const FAIXAS = [
      { id: 'critico',      label: '🔴 Crítico',      min: 0,  max: 40,  color: '#C0392B' },
      { id: 'insuficiente', label: '🟠 Insuficiente',  min: 41, max: 59,  color: '#E07B54' },
      { id: 'bom',          label: '🟡 Bom',           min: 60, max: 79,  color: '#C07D14' },
      { id: 'excelente',    label: '🟢 Excelente',     min: 80, max: 100, color: '#2E7D52' },
    ];

    const grupos = {};
    FAIXAS.forEach(f => grupos[f.id] = []);
    comDados.forEach(r => {
      const faixa = FAIXAS.find(f => r.pct >= f.min && r.pct <= f.max);
      if (faixa) grupos[faixa.id].push(r);
    });
    Object.values(grupos).forEach(arr => arr.sort((a,b) => a.pct - b.pct));

    // ── Resumo (média geral + abaixo de 40%) ──
    const media = comDados.length ? Math.round(comDados.reduce((s,r) => s + r.pct, 0) / comDados.length) : 0;
    const criticos = grupos['critico'].length;

    let html = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:16px;display:flex;gap:12px">
        <div style="flex:1;text-align:center;border-right:1px solid var(--border)">
          <div style="font-size:22px;font-weight:700;color:var(--accent)">${media}%</div>
          <div style="font-size:11px;color:var(--muted)">Média geral</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#C0392B">${criticos}</div>
          <div style="font-size:11px;color:var(--muted)">Abaixo de 40%</div>
        </div>
      </div>`;

    // ── Faixas colapsáveis (todas fechadas por padrão) ──
    FAIXAS.forEach(f => {
      const lista = grupos[f.id];
      if (!lista.length) return;
      html += `
        <div style="margin-bottom:8px">
          <div onclick="toggleFaixaPresenca('${f.id}')" id="faixa-header-${f.id}"
            style="display:flex;justify-content:space-between;align-items:center;padding:11px 14px;background:var(--surface);border:1px solid var(--border);border-left:4px solid ${f.color};border-radius:12px;cursor:pointer">
            <span style="font-size:13px;font-weight:700;color:${f.color}">${f.label}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;color:var(--muted)">${lista.length} ${lista.length!==1?'jovens':'jovem'}</span>
              <span id="faixa-arrow-${f.id}" style="font-size:16px;color:var(--muted);transition:transform .2s;display:inline-block">▾</span>
            </div>
          </div>
          <div id="faixa-body-${f.id}" style="display:none;border:1px solid var(--border);border-top:none;border-radius:0 0 12px 12px;overflow:hidden">
            ${lista.map((r,i) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;${i>0?'border-top:1px solid var(--border)':''}">
                <span style="font-size:13px;font-weight:500">${esc(r.nome)}</span>
                <div style="text-align:right">
                  <div style="font-size:14px;font-weight:700;color:${f.color}">${r.pct}%</div>
                  <div style="font-size:10px;color:var(--muted)">${r.presentes}/${r.total}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    });

    // ── Sem registos (colapsável, fechado por padrão) ──
    if (semDados.length) {
      html += `
        <div style="margin-bottom:8px">
          <div onclick="toggleFaixaPresenca('semdados')" id="faixa-header-semdados"
            style="display:flex;justify-content:space-between;align-items:center;padding:11px 14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;cursor:pointer;opacity:0.7">
            <span style="font-size:13px;font-weight:700;color:var(--muted)">⚪ Sem registos ainda</span>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;color:var(--muted)">${semDados.length} ${semDados.length!==1?'jovens':'jovem'}</span>
              <span id="faixa-arrow-semdados" style="font-size:16px;color:var(--muted);transition:transform .2s;display:inline-block">▾</span>
            </div>
          </div>
          <div id="faixa-body-semdados" style="display:none;border:1px solid var(--border);border-top:none;border-radius:0 0 12px 12px;overflow:hidden;opacity:0.7">
            ${semDados.map((r,i) => `
              <div style="padding:10px 14px;${i>0?'border-top:1px solid var(--border)':''}">
                <span style="font-size:13px;font-weight:500">${esc(r.nome)}</span>
              </div>`).join('')}
          </div>
        </div>`;
    }

    container.innerHTML = html;
  }

  function toggleFaixaPresenca(id) {
    const body = document.getElementById('faixa-body-' + id);
    const arrow = document.getElementById('faixa-arrow-' + id);
    const header = document.getElementById('faixa-header-' + id);
    if (!body) return;
    const open = body.style.display === 'block';
    body.style.display = open ? 'none' : 'block';
    if (arrow) arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
    if (header) header.style.borderRadius = open ? '12px' : '12px 12px 0 0';
  }

  function filterByAtencao() {
    if (mocFilter === 'atencao') {

      const todosChip = document.querySelector('#sec-mocidade .filter-chip');
      setMocFilter(todosChip, 'todos');
    } else {
      const atencaoChip = document.querySelector('#sec-mocidade .filter-chip[onclick*="atencao"]');
      if (atencaoChip) setMocFilter(atencaoChip, 'atencao');
    }
    if (document.getElementById('moc-tracker').style.display === 'none') {
      const trackerTab = document.querySelector('.moc-inner-tab');
      setMocTab(trackerTab, 'tracker');
    }
  }

  // ── HELPERS ──
  function parseDate(d) {
    if (!d) return null;
    // Handles dd/mm/yyyy and yyyy-mm-dd
    if (d.includes('/')) {
      const [dd, mm, yyyy] = d.split('/');
      return new Date(parseInt(yyyy||2000), parseInt(mm)-1, parseInt(dd));
    }
    return new Date(d);
  }

  function daysSince(date) {
    if (!date) return Infinity;
    const parsed = parseDate(date);
    if (!parsed || isNaN(parsed)) return Infinity;
    return Math.floor((Date.now() - parsed) / 86400000);
  }

  function lastInteraction(jovem) {
    if (!jovem.interactions || jovem.interactions.length === 0) return null;
    return jovem.interactions.slice().sort((a,b) => parseDate(b.date) - parseDate(a.date))[0].date;
  }

  function getStatusDot(jovem) {
    const d = daysSince(lastInteraction(jovem));
    if (d === Infinity || d > 30) return 'alert';
    if (d > 15) return 'warn';
    return '';
  }

  function fmtDate(d) {
    if (!d) return '—';
    const parsed = parseDate(d);
    if (!parsed || isNaN(parsed)) return d;
    return parsed.toLocaleDateString('pt-BR');
  }

  function lastByType(jovem, tipo) {
    if (!jovem.interactions) return null;
    const f = jovem.interactions.filter(i => i.tipo === tipo).sort((a,b) => parseDate(b.date) - parseDate(a.date));
    return f.length ? f[0].date : null;
  }

  // ── GRUPO AUTOMÁTICO POR GÊNERO + IDADE ──
  // Categorias novas:
  //   Jovem Moça (+12), Jovem Moço (+12)
  //   Criança Menina (6-11), Criança Menino (6-11)
  //   Menina menor de 6, Menino menor de 6
  // Compatibilidade: se não tem ano (só dd/mm), mantém cat antiga

  function calcIdade(aniv) {
    if (!aniv) return null;
    let dd, mm, aaaa;
    if (aniv.includes('-')) {
      // formato ISO yyyy-mm-dd (perfis antigos editados com date picker)
      const parts = aniv.split('-');
      if (parts.length < 3) return null;
      [aaaa, mm, dd] = parts;
    } else {
      const parts = aniv.split('/');
      if (parts.length < 3) return null; // sem ano
      [dd, mm, aaaa] = parts;
    }
    const nasc = new Date(parseInt(aaaa), parseInt(mm)-1, parseInt(dd));
    if (isNaN(nasc)) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mDiff = hoje.getMonth() - nasc.getMonth();
    if (mDiff < 0 || (mDiff === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }

  // Converte qualquer formato de aniv para dd/mm/aaaa (texto editável)
  function anivToTexto(aniv) {
    if (!aniv) return '';
    if (aniv.includes('-')) {
      const [y,m,d] = aniv.split('-');
      if (y && m && d) return `${d}/${m}/${y}`;
    }
    return aniv; // já é dd/mm ou dd/mm/aaaa
  }

  function getGrupoAuto(jovem) {
    const genero = jovem.genero; // 'M' ou 'F'
    const idade = calcIdade(jovem.aniv);

    // Sem ano cadastrado → mantém a categoria guardada SÓ se for do mesmo género;
    // caso contrário usa a categoria base desse género.
    if (idade === null) {
      const catAtual = (jovem.cat || '').trim().toLowerCase();
      const CATS_M = ['jovem moço', 'criança menino', 'menino menor de 6'];
      const CATS_F = ['jovem moça', 'criança menina', 'menina menor de 6'];
      if (genero === 'M') return CATS_M.includes(catAtual) ? jovem.cat : 'Jovem Moço';
      if (genero === 'F') return CATS_F.includes(catAtual) ? jovem.cat : 'Jovem Moça';
      return jovem.cat || 'Jovem Moça';
    }

    if (genero === 'M') {
      if (idade >= 12) return 'Jovem Moço';
      if (idade >= 6)  return 'Criança Menino';
      return 'Menino menor de 6';
    } else {
      // 'F' ou não definido (legado feminino)
      if (idade >= 12) return 'Jovem Moça';
      if (idade >= 6)  return 'Criança Menina';
      return 'Menina menor de 6';
    }
  }

  // ── RENDER TRACKER ──
  // Track which categories are collapsed
  const CATS_ALL = ['Jovem Moça', 'Criança Menina', 'Menina menor de 6', 'Jovem Moço', 'Criança Menino', 'Menino menor de 6', '__inativo__'];
  const collapsedCats = {};
  CATS_ALL.forEach(c => collapsedCats[c] = true); // all closed by default

  function toggleCat(cat) {
    collapsedCats[cat] = !collapsedCats[cat];
    renderTracker();
  }

  function renderTracker() {
    const search = (document.getElementById('moc-search')?.value || '').toLowerCase();
    let list = db.jovens.filter(j => j.ativo !== false && j.name.toLowerCase().includes(search));
    if (mocFilter !== 'todos' && mocFilter !== 'atencao') list = list.filter(j => getGrupoAuto(j) === mocFilter);
    if (mocFilter === 'atencao') list = list.filter(j => daysSince(lastInteraction(j)) > 15);
    list.sort((a,b) => daysSince(lastInteraction(b)) - daysSince(lastInteraction(a)));

    const alertCount = db.jovens.filter(j => j.ativo !== false && daysSince(lastInteraction(j)) > 15).length;
    const totalAtivos = db.jovens.filter(j => j.ativo !== false).length;
    document.getElementById('ms-total').textContent = totalAtivos;
    document.getElementById('ms-alert').textContent = alertCount;
    document.getElementById('ms-ok').textContent = totalAtivos - alertCount;

    const container = document.getElementById('tracker-list');
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 0">
        <div class="empty-icon" style="font-size:32px">🔍</div>
        <div class="empty-desc">Nenhum jovem encontrado.</div>
      </div>`;
      return;
    }

    const useGroups = mocFilter === 'todos' || mocFilter === 'atencao';
    const cats = ['Jovem Moça','Criança Menina','Menina menor de 6','Jovem Moço','Criança Menino','Menino menor de 6'];
    const today = new Date();

    const renderCard = (jovem) => {
      const idx = db.jovens.indexOf(jovem);
      const dot = getStatusDot(jovem);
      const last = lastInteraction(jovem);
      const d = daysSince(last);
      const statusText = d === Infinity ? 'Sem interação' : `${d}d atrás`;
      const anivStr = jovem.aniv || '';
      let anivBadge = '';
      let anivDisplay = '';
      if (anivStr) {
        const parts = anivStr.split('/');
        const dd = parseInt(parts[0]);
        const mm = parseInt(parts[1]);
        if (mm-1 === today.getMonth() && dd === today.getDate()) anivBadge = ' 🎂';
        else if (mm-1 === today.getMonth()) anivBadge = ' 🎈';
        // Show age if year available
        const idade = calcIdade(anivStr);
        if (idade !== null) {
          anivDisplay = `${anivStr} · ${idade} anos`;
        } else {
          anivDisplay = anivStr;
        }
      }
      const card = document.createElement('div');
      card.className = `person-card ${dot === 'alert' ? 'needs-attention' : ''}`;
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="pc-top" style="margin-bottom:0">
          <div>
            <div class="pc-name">${jovem.auxiliar ? '🖋️ ' : ''}${esc(jovem.name)}${anivBadge}</div>
            ${anivStr ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">🎂 ${anivDisplay}</div>` : ''}
          </div>
          <div class="pc-status">
            <div class="pc-dot ${dot}"></div>
            <span>${statusText}</span>
            <span style="color:var(--border);margin-left:4px;font-size:16px">›</span>
          </div>
        </div>`;
      card.onclick = () => openPerfil(idx);
      return card;
    };

    if (useGroups) {
      const grouped = {};
      list.forEach(j => {
        const grupo = getGrupoAuto(j);
        if(!grouped[grupo]) grouped[grupo]=[];
        grouped[grupo].push(j);
      });

      cats.forEach(cat => {
        if (!grouped[cat] || grouped[cat].length === 0) return;
        // Sort oldest first (highest age = lowest birth year)
        grouped[cat].sort((a, b) => {
          const partsA = (a.aniv || '').split('/');
          const partsB = (b.aniv || '').split('/');
          const hasYearA = partsA.length === 3;
          const hasYearB = partsB.length === 3;
          if (!hasYearA && !hasYearB) return a.name.localeCompare(b.name);
          if (!hasYearA) return 1;
          if (!hasYearB) return -1;
          const dateA = new Date(parseInt(partsA[2]), parseInt(partsA[1])-1, parseInt(partsA[0]));
          const dateB = new Date(parseInt(partsB[2]), parseInt(partsB[1])-1, parseInt(partsB[0]));
          return dateA - dateB; // oldest (earlier date) first
        });
        const isCollapsed = !!collapsedCats[cat];
        const count = grouped[cat].length;

        const header = document.createElement('div');
        header.className = 'toggle-header' + (isCollapsed ? ' closed' : '');
        header.innerHTML = `
          <span class="toggle-header-label">${esc(cat)} <span style="font-weight:400;font-size:11px">(${count})</span></span>
          <i class="toggle-chevron${isCollapsed ? '' : ' open'}">▾</i>`;
        header.onclick = () => toggleCat(cat);

        const cardsWrap = document.createElement('div');
        cardsWrap.className = 'toggle-cards';
        cardsWrap.style.display = isCollapsed ? 'none' : 'block';
        grouped[cat].forEach(jovem => cardsWrap.appendChild(renderCard(jovem)));

        container.appendChild(header);
        if (!isCollapsed) container.appendChild(cardsWrap);
      });

      // ── Inativos section (only in "todos" filter) ──
      if (mocFilter === 'todos') {
        const inativos = db.jovens.filter(j => j.ativo === false && j.name.toLowerCase().includes(search));
        if (inativos.length) {
          const CAT_INATIVO = '__inativo__';
          const isCollapsed = collapsedCats[CAT_INATIVO] !== false;
          const sep = document.createElement('div');
          sep.style.cssText = 'border-top:1px dashed var(--border);margin:10px 0 8px';
          container.appendChild(sep);

          const header = document.createElement('div');
          header.className = 'toggle-header' + (isCollapsed ? ' closed' : '');
          header.style.opacity = '0.75';
          header.innerHTML = `
            <span class="toggle-header-label">Inativos <span style="font-weight:400;font-size:11px">(${inativos.length})</span></span>
            <i class="toggle-chevron${isCollapsed ? '' : ' open'}">▾</i>`;
          header.onclick = () => { collapsedCats[CAT_INATIVO] = !collapsedCats[CAT_INATIVO]; renderTracker(); };

          container.appendChild(header);

          if (!isCollapsed) {
            const cardsWrap = document.createElement('div');
            cardsWrap.className = 'toggle-cards';
            cardsWrap.style.opacity = '0.75';
            inativos.forEach(jovem => cardsWrap.appendChild(renderCard(jovem)));
            container.appendChild(cardsWrap);
          }
        }
      }
    } else {
      // Single filter — flat list, no groups
      list.forEach(jovem => container.appendChild(renderCard(jovem)));
    }
  }

  // ── PERFIL JOVEM ──
  let perfilIdx = null;
  function openPerfil(idx) {
    perfilIdx = idx;
    perfilHistPage = 0;
    const j = db.jovens[idx];
    document.getElementById('perfil-nome').textContent = j.name;
    document.getElementById('perfil-id').textContent = j.id || '';

    renderPerfilInfoRows(idx);
    setPerfilSubTab('perfil');

    // Interaction buttons
    ['presente','conversa','viagem','outro'].forEach(tipo => {
      const ld = lastByType(j, tipo);
      const btn = document.getElementById('pb-' + tipo);
      const dateEl = document.getElementById('pb-' + tipo + '-date');
      if (btn) { btn.className = 'pc-btn' + (ld ? ' has-data' : ''); }
      if (dateEl) dateEl.textContent = ld ? fmtDate(ld) : '—';
    });

    // Full history
    renderPerfilHist(idx);
    openModal('modal-perfil');
  }

  function setPerfilSubTab(tab) {
    document.getElementById('perfil-subtab-perfil').classList.toggle('active', tab === 'perfil');
    document.getElementById('perfil-subtab-interacoes').classList.toggle('active', tab === 'interacoes');
    document.getElementById('perfil-tab-perfil').style.display = tab === 'perfil' ? 'block' : 'none';
    document.getElementById('perfil-tab-interacoes').style.display = tab === 'interacoes' ? 'block' : 'none';
  }

  // ── ABA PERFIL — só de leitura; só mostra o que estiver preenchido ──
  function renderPerfilInfoRows(idx) {
    const j = db.jovens[idx];
    const container = document.getElementById('perfil-info-rows');
    if (!container) return;
    const linhas = [];
    if (j.ativo === false) {
      let estadoIcone = '🚫', estadoTexto = 'Inativo';
      if (j.motivoInativo === 'casamento') {
        estadoIcone = '💍';
        const nomeConjuge = j.conjugeNome ? nomeAtualDoJovem(j.conjugeNome, j.conjugeId) : '';
        estadoTexto = 'Casou-se' + (nomeConjuge ? ` com ${nomeConjuge}` : '') + (j.dataCasamento ? ` em ${j.dataCasamento}` : '');
      } else if (j.motivoInativo === 'mudanca') {
        estadoIcone = '📦';
        estadoTexto = 'Mudou-se' + (j.mudancaLocal ? ` para ${j.mudancaLocal}` : '');
      }
      linhas.push({ label: `${estadoIcone} Estado`, value: `<span style="background:#fbddd5;color:#c0392b;border-radius:100px;padding:3px 10px;font-size:11px;font-weight:600">${esc(estadoTexto)}</span>` });
    }
    if (j.auxiliar) linhas.push({ label: '🖋️ Auxiliar', value: 'Sim' });
    const grupo = getGrupoAuto(j);
    if (grupo) linhas.push({ label: (j.genero === 'M' ? '♂️' : '♀️') + ' Categoria', value: esc(grupo) });
    if (j.aniv) {
      const idade = calcIdade(j.aniv);
      linhas.push({ label: '🎂 Aniversário', value: esc(j.aniv) + (idade !== null ? ` · ${idade} anos` : '') });
    }
    if (j.batismo) {
      const anosBatismo = calcIdade(j.batismo);
      linhas.push({ label: '🙏 Batismo', value: esc(j.batismo) + (anosBatismo !== null ? ` · há ${anosBatismo} anos` : '') });
    }
    const irmaos = (j.irmaosIds || []).map(id => getJovemById(id)).filter(Boolean);
    if (irmaos.length) {
      const chips = irmaos.map(ir => `<span onclick="openPerfil(db.jovens.findIndex(x=>x.id==='${escJs(ir.id)}'))" style="cursor:pointer;background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:3px 10px;font-size:12px">${esc(ir.name)}</span>`).join(' ');
      linhas.push({ label: '👨\u200d👩\u200d👧\u200d👦 Irmãos', value: `<span style="display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end">${chips}</span>` });
    }
    if (j.tel) linhas.push({ label: '📞 Telefone', value: j.tel });

    if (!linhas.length) {
      container.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:20px 0;text-align:center">Nenhuma informação preenchida ainda.</div>`;
    } else {
      container.innerHTML = linhas.map((l, i) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 0;${i < linhas.length - 1 ? 'border-bottom:1px solid var(--border);' : ''}font-size:13px"><span style="color:var(--muted);flex-shrink:0">${l.label}</span><span>${l.value}</span></div>`).join('');
    }
    if (j.obs) {
      container.innerHTML += `<div style="padding:10px 0 0;font-size:12px;color:var(--muted);font-style:italic">${esc(j.obs)}</div>`;
    }
  }

  // ── IRMÃOS — gestão (adicionar/remover) fica só dentro do Editar Jovem ──
  function renderEjIrmaosList() {
    if (perfilIdx === null) return;
    const j = db.jovens[perfilIdx];
    if (!j.irmaosIds) j.irmaosIds = [];
    const list = document.getElementById('ej-irmaos-list');
    if (!list) return;
    const irmaos = j.irmaosIds.map(id => getJovemById(id)).filter(Boolean);
    if (!irmaos.length) {
      list.innerHTML = `<span style="font-size:12px;color:var(--muted)">Nenhum irmão ligado ainda.</span>`;
    } else {
      list.innerHTML = irmaos.map(irmao => `
        <span style="display:inline-flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:5px 6px 5px 12px;font-size:13px">
          <span style="font-weight:500">${esc(irmao.name)}</span>
          <span onclick="removeIrmao('${escJs(irmao.id)}')" style="cursor:pointer;color:var(--muted);font-size:15px;line-height:1;padding:2px 4px">×</span>
        </span>`).join('');
    }
    const searchInp = document.getElementById('ej-irmao-search');
    if (searchInp) searchInp.value = '';
    const drop = document.getElementById('ac-irmao');
    if (drop) drop.style.display = 'none';
  }

  function acIrmao(q) {
    if (perfilIdx === null) return;
    const j = db.jovens[perfilIdx];
    acJovemPicker(q, {
      boxId: 'ac-irmao',
      onlyAtivos: false,
      excluirSelfId: j.id,
      excluir: j.irmaosIds || [],
      excluirPor: 'id',
      style: 'compacta',
      onSelect: (x) => addIrmao(x.id)
    });
  }

  function addIrmao(idAlvo) {
    if (perfilIdx === null) return;
    const j = db.jovens[perfilIdx];
    const alvo = getJovemById(idAlvo);
    if (!alvo) return;
    if (!j.irmaosIds) j.irmaosIds = [];
    if (!alvo.irmaosIds) alvo.irmaosIds = [];
    if (!j.irmaosIds.includes(alvo.id)) j.irmaosIds.push(alvo.id);
    if (!alvo.irmaosIds.includes(j.id)) alvo.irmaosIds.push(j.id);
    saveDB();
    renderEjIrmaosList();
  }

  function removeIrmao(idAlvo) {
    if (perfilIdx === null) return;
    const j = db.jovens[perfilIdx];
    const alvo = getJovemById(idAlvo);
    j.irmaosIds = (j.irmaosIds||[]).filter(id => id !== idAlvo);
    if (alvo) alvo.irmaosIds = (alvo.irmaosIds||[]).filter(id => id !== j.id);
    saveDB();
    renderEjIrmaosList();
    renderPerfilInfoRows(perfilIdx);
  }

  const HIST_PAGE_SIZE = 4;
  let perfilHistPage = 0;

  function renderPerfilHist(idx) {
    const j = db.jovens[idx];
    const all = [...(j.interactions || [])].sort((a,b) => parseDate(b.date) - parseDate(a.date));
    const div = document.getElementById('perfil-hist');
    if (!all.length) {
      div.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:8px 0">Nenhuma interação registrada.</div>`;
      return;
    }
    const totalPages = Math.ceil(all.length / HIST_PAGE_SIZE);
    if (perfilHistPage >= totalPages) perfilHistPage = totalPages - 1;
    const start = perfilHistPage * HIST_PAGE_SIZE;
    const page = all.slice(start, start + HIST_PAGE_SIZE);
    const tipoLabels = { presente:'🎁 Presente', conversa:'💬 Conversa', viagem:'✈️ Viagem', outro:'📝 Outro', Outro:'📝 Outro' };

    const rows = page.map(h => {
      const realIdx = j.interactions.indexOf(h);
      const label = tipoLabels[h.tipo] || h.tipo;
      const descText = h.note || h.desc || '';
      return `<div class="hist-item" style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600">${esc(label)}</div>
          <div style="font-size:12px;color:var(--muted)">${fmtDate(h.date)}${descText ? ' · '+esc(descText) : ''}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button onclick="openEditInter(${idx},${realIdx})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:3px 7px;font-size:11px;cursor:pointer">✏️</button>
          <button onclick="delInterFromPerfil(${idx},${realIdx})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:3px 7px;font-size:11px;cursor:pointer;color:#E07B54">✕</button>
        </div>
      </div>`;
    }).join('');

    const nav = totalPages > 1 ? `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 4px">
        <button onclick="histNavPage(${idx},-1)" ${perfilHistPage===0?'disabled':''} style="background:none;border:1px solid var(--border);border-radius:100px;padding:6px 14px;font-size:13px;cursor:pointer;opacity:${perfilHistPage===0?'0.3':'1'}">‹ Anterior</button>
        <span style="font-size:12px;color:var(--muted)">${start+1}–${Math.min(start+HIST_PAGE_SIZE,all.length)} de ${all.length}</span>
        <button onclick="histNavPage(${idx},1)" ${perfilHistPage>=totalPages-1?'disabled':''} style="background:none;border:1px solid var(--border);border-radius:100px;padding:6px 14px;font-size:13px;cursor:pointer;opacity:${perfilHistPage>=totalPages-1?'0.3':'1'}">Próximo ›</button>
      </div>` : '';

    div.innerHTML = rows + nav;
  }

  function histNavPage(idx, dir) {
    perfilHistPage += dir;
    renderPerfilHist(idx);
  }

  // Edit individual interaction
  let editInterIdx = null;
  let editInterJovemIdx = null;

  function openEditInter(jovemIdx, interIdx) {
    editInterJovemIdx = jovemIdx;
    editInterIdx = interIdx;
    const h = db.jovens[jovemIdx].interactions[interIdx];
    document.getElementById('ei-tipo').value = h.tipo || 'outro';
    document.getElementById('ei-date').value = h.date ? h.date.split('/').reverse().join('-') : '';
    document.getElementById('ei-desc').value = h.note || h.desc || '';
    openModal('modal-edit-inter');
  }

  function saveEditInter() {
    const h = db.jovens[editInterJovemIdx].interactions[editInterIdx];
    h.tipo = document.getElementById('ei-tipo').value;
    const dateVal = document.getElementById('ei-date').value;
    h.date = dateVal ? dateVal.split('-').reverse().join('/') : h.date;
    h.note = document.getElementById('ei-desc').value.trim();
    h.desc = h.note; // keep both fields in sync
    saveDB();
    closeModal('modal-edit-inter');
    renderPerfilHist(editInterJovemIdx);
    openPerfil(editInterJovemIdx);
    openModal('modal-perfil');
  }

  async function delInterFromPerfil(idx, interIdx) {
    const h = db.jovens[idx].interactions[interIdx];
    const tipoLabels = { presente:'Presente', conversa:'Conversa', viagem:'Viagem', outro:'Outro', Outro:'Outro' };
    const label = tipoLabels[h.tipo] || h.tipo;
    const desc = h.note || h.desc || '';
    if (!(await chzConfirm(`Remover interação?\n${label}${desc ? ' · ' + desc : ''}\n${fmtDate(h.date)}`, 'Remover'))) return;
    db.jovens[idx].interactions.splice(interIdx, 1);
    saveDB();
    renderPerfilHist(idx);
    renderTracker();
    openPerfil(idx);
    openModal('modal-perfil');
  }

  async function delJovemFromPerfil() {
    if (!(await chzConfirm(`Remover ${db.jovens[perfilIdx].name}?`, 'Remover'))) return;
    const idRemovido = db.jovens[perfilIdx].id;
    db.jovens.splice(perfilIdx, 1);
    if (idRemovido) db.jovens.forEach(j => { if (j.irmaosIds) j.irmaosIds = j.irmaosIds.filter(id => id !== idRemovido); });
    saveDB();
    closeModal('modal-edit-jovem');
    closeModal('modal-perfil');
    renderTracker();
  }

  function openEditJovem() {
    if (perfilIdx === null || !db.jovens[perfilIdx]) return;
    const j = db.jovens[perfilIdx];
    document.getElementById('ej-nome').value = j.name;
    document.getElementById('ej-aniv').value = anivToTexto(j.aniv || '');
    document.getElementById('ej-batismo').value = anivToTexto(j.batismo || '');
    document.getElementById('ej-tel').value = j.tel || '';
    document.getElementById('ej-obs').value = j.obs || '';
    document.getElementById('ej-ativo').checked = j.ativo !== false;
    document.getElementById('ej-excluir-ranking').checked = !!j.excluirRankingPresenca;
    document.getElementById('ej-auxiliar').checked = !!j.auxiliar;
    // Motivo de inatividade
    _conjugePickedId = null;
    document.getElementById('ej-motivo').value = j.motivoInativo || 'generico';
    document.getElementById('ej-conjuge-search').value = '';
    document.getElementById('ej-conjuge-outro').value = '';
    document.getElementById('ej-data-casamento').value = j.dataCasamento || '';
    document.getElementById('ej-mudanca-local').value = j.mudancaLocal || '';
    if (j.motivoInativo === 'casamento' && j.conjugeNome) {
      if (j.conjugeId) { document.getElementById('ej-conjuge-search').value = nomeAtualDoJovem(j.conjugeNome, j.conjugeId); _conjugePickedId = j.conjugeId; }
      else { document.getElementById('ej-conjuge-outro').value = j.conjugeNome; }
    }
    toggleMotivoInativo();
    toggleMotivoCampos();
    // Load genero
    _ejGenero = j.genero || (
      ['Jovem Moço','Criança Menino','Menino menor de 6','Menor de 5 anos'].includes(j.cat) ||
      j.cat?.toLowerCase().includes('moço') || j.cat?.toLowerCase().includes('menino') ? 'M' : 'F'
    );
    resetGeneroButtons('ej');
    selectGeneroEdit(_ejGenero);
    renderEjIrmaosList();
    openModal('modal-edit-jovem');
  }

  function saveEditJovem() {
    const j = db.jovens[perfilIdx];
    const oldName = j.name;
    j.name = document.getElementById('ej-nome').value.trim() || j.name;
    j.aniv = document.getElementById('ej-aniv').value;
    j.batismo = document.getElementById('ej-batismo').value;
    j.tel  = document.getElementById('ej-tel').value;
    j.obs  = document.getElementById('ej-obs').value;
    j.ativo = document.getElementById('ej-ativo').checked;
    j.excluirRankingPresenca = document.getElementById('ej-excluir-ranking').checked;
    j.auxiliar = document.getElementById('ej-auxiliar').checked;
    if (!j.ativo) {
      const motivo = document.getElementById('ej-motivo').value;
      j.motivoInativo = motivo;
      if (motivo === 'casamento') {
        const conjugeSearch = document.getElementById('ej-conjuge-search').value.trim();
        const conjugeOutro = document.getElementById('ej-conjuge-outro').value.trim();
        const dataCasamento = document.getElementById('ej-data-casamento').value.trim();
        j.dataCasamento = dataCasamento;
        if (conjugeSearch && _conjugePickedId) {
          j.conjugeId = _conjugePickedId;
          j.conjugeNome = conjugeSearch;
          // O cônjuge, se for jovem da mocidade, é desativado também — mesmo motivo e mesma data
          const conjuge = getJovemById(_conjugePickedId);
          if (conjuge) {
            conjuge.ativo = false;
            conjuge.motivoInativo = 'casamento';
            conjuge.conjugeId = j.id;
            conjuge.conjugeNome = j.name;
            conjuge.dataCasamento = dataCasamento;
          }
        } else {
          j.conjugeId = null;
          j.conjugeNome = conjugeOutro || conjugeSearch || '';
        }
      } else if (motivo === 'mudanca') {
        j.mudancaLocal = document.getElementById('ej-mudanca-local').value.trim();
      }
    }
    // Se o nome mudou, sincronizar chaves nos registos de presença histórica
    if (oldName !== j.name && (db.presencas||[]).length) {
      db.presencas.forEach(s => {
        if (s.registros && Object.prototype.hasOwnProperty.call(s.registros, oldName)) {
          s.registros[j.name] = s.registros[oldName];
          delete s.registros[oldName];
        }
      });
    }
    if (_ejGenero) {
      j.genero = _ejGenero;
      j.cat = getGrupoAuto(j);
    }
    saveDB();
    closeModal('modal-edit-jovem');
    openPerfil(perfilIdx);
    renderTracker();
  }

  // ── RENDER VIAGENS ──
  function renderViagens() {
    const container = document.getElementById('viagens-list');
    if (!container) return;
    document.getElementById('viagens-list-view').style.display = 'block';
    document.getElementById('viagem-detail-view').style.display = 'none';

    if (!db.viagens || db.viagens.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 0">
        <div class="empty-icon" style="font-size:36px">✈️</div>
        <div class="empty-title">Nenhuma viagem</div>
        <div class="empty-desc">Toca no + para organizar uma viagem.</div>
      </div>`;
      return;
    }
    const sorted = db.viagens.map((v,i)=>({...v,_idx:i})).sort((a,b)=>new Date(b.dataIda)-new Date(a.dataIda));
    container.innerHTML = sorted.map(v => {
      const dateStr = v.dataIda ? fmtDate(v.dataIda) + (v.dataVolta && v.dataVolta !== v.dataIda ? ' → '+fmtDate(v.dataVolta) : '') : '';
      const totalPart = (v.convidados||[]).length;
      const confirmados = (v.convidados||[]).filter(c=>c.confirmado).length;
      const totalCarros = (v.carros||[]).length + 1;
      return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:10px;cursor:pointer" onclick="openViagemDetail(${v._idx})">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600;letter-spacing:-0.2px;margin-bottom:4px">📍 ${esc(v.destino||'Sem destino')}</div>
            ${v.evento ? `<div style="font-size:12px;color:var(--accent3);margin-bottom:4px">🗓 ${esc(v.evento)}</div>` : ''}
            <div style="font-size:12px;color:var(--muted)">${dateStr}</div>
            <div style="display:flex;gap:8px;margin-top:6px">
              <span style="font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:2px 8px">👥 ${confirmados}/${totalPart}</span>
              <span style="font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:2px 8px">🚗 ${totalCarros} carro${totalCarros!==1?'s':''}</span>
            </div>
          </div>
          <span style="font-size:20px;color:var(--muted)">›</span>
        </div>
      </div>`;
    }).join('');
  }

  // ── VIAGEM DETAIL ──
  let currentViagemIdx = null;

  function openViagemDetail(idx) {
    currentViagemIdx = idx;
    document.getElementById('viagens-list-view').style.display = 'none';
    document.getElementById('viagem-detail-view').style.display = 'block';
    renderViagemDetail();
    const m = document.querySelector('main');
    if (m) m.scrollTop = 0;
  }

  function closeViagemDetail() {
    currentViagemIdx = null;
    document.getElementById('viagens-list-view').style.display = 'block';
    document.getElementById('viagem-detail-view').style.display = 'none';
    renderViagens();
  }

  function renderViagemDetail() {
    if (currentViagemIdx === null) return;
    const v = db.viagens[currentViagemIdx];
    if (!v) return;
    if (!v.convidados) v.convidados = [];
    if (!v.carros) v.carros = [];
    if (!v.meuCarro) v.meuCarro = { lugares: 6, passageiros: [] };
    const dateStr = v.dataIda ? fmtDate(v.dataIda) + (v.dataVolta && v.dataVolta !== v.dataIda ? ' → '+fmtDate(v.dataVolta) : '') : '';
    const confirmados = v.convidados.filter(c=>c.confirmado).length;
    const detail = document.getElementById('viagem-detail-view');
    detail.innerHTML = `
      <!-- Header + back -->
      <div class="vd-header">
        <button class="vd-back" onclick="closeViagemDetail()">‹ Voltar</button>
        <div style="flex:1">
          <div class="vd-title">📍 ${esc(v.destino||'Sem destino')}</div>
          <div class="vd-meta">${v.evento ? '🗓 '+esc(v.evento)+' · ' : ''}${dateStr}</div>
        </div>
        <button onclick="delViagemFromDetail()" style="background:none;border:none;color:#E07B54;font-size:18px;cursor:pointer">🗑</button>
      </div>

      <!-- EDITAR INFO -->
      <div class="card" style="margin-bottom:18px;display:flex;flex-direction:column;gap:10px">
        <div class="vd-section-title" style="margin-bottom:0">✏️ Editar</div>
        <div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Destino</div>
          <div class="ac-wrap">
            <input class="form-input" type="text" id="vde-destino-input" value="${esc(v.destino||'')}"
              placeholder="Buscar ou escrever destino..." autocomplete="off" style="font-size:13px"
              oninput="acLocal(this,'ac-vde-local')" onfocus="acLocal(this,'ac-vde-local')"
              onblur="setTimeout(()=>{ hideAc('ac-vde-local'); saveViagemField('destino',document.getElementById('vde-destino-input').value.trim()) },200)">
            <div class="ac-dropdown" id="ac-vde-local" style="display:none"></div>
          </div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Evento</div>
          <div class="ac-wrap">
            <input class="form-input" type="text" id="vde-evento" value="${esc(v.evento||'')}" placeholder="Buscar ou escrever evento..."
              autocomplete="off" oninput="acEventoEdit(this.value)" onfocus="acEventoEdit(this.value)"
              onblur="setTimeout(()=>{ hideAc('ac-evento-edit'); saveViagemField('evento',document.getElementById('vde-evento').value) },200)"
              style="font-size:13px">
            <div class="ac-dropdown" id="ac-evento-edit" style="display:none"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Ida</div>
            <input class="form-input" type="date" id="vde-ida" value="${v.dataIda||''}" onchange="saveViagemField('dataIda',this.value); const vv=document.getElementById('vde-volta'); if(!vv.value||vv.value===document.getElementById('vde-ida').dataset.prev) vv.value=this.value; document.getElementById('vde-ida').dataset.prev=this.value;" style="font-size:13px">
          </div>
          <div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Volta</div>
            <input class="form-input" type="date" id="vde-volta" value="${v.dataVolta||''}" onchange="saveViagemField('dataVolta',this.value)" style="font-size:13px">
          </div>
        </div>
      </div>

      <!-- CONVIDADOS -->
      <div class="vd-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="vd-section-title" style="margin-bottom:0">👥 Convidados <span id="vd-inv-count">(${confirmados}/${v.convidados.length})</span></div>
          <button onclick="addConvidado()" style="background:var(--accent);color:white;border:none;border-radius:100px;padding:5px 14px;font-size:12px;font-weight:500;cursor:pointer">+ Add</button>
        </div>
        <div id="vd-inv-list"></div>
      </div>

      <!-- CARROS -->
      <div class="vd-section">
        <div class="vd-section-title">🚗 Organização dos carros</div>
        <div class="carro-card" style="border-color:var(--accent);border-left-width:3px">
          <div class="carro-header">
            <div class="carro-titulo">🚙 Meu carro</div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:12px;color:var(--muted)">Lugares:</span>
              <select onchange="setMeuCarroLugares(this.value)" style="border:1px solid var(--border);border-radius:100px;padding:4px 10px;font-size:12px;background:var(--bg);color:var(--text)">
                ${[2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${n===(v.meuCarro.lugares||6)?'selected':''}>${n-1} passageiros</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:10px;padding-left:4px">👤 Eduardo (motorista)</div>
          <div id="meu-carro-posti"></div>
          <button onclick="openPessoaPicker('passageiro',null)" style="width:100%;margin-top:6px;padding:8px;border:1px dashed var(--border);border-radius:100px;background:none;color:var(--accent);font-size:12px;cursor:pointer">+ Adicionar passageiro</button>
        </div>
        <div id="outros-carros"></div>
        <button onclick="addCarro()" style="width:100%;padding:11px;border:1.5px dashed var(--border);border-radius:var(--radius);background:none;color:var(--muted);font-size:13px;font-weight:500;cursor:pointer;margin-top:4px">+ Adicionar outro carro</button>
      </div>

      <!-- REGISTRAR NO TRACKER -->
      <div class="vd-section">
        <button onclick="registrarViagemNoTracker()" style="width:100%;padding:13px;border:1.5px solid var(--accent);border-radius:var(--radius);background:none;color:var(--accent);font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">
          ✅ Registrar viagem no Tracker
        </button>
      </div>

      <!-- WHATSAPP -->
      <div class="vd-section">
        <button class="vd-wa-btn" onclick="enviarWhatsApp()"><span>📤</span> Partilhar via WhatsApp</button>
      </div>
    `;
    renderConvidados();
    renderCarros();
  }

  function saveViagemField(field, value) {
    if (currentViagemIdx === null) return;
    db.viagens[currentViagemIdx][field] = value;
    saveDB();
    // Update header display
    const v = db.viagens[currentViagemIdx];
    const titleEl = document.querySelector('.vd-title');
    const metaEl  = document.querySelector('.vd-meta');
    const dateStr = v.dataIda ? fmtDate(v.dataIda) + (v.dataVolta && v.dataVolta !== v.dataIda ? ' → '+fmtDate(v.dataVolta) : '') : '';
    if (titleEl) titleEl.textContent = '📍 ' + (v.destino||'Sem destino');
    if (metaEl)  metaEl.textContent  = (v.evento ? '🗓 '+v.evento+' · ' : '') + dateStr;
  }

  function acEventoEdit(val) {
    const box = document.getElementById('ac-evento-edit');
    if (!box) return;
    const q = val.trim().toLowerCase();
    const today = new Date().toISOString().slice(0,10);
    const all = (db.eventos||[]).filter(e=>e.data>=today).sort((a,b)=>a.data.localeCompare(b.data));
    const matches = q ? all.filter(e=>(e.tipo+' '+e.local).toLowerCase().includes(q)) : all.slice(0,5);
    if (!matches.length) { box.style.display='none'; return; }
    box.innerHTML = matches.slice(0,5).map(e =>
      `<div class="ac-item" onmousedown="selectAcEventoEdit('${escJs(e.tipo+' — '+(e.local||'')+' ('+fmtDate(e.data)+')')}')">
        <div>${esc(e.tipo)}${e.local?' — '+esc(e.local):''}</div>
        <div class="ac-sub">${fmtDate(e.data)}</div>
      </div>`
    ).join('');
    box.style.display = 'block';
  }

  function selectAcEventoEdit(label) {
    const inp = document.getElementById('vde-evento');
    if (inp) { inp.value = label; saveViagemField('evento', label); }
    hideAc('ac-evento-edit');
  }

  function renderConvidados() {
    if (currentViagemIdx === null) return;
    const v = db.viagens[currentViagemIdx];
    const container = document.getElementById('vd-inv-list');
    if (!container) return;
    const conf = v.convidados.filter(c=>c.confirmado).length;
    const countEl = document.getElementById('vd-inv-count');
    if (countEl) countEl.textContent = `(${conf}/${v.convidados.length})`;
    if (!v.convidados.length) {
      container.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:10px 0">Nenhum convidado ainda.</div>`;
      return;
    }
    container.innerHTML = '';
    v.convidados.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = 'inv-row' + (c.confirmado ? ' confirmed' : '');
      row.innerHTML = `
        <input type="checkbox" class="inv-check" ${c.confirmado?'checked':''} onchange="toggleConvidado(${i},this.checked)">
        <input type="text" class="inv-nome" value="${esc(nomeAtualDoJovem(c.nome,c.jovemId)||'')}" placeholder="Nome..." onchange="editConvidadoNome(${i},this.value)" ${c.confirmado?'style="text-decoration:line-through;color:#2e7d32"':''}>
        <button class="inv-del" onclick="delConvidado(${i})">×</button>
      `;
      container.appendChild(row);
    });
  }

  function addConvidado() {
    openPessoaPicker('convidado');
  }

  // ── Autocomplete de passageiro inline ──
  function setupPostoAC(inp, getNames, onSave) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:100%';
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);

    const drop = document.createElement('div');
    drop.style.cssText = 'position:absolute;left:0;right:0;top:100%;background:var(--surface);border:1px solid var(--border);border-top:none;border-radius:0 0 10px 10px;z-index:50;display:none;max-height:180px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.1)';
    wrap.appendChild(drop);

    function buildItems(q) {
      const jovens = (db.jovens||[]).filter(j => j.ativo !== false);
      const taken = getNames();
      return jovens
        .filter(j => !taken.includes(j.name) && (!q || j.name.toLowerCase().includes(q.toLowerCase())))
        .slice(0, 6);
    }

    function showSuggestions(q) {
      const matches = buildItems(q);
      drop.innerHTML = '';
      if (!matches.length) { drop.style.display = 'none'; return; }
      matches.forEach(j => {
        const item = document.createElement('div');
        item.style.cssText = 'padding:10px 12px;font-size:14px;cursor:pointer;border-bottom:1px solid var(--border)';
        item.innerHTML = `${esc(j.name)} <span style="font-size:11px;color:var(--muted)">${esc(j.cat||'')}</span>`;
        item.addEventListener('mousedown', (e) => e.preventDefault());
        item.addEventListener('click', () => {
          inp.value = j.name;
          drop.style.display = 'none';
          onSave(inp, j.id);
        });
        drop.appendChild(item);
      });
      drop.style.display = 'block';
    }

    inp.addEventListener('input', () => showSuggestions(inp.value));
    inp.addEventListener('focus', () => showSuggestions(inp.value));
    inp.addEventListener('blur', () => setTimeout(() => { drop.style.display = 'none'; }, 200));
  }

  function toggleConvidado(i, checked) {
    if (currentViagemIdx === null) return;
    db.viagens[currentViagemIdx].convidados[i].confirmado = checked;
    saveDB(); renderConvidados();
  }

  function editConvidadoNome(i, val) {
    if (currentViagemIdx === null) return;
    const c = db.viagens[currentViagemIdx].convidados[i];
    c.nome = val;
    c.jovemId = null; // edição manual desliga a ligação ao jovem
    saveDB();
  }

  function delConvidado(i) {
    if (currentViagemIdx === null) return;
    db.viagens[currentViagemIdx].convidados.splice(i, 1);
    saveDB(); renderConvidados();
  }

  function setMeuCarroLugares(val) {
    if (currentViagemIdx === null) return;
    db.viagens[currentViagemIdx].meuCarro.lugares = parseInt(val);
    saveDB(); renderCarros();
  }

  function renderCarros() {
    if (currentViagemIdx === null) return;
    const v = db.viagens[currentViagemIdx];
    const mc = document.getElementById('meu-carro-posti');
    if (mc) {
      mc.innerHTML = '';
      for (let i = 0; i < (v.meuCarro.lugares||6) - 1; i++) {
        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'posto-input';
        inp.placeholder = `Passageiro ${i+1}`;
        inp.value = nomeAtualDoJovem((v.meuCarro.passageiros||[])[i] || '', (v.meuCarro.passageirosIds||[])[i]);
        const _i = i;
        const onSave = (el, jovemId) => {
          if (!v.meuCarro.passageiros) v.meuCarro.passageiros = [];
          if (!v.meuCarro.passageirosIds) v.meuCarro.passageirosIds = [];
          v.meuCarro.passageiros[_i] = el.value;
          v.meuCarro.passageirosIds[_i] = jovemId || null;
          saveDB();
        };
        inp.oninput = () => onSave(inp);
        mc.appendChild(inp);
        setupPostoAC(inp,
          () => [...(v.meuCarro.passageiros||[]), ...(v.carros||[]).flatMap(c=>c.passageiros||[])].filter(Boolean),
          onSave
        );
      }
    }
    const outros = document.getElementById('outros-carros');
    if (!outros) return;
    outros.innerHTML = '';
    (v.carros||[]).forEach((carro, ci) => {
      const card = document.createElement('div');
      card.className = 'carro-card';
      card.innerHTML = `
        <div class="carro-header">
          <div class="carro-titulo">🚗 ${esc(nomeAtualDoJovem(carro.motorista, carro.motoristaId))}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <select onchange="setCarroLugares(${ci},this.value)" style="border:1px solid var(--border);border-radius:100px;padding:4px 10px;font-size:12px;background:var(--bg);color:var(--text)">
              ${[2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${n===carro.lugares?'selected':''}>${n-1} pass.</option>`).join('')}
            </select>
            <button class="carro-del" onclick="delCarro(${ci})">🗑</button>
          </div>
        </div>
        <div id="posti-carro-${ci}"></div>
      `;
      outros.appendChild(card);
      const posti = card.querySelector(`#posti-carro-${ci}`);
      for (let i = 0; i < carro.lugares - 1; i++) {
        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'posto-input';
        inp.placeholder = `Passageiro ${i+1}`;
        inp.value = nomeAtualDoJovem((carro.passageiros||[])[i] || '', (carro.passageirosIds||[])[i]);
        const _i = i;
        const _carro = carro;
        const onSavePosti = (el, jovemId) => {
          if (!_carro.passageiros) _carro.passageiros = [];
          if (!_carro.passageirosIds) _carro.passageirosIds = [];
          _carro.passageiros[_i] = el.value;
          _carro.passageirosIds[_i] = jovemId || null;
          saveDB();
        };
        inp.oninput = () => onSavePosti(inp);
        posti.appendChild(inp);
        setupPostoAC(inp,
          () => [...(v.meuCarro?.passageiros||[]), ...(v.carros||[]).flatMap(c=>c.passageiros||[])].filter(Boolean),
          onSavePosti
        );
      }
      // Add passageiro picker button
      const addBtn = document.createElement('button');
      addBtn.style.cssText = 'width:100%;margin-top:6px;padding:8px;border:1px dashed var(--border);border-radius:100px;background:none;color:var(--accent);font-size:12px;cursor:pointer';
      addBtn.textContent = '+ Adicionar passageiro';
      addBtn.onclick = () => openPessoaPicker('passageiro', ci);
      card.appendChild(addBtn);
    });
  }

  function addCarro() {
    if (currentViagemIdx === null) return;
    // Open motorista modal instead of prompt
    openMotoristaModal();
  }

  function openMotoristaModal() {
    _motoristaPickedId = null;
    document.getElementById('mot-search').value = '';
    document.getElementById('mot-outro').value = '';
    document.getElementById('mot-lugares').value = '5';
    acMotorista('');
    openModal('modal-motorista');
    setTimeout(() => document.getElementById('mot-search').focus(), 200);
  }

  function acMotorista(val) {
    _motoristaPickedId = null;
    acJovemPicker(val, {
      boxId: 'ac-motorista',
      emptyId: 'mot-empty',
      inputId: 'mot-search',
      style: 'card',
      useTouchFix: true,
      onSelect: (j) => {
        const inp = document.getElementById('mot-search');
        if (inp) inp.value = j.name;
        _motoristaPickedId = j.id;
        document.getElementById('ac-motorista').style.display = 'none';
        const empty = document.getElementById('mot-empty');
        if (empty) empty.style.display = 'none';
      }
    });
  }

  function saveMotorista() {
    const search = document.getElementById('mot-search').value.trim();
    const outro = document.getElementById('mot-outro').value.trim();
    const motorista = search || outro;
    if (!motorista) { chzAlert('Indica o nome do motorista!'); return; }
    const lugares = parseInt(document.getElementById('mot-lugares').value) || 5;
    if (lugares < 2) { chzAlert('Mínimo 2 lugares.'); return; }
    if (!db.viagens[currentViagemIdx].carros) db.viagens[currentViagemIdx].carros = [];
    const motoristaId = search ? _motoristaPickedId : null;
    db.viagens[currentViagemIdx].carros.push({id:'carro_'+Date.now(), motorista, motoristaId, lugares, passageiros:[], passageirosIds:[]});
    saveDB(); renderCarros();
    closeModal('modal-motorista');
  }

  function setCarroLugares(ci, val) {
    if (currentViagemIdx === null) return;
    db.viagens[currentViagemIdx].carros[ci].lugares = parseInt(val);
    saveDB(); renderCarros();
  }

  function registrarViagemNoTracker() {
    if (currentViagemIdx === null) return;
    const v = db.viagens[currentViagemIdx];
    const date = v.dataIda || new Date().toISOString().slice(0,10);
    // Build note: evento ou só local
    const note = v.evento ? v.evento : (v.destino || '');

    // Collect all names — read directly from live DOM (fonte da verdade)
    const nomes = new Set();
    // Todos os posto-input visíveis (meu carro + outros carros)
    document.querySelectorAll('.posto-input').forEach(el => {
      if (el.value.trim()) nomes.add(el.value.trim());
    });
    // Motoristas dos outros carros (do DB, não têm posto-input) — nome atual via ID
    (v.carros||[]).forEach(carro => {
      const nomeAtual = nomeAtualDoJovem(carro.motorista, carro.motoristaId);
      if (nomeAtual && nomeAtual.trim()) nomes.add(nomeAtual.trim());
    });
    // Fallback: DB arrays caso os inputs não estejam visíveis — também com nome atual
    (v.meuCarro?.passageiros||[]).forEach((n,i) => { const na = nomeAtualDoJovem(n,(v.meuCarro.passageirosIds||[])[i]); if(na && na.trim()) nomes.add(na.trim()); });
    (v.carros||[]).forEach(carro => {
      (carro.passageiros||[]).forEach((n,i) => { const na = nomeAtualDoJovem(n,(carro.passageirosIds||[])[i]); if(na && na.trim()) nomes.add(na.trim()); });
    });

    // Unique ID for this viagem registration (prevents duplicates)
    const viagemId = v.id || ('v_' + (v.dataIda||'') + '_' + (v.destino||'').replace(/\s/g,''));

    // Match names against db.jovens (case-insensitive)
    let registrados = 0;
    let jaRegistrados = 0;
    nomes.forEach(nome => {
      const nomeLower = nome.toLowerCase();
      const jIdx = db.jovens.findIndex(j => j.name.toLowerCase() === nomeLower);
      if (jIdx >= 0) {
        if (!db.jovens[jIdx].interactions) db.jovens[jIdx].interactions = [];
        // Check if already registered for this viagem
        const jaDuplicado = db.jovens[jIdx].interactions.some(i => i.tipo === 'viagem' && i.viagemId === viagemId);
        if (jaDuplicado) {
          jaRegistrados++;
        } else {
          db.jovens[jIdx].interactions.push({ tipo: 'viagem', date, note, viagemId });
          registrados++;
        }
      }
    });

    saveDB();
    renderTracker();
    const nomesArr = [...nomes];
    if (registrados === 0 && jaRegistrados === 0) {
      chzAlert('Nenhum nome corresponde a um jovem do database.\n\nNomes detetados nos carros:\n' + (nomesArr.length ? nomesArr.join('\n') : '(nenhum)') + '\n\nVerifica se os nomes coincidem exatamente com os da lista de jovens.');
    } else if (registrados === 0 && jaRegistrados > 0) {
      chzAlert(`ℹ️ Todos os jovens já tinham esta viagem registrada no Tracker.`);
    } else {
      const extra = jaRegistrados > 0 ? `\n(${jaRegistrados} já estavam registrados — ignorados)` : '';
      chzAlert(`✅ Registrado no Tracker de ${registrados} ${registrados>1?'jovens':'jovem'}!${extra}`);
    }
  }

  async function delCarro(ci) {
    if (currentViagemIdx === null) return;
    if (await chzConfirm('Remover este carro?', 'Remover')) {
      db.viagens[currentViagemIdx].carros.splice(ci, 1);
      saveDB(); renderCarros();
    }
  }

  async function delViagemFromDetail() {
    if (currentViagemIdx === null) return;
    const v = db.viagens[currentViagemIdx];
    if (await chzConfirm(`Remover viagem para ${v.destino}?`, 'Remover')) {
      db.viagens.splice(currentViagemIdx, 1);
      saveDB(); closeViagemDetail();
    }
  }

  function enviarWhatsApp() {
    if (currentViagemIdx === null) return;
    const v = db.viagens[currentViagemIdx];
    const dateStr = v.dataIda ? fmtDate(v.dataIda) + (v.dataVolta && v.dataVolta !== v.dataIda ? ' → '+fmtDate(v.dataVolta) : '') : '—';
    let msg = `🚗 VIAGEM\n\n📍 Destino: ${v.destino||'—'}\n`;
    if (v.evento) msg += `🗓 Evento: ${v.evento}\n`;
    msg += `📅 Data: ${dateStr}\n\n`;
    if (v.convidados && v.convidados.length) {
      const conf = v.convidados.filter(c=>c.confirmado&&c.nome);
      const pend = v.convidados.filter(c=>!c.confirmado&&c.nome);
      msg += `📋 CONVIDADOS\n`;
      if (pend.length) { msg += `Aguardando:\n`; pend.forEach(c=>msg+=`• ${nomeAtualDoJovem(c.nome,c.jovemId)}\n`); }
      if (conf.length) { msg += `Confirmados:\n`; conf.forEach(c=>msg+=`✅ ${nomeAtualDoJovem(c.nome,c.jovemId)}\n`); }
      msg += `\n`;
    }
    msg += `🚙 Meu carro (Eduardo):\n`;
    const mcPass = (v.meuCarro?.passageiros||[]).map((p,i)=>nomeAtualDoJovem(p,(v.meuCarro.passageirosIds||[])[i])).filter(p=>p&&p.trim());
    if (mcPass.length) mcPass.forEach(p=>msg+=`- ${p}\n`); else msg += `(sem passageiros)\n`;
    msg += `\n`;
    (v.carros||[]).forEach(c => {
      msg += `🚗 ${nomeAtualDoJovem(c.motorista,c.motoristaId)}:\n`;
      const pass = (c.passageiros||[]).map((p,i)=>nomeAtualDoJovem(p,(c.passageirosIds||[])[i])).filter(p=>p&&p.trim());
      if (pass.length) pass.forEach(p=>msg+=`- ${p}\n`); else msg += `(sem passageiros)\n`;
      msg += `\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // ── FAB ──
  function openFab() {
    const activeSection = document.querySelector('.section.active')?.id || '';
    if (activeSection === 'sec-servicos') { openNovoServico(); return; }
    if (activeSection === 'sec-biblia') {
      const leitTab = document.getElementById('biblia-leitura');
      const livrosTab = document.getElementById('biblia-livros');
      const curTab = document.getElementById('biblia-curiosidades');
      const favTab = document.getElementById('biblia-favoritos');
      const oeeTab = document.getElementById('biblia-ondeescrito');
      if (livrosTab && livrosTab.style.display !== 'none') {
        if (livroAtualIdx !== null) return; // já dentro de um livro — usa os botões próprios de Cap./Termo/Vers. ali mesmo
        openNovoLivro();
        return;
      }
      if (curTab && curTab.style.display !== 'none') { openNovaCuriosidade(); return; }
      if (favTab && favTab.style.display !== 'none') { openNovoFavorito(); return; }
      if (oeeTab && oeeTab.style.display !== 'none') {
        openNovaCuriosidade();
        document.getElementById('cur-categoria').value = 'Onde está escrito';
        return;
      }
      return;
    }
    if (activeSection === 'sec-biblia') {
      const activeBibliaTab = document.querySelector('.inner-tab.active')?.textContent.trim() || '';
      if (activeBibliaTab.includes('Leitura')) { openNovaLeitura(); return; }
      if (activeBibliaTab.includes('Curiosidades')) { openNovaCuriosidade(); return; }
      if (activeBibliaTab.includes('Favoritos')) { openNovoFavorito(); return; }
      openNovaLeitura(); return;
    }
    // Mocidade
    const isViagens   = document.getElementById('moc-viagens').style.display   !== 'none';
    const isEncontros = document.getElementById('moc-encontros').style.display !== 'none';
    const isIdeias    = document.getElementById('moc-ideias').style.display    !== 'none';
    const isPresenca  = document.getElementById('moc-presenca').style.display  !== 'none';
    if (isViagens) {
      openNovaViagem();
    } else if (isEncontros) {
      openNovoEncontro();
    } else if (isIdeias) {
      openNovaIdeia();
    } else if (isPresenca) {
      const rankingView = document.getElementById('presenca-ranking-view');
      if (rankingView && rankingView.style.display !== 'none') return; // sem ação no ranking
      openNovaSessaoPresenca();
    } else {
      openModal('modal-jovem');
    }
  }

  // ── GENDER SELECTOR HELPERS ──
  let _njGenero = null;
  let _ejGenero = null;
  let _conjugePickedId = null; // id do jovem escolhido como cônjuge (null se digitado à mão / sem escolha)

  function toggleMotivoInativo() {
    const ativo = document.getElementById('ej-ativo').checked;
    document.getElementById('ej-motivo-wrap').style.display = ativo ? 'none' : 'block';
  }

  function toggleMotivoCampos() {
    const motivo = document.getElementById('ej-motivo').value;
    document.getElementById('ej-motivo-casamento').style.display = motivo === 'casamento' ? 'block' : 'none';
    document.getElementById('ej-motivo-mudanca').style.display = motivo === 'mudanca' ? 'block' : 'none';
  }

  function acConjuge(q) {
    if (perfilIdx === null) return;
    const j = db.jovens[perfilIdx];
    _conjugePickedId = null;
    acJovemPicker(q, {
      boxId: 'ac-conjuge',
      excluirSelfId: j.id,
      style: 'compacta',
      onSelect: (x) => {
        const inp = document.getElementById('ej-conjuge-search');
        if (inp) inp.value = x.name;
        _conjugePickedId = x.id;
        document.getElementById('ac-conjuge').style.display = 'none';
      }
    });
  }

  function selectGenero(g) {
    _njGenero = g;
    const btnF = document.getElementById('nj-gen-f');
    const btnM = document.getElementById('nj-gen-m');
    if (btnF && btnM) {
      btnF.style.borderColor = g === 'F' ? 'var(--accent)' : 'var(--border)';
      btnF.style.background  = g === 'F' ? 'var(--accent)' : 'var(--surface)';
      btnF.style.color       = g === 'F' ? 'white' : 'var(--muted)';
      btnM.style.borderColor = g === 'M' ? 'var(--accent)' : 'var(--border)';
      btnM.style.background  = g === 'M' ? 'var(--accent)' : 'var(--surface)';
      btnM.style.color       = g === 'M' ? 'white' : 'var(--muted)';
    }
    updateGrupoPreview('nj');
  }

  function selectGeneroEdit(g) {
    _ejGenero = g;
    const btnF = document.getElementById('ej-gen-f');
    const btnM = document.getElementById('ej-gen-m');
    if (btnF && btnM) {
      btnF.style.borderColor = g === 'F' ? 'var(--accent)' : 'var(--border)';
      btnF.style.background  = g === 'F' ? 'var(--accent)' : 'var(--surface)';
      btnF.style.color       = g === 'F' ? 'white' : 'var(--muted)';
      btnM.style.borderColor = g === 'M' ? 'var(--accent)' : 'var(--border)';
      btnM.style.background  = g === 'M' ? 'var(--accent)' : 'var(--surface)';
      btnM.style.color       = g === 'M' ? 'white' : 'var(--muted)';
    }
    updateGrupoPreview('ej');
  }

  function formatDateSimples(inp) {
    // Auto-inserts slashes: dd/mm/aaaa (sem ligação ao grupo automático — usado no Batismo)
    let v = inp.value.replace(/\D/g,'');
    if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
    if (v.length > 5) v = v.slice(0,5) + '/' + v.slice(5);
    inp.value = v.slice(0,10);
  }

  function formatAnivInput(inp) {
    // Auto-inserts slashes: dd/mm/aaaa
    let v = inp.value.replace(/\D/g,'');
    if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
    if (v.length > 5) v = v.slice(0,5) + '/' + v.slice(5);
    inp.value = v.slice(0,10);
    const prefix = inp.id.startsWith('ej') ? 'ej' : 'nj';
    updateGrupoPreview(prefix);
  }

  function updateGrupoPreview(prefix) {
    const aniv = document.getElementById(prefix + '-aniv')?.value || '';
    const genero = prefix === 'nj' ? _njGenero : _ejGenero;
    const preview = document.getElementById(prefix + '-grupo-preview');
    if (!preview) return;
    if (!genero || !aniv) { preview.style.display = 'none'; return; }
    const temp = { genero, aniv };
    const grupo = getGrupoAuto(temp);
    const idade = calcIdade(aniv);
    if (idade !== null) {
      preview.style.display = 'block';
      preview.textContent = `→ Grupo: ${grupo} (${idade} anos)`;
    } else {
      preview.style.display = 'none';
    }
  }

  function resetGeneroButtons(prefix) {
    ['f','m'].forEach(g => {
      const btn = document.getElementById(prefix + '-gen-' + g);
      if (btn) {
        btn.style.borderColor = 'var(--border)';
        btn.style.background = 'var(--surface)';
        btn.style.color = 'var(--muted)';
      }
    });
  }

  // ── SAVE JOVEM ──
  function saveJovem() {
    const nome = document.getElementById('nj-nome').value.trim();
    if (!nome) { chzAlert('Digite um nome!'); return; }
    if (!_njGenero) { chzAlert('Seleciona o gênero!'); return; }
    const aniv = document.getElementById('nj-aniv').value.trim();
    db.jovens.push({
      id: gerarIdJovem(),
      name: nome,
      genero: _njGenero,
      cat: getGrupoAuto({ genero: _njGenero, aniv }),
      aniv,
      batismo: document.getElementById('nj-batismo').value.trim(),
      tel: document.getElementById('nj-tel').value,
      obs: document.getElementById('nj-obs').value,
      interactions: [],
      irmaosIds: [],
      ativo: document.getElementById('nj-ativo').checked
    });
    document.getElementById('nj-nome').value = '';
    document.getElementById('nj-aniv').value = '';
    document.getElementById('nj-batismo').value = '';
    document.getElementById('nj-tel').value = '';
    document.getElementById('nj-obs').value = '';
    document.getElementById('nj-ativo').checked = true;
    _njGenero = null;
    resetGeneroButtons('nj');
    const prev = document.getElementById('nj-grupo-preview');
    if (prev) prev.style.display = 'none';
    saveDB();
    closeModal('modal-jovem');
    renderTracker();
  }

  // ── SAVE VIAGEM ──
  function saveViagem() {
    const destino = (document.getElementById('nv-dest-input')?.value || '').trim();
    if (!destino) { chzAlert('Seleciona um destino!'); return; }
    const evento = (document.getElementById('nv-evento-input').value || '').trim();
    const mesmodia = document.getElementById('nv-mesmo-dia').checked;
    const dataIda   = document.getElementById('nv-data-ida').value;
    const dataVolta = mesmodia ? dataIda : document.getElementById('nv-data-volta').value;
    const viagem = {
      destino, evento, dataIda, dataVolta,
      convidados: [], carros: [],
      meuCarro: { lugares: 6, passageiros: [] }
    };
    db.viagens.push(viagem);
    saveDB();
    closeModal('modal-viagem');
    renderViagens();
    openViagemDetail(db.viagens.length - 1);
  }

  // ── INTERACTION MODAL (from perfil) ──
  function openInterModal(idx, tipo) {
    interCtx = { idx, tipo };
    const jovem = db.jovens[idx];
    document.getElementById('inter-title').textContent = jovem.name + ' · ' + ({presente:'🎁 Presente',conversa:'💬 Conversa',viagem:'✈️ Viagem',outro:'📝 Outro'}[tipo]||tipo);
    document.getElementById('inter-tipo').value = tipo;
    document.getElementById('inter-date').value = new Date().toISOString().slice(0,10);
    toggleOutroField();
    renderInterHist(idx, tipo);
    openModal('modal-inter');
  }

  document.getElementById('inter-tipo').addEventListener('change', () => { toggleOutroField(); if(interCtx) renderInterHist(interCtx.idx, document.getElementById('inter-tipo').value); });
  function toggleOutroField() { document.getElementById('inter-outro-wrap').style.display = document.getElementById('inter-tipo').value==='outro' ? 'block' : 'none'; }

  function renderInterHist(idx, tipo) {
    const j = db.jovens[idx];
    const hist = (j.interactions||[]).filter(i=>i.tipo===tipo).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const div = document.getElementById('inter-hist');
    if (!hist.length) { div.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:8px 0">Nenhuma entrada ainda.</div>`; return; }
    div.innerHTML = hist.map(h => `<div class="hist-item"><span>${fmtDate(h.date)}${h.note?' · '+esc(h.note):''}</span><button class="hist-del" onclick="delInter(${idx},'${tipo}',${j.interactions.indexOf(h)})">✕</button></div>`).join('');
  }

  function saveInter() {
    if (!interCtx) return;
    const { idx } = interCtx;
    const date = document.getElementById('inter-date').value;
    const realTipo = document.getElementById('inter-tipo').value;
    const note = realTipo==='outro' ? document.getElementById('inter-outro').value : '';
    if (!date) { chzAlert('Selecione uma data!'); return; }
    db.jovens[idx].interactions.push({ tipo:realTipo, date, note });
    saveDB();
    renderInterHist(idx, realTipo);
    renderTracker();
    if (perfilIdx===idx) renderPerfilHist(idx);
  }

  function delInter(idx, tipo, interIdx) {
    db.jovens[idx].interactions.splice(interIdx, 1);
    saveDB(); renderInterHist(idx, tipo); renderTracker();
    if (perfilIdx===idx) renderPerfilHist(idx);
  }

  async function delJovem(idx) {
    if (await chzConfirm(`Remover ${db.jovens[idx].name}?`, 'Remover')) {
      const idRemovido = db.jovens[idx].id;
      db.jovens.splice(idx,1);
      if (idRemovido) db.jovens.forEach(j => { if (j.irmaosIds) j.irmaosIds = j.irmaosIds.filter(id => id !== idRemovido); });
      saveDB();
      renderTracker();
    }
  }



  // ══════════════════════════════════════════
  // A3 — ETAPA 3: migração silenciosa de registos antigos para ID
  // Só liga o ID quando o nome bate, de forma inequívoca, com UM único jovem
  // atual. Casos ambíguos ou sem correspondência ficam como estavam — nada
  // é forçado nem apagado.
  // ══════════════════════════════════════════
  function resolverJovemIdExato(nome) {
    if (!nome) return null;
    const candidatos = (db.jovens || []).filter(j => j.name === nome);
    return candidatos.length === 1 ? candidatos[0].id : null;
  }

  function migrarViagensEncontrosParaId() {
    let changed = false;
    (db.viagens || []).forEach(v => {
      (v.convidados || []).forEach(c => {
        if (!c.jovemId) {
          const id = resolverJovemIdExato(c.nome);
          if (id) { c.jovemId = id; changed = true; }
        }
      });
      (v.carros || []).forEach(carro => {
        if (!carro.motoristaId) {
          const id = resolverJovemIdExato(carro.motorista);
          if (id) { carro.motoristaId = id; changed = true; }
        }
        if (!carro.passageirosIds || carro.passageirosIds.length !== (carro.passageiros || []).length) {
          carro.passageirosIds = (carro.passageiros || []).map(nome => resolverJovemIdExato(nome));
          changed = true;
        }
      });
      if (v.meuCarro && (!v.meuCarro.passageirosIds || v.meuCarro.passageirosIds.length !== (v.meuCarro.passageiros || []).length)) {
        v.meuCarro.passageirosIds = (v.meuCarro.passageiros || []).map(nome => resolverJovemIdExato(nome));
        changed = true;
      }
    });
    (db.encontros || []).forEach(enc => {
      if (!enc.presentesIds || enc.presentesIds.length !== (enc.presentes || []).length) {
        enc.presentesIds = (enc.presentes || []).map(nome => resolverJovemIdExato(nome));
        changed = true;
      }
    });
    if (changed) saveDB();
  }

  // ── IDEIAS ──
  let ideiaEditIdx = null;
  let ideiaTagFilter = null; // null = todos
  let pendingTags = []; // tags being built in modal

  function getAllTags() {
    const set = new Set();
    (db.ideias || []).forEach(idea => (idea.tags || []).forEach(t => set.add(t)));
    return [...set].sort();
  }

  function openNovaIdeia() {
    ideiaEditIdx = null;
    pendingTags = [];
    document.getElementById('ideia-modal-title').textContent = 'Nova Ideia';
    document.getElementById('ideia-titulo').value = '';
    document.getElementById('ideia-texto').value = '';
    document.getElementById('ideia-tag-input').value = '';
    renderModalTags();
    renderSavedTagSuggestions();
    openModal('modal-ideia');
  }

  function openEditIdeia(idx) {
    ideiaEditIdx = idx;
    const idea = db.ideias[idx];
    pendingTags = [...(idea.tags || [])];
    document.getElementById('ideia-modal-title').textContent = 'Editar Ideia';
    document.getElementById('ideia-titulo').value = idea.titulo || '';
    document.getElementById('ideia-texto').value = idea.texto || '';
    document.getElementById('ideia-tag-input').value = '';
    renderModalTags();
    renderSavedTagSuggestions();
    openModal('modal-ideia');
  }

  function addIdeiaTag() {
    const inp = document.getElementById('ideia-tag-input');
    const val = inp.value.trim().toLowerCase();
    if (!val || pendingTags.includes(val)) { inp.value = ''; return; }
    pendingTags.push(val);
    inp.value = '';
    renderModalTags();
    renderSavedTagSuggestions();
  }

  function removeIdeiaTag(tag) {
    pendingTags = pendingTags.filter(t => t !== tag);
    renderModalTags();
    renderSavedTagSuggestions();
  }

  function addSavedTag(tag) {
    if (!pendingTags.includes(tag)) {
      pendingTags.push(tag);
      renderModalTags();
      renderSavedTagSuggestions();
    }
  }

  function renderModalTags() {
    const wrap = document.getElementById('ideia-tags-wrap');
    if (!wrap) return;
    wrap.innerHTML = pendingTags.map(t => `
      <span style="display:inline-flex;align-items:center;gap:4px;background:var(--accent);color:white;border-radius:100px;padding:3px 10px;font-size:12px;font-weight:500">
        ${esc(t)}
        <span onclick="removeIdeiaTag('${escJs(t)}')" style="cursor:pointer;font-size:14px;line-height:1;margin-left:2px">×</span>
      </span>`).join('');
  }

  function renderSavedTagSuggestions() {
    const wrap = document.getElementById('ideia-tags-saved');
    if (!wrap) return;
    const all = getAllTags().filter(t => !pendingTags.includes(t));
    if (!all.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = '<span style="font-size:11px;color:var(--muted);margin-right:4px">Tags salvas:</span>' +
      all.map(t => `<span onclick="addSavedTag('${escJs(t)}')" style="cursor:pointer;background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:3px 10px;font-size:11px;color:var(--muted)">${esc(t)}</span>`).join('');
  }

  function saveIdeia() {
    const titulo = document.getElementById('ideia-titulo').value.trim();
    const texto = document.getElementById('ideia-texto').value.trim();
    if (!texto && !titulo) { chzAlert('Escreve algo!'); return; }
    if (!db.ideias) db.ideias = [];
    const now = new Date().toISOString();
    if (ideiaEditIdx !== null) {
      db.ideias[ideiaEditIdx].titulo = titulo;
      db.ideias[ideiaEditIdx].texto = texto;
      db.ideias[ideiaEditIdx].tags = [...pendingTags];
      db.ideias[ideiaEditIdx].editado = now;
    } else {
      db.ideias.unshift({ titulo, texto, tags: [...pendingTags], criado: now });
    }
    saveDB();
    closeModal('modal-ideia');
    renderIdeias();
  }

  async function delIdeia(idx) {
    if (await chzConfirm('Remover esta ideia?', 'Remover')) {
      db.ideias.splice(idx, 1);
      saveDB();
      renderIdeias();
    }
  }

  function renderIdeias() {
    const tagBar = document.getElementById('ideias-tag-bar');
    const container = document.getElementById('ideias-list');
    if (!tagBar || !container) return;

    // Tag filter bar
    const allTags = getAllTags();
    tagBar.innerHTML = allTags.length ? [
      `<span onclick="setIdeiaTagFilter(null)" style="cursor:pointer;border-radius:100px;padding:4px 12px;font-size:12px;font-weight:500;background:${ideiaTagFilter === null ? 'var(--text)' : 'var(--surface)'};color:${ideiaTagFilter === null ? 'white' : 'var(--muted)'};border:1px solid var(--border)">Todas</span>`,
      ...allTags.map(t => `<span onclick="setIdeiaTagFilter('${escJs(t)}')" style="cursor:pointer;border-radius:100px;padding:4px 12px;font-size:12px;font-weight:500;background:${ideiaTagFilter === t ? 'var(--accent)' : 'var(--surface)'};color:${ideiaTagFilter === t ? 'white' : 'var(--muted)'};border:1px solid var(--border)">${esc(t)}</span>`)
    ].join('') : '';

    // Filter ideias
    let list = (db.ideias || []);
    if (ideiaTagFilter) list = list.filter(i => (i.tags||[]).includes(ideiaTagFilter));

    if (!list.length) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 0">
        <div class="empty-icon" style="font-size:36px">💡</div>
        <div class="empty-title">${ideiaTagFilter ? 'Nenhuma ideia com esta tag' : 'Nenhuma ideia ainda'}</div>
        <div class="empty-desc">Toca no + para adicionar.</div>
      </div>`;
      return;
    }

    container.innerHTML = list.map((idea, i) => {
      const realIdx = db.ideias.indexOf(idea);
      const d = new Date(idea.criado);
      const dateStr = d.toLocaleDateString('pt-BR', {day:'numeric', month:'short', year:'numeric'});
      const preview = (idea.texto || '').slice(0, 120) + ((idea.texto||'').length > 120 ? '…' : '');
      const tagsHtml = (idea.tags||[]).map(t =>
        `<span style="background:var(--accent);color:white;border-radius:100px;padding:2px 8px;font-size:11px;font-weight:500">${esc(t)}</span>`
      ).join('');
      return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
          <div style="flex:1">
            ${idea.titulo ? `<div style="font-weight:600;font-size:14px;margin-bottom:2px">${esc(idea.titulo)}</div>` : ''}
            <div style="font-size:12px;color:var(--muted)">${dateStr}${idea.editado ? ' · editado' : ''}</div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button onclick="openEditIdeia(${realIdx})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer">✏️</button>
            <button onclick="delIdeia(${realIdx})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer;color:#E07B54">🗑</button>
          </div>
        </div>
        ${preview ? `<div style="font-size:13px;color:var(--text);margin-bottom:8px;white-space:pre-wrap">${esc(preview)}</div>` : ''}
        ${tagsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${tagsHtml}</div>` : ''}
      </div>`;
    }).join('');
  }

  function setIdeiaTagFilter(tag) {
    ideiaTagFilter = tag;
    renderIdeias();
  }

  // ── ENCONTROS ──
  let encPresentes = []; // array of names during editing
  let encPresentesIds = []; // A3 — array irmão de encPresentes: id do jovem (ou null se nome externo)
  let _motoristaPickedId = null; // A3 — id do jovem escolhido como motorista (null se digitado à mão)

  let encEditIdx = null;

  function openEditEncontro(idx) {
    encEditIdx = idx;
    const enc = db.encontros[idx];
    encPresentes = [...(enc.presentes || [])];
    encPresentesIds = (enc.presentesIds && enc.presentesIds.length === encPresentes.length)
      ? [...enc.presentesIds] : encPresentes.map(() => null);
    document.getElementById('enc-nome').value = enc.nome || '';
    document.getElementById('enc-data').value = enc.data || new Date().toISOString().slice(0,10);
    document.getElementById('enc-notas').value = enc.notas || '';
    document.getElementById('enc-pessoa-search').value = '';
    renderEncPresentes();
    // Change save button behavior
    document.querySelector('#modal-encontro .btn-save').onclick = saveEditEncontro;
    document.querySelector('#modal-encontro .modal-title').textContent = '✏️ Editar Encontro';
    openModal('modal-encontro');
  }

  function saveEditEncontro() {
    const nome = document.getElementById('enc-nome').value.trim();
    if (!nome) { chzAlert('Dá um nome ao encontro!'); return; }
    const enc = db.encontros[encEditIdx];
    const dataFormatted = enc.data.split('-').reverse().join('/');
    const oldNome = enc.nome;
    const oldPresentes = [...(enc.presentes || [])];
    const newData = document.getElementById('enc-data').value || enc.data;
    const newDataFormatted = newData.split('-').reverse().join('/');
    const notas = document.getElementById('enc-notas').value.trim();

    // Remove old interactions
    oldPresentes.forEach(pName => {
      const j = db.jovens.find(x => x.name === pName);
      if (j && j.interactions) {
        j.interactions = j.interactions.filter(inter =>
          !(inter.date === dataFormatted && (inter.desc === oldNome || inter.note === oldNome) && (inter.tipo === 'Outro' || inter.tipo === 'outro'))
        );
      }
    });

    // Update encontro
    enc.nome = nome;
    enc.data = newData;
    enc.notas = notas;
    enc.presentes = [...encPresentes];
    enc.presentesIds = [...encPresentesIds];

    // Re-register interactions for new presentes list
    encPresentes.forEach(pName => {
      const j = db.jovens.find(x => x.name === pName);
      if (j) {
        if (!j.interactions) j.interactions = [];
        j.interactions.push({ date: newDataFormatted, tipo: 'Outro', desc: nome });
      }
    });

    saveDB();
    closeModal('modal-encontro');
    // Reset save button back to create mode
    document.querySelector('#modal-encontro .btn-save').onclick = saveEncontro;
    document.querySelector('#modal-encontro .modal-title').textContent = '🎉 Novo Encontro';
    encEditIdx = null;
    renderEncontros();
    renderTracker();
  }

  function openNovoEncontro() {
    encPresentes = [];
    encPresentesIds = [];
    encEditIdx = null;
    document.getElementById('enc-nome').value = '';
    document.getElementById('enc-data').value = new Date().toISOString().slice(0,10);
    document.getElementById('enc-notas').value = '';
    document.getElementById('enc-pessoa-search').value = '';
    // Reset modal to create mode
    document.querySelector('#modal-encontro .btn-save').onclick = saveEncontro;
    document.querySelector('#modal-encontro .modal-title').textContent = '🎉 Novo Encontro';
    renderEncPresentes();
    openModal('modal-encontro');
  }

  function acEncontro(q) {
    acJovemPicker(q, {
      boxId: 'ac-enc-pessoa',
      excluir: encPresentes,
      excluirPor: 'name',
      style: 'simples',
      onSelect: (j) => {
        addEncPresente(j.name, j.id);
        document.getElementById('enc-pessoa-search').value = '';
        document.getElementById('ac-enc-pessoa').style.display = 'none';
      }
    });
  }

  function addEncPresente(name, jovemId) {
    if (!encPresentes.includes(name)) {
      encPresentes.push(name);
      encPresentesIds.push(jovemId || null);
      renderEncPresentes();
    }
  }

  function removeEncPresente(name) {
    const idx = encPresentes.indexOf(name);
    encPresentes = encPresentes.filter(n => n !== name);
    if (idx >= 0) encPresentesIds.splice(idx, 1);
    renderEncPresentes();
  }

  function renderEncPresentes() {
    const el = document.getElementById('enc-presentes-list');
    if (!el) return;
    if (!encPresentes.length) {
      el.innerHTML = `<span style="font-size:12px;color:var(--muted);padding:4px 0">Nenhum adicionado ainda</span>`;
      return;
    }
    el.innerHTML = encPresentes.map((n,i) =>
      `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--accent);color:white;border-radius:100px;padding:4px 10px;font-size:12px;font-weight:500">
        ${esc(nomeAtualDoJovem(n, encPresentesIds[i]))}
        <span onclick="removeEncPresente('${n.replace(/'/g,"\\'")}')" style="cursor:pointer;opacity:0.8;font-size:14px;line-height:1">×</span>
      </span>`
    ).join('');
  }

  function saveEncontro() {
    const nome = document.getElementById('enc-nome').value.trim();
    if (!nome) { chzAlert('Dá um nome ao encontro!'); return; }
    const data = document.getElementById('enc-data').value || new Date().toISOString().slice(0,10);
    const notas = document.getElementById('enc-notas').value.trim();
    // Save encontro
    if (!db.encontros) db.encontros = [];
    db.encontros.unshift({ nome, data, notas, presentes: [...encPresentes], presentesIds: [...encPresentesIds], criado: Date.now() });
    // Register interaction on each present jovem
    const dataFormatted = data.split('-').reverse().join('/'); // dd/mm/yyyy
    encPresentes.forEach(pName => {
      const j = db.jovens.find(x => x.name === pName);
      if (j) {
        if (!j.interactions) j.interactions = [];
        j.interactions.push({ date: dataFormatted, tipo: 'Outro', desc: nome });
      }
    });
    saveDB();
    closeModal('modal-encontro');
    renderEncontros();
    renderTracker();
  }

  async function deleteEncontro(idx) {
    const enc = db.encontros[idx];
    if (!(await chzConfirm(`Remover "${enc.nome}"?\nAs interações registradas nas fichas dos jovens presentes também serão removidas.`, 'Remover'))) return;
    // Remove corresponding interactions from each jovem
    const dataFormatted = enc.data.split('-').reverse().join('/');
    (enc.presentes || []).forEach(pName => {
      const j = db.jovens.find(x => x.name === pName);
      if (j && j.interactions) {
        j.interactions = j.interactions.filter(inter =>
          !(inter.date === dataFormatted && (inter.desc === enc.nome || inter.note === enc.nome) && (inter.tipo === 'Outro' || inter.tipo === 'outro'))
        );
      }
    });
    db.encontros.splice(idx, 1);
    saveDB();
    renderEncontros();
    renderTracker();
  }

  function openVerEncontro(idx) {
    const enc = db.encontros[idx];
    if (!enc) return;
    const [y,m,d] = enc.data.split('-');
    const dateStr = `${d}/${m}/${y}`;
    const presentes = (enc.presentes || []);
    const presentesIds = enc.presentesIds || [];
    const chips = presentes.length
      ? presentes.map((n,i) => `<span style="background:var(--bg);border:1px solid var(--border);border-radius:100px;padding:4px 10px;font-size:12px">${esc(nomeAtualDoJovem(n, presentesIds[i]))}</span>`).join('')
      : `<span style="font-size:13px;color:var(--muted)">Nenhum presente registado.</span>`;
    document.getElementById('ver-nota-conteudo').innerHTML = `
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:var(--accent3);text-transform:uppercase;margin-bottom:6px">🎉 Encontro</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:6px">${esc(enc.nome)}</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:14px">📅 ${dateStr}</div>
        ${enc.notas ? `<div style="font-size:13px;color:var(--muted);font-style:italic;margin-bottom:14px;border-top:1px solid var(--border);padding-top:12px">${esc(enc.notas)}</div>` : ''}
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px">👥 Presentes (${presentes.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${chips}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="closeModal('modal-ver-nota');openEditEncontro(${idx})" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);font-size:13px;cursor:pointer">✏️ Editar</button>
        <button onclick="closeModal('modal-ver-nota')" style="flex:1;padding:10px;border-radius:10px;border:none;background:var(--accent3);color:white;font-size:13px;cursor:pointer">Fechar</button>
      </div>`;
    openModal('modal-ver-nota');
  }

  function renderEncontros() {
    const container = document.getElementById('encontros-list');
    if (!container) return;
    if (!db.encontros) db.encontros = [];
    if (!db.encontros.length) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 0">
        <div class="empty-icon" style="font-size:36px">🎉</div>
        <div class="empty-title">Nenhum encontro ainda</div>
        <div class="empty-desc">Toca no + para registar um encontro em grupo.</div>
      </div>`;
      return;
    }
    container.innerHTML = db.encontros.map((enc, i) => {
      const [y,m,d] = enc.data.split('-');
      const dateStr = `${d}/${m}/${y}`;
      const presentes = (enc.presentes || []);
      return `<div onclick="openVerEncontro(${i})" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:pointer">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(enc.nome)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px">📅 ${dateStr} · 👥 ${presentes.length} presente${presentes.length !== 1 ? 's' : ''}${enc.notas ? ' · ' + esc(enc.notas) : ''}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button onclick="event.stopPropagation();openEditEncontro(${i})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer">✏️</button>
          <button onclick="event.stopPropagation();deleteEncontro(${i})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer;color:#E07B54">🗑</button>
        </div>
      </div>`;
    }).join('');
  }

