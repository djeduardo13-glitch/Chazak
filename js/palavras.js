  // Chazak — aba Palavras (secção "servicos")


  // ── SERVIÇOS ──
  let servFilter = 'todos';
  let servEditIdx = null;

  function setServTipo(el, f) {
    document.querySelectorAll('#sec-servicos .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    servFilter = f;
    renderServicos();
  }

  // Alias
  function setServFilter(el, f) { setServTipo(el, f); }

  let servBusca = '';

  function renderServicos() {
    const container = document.getElementById('servicos-list');
    if (!container) return;

    // ── Barra de busca (injeta uma vez) ──
    let searchBar = document.getElementById('serv-search-bar');
    if (!searchBar) {
      const barWrap = document.createElement('div');
      barWrap.style.cssText = 'position:relative;margin-bottom:14px';
      barWrap.innerHTML = `
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--muted)">🔍</span>
        <input id="serv-search-bar" type="text" placeholder="Buscar por serviço, dia, cidade ou livro..."
          style="width:100%;padding:10px 12px 10px 34px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:13px;box-sizing:border-box"
          value="${esc(servBusca)}" oninput="servBusca=this.value;renderServicos()">`;
      container.parentElement.insertBefore(barWrap, container);
      searchBar = barWrap.querySelector('#serv-search-bar');
    }

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    let list = (db.servicos || []).slice().sort((a,b) => b.data.localeCompare(a.data));
    if (servFilter !== 'todos') list = list.filter(s => s.tipo === servFilter);

    // Busca geral
    if (servBusca.trim()) {
      const q = servBusca.trim().toLowerCase();
      list = list.filter(s =>
        (s.tipo||'').toLowerCase().includes(q) ||
        (s.local||'').toLowerCase().includes(q) ||
        (s.palavra||'').toLowerCase().includes(q) ||
        (s.notas||'').toLowerCase().includes(q) ||
        (s.data||'').includes(q)
      );
    }

    if (!list.length) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 0">
        <div class="empty-icon">🙏</div>
        <div class="empty-title">Nenhum serviço${servBusca ? ' encontrado' : servFilter !== 'todos' ? ' — '+servFilter : ''}</div>
        <div class="empty-desc">${servBusca ? 'Tenta outra busca.' : 'Toca no + para registrar.'}</div>
      </div>`;
      return;
    }

    const COLOR = {'RDM':'var(--accent)','RDJ':'var(--accent2)','Culto':'var(--accent3)',
      'Batismo':'#2980b9','S. Ceia':'var(--accent4)','Ministerial':'#7f8c8d','Outro':'#95a5a6',
      'RMA':'#8B4A2E','RMN':'#D32F2F','RGI':'#C0392B','Busca dos Dons':'#C07D14',
      'Ensaio Regional':'#A0522D','Santa Ceia':'#7A5C9B','Reunião Ministerial / Conselhos':'#546E7A'};
    const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    // ── Agrupar por ano-mês ──
    const grupos = {};
    list.forEach(s => {
      const key = s.data.slice(0,7); // "2026-03"
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(s);
    });
    const keys = Object.keys(grupos).sort((a,b) => b.localeCompare(a)); // mais recente primeiro

    container.innerHTML = '';
    keys.forEach(key => {
      const [ano, mesStr] = key.split('-');
      const mesIdx = parseInt(mesStr) - 1;
      const isCurrent = mesIdx === mesAtual && parseInt(ano) === anoAtual;
      const isPast = new Date(parseInt(ano), mesIdx+1, 1) <= hoje;
      const isOpen = isCurrent || !isPast || !!servBusca.trim();

      const section = document.createElement('div');
      section.style.marginBottom = '6px';

      // Header clicável
      const header = document.createElement('div');
      header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:${isOpen ? '12px 12px 0 0' : '12px'};cursor:pointer;opacity:${isPast && !isCurrent ? '0.7' : '1'}`;
      header.innerHTML = `
        <span style="font-size:13px;font-weight:600">${MESES_FULL[mesIdx]} ${ano}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;color:var(--muted)">${grupos[key].length} registo${grupos[key].length!==1?'s':''}</span>
          <span class="serv-arrow" style="font-size:16px;color:var(--muted);transition:transform .2s;display:inline-block;transform:rotate(${isOpen?'180':'0'}deg)">▾</span>
        </div>`;

      // Body colapsável
      const body = document.createElement('div');
      body.style.cssText = `display:${isOpen?'block':'none'};border:1px solid var(--border);border-top:none;border-radius:0 0 12px 12px;overflow:hidden;margin-bottom:10px`;

      grupos[key].forEach((s, i) => {
        const realIdx = db.servicos.indexOf(s);
        const d = new Date(s.data+'T00:00:00');
        const dateStr = d.toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
        const color = COLOR[s.tipo] || '#999';
        const row = document.createElement('div');
        row.style.cssText = `background:var(--surface);border-left:3px solid ${color};padding:12px 14px;${i>0?'border-top:1px solid var(--border)':''}`;
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase">${esc(s.tipo)}</span>
                ${s._eventoRef ? `<span style="font-size:10px;background:var(--border);color:var(--muted);border-radius:6px;padding:2px 6px">📅 agenda</span>` : ''}
                <span style="font-size:11px;color:var(--muted)">${dateStr}</span>
              </div>
              ${s.local ? `<div style="font-size:13px;font-weight:500;margin-bottom:2px">📍 ${esc(s.local)}</div>` : ''}
              ${s.palavra ? `<div style="font-size:12px;color:var(--accent4);margin-bottom:2px">📖 ${esc(s.palavra)}</div>` : ''}
              ${s.recitativos ? `<div style="font-size:12px;color:var(--muted);font-style:italic">${esc(s.recitativos)} Recitativos</div>` : ''}
              ${s.notas ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;font-style:italic">${esc(s.notas)}</div>` : ''}
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button onclick="openEditServico(${realIdx})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer">✏️</button>
              <button onclick="delServico(${realIdx})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer;color:#E07B54">🗑</button>
            </div>
          </div>`;
        body.appendChild(row);
      });

      header.onclick = () => {
        const open = body.style.display === 'block';
        body.style.display = open ? 'none' : 'block';
        header.style.borderRadius = open ? '12px' : '12px 12px 0 0';
        const arrow = header.querySelector('.serv-arrow');
        if (arrow) arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
      };

      section.appendChild(header);
      section.appendChild(body);
      container.appendChild(section);
    });
  }

  function openNovoServico() {
    servEditIdx = null;
    document.getElementById('serv-modal-title').textContent = 'Novo Serviço';
    document.getElementById('serv-tipo').value = 'Culto';
    document.getElementById('serv-data').value = new Date().toISOString().slice(0,10);
    document.getElementById('serv-local-input').value = 'Collechio (Parma)';
    document.getElementById('serv-palavra').value = '';
    document.getElementById('serv-recitativos').value = '';
    document.getElementById('serv-notas').value = '';
    openModal('modal-servico');
  }

  function openEditServico(idx) {
    servEditIdx = idx;
    const s = db.servicos[idx];
    document.getElementById('serv-modal-title').textContent = 'Editar Serviço';
    document.getElementById('serv-tipo').value = s.tipo;
    document.getElementById('serv-data').value = s.data;
    document.getElementById('serv-local-input').value = s.local||'';
    document.getElementById('serv-palavra').value = s.palavra||'';
    document.getElementById('serv-recitativos').value = s.recitativos||'';
    document.getElementById('serv-notas').value = s.notas||'';
    openModal('modal-servico');
  }

  function saveServico() {
    const data = document.getElementById('serv-data').value;
    if (!data) { chzAlert('Selecione uma data!'); return; }
    const s = {
      tipo: document.getElementById('serv-tipo').value,
      data,
      local: (document.getElementById('serv-local-input')||{}).value?.trim()||'',
      palavra: document.getElementById('serv-palavra').value.trim(),
      recitativos: document.getElementById('serv-recitativos').value.trim(),
      notas: document.getElementById('serv-notas').value.trim(),
    };
    // Preservar _eventoRef se editar um registo vindo da agenda
    if (servEditIdx !== null && db.servicos[servEditIdx]?._eventoRef) {
      s._eventoRef = db.servicos[servEditIdx]._eventoRef;
      // Sincronizar palavra de volta ao evento da agenda
      const evIdx = (db.eventos||[]).findIndex(e => e._eventoRef === s._eventoRef);
      if (evIdx >= 0) {
        db.eventos[evIdx].palavra = s.palavra;
        db.eventos[evIdx].notas = s.notas;
      }
    }
    if (!db.servicos) db.servicos = [];
    if (servEditIdx !== null) db.servicos[servEditIdx] = s;
    else db.servicos.unshift(s);
    saveDB(); closeModal('modal-servico'); renderServicos(); renderAgenda(); updateStats();
  }

  async function delServico(idx) {
    if (await chzConfirm('Remover este serviço?', 'Remover')) {
      db.servicos.splice(idx, 1);
      saveDB(); renderServicos(); updateStats();
    }
  }

