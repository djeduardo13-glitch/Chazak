  // Chazak — aba Bíblia: planner, livros, versículos (API), leitura, curiosidades, favoritos


  // Sempre que se entra na aba Bíblia (vindo de outra aba), volta ao ponto
  // de partida: sub-aba Leitura, filtro Todos, sem nenhum livro aberto.
  function resetBibliaParaLeitura() {
    if (livroAtualIdx !== null) fecharLivro(); // fecha detalhe se estava aberto

    document.querySelectorAll('.inner-tab').forEach(t => t.classList.remove('active'));
    const leituraTab = document.querySelector('.inner-tab[onclick*="livros"]');
    if (leituraTab) leituraTab.classList.add('active');
    ['livros','curiosidades','favoritos','ondeescrito'].forEach(t => {
      const el = document.getElementById('biblia-' + t);
      if (el) el.style.display = t === 'livros' ? 'block' : 'none';
    });

    livrosFiltro = 'todos';
    document.querySelectorAll('#biblia-livros .filter-chip').forEach(c => c.classList.remove('active'));
    const todosChip = document.querySelector('#biblia-livros .filter-chip');
    if (todosChip) todosChip.classList.add('active');

    renderLivros();
  }

  function setBibliaTab(el, name) {
    document.querySelectorAll('.inner-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    ['livros','curiosidades','favoritos','ondeescrito'].forEach(t => {
      document.getElementById('biblia-' + t).style.display = t === name ? 'block' : 'none';
    });
    if (name === 'livros') renderLivros();
    if (name === 'curiosidades') renderCuriosidades();
    if (name === 'favoritos') renderFavoritos();
    if (name === 'ondeescrito') renderOndeEstaEscrito();
  }

  // ── PLANNER ──
  const BIBLIA_LIVROS = {
    'Antigo Testamento': [
      'Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute',
      '1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras',
      'Neemias','Ester','Jó','Salmos','Provérbios','Eclesiastes','Cânticos','Isaías',
      'Jeremias','Lamentações','Ezequiel','Daniel','Oséias','Joel','Amós','Obadias',
      'Jonas','Miquéias','Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias'
    ],
    'Novo Testamento': [
      'Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios',
      'Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses',
      '1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro',
      '1 João','2 João','3 João','Judas','Apocalipse'
    ]
  };

  function renderPlanner() {
    const lidos = db.plannerLidos || {};
    const total = 66;
    const done = Object.values(lidos).filter(Boolean).length;
    const pct = Math.round((done / total) * 100);

    document.getElementById('planner-pct').textContent = pct + '%';
    document.getElementById('planner-bar').style.width = pct + '%';
    document.getElementById('planner-done').textContent = done + ' livros lidos';

    const container = document.getElementById('planner-list');
    container.innerHTML = '';

    Object.entries(BIBLIA_LIVROS).forEach(([testamento, livros]) => {
      const section = document.createElement('div');
      section.style.marginBottom = '20px';

      const label = document.createElement('div');
      label.style.cssText = 'font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:10px';
      label.textContent = testamento;
      section.appendChild(label);

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px';

      livros.forEach(livro => {
        const lido = lidos[livro];
        const btn = document.createElement('button');
        btn.style.cssText = `
          padding:10px 6px;border-radius:10px;font-size:11px;font-weight:500;
          cursor:pointer;border:1px solid;text-align:center;line-height:1.3;
          transition:all 0.15s;font-family:'DM Sans',sans-serif;
          background:${lido ? 'var(--accent4)' : 'var(--surface)'};
          color:${lido ? 'white' : 'var(--text)'};
          border-color:${lido ? 'var(--accent4)' : 'var(--border)'};
        `;
        btn.textContent = livro;
        btn.onclick = () => {
          if (!db.plannerLidos) db.plannerLidos = {};
          db.plannerLidos[livro] = !db.plannerLidos[livro];
          saveDB();
          renderPlanner();
        };
        grid.appendChild(btn);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });
  }

  // ── 66 LIVROS DA BÍBLIA ──
  const BIBLIA_LIVROS_AC = [
    // Antigo Testamento
    'Gênesis','Êxodo','Levítico','Números','Deuteronômio',
    'Josué','Juízes','Rute','1 Samuel','2 Samuel',
    '1 Reis','2 Reis','1 Crônicas','2 Crônicas',
    'Esdras','Neemias','Ester','Jó','Salmos','Provérbios',
    'Eclesiastes','Cânticos','Isaías','Jeremias','Lamentações',
    'Ezequiel','Daniel','Oséias','Joel','Amós',
    'Obadias','Jonas','Miquéias','Naum','Habacuque',
    'Sofonias','Ageu','Zacarias','Malaquias',
    // Novo Testamento
    'Mateus','Marcos','Lucas','João','Atos',
    'Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios',
    'Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses',
    '1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus',
    'Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João',
    'Judas','Apocalipse'
  ];

  // ══════════════════════════════════════════
  // BUSCA AUTOMÁTICA DE VERSÍCULOS — API "A Bíblia Digital" (tradução ACF)
  // Sintaxe: escrever "Livro Cap:Vers" entre aspas no texto de uma nota.
  // A busca acontece só ao Salvar. Resultado fica guardado para sempre
  // (funciona offline depois da 1ª vez). Toque no destaque abre uma
  // janelinha com o texto do versículo.
  // ══════════════════════════════════════════
  // ── Configuração centralizada da API (fácil trocar domínio/versão no futuro) ──
  const BIBLIA_API_BASE = 'https://abibliadigital.api.br/api';
  const BIBLIA_VERSAO = 'acf';

  const BIBLIA_ABREV = {
    'gênesis':'gn','êxodo':'ex','levítico':'lv','números':'nm','deuteronômio':'dt',
    'josué':'js','juízes':'jz','rute':'rt','1 samuel':'1sm','2 samuel':'2sm',
    '1 reis':'1rs','2 reis':'2rs','1 crônicas':'1cr','2 crônicas':'2cr',
    'esdras':'ed','neemias':'ne','ester':'et','jó':'job','salmos':'sl','provérbios':'pv',
    'eclesiastes':'ec','cânticos':'ct','isaías':'is','jeremias':'jr','lamentações':'lm',
    'ezequiel':'ez','daniel':'dn','oséias':'os','joel':'jl','amós':'am',
    'obadias':'ob','jonas':'jn','miquéias':'mq','naum':'na','habacuque':'hc',
    'sofonias':'sf','ageu':'ag','zacarias':'zc','malaquias':'ml',
    'mateus':'mt','marcos':'mc','lucas':'lc','joão':'jo','atos':'at',
    'romanos':'rm','1 coríntios':'1co','2 coríntios':'2co','gálatas':'gl','efésios':'ef',
    'filipenses':'fp','colossenses':'cl','1 tessalonicenses':'1ts','2 tessalonicenses':'2ts',
    '1 timóteo':'1tm','2 timóteo':'2tm','tito':'tt','filemom':'fm','hebreus':'hb',
    'tiago':'tg','1 pedro':'1pe','2 pedro':'2pe','1 joão':'1jo','2 joão':'2jo','3 joão':'3jo',
    'judas':'jd','apocalipse':'ap'
  };

  function normalizarRef(ref) {
    return ref.trim().replace(/\s+/g, ' ');
  }

  // Chave de cache por versículo individual (permite reaproveitar versículos
  // já buscados anteriormente, mesmo que a busca original tenha sido um intervalo)
  function chaveVersiculo(abrev, cap, num) {
    return `${BIBLIA_VERSAO}|${abrev}|${cap}|${num}`;
  }

  // Separa "Livro Cap:Vers" ou "Livro Cap:VersInicio-VersFim" em partes,
  // aceitando nomes com acento/maiúsculas variados
  function parseReferencia(ref) {
    const m = ref.trim().match(/^(.+?)\s(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/);
    if (!m) return null;
    const nomeLivro = m[1].trim().toLowerCase();
    const abrev = BIBLIA_ABREV[nomeLivro];
    if (!abrev) return null;
    const cap = parseInt(m[2], 10);
    const versInicio = parseInt(m[3], 10);
    const versFim = m[4] ? parseInt(m[4], 10) : versInicio;
    if (versFim < versInicio) return null;
    return { abrev, cap, versInicio, versFim };
  }

  // Busca os versículos de uma referência (simples ou intervalo).
  // Estratégia: 1 pedido ao capítulo inteiro, extrai só o que falta,
  // nunca faz 1 pedido por versículo. Reaproveita cache sempre que possível.
  async function buscarVersiculosAPI(parsed) {
    if (!parsed) return { erro: true, motivo: 'Referência bíblica inválida' };
    if (!db.versiculosCache) db.versiculosCache = {};

    const faltantes = [];
    for (let n = parsed.versInicio; n <= parsed.versFim; n++) {
      if (!db.versiculosCache[chaveVersiculo(parsed.abrev, parsed.cap, n)]) faltantes.push(n);
    }
    if (faltantes.length === 0) return { erro: false }; // já estava tudo em cache

    try {
      const url = `${BIBLIA_API_BASE}/verses/${BIBLIA_VERSAO}/${parsed.abrev}/${parsed.cap}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) return { erro: true, motivo: 'Capítulo ou versículo não encontrado' };
        return { erro: true, motivo: 'Resposta inválida da API da Bíblia' };
      }
      let data;
      try { data = await res.json(); } catch { return { erro: true, motivo: 'Resposta inválida da API da Bíblia' }; }
      if (!data || !Array.isArray(data.verses)) return { erro: true, motivo: 'Resposta inválida da API da Bíblia' };

      let algumEncontrado = false;
      faltantes.forEach(n => {
        const v = data.verses.find(x => x.number === n);
        if (v && v.text) {
          db.versiculosCache[chaveVersiculo(parsed.abrev, parsed.cap, n)] = { texto: v.text.trim(), buscadoEm: new Date().toISOString() };
          algumEncontrado = true;
        }
      });
      if (!algumEncontrado) return { erro: true, motivo: 'Capítulo ou versículo não encontrado' };
      return { erro: false };
    } catch {
      return { erro: true, motivo: 'Sem ligação à internet' };
    }
  }

  // Varre o texto em busca de "Referências" entre aspas (simples ou
  // intervalo) e busca as que ainda não estão guardadas. Chamado ao
  // Salvar uma nota.
  async function processarReferenciasDoTexto(texto) {
    if (!texto) return;
    if (!db.versiculosCache) db.versiculosCache = {};
    const regex = /"([1-3]?\s?[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s[A-Za-zÀ-ÖØ-öø-ÿ]+)?\s\d{1,3}:\d{1,3}(?:-\d{1,3})?)"/g;
    const encontradas = new Set();
    let m;
    while ((m = regex.exec(texto)) !== null) encontradas.add(normalizarRef(m[1]));

    for (const ref of encontradas) {
      const parsed = parseReferencia(ref);
      await buscarVersiculosAPI(parsed);
    }
  }

  // Mostra a janelinha com o texto do(s) versículo(s) ao tocar no destaque
  function mostrarVersiculoPeek(event, ref) {
    if (event) event.stopPropagation();
    const parsed = parseReferencia(ref);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding-top:18vh';
    overlay.onclick = () => overlay.remove();

    const card = document.createElement('div');
    card.style.cssText = 'background:var(--surface);border-radius:14px;padding:16px 18px;max-width:320px;width:85%;box-shadow:0 8px 24px rgba(0,0,0,0.25)';
    card.onclick = (e) => e.stopPropagation();

    let corpo;
    if (!parsed) {
      corpo = `<div style="font-size:13px;color:#E07B54">Referência bíblica inválida.</div>`;
    } else {
      const partes = [];
      let faltaAlgum = false;
      for (let n = parsed.versInicio; n <= parsed.versFim; n++) {
        const dado = (db.versiculosCache || {})[chaveVersiculo(parsed.abrev, parsed.cap, n)];
        if (dado) {
          const numLabel = parsed.versFim > parsed.versInicio ? `<strong>${n}.</strong> ` : '';
          partes.push(`<div style="font-size:14px;font-style:italic;line-height:1.6;margin-bottom:6px">${numLabel}${esc(dado.texto)}</div>`);
        } else {
          faltaAlgum = true;
        }
      }
      if (partes.length === 0) {
        corpo = `<div style="font-size:13px;color:var(--muted)">Ainda não procurado. Salva a nota outra vez para buscar este versículo.</div>`;
      } else {
        corpo = partes.join('') + (faltaAlgum ? `<div style="font-size:11px;color:#E07B54;margin-top:4px">Alguns versículos deste intervalo não foram encontrados.</div>` : '');
      }
    }

    card.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:var(--accent4);margin-bottom:8px">📖 ${esc(ref)} <span style="font-weight:400;color:var(--muted)">(ACF)</span></div>
      ${corpo}
      <button onclick="this.closest('div[style*=fixed]').remove()" style="margin-top:12px;width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--muted);font-size:12px;cursor:pointer">Fechar</button>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function acPalavra(inp, dropId) {
    const box = document.getElementById(dropId);
    if (!box) return;
    const val = inp.value;
    // Extrair só o nome do livro (antes de espaço+número)
    const q = val.trim().toLowerCase();
    if (!q) { box.style.display = 'none'; return; }
    const matches = BIBLIA_LIVROS_AC.filter(l => l.toLowerCase().startsWith(q) || l.toLowerCase().includes(q));
    if (!matches.length) { box.style.display = 'none'; return; }
    box.innerHTML = matches.slice(0,8).map(l =>
      `<div class="ac-item" onmousedown="selectPalavra('${escJs(l)}','${dropId}',this)">${esc(l)}</div>`
    ).join('');
    box.style.display = 'block';
  }

  function selectPalavra(livro, dropId, el) {
    const box = document.getElementById(dropId);
    if (!box) return;
    const inp = box.previousElementSibling;
    if (inp) {
      // Preservar cap:vers se já tinha digitado depois do livro
      const cur = inp.value;
      const afterSpace = cur.match(/\s+(\d.*)$/);
      inp.value = livro + (afterSpace ? ' ' + afterSpace[1] : ' ');
      inp.focus();
      // posicionar cursor no fim
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
    hideAc(dropId);
  }

  // ── LEITURA ──
  // ══════════════════════════════════════════
  // LIVROS — diário de leitura por livro
  // ══════════════════════════════════════════
  let livrosFiltro = 'todos';
  let livroAtualIdx = null;

  // Testamento de um livro
  function livroTestamento(nome) {
    const AT = ['Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute','1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias','Ester','Jó','Salmos','Provérbios','Eclesiastes','Cânticos','Isaías','Jeremias','Lamentações','Ezequiel','Daniel','Oséias','Joel','Amós','Obadias','Jonas','Miquéias','Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias'];
    return AT.includes(nome) ? 'AT' : 'NT';
  }

  function setLivrosFiltro(el, f) {
    document.querySelectorAll('#biblia-livros .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    livrosFiltro = f;
    renderLivros();
  }

  function renderLivros() {
    if (livroAtualIdx !== null) return; // em detalhe, não re-renderizar lista
    const container = document.getElementById('livros-list');
    if (!container) return;
    const q = (document.getElementById('livros-busca')?.value || '').trim().toLowerCase();
    let list = (db.livros || []).slice();
    if (livrosFiltro === 'AT') list = list.filter(l => livroTestamento(l.nome) === 'AT');
    if (livrosFiltro === 'NT') list = list.filter(l => livroTestamento(l.nome) === 'NT');
    if (q) list = list.filter(l => l.nome.toLowerCase().includes(q));

    if (!list.length) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 0">
        <div class="empty-icon" style="font-size:36px">📚</div>
        <div class="empty-title">Nenhum livro ainda</div>
        <div class="empty-desc">Toca no + para começar um livro.</div>
      </div>`;
      return;
    }

    // Agrupar AT / NT se filtro = todos
    const renderCard = (l) => {
      const realIdx = db.livros.indexOf(l);
      const test = livroTestamento(l.nome);
      const capCount = (l.capitulos||[]).length;
      const dictCount = (l.dicionario||[]).length;
      const versCount = (l.versiculos||[]).length;
      const color = test === 'AT' ? 'var(--accent2)' : 'var(--accent4)';
      const card = document.createElement('div');
      card.style.cssText = `background:var(--surface);border:1px solid var(--border);border-left:3px solid ${color};border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center`;
      card.innerHTML = `
        <div>
          <div style="font-weight:600;font-size:15px;margin-bottom:4px">${esc(l.nome)}</div>
          <div style="font-size:11px;color:var(--muted);display:flex;gap:10px">
            <span>📖 ${capCount} cap.</span>
            <span>📚 ${dictCount} termos</span>
            <span>⭐ ${versCount} versículos</span>
          </div>
        </div>
        <span style="font-size:18px;color:var(--muted)">›</span>`;
      card.onclick = () => abrirLivro(realIdx);
      return card;
    };

    container.innerHTML = '';
    if (livrosFiltro === 'todos') {
      const atList = list.filter(l => livroTestamento(l.nome) === 'AT');
      const ntList = list.filter(l => livroTestamento(l.nome) === 'NT');
      if (atList.length) {
        const lbl = document.createElement('div');
        lbl.className = 'agenda-section-label';
        lbl.textContent = 'Antigo Testamento';
        container.appendChild(lbl);
        atList.forEach(l => container.appendChild(renderCard(l)));
      }
      if (ntList.length) {
        const lbl = document.createElement('div');
        lbl.className = 'agenda-section-label';
        lbl.textContent = 'Novo Testamento';
        container.appendChild(lbl);
        ntList.forEach(l => container.appendChild(renderCard(l)));
      }
    } else {
      list.forEach(l => container.appendChild(renderCard(l)));
    }
  }

  function openNovoLivro() {
    openModal('modal-novo-livro');
    document.getElementById('novo-livro-input').value = '';
    hideAc('ac-novo-livro');
  }

  function salvarNovoLivro() {
    const nome = document.getElementById('novo-livro-input').value.trim();
    if (!nome) { chzAlert('Escolhe um livro!'); return; }
    if (!db.livros) db.livros = [];
    if (db.livros.find(l => l.nome === nome)) { chzAlert('Este livro já existe!'); closeModal('modal-novo-livro'); abrirLivro(db.livros.findIndex(l => l.nome === nome)); return; }
    const livro = { nome, capitulos: [], dicionario: [], versiculos: [] };
    db.livros.push(livro);
    saveDB();
    closeModal('modal-novo-livro');
    abrirLivro(db.livros.length - 1);
  }

  function abrirLivro(idx) {
    livroAtualIdx = idx;
    _navPush({ type: 'livro', idx });
    document.getElementById('livros-lista-view').style.display = 'none';
    document.getElementById('livros-detalhe-view').style.display = 'block';
    renderLivroDetalhe();
  }

  function fecharLivro() {
    livroAtualIdx = null;
    document.getElementById('livros-lista-view').style.display = 'block';
    document.getElementById('livros-detalhe-view').style.display = 'none';
    renderLivros();
  }

  function renderLivroDetalhe() {
    const livro = db.livros[livroAtualIdx];
    if (!livro) return;
    const test = livroTestamento(livro.nome);
    const color = test === 'AT' ? 'var(--accent2)' : 'var(--accent4)';
    const container = document.getElementById('livros-detalhe-conteudo');

    let html = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
        <div onclick="fecharLivroBtn()" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 8px;margin:-10px 0 -10px -8px;flex:1">
          <button style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--muted);padding:0;pointer-events:none">‹</button>
          <div>
            <div style="font-size:20px;font-weight:700">${esc(livro.nome)}</div>
            <div style="font-size:11px;color:${color};font-weight:600">${test === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}</div>
          </div>
        </div>
        <button onclick="delLivro(${livroAtualIdx})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer;color:#E07B54">🗑</button>
      </div>

      <!-- ── Capítulos ── -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="agenda-section-label" style="margin:0">📖 Explicação</div>
        <button onclick="openNovoCapitulo()" style="background:${color};color:white;border:none;border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer">+ Cap.</button>
      </div>`;

    if (!(livro.capitulos||[]).length) {
      html += `<div style="font-size:13px;color:var(--muted);padding:10px 0 16px;text-align:center">Nenhum capítulo ainda.</div>`;
    } else {
      livro.capitulos.forEach((cap, ci) => {
        const preview = _stripInlineMarkup(cap.texto||'').slice(0, 80) + (_stripInlineMarkup(cap.texto||'').length > 80 ? '…' : '');
        html += `
        <div onclick="verCapitulo(${ci})" style="background:var(--surface);border:1px solid var(--border);border-left:3px solid ${color};border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;cursor:pointer">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:14px;margin-bottom:3px">Cap. ${cap.num}</div>
              ${preview ? `<div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(preview)}</div>` : ''}
            </div>
            <span style="font-size:18px;color:var(--muted);flex-shrink:0">›</span>
          </div>
        </div>`;
      });
    }

    // ── Dicionário ──
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;margin-top:8px">
        <div class="agenda-section-label" style="margin:0">📚 Dicionário</div>
        <button onclick="openNovoDicionario()" style="background:${color};color:white;border:none;border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer">+ Termo</button>
      </div>`;
    if (!(livro.dicionario||[]).length) {
      html += `<div style="font-size:13px;color:var(--muted);padding:10px 0 16px;text-align:center">Nenhum termo ainda.</div>`;
    } else {
      livro.dicionario.forEach((t, ti) => {
        html += `
          <div onclick="verTermo(${ti})" style="background:var(--surface);border:1px solid var(--border);border-left:3px solid ${color};border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:14px;margin-bottom:3px">${esc(t.termo)}</div>
                <div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(_stripInlineMarkup(t.def||'').slice(0,80))}${_stripInlineMarkup(t.def||'').length>80?'…':''}</div>
              </div>
              <span style="font-size:18px;color:var(--muted);flex-shrink:0">›</span>
            </div>
          </div>`;
      });
    }

    // ── Versículos bonitos ──
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="agenda-section-label" style="margin:0">⭐ Versículos bonitos</div>
        <button onclick="openNovoVersiculo()" style="background:${color};color:white;border:none;border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer">+ Vers.</button>
      </div>`;
    if (!(livro.versiculos||[]).length) {
      html += `<div style="font-size:13px;color:var(--muted);padding:10px 0 24px;text-align:center">Nenhum versículo ainda.</div>`;
    } else {
      livro.versiculos.forEach((v, vi) => {
        html += `
          <div onclick="verVersiculo(${vi})" style="background:var(--surface);border:1px solid var(--border);border-left:3px solid ${color};border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <div style="flex:1;min-width:0">
                <div style="font-size:11px;font-weight:600;color:${color};margin-bottom:4px">📖 ${esc(v.ref)}</div>
                <div style="font-size:13px;font-style:italic;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">"${esc(v.texto)}"</div>
              </div>
              <span style="font-size:18px;color:var(--muted);flex-shrink:0">›</span>
            </div>
          </div>`;
      });
    }

    container.innerHTML = html;
  }

  // ── Modais de visualização ──
  function verCapitulo(ci) {
    const livro = db.livros[livroAtualIdx];
    const cap = livro.capitulos[ci];
    const color = livroTestamento(livro.nome) === 'AT' ? 'var(--accent2)' : 'var(--accent4)';
    document.getElementById('ver-nota-conteudo').innerHTML = `
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;margin-bottom:6px">📖 ${esc(livro.nome)}</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:12px">Cap. ${cap.num}</div>
        <div style="border-top:1px solid var(--border);padding-top:14px">${renderNotaTexto(cap.texto||'')}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="closeModal('modal-ver-nota');openEditCapitulo(${ci})" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);font-size:13px;cursor:pointer">✏️ Editar</button>
        <button onclick="chzConfirmDelete('Remover?', () => {closeModal('modal-ver-nota');delCapitulo(${ci})})" style="padding:10px 14px;border-radius:10px;border:1px solid #fbddd5;background:none;font-size:13px;cursor:pointer;color:#E07B54">🗑</button>
        <button onclick="closeModal('modal-ver-nota')" style="flex:1;padding:10px;border-radius:10px;border:none;background:${color};color:white;font-size:13px;cursor:pointer">Fechar</button>
      </div>`;
    openModal('modal-ver-nota');
  }

  function verTermo(ti) {
    const livro = db.livros[livroAtualIdx];
    const t = livro.dicionario[ti];
    const color = livroTestamento(livro.nome) === 'AT' ? 'var(--accent2)' : 'var(--accent4)';
    document.getElementById('ver-nota-conteudo').innerHTML = `
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;margin-bottom:6px">📚 Dicionário — ${esc(livro.nome)}</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:12px">${esc(t.termo)}</div>
        <div style="border-top:1px solid var(--border);padding-top:14px;font-size:14px;line-height:1.7">${renderNotaTexto(t.def||'')}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="closeModal('modal-ver-nota');openEditDicionario(${ti})" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);font-size:13px;cursor:pointer">✏️ Editar</button>
        <button onclick="chzConfirmDelete('Remover?', () => {closeModal('modal-ver-nota');delDicionario(${ti})})" style="padding:10px 14px;border-radius:10px;border:1px solid #fbddd5;background:none;font-size:13px;cursor:pointer;color:#E07B54">🗑</button>
        <button onclick="closeModal('modal-ver-nota')" style="flex:1;padding:10px;border-radius:10px;border:none;background:${color};color:white;font-size:13px;cursor:pointer">Fechar</button>
      </div>`;
    openModal('modal-ver-nota');
  }

  function verVersiculo(vi) {
    const livro = db.livros[livroAtualIdx];
    const v = livro.versiculos[vi];
    const color = livroTestamento(livro.nome) === 'AT' ? 'var(--accent2)' : 'var(--accent4)';
    document.getElementById('ver-nota-conteudo').innerHTML = `
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;margin-bottom:6px">⭐ Versículos — ${esc(livro.nome)}</div>
        <div style="font-size:15px;font-weight:600;color:${color};margin-bottom:14px">📖 ${esc(v.ref)}</div>
        <div style="border-top:1px solid var(--border);padding-top:14px;font-size:16px;font-style:italic;line-height:1.8">"${formatInline(v.texto||'').replace(/\n/g,'<br>')}"</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="closeModal('modal-ver-nota');openEditVersiculo(${vi})" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);font-size:13px;cursor:pointer">✏️ Editar</button>
        <button onclick="chzConfirmDelete('Remover?', () => {closeModal('modal-ver-nota');delVersiculo(${vi})})" style="padding:10px 14px;border-radius:10px;border:1px solid #fbddd5;background:none;font-size:13px;cursor:pointer;color:#E07B54">🗑</button>
        <button onclick="closeModal('modal-ver-nota')" style="flex:1;padding:10px;border-radius:10px;border:none;background:${color};color:white;font-size:13px;cursor:pointer">Fechar</button>
      </div>`;
    openModal('modal-ver-nota');
  }

  function fecharLivroBtn() {
    // Não fazer pop manual aqui — history.back() já dispara o popstate,
    // que trata do pop e do fecharLivro() sozinho. Fazer os dois ao
    // mesmo tempo saltava duas posições no histórico em vez de uma.
    if (_navStack.length > 0 && _navStack[_navStack.length-1]?.type === 'livro') {
      history.back();
    } else {
      fecharLivro();
    }
  }

  async function delLivro(idx) {
    if (await chzConfirm('Remover este livro e todo o seu conteúdo?', 'Remover')) {
      db.livros.splice(idx, 1);
      saveDB();
      fecharLivro();
    }
  }

  // ── Capítulos ──
  let capEditIdx = null;
  function openNovoCapitulo() {
    capEditIdx = null;
    document.getElementById('cap-modal-title').textContent = 'Novo Capítulo';
    document.getElementById('cap-num').value = ((db.livros[livroAtualIdx]?.capitulos||[]).length + 1);
    document.getElementById('cap-texto').value = '';
    openModal('modal-capitulo');
  }
  function openEditCapitulo(ci) {
    capEditIdx = ci;
    const cap = db.livros[livroAtualIdx].capitulos[ci];
    document.getElementById('cap-modal-title').textContent = 'Editar Capítulo';
    document.getElementById('cap-num').value = cap.num;
    document.getElementById('cap-texto').value = cap.texto||'';
    openModal('modal-capitulo');
  }
  function salvarCapitulo() {
    const num = document.getElementById('cap-num').value.trim();
    const texto = document.getElementById('cap-texto').value.trim();
    if (!num) { chzAlert('Indica o número do capítulo!'); return; }
    const cap = { num, texto };
    const livro = db.livros[livroAtualIdx];
    if (!livro.capitulos) livro.capitulos = [];
    if (capEditIdx !== null) livro.capitulos[capEditIdx] = cap;
    else livro.capitulos.push(cap);
    livro.capitulos.sort((a,b) => parseInt(a.num) - parseInt(b.num));
    saveDB(); closeModal('modal-capitulo'); renderLivroDetalhe();
  }
  async function delCapitulo(ci) {
    if (await chzConfirm('Remover este capítulo?', 'Remover')) {
      db.livros[livroAtualIdx].capitulos.splice(ci, 1);
      saveDB(); renderLivroDetalhe();
    }
  }

  // ── Dicionário ──
  let dictEditIdx = null;
  function openNovoDicionario() {
    dictEditIdx = null;
    document.getElementById('dict-modal-title').textContent = 'Novo Termo';
    document.getElementById('dict-termo').value = '';
    document.getElementById('dict-def').value = '';
    openModal('modal-dicionario');
  }
  function openEditDicionario(ti) {
    dictEditIdx = ti;
    const t = db.livros[livroAtualIdx].dicionario[ti];
    document.getElementById('dict-modal-title').textContent = 'Editar Termo';
    document.getElementById('dict-termo').value = t.termo;
    document.getElementById('dict-def').value = t.def;
    openModal('modal-dicionario');
  }
  function salvarDicionario() {
    const termo = document.getElementById('dict-termo').value.trim();
    const def = document.getElementById('dict-def').value.trim();
    if (!termo) { chzAlert('Indica o termo!'); return; }
    const livro = db.livros[livroAtualIdx];
    if (!livro.dicionario) livro.dicionario = [];
    if (dictEditIdx !== null) livro.dicionario[dictEditIdx] = { termo, def };
    else livro.dicionario.push({ termo, def });
    saveDB(); closeModal('modal-dicionario'); renderLivroDetalhe();
  }
  async function delDicionario(ti) {
    if (await chzConfirm('Remover este termo?', 'Remover')) {
      db.livros[livroAtualIdx].dicionario.splice(ti, 1);
      saveDB(); renderLivroDetalhe();
    }
  }

  // ── Versículos bonitos ──
  let versEditIdx = null;
  function openNovoVersiculo() {
    versEditIdx = null;
    document.getElementById('vers-modal-title').textContent = 'Novo Versículo';
    document.getElementById('vers-ref').value = '';
    document.getElementById('vers-texto').value = '';
    openModal('modal-versiculo-livro');
  }
  function openEditVersiculo(vi) {
    versEditIdx = vi;
    const v = db.livros[livroAtualIdx].versiculos[vi];
    document.getElementById('vers-modal-title').textContent = 'Editar Versículo';
    document.getElementById('vers-ref').value = v.ref;
    document.getElementById('vers-texto').value = v.texto;
    openModal('modal-versiculo-livro');
  }
  function salvarVersiculo() {
    const ref = document.getElementById('vers-ref').value.trim();
    const texto = document.getElementById('vers-texto').value.trim();
    if (!ref || !texto) { chzAlert('Preenche a referência e o texto!'); return; }
    const livro = db.livros[livroAtualIdx];
    if (!livro.versiculos) livro.versiculos = [];
    if (versEditIdx !== null) livro.versiculos[versEditIdx] = { ref, texto };
    else livro.versiculos.push({ ref, texto });
    saveDB(); closeModal('modal-versiculo-livro'); renderLivroDetalhe();
  }
  async function delVersiculo(vi) {
    if (await chzConfirm('Remover este versículo?', 'Remover')) {
      db.livros[livroAtualIdx].versiculos.splice(vi, 1);
      saveDB(); renderLivroDetalhe();
    }
  }

  let leituraFilter = 'todos';
  let leitEditIdx = null;
  const AT_LIVROS = ['Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute','1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias','Ester','Jó','Salmos','Provérbios','Eclesiastes','Cânticos','Isaías','Jeremias','Lamentações','Ezequiel','Daniel','Oséias','Joel','Amós','Obadias','Jonas','Miquéias','Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias'];
  const NT_LIVROS = ['Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses','1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João','Judas','Apocalipse'];

  function setLeituraFilter(el, f) {
    document.querySelectorAll('#biblia-leitura .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    leituraFilter = f;
    renderLeitura();
  }

  function isAT(passagem) {
    return AT_LIVROS.some(l => passagem.toLowerCase().startsWith(l.toLowerCase()));
  }

  function renderLeitura() {
    const container = document.getElementById('leitura-list');
    if (!container) return;
    let list = (db.leituras || []).slice().sort((a,b) => b.data.localeCompare(a.data));
    if (leituraFilter === 'AT') list = list.filter(l => isAT(l.passagem));
    if (leituraFilter === 'NT') list = list.filter(l => !isAT(l.passagem));
    if (!list.length) {
      container.innerHTML = `<div class="empty-state" style="padding:30px 0">
        <div class="empty-icon" style="font-size:32px">📖</div>
        <div class="empty-title">Nenhuma leitura registrada</div>
        <div class="empty-desc">Toca no + para registrar.</div>
      </div>`;
      return;
    }
    container.innerHTML = list.map(l => {
      const realIdx = db.leituras.indexOf(l);
      const d = new Date(l.data+'T00:00:00');
      const dateStr = d.toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'});
      const badge = isAT(l.passagem) ? 'A.T.' : 'N.T.';
      const badgeColor = isAT(l.passagem) ? 'var(--accent2)' : 'var(--accent4)';
      return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:11px;font-weight:600;color:${badgeColor};background:${badgeColor}18;border-radius:100px;padding:2px 8px">${badge}</span>
              <span style="font-size:13px;font-weight:600">${esc(l.passagem)}</span>
            </div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:${l.notas?'4px':'0'}">${dateStr}</div>
            ${l.notas ? `<div style="font-size:12px;color:var(--muted);font-style:italic">${renderNotaTexto(l.notas)}</div>` : ''}
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button onclick="openEditLeitura(${realIdx})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer">✏️</button>
            <button onclick="delLeitura(${realIdx})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer;color:#E07B54">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function openNovaLeitura() {
    leitEditIdx = null;
    document.getElementById('leit-modal-title').textContent = 'Registrar Leitura';
    document.getElementById('leit-passagem').value = '';
    document.getElementById('leit-data').value = new Date().toISOString().slice(0,10);
    document.getElementById('leit-notas').value = '';
    openModal('modal-leitura');
  }

  function openEditLeitura(idx) {
    leitEditIdx = idx;
    const l = db.leituras[idx];
    document.getElementById('leit-modal-title').textContent = 'Editar Leitura';
    document.getElementById('leit-passagem').value = l.passagem;
    document.getElementById('leit-data').value = l.data;
    document.getElementById('leit-notas').value = l.notas||'';
    openModal('modal-leitura');
  }

  function saveLeitura() {
    const passagem = document.getElementById('leit-passagem').value.trim();
    const data = document.getElementById('leit-data').value;
    if (!passagem || !data) { chzAlert('Preenche a passagem e a data!'); return; }
    const l = { passagem, data, notas: document.getElementById('leit-notas').value.trim() };
    if (!db.leituras) db.leituras = [];
    if (leitEditIdx !== null) db.leituras[leitEditIdx] = l;
    else db.leituras.unshift(l);
    saveDB(); closeModal('modal-leitura'); renderLeitura();
  }

  async function delLeitura(idx) {
    if (await chzConfirm('Remover esta leitura?', 'Remover')) {
      db.leituras.splice(idx, 1);
      saveDB(); renderLeitura();
    }
  }

  // ── CURIOSIDADES ──
  let curEditIdx = null;
  let curTagFilter = null;
  let pendingCurTags = [];

  function getAllCurTags() {
    const set = new Set();
    (db.curiosidades||[]).forEach(c => { if(c.categoria) set.add(c.categoria); (c.tags||[]).forEach(t => set.add(t)); });
    return [...set].sort();
  }

  const CUR_CATEGORIAS = [
    { val:'Significado',       icon:'📖' },
    { val:'Curiosidades',      icon:'🧐' },
    { val:'Aprofundamento',    icon:'🔬' },
    { val:'Biografia',         icon:'👤' },
    { val:'Etimologia',        icon:'🔤' },
  ];

  let curBusca = '';

  // Render texto com formatação: **bold**, - lista, [Ref] versículo
  function renderNotaTexto(texto) {
    if (!texto) return '';
    const lines = texto.split('\n');
    let html = '';
    let inList = false;
    lines.forEach(line => {
      // Fechar lista se a linha não começa com -
      if (inList && !line.trim().startsWith('- ')) { html += '</ul>'; inList = false; }

      if (line.trim().startsWith('- ')) {
        if (!inList) { html += '<ul style="margin:6px 0 6px 18px;padding:0">'; inList = true; }
        const li = formatInline(line.trim().slice(2));
        html += `<li style="margin-bottom:3px;font-size:13px;line-height:1.5">${li}</li>`;
      } else if (line.trim() === '') {
        html += '<br>';
      } else {
        html += `<p style="margin:0 0 6px;font-size:13px;line-height:1.6">${formatInline(line)}</p>`;
      }
    });
    if (inList) html += '</ul>';
    return html;
  }

  function formatInline(text) {
    text = esc(text); // primeiro torna o texto seguro; depois aplica a formatação
    // "Referência" → versículo em destaque TOCÁVEL (abre janelinha com o texto buscado)
    // Aceita simples ("João 3:16") ou intervalo ("João 3:16-19")
    text = text.replace(/&quot;([1-3]?\s?[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s[A-Za-zÀ-ÖØ-öø-ÿ]+)?\s\d{1,3}:\d{1,3}(?:-\d{1,3})?)&quot;/g,
      (m, ref) => `<span onclick="mostrarVersiculoPeek(event,'${escJs(ref)}')" style="display:inline-block;background:var(--accent4);color:white;border-radius:6px;padding:1px 7px;font-size:11px;font-weight:600;margin:0 2px;cursor:pointer;text-decoration:underline dotted;text-decoration-color:rgba(255,255,255,0.6)">${ref}</span>`);
    // [Referência] → versículo em destaque simples (sem busca automática)
    text = text.replace(/\[([^\]]+)\]/g, '<span style="display:inline-block;background:var(--accent4);color:white;border-radius:6px;padding:1px 7px;font-size:11px;font-weight:600;margin:0 2px">$1</span>');
    // ==verde== · ~~azul~~ · !!rosa!! → marca-texto (destaque de cor)
    text = text.replace(/==(.+?)==/g, '<mark class="chz-hl-verde">$1</mark>');
    text = text.replace(/~~(.+?)~~/g, '<mark class="chz-hl-azul">$1</mark>');
    text = text.replace(/!!(.+?)!!/g, '<mark class="chz-hl-rosa">$1</mark>');
    // **negrito**
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return text;
  }

  function renderCuriosidades() {
    const tagBar = document.getElementById('curiosidades-tag-bar');
    const container = document.getElementById('curiosidades-list');
    if (!tagBar || !container) return;

    // Chips de categoria — só mostra as que têm notas
    const catsComDados = new Set((db.curiosidades||[]).map(c => c.categoria || 'Curiosidades'));
    tagBar.innerHTML = [
      `<div class="filter-chip${curTagFilter===null?' active':''}" onclick="setCurTagFilter(null)">Todas</div>`,
      ...CUR_CATEGORIAS.filter(cat => catsComDados.has(cat.val)).map(cat =>
        `<div class="filter-chip${curTagFilter===cat.val?' active':''}" onclick="setCurTagFilter('${cat.val}')">${cat.icon} ${cat.val}</div>`
      )
    ].join('');

    let list = (db.curiosidades||[]).slice().sort((a,b) => (b.criado||'').localeCompare(a.criado||''));
    if (curTagFilter) list = list.filter(c => (c.categoria||'Curiosidades') === curTagFilter);
    if (curBusca.trim()) {
      const q = curBusca.trim().toLowerCase();
      list = list.filter(c =>
        (c.titulo||'').toLowerCase().includes(q) ||
        (c.texto||'').toLowerCase().includes(q) ||
        (c.passagem||'').toLowerCase().includes(q) ||
        (c.categoria||'').toLowerCase().includes(q)
      );
    }

    if (!list.length) {
      container.innerHTML = `<div class="empty-state" style="padding:30px 0"><div class="empty-icon" style="font-size:32px">📖</div><div class="empty-title">${curBusca?'Nenhum resultado':curTagFilter?'Nenhuma nota nesta categoria':'Nenhuma nota ainda'}</div><div class="empty-desc">Toca no + para adicionar.</div></div>`;
      return;
    }

    const CAT_COLOR = {
      'Significado':'#3A6EA8','Onde está escrito':'#8B4A2E','Curiosidades':'#7A5C9B',
      'Aprofundamento':'#2E7D52','Palavra':'#C07D14','Biografia':'#C0392B',
      'Etimologia':'#546E7A','Explicação':'#3D6B4F'
    };

    // Agrupar por categoria se filtro = null
    if (!curTagFilter && !curBusca.trim()) {
      const grupos = {};
      list.forEach(c => {
        const cat = c.categoria || 'Curiosidades';
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push(c);
      });
      const ordem = CUR_CATEGORIAS.map(c => c.val).filter(v => grupos[v]);
      container.innerHTML = '';
      ordem.forEach(cat => {
        const catInfo = CUR_CATEGORIAS.find(c => c.val === cat);
        const color = CAT_COLOR[cat] || '#757575';
        const lbl = document.createElement('div');
        lbl.className = 'agenda-section-label';
        lbl.innerHTML = `${catInfo?.icon||''} ${esc(cat)}`;
        lbl.style.color = color;
        container.appendChild(lbl);
        grupos[cat].forEach(c => container.appendChild(_makeCurCard(c, color)));
      });
    } else {
      container.innerHTML = '';
      list.forEach(c => {
        const color = CAT_COLOR[c.categoria||'Curiosidades'] || '#757575';
        container.appendChild(_makeCurCard(c, color));
      });
    }
  }

  function _primeiraLinhaTexto(texto) {
    if (!texto) return '';
    const linha = (texto.split('\n').find(l => l.trim() !== '') || '').trim();
    // Remove marcadores de formatação (não faz sentido em preview de 1 linha)
    return linha.replace(/^- /, '').replace(/\*\*/g, '').replace(/==(.+?)==/g, '$1').replace(/~~(.+?)~~/g, '$1').replace(/!!(.+?)!!/g, '$1').replace(/\[([^\]]+)\]/g, '$1');
  }

  // Remove marcadores de formatação sem se limitar à 1ª linha — usado em pré-visualizações mais longas
  function _stripInlineMarkup(texto) {
    if (!texto) return '';
    return texto.replace(/\*\*/g, '').replace(/==(.+?)==/g, '$1').replace(/~~(.+?)~~/g, '$1').replace(/!!(.+?)!!/g, '$1').replace(/\[([^\]]+)\]/g, '$1');
  }

  function _makeCurCard(c, color) {
    const realIdx = db.curiosidades.indexOf(c);
    const d = new Date(c.criado);
    const dateStr = d.toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'});
    const catInfo = CUR_CATEGORIAS.find(x => x.val === (c.categoria||'Curiosidades'));
    const preview = _primeiraLinhaTexto(c.texto);

    const card = document.createElement('div');
    card.style.cssText = `background:var(--surface);border:1px solid var(--border);border-left:3px solid ${color};border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;cursor:pointer`;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="font-size:10px;font-weight:600;color:${color};text-transform:uppercase">${catInfo?.icon||''} ${esc(c.categoria||'Curiosidades')}</span>
            <span style="font-size:10px;color:var(--muted)">${dateStr}</span>
          </div>
          <div style="font-weight:600;font-size:14px;margin-bottom:3px">${esc(c.titulo||'Sem título')}</div>
          ${c.passagem?`<div style="font-size:11px;color:var(--accent4);margin-bottom:3px">📖 ${esc(c.passagem)}</div>`:''}
          <div class="nota-preview">${esc(preview)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
          <button onclick="event.stopPropagation();openEditCuriosidade(${realIdx})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer">✏️</button>
          <button onclick="event.stopPropagation();delCuriosidade(${realIdx})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer;color:#E07B54">🗑</button>
        </div>
      </div>`;
    card.onclick = () => openVerNota(realIdx);
    return card;
  }

  function openVerNota(idx) {
    const c = db.curiosidades[idx];
    const color = {'Significado':'#3A6EA8','Onde está escrito':'#8B4A2E','Curiosidades':'#7A5C9B','Aprofundamento':'#2E7D52','Palavra':'#C07D14','Biografia':'#C0392B','Etimologia':'#546E7A','Explicação':'#3D6B4F'}[c.categoria||'Curiosidades'] || '#757575';
    const catInfo = CUR_CATEGORIAS.find(x => x.val === (c.categoria||'Curiosidades'));
    document.getElementById('ver-nota-conteudo').innerHTML = `
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;margin-bottom:6px">${catInfo?.icon||''} ${esc(c.categoria||'Curiosidades')}</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:6px">${esc(c.titulo||'Sem título')}</div>
        ${c.passagem?`<div style="font-size:13px;color:var(--accent4);margin-bottom:12px">📖 ${esc(c.passagem)}</div>`:''}
        <div style="border-top:1px solid var(--border);padding-top:14px">${renderNotaTexto(c.texto||'')}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="closeModal('modal-ver-nota');openEditCuriosidade(${idx})" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);font-size:13px;cursor:pointer">✏️ Editar</button>
        <button onclick="closeModal('modal-ver-nota')" style="flex:1;padding:10px;border-radius:10px;border:none;background:var(--accent4);color:white;font-size:13px;cursor:pointer">Fechar</button>
      </div>`;
    openModal('modal-ver-nota');
  }

  function setCurTagFilter(t) { curTagFilter = t; renderCuriosidades(); }

  // ── ONDE ESTÁ ESCRITO — índice A-Z (reutiliza openVerNota/openNovaCuriosidade) ──
  let oeeBusca = '';

  function renderOndeEstaEscrito() {
    const container = document.getElementById('oee-list');
    const azNav = document.getElementById('oee-az-nav');
    if (!container || !azNav) return;
    const color = '#8B4A2E'; // mesma cor já usada para "Onde está escrito" em CAT_COLOR

    let list = (db.curiosidades || []).filter(c => c.categoria === 'Onde está escrito');
    if (oeeBusca.trim()) {
      const q = oeeBusca.trim().toLowerCase();
      list = list.filter(c => (c.titulo||'').toLowerCase().includes(q));
    }
    list.sort((a,b) => (a.titulo||'').localeCompare(b.titulo||'', 'pt'));

    if (!list.length) {
      container.style.border = 'none';
      container.innerHTML = `<div class="empty-state" style="padding:30px 0">
        <div class="empty-icon">📍</div>
        <div class="empty-title">${oeeBusca ? 'Nenhum resultado' : 'Nenhum tópico ainda'}</div>
        <div class="empty-desc">${oeeBusca ? 'Tenta outra busca.' : 'Toca no + para adicionar.'}</div>
      </div>`;
      azNav.innerHTML = '';
      return;
    }
    container.style.border = '1px solid var(--border)';

    // Agrupar por primeira letra do título
    const grupos = {};
    list.forEach(c => {
      const letra = (c.titulo||'?').trim().charAt(0).toUpperCase();
      if (!grupos[letra]) grupos[letra] = [];
      grupos[letra].push(c);
    });
    const letras = Object.keys(grupos).sort((a,b) => a.localeCompare(b,'pt'));

    container.innerHTML = '';
    letras.forEach(letra => {
      const header = document.createElement('div');
      header.id = `oee-letra-${letra}`;
      header.style.cssText = 'position:sticky;top:0;background:var(--bg);padding:6px 14px;font-size:12px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--border);z-index:1';
      header.textContent = letra;
      container.appendChild(header);

      grupos[letra].forEach(c => {
        const realIdx = db.curiosidades.indexOf(c);
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-top:1px solid var(--border);cursor:pointer';
        row.innerHTML = `
          <span style="font-size:14px;color:var(--text)">${esc(c.titulo||'Sem título')}</span>
          <span style="font-size:16px;color:var(--muted);flex-shrink:0;margin-left:8px">›</span>`;
        row.onclick = () => openVerNota(realIdx);
        container.appendChild(row);
      });
    });

    // Barra rápida A-Z lateral
    const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    azNav.innerHTML = ALFABETO.map(letra => {
      const temConteudo = letras.includes(letra);
      return `<span onclick="${temConteudo ? `document.getElementById('oee-letra-${letra}').scrollIntoView({block:'start'})` : ''}"
        style="font-size:9px;text-align:center;width:14px;cursor:${temConteudo?'pointer':'default'};font-weight:${temConteudo?'700':'400'};color:${temConteudo?color:'var(--muted)'};opacity:${temConteudo?'1':'0.4'}">${letra}</span>`;
    }).join('');
  }

  function openNovaCuriosidade() {
    curEditIdx = null;
    document.getElementById('cur-modal-title').textContent = 'Nova Nota';
    document.getElementById('cur-categoria').value = 'Curiosidades';
    document.getElementById('cur-titulo').value = '';
    document.getElementById('cur-passagem').value = '';
    document.getElementById('cur-texto').value = '';
    openModal('modal-curiosidade');
  }

  function openEditCuriosidade(idx) {
    curEditIdx = idx;
    const c = db.curiosidades[idx];
    document.getElementById('cur-modal-title').textContent = 'Editar Nota';
    document.getElementById('cur-categoria').value = c.categoria || 'Curiosidades';
    document.getElementById('cur-titulo').value = c.titulo||'';
    document.getElementById('cur-passagem').value = c.passagem||'';
    document.getElementById('cur-texto').value = c.texto||'';
    openModal('modal-curiosidade');
  }

  async function saveCuriosidade() {
    const titulo = document.getElementById('cur-titulo').value.trim();
    const texto = document.getElementById('cur-texto').value.trim();
    if (!titulo && !texto) { chzAlert('Preenche o título ou conteúdo!'); return; }
    if (!db.curiosidades) db.curiosidades = [];

    const btn = document.getElementById('cur-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'A verificar versículos...'; }
    await processarReferenciasDoTexto(texto);
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }

    const obj = {
      categoria: document.getElementById('cur-categoria').value,
      titulo,
      passagem: document.getElementById('cur-passagem').value.trim(),
      texto,
      tags: [],
      criado: new Date().toISOString()
    };
    if (curEditIdx !== null) { obj.criado = db.curiosidades[curEditIdx].criado; db.curiosidades[curEditIdx]=obj; }
    else db.curiosidades.unshift(obj);
    saveDB(); closeModal('modal-curiosidade'); renderCuriosidades(); renderOndeEstaEscrito();
  }

  async function delCuriosidade(idx) {
    if(await chzConfirm('Remover esta nota?', 'Remover')){db.curiosidades.splice(idx,1);saveDB();renderCuriosidades();renderOndeEstaEscrito();}
  }

  // ── FAVORITOS ──
  let favEditIdx = null;

  function renderFavoritos() {
    const container = document.getElementById('favoritos-list');
    if (!container) return;
    const search = (document.getElementById('fav-search')?.value||'').toLowerCase();
    let list = (db.favoritos||[]).filter(f => !search || f.ref.toLowerCase().includes(search) || (f.texto||'').toLowerCase().includes(search) || (f.nota||'').toLowerCase().includes(search));
    if (!list.length) {
      container.innerHTML = `<div class="empty-state" style="padding:30px 0"><div class="empty-icon" style="font-size:32px">⭐</div><div class="empty-title">${search?'Nenhum resultado':'Nenhum versículo favorito'}</div><div class="empty-desc">Toca no + para adicionar.</div></div>`;
      return;
    }
    container.innerHTML = list.map(f => {
      const realIdx = db.favoritos.indexOf(f);
      const previewTexto = _stripInlineMarkup(f.texto||'').slice(0, 120) + (_stripInlineMarkup(f.texto||'').length > 120 ? '…' : '');
      return `<div onclick="openVerFavorito(${realIdx})" style="background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent4);border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;cursor:pointer">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;color:var(--accent4);margin-bottom:4px">⭐ ${esc(f.ref)}</div>
            ${previewTexto ? `<div style="font-size:13px;font-style:italic;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">"${esc(previewTexto)}"</div>` : ''}
            ${f.nota ? `<div style="font-size:11px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(_stripInlineMarkup(f.nota))}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
            <button onclick="event.stopPropagation();openEditFavorito(${realIdx})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer">✏️</button>
            <button onclick="event.stopPropagation();delFavorito(${realIdx})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer;color:#E07B54">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function openVerFavorito(idx) {
    const f = db.favoritos[idx];
    document.getElementById('ver-nota-conteudo').innerHTML = `
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--accent4);text-transform:uppercase;margin-bottom:6px">⭐ Favorito</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:10px">${esc(f.ref)}</div>
        ${f.texto ? `<div style="font-size:15px;font-style:italic;color:var(--text);line-height:1.6;border-top:1px solid var(--border);padding-top:14px;margin-bottom:12px">"${formatInline(f.texto).replace(/\n/g,'<br>')}"</div>` : ''}
        ${f.nota ? `<div style="font-size:13px;color:var(--muted)">${renderNotaTexto(f.nota)}</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="closeModal('modal-ver-nota');openEditFavorito(${idx})" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);font-size:13px;cursor:pointer">✏️ Editar</button>
        <button onclick="closeModal('modal-ver-nota')" style="flex:1;padding:10px;border-radius:10px;border:none;background:var(--accent4);color:white;font-size:13px;cursor:pointer">Fechar</button>
      </div>`;
    openModal('modal-ver-nota');
  }

  function openNovoFavorito() {
    favEditIdx = null;
    document.getElementById('fav-modal-title').textContent = 'Novo Favorito';
    ['fav-ref','fav-texto','fav-nota'].forEach(id=>document.getElementById(id).value='');
    openModal('modal-favorito');
  }

  function openEditFavorito(idx) {
    favEditIdx = idx; const f = db.favoritos[idx];
    document.getElementById('fav-modal-title').textContent = 'Editar Favorito';
    document.getElementById('fav-ref').value = f.ref||'';
    document.getElementById('fav-texto').value = f.texto||'';
    document.getElementById('fav-nota').value = f.nota||'';
    openModal('modal-favorito');
  }

  function saveFavorito() {
    const ref = document.getElementById('fav-ref').value.trim();
    if (!ref) { chzAlert('Preenche a referência!'); return; }
    if (!db.favoritos) db.favoritos = [];
    const obj = { ref, texto: document.getElementById('fav-texto').value.trim(), nota: document.getElementById('fav-nota').value.trim() };
    if (favEditIdx !== null) db.favoritos[favEditIdx] = obj;
    else db.favoritos.unshift(obj);
    saveDB(); closeModal('modal-favorito'); renderFavoritos();
  }

  async function delFavorito(idx) {
    if(await chzConfirm('Remover este favorito?', 'Remover')){db.favoritos.splice(idx,1);saveDB();renderFavoritos();}
  }

