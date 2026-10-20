  // Chazak — navegação: switchTab, data do cabeçalho, scroll-to-top, botão Voltar

  // ── TAB NAVIGATION ──
  // semHistorico = true → não regista a aba no stack do botão Voltar
  // (usado pelo próprio popstate, que já está a recuar no histórico).
  function switchTab(name, semHistorico) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('sec-' + name).classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
    // Show/hide FAB + agenda trigger
    document.getElementById('fab-btn').classList.toggle('visible', ['mocidade','servicos','biblia'].includes(name));
    if (name === 'mocidade') {
      const trackerTab = document.querySelector('.moc-inner-tab');
      if (trackerTab) setMocTab(trackerTab, 'tracker');
      else renderTracker();
    }
    if (name === 'servicos') renderServicos();
    if (name === 'agenda')   { renderCalendar(); renderAgenda(); }
    if (name === 'dados')    { updateStats(); renderGistStatus(); }
    if (name === 'biblia')   { resetBibliaParaLeitura(); }
    // ── Dynamic header color per tab ──
    const tabColors = {
      mocidade: 'var(--tab-moc)',
      servicos:  'var(--tab-serv)',
      agenda:    'var(--tab-ag)',
      biblia:    'var(--tab-bib)',
      dados:     'var(--tab-dad)'
    };
    const hdr = document.querySelector('header');
    if (hdr) hdr.style.background = tabColors[name] || 'var(--tab-ag)';
    document.body.dataset.tab = name;
    const tcMeta = document.querySelector('meta[name="theme-color"]');
    if (tcMeta) tcMeta.content = getComputedStyle(document.body).getPropertyValue('--sec').trim() || '#3A6EA8';
    // ── Verso por aba ──
    const tabVerses = {
      mocidade: '1Jo 2:14 "Jovens, sois fortes, e a palavra de Deus permanece em vós"',
      servicos:  'Tg 1:22 "sede cumpridores da palavra e não somente ouvintes"',
      agenda:    'Js 1:9 "Esforça-te e tem bom ânimo"',
      biblia:    'Jo 5:39 "Examinais as Escrituras, porque julgais ter nelas a vida eterna"',
      dados:     'Sl 23 "O Senhor é o meu pastor; nada me faltará"'
    };
    const verseEl = document.getElementById('header-verse');
    if (verseEl) verseEl.textContent = tabVerses[name] || tabVerses.agenda;
    // ── Botão Voltar: regista a aba (só se for diferente do topo do stack) ──
    if (!semHistorico) {
      const top = _navStack[_navStack.length - 1];
      if (!top || top.type !== 'tab' || top.name !== name) {
        _navPush({ type: 'tab', name });
      }
    }
  }

  // ── HEADER DATE + HORA ──
  function setHeaderDate() {
    const now = new Date();
    const dateOpts = { weekday: 'short', day: 'numeric', month: 'short' };
    const datePart = now.toLocaleDateString('pt-BR', dateOpts);
    const timePart = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('header-date').textContent = datePart + ' · ' + timePart;
  }
  setInterval(() => { setHeaderDate(); atualizarBadgeAniversarios(); }, 60000);

  // ── SCROLL TO TOP ──
  function scrollToTop() {
    const active = document.querySelector('.section.active');
    if (active) active.scrollTop = 0;
    const m = document.querySelector('main');
    if (m) m.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ══════════════════════════════════════════
  // BACK BUTTON — navigation stack
  // States: { type: 'tab', name } | { type: 'viagem_list' } | { type: 'viagem_detail', idx } | { type: 'perfil', idx }
  // ══════════════════════════════════════════
  const _navStack = [];
  const HOME_TAB = 'agenda';

  function _navPush(state) {
    _navStack.push(state);
    history.pushState(state, '');
  }

  // Override openPerfil to track
  const _origOpenPerfil = openPerfil;
  openPerfil = function(idx) {
    _origOpenPerfil(idx);
    _navPush({ type: 'perfil', idx });
  };

  // Override openViagemDetail to track
  const _origOpenViagemDetail = openViagemDetail;
  openViagemDetail = function(idx) {
    _origOpenViagemDetail(idx);
    _navPush({ type: 'viagem_detail', idx });
  };

  // Quando um botão "Voltar" da própria app já fechou o ecrã e só precisa de
  // recuar o histórico, marca isto para o popstate não fazer nada a mais.
  let _navVoltarJaTratado = false;

  // Um estado do stack está "obsoleto" quando o ecrã a que corresponde já foi
  // fechado por outro caminho (ex.: botão Fechar do perfil, ou trocar de aba
  // com um livro aberto). Nesses casos o Voltar deve saltar para o anterior.
  function _navEstadoObsoleto(st) {
    if (!st) return false;
    if (st.type === 'perfil') return !document.getElementById('modal-perfil')?.classList.contains('show');
    if (st.type === 'livro') return livroAtualIdx === null;
    if (st.type === 'viagem_detail') return currentViagemIdx === null;
    return false;
  }

  // Handle Android back button / browser back
  window.addEventListener('popstate', function(e) {
    const removido = _navStack.pop(); // estado do ecrã de onde estamos a sair

    if (_navVoltarJaTratado) { _navVoltarJaTratado = false; return; }

    // 1) Um modal aberto (que não seja o próprio perfil a fechar) fecha-se primeiro.
    //    O estado retirado é reposto, para o stack continuar alinhado com o histórico.
    const abertos = document.querySelectorAll('.modal-overlay.show');
    const modalTopo = abertos[abertos.length - 1];
    const fechaPerfil = removido && removido.type === 'perfil' && modalTopo && modalTopo.id === 'modal-perfil';
    if (modalTopo && !fechaPerfil) {
      modalTopo.classList.remove('show');
      if (removido) _navStack.push(removido);
      history.pushState(removido || {}, '');
      return;
    }

    // 2) Estado já fechado por outro caminho → salta para o anterior
    if (_navEstadoObsoleto(removido) && _navStack.length > 0) {
      history.back();
      return;
    }

    // 3) Fecha o ecrã de onde estamos a sair
    if (removido) {
      if (removido.type === 'viagem_detail') { _origCloseViagemDetail(); return; }
      if (removido.type === 'livro')         { fecharLivro(); return; }
      if (removido.type === 'perfil')        { closeModal('modal-perfil'); return; }
    }

    // 4) Saímos de uma aba → volta à aba anterior (ou ao início)
    let abaAnterior = null;
    for (let i = _navStack.length - 1; i >= 0; i--) {
      if (_navStack[i].type === 'tab') { abaAnterior = _navStack[i].name; break; }
    }
    if (!abaAnterior) {
      // Stack vazio — vai para o início
      _navStack.length = 0;
      switchTab(HOME_TAB, true);
      _navPush({ type: 'tab', name: HOME_TAB });
      return;
    }
    switchTab(abaAnterior, true);
  });

  // Botão "‹ Voltar" do detalhe da viagem: fecha logo o detalhe e recua
  // uma única posição no histórico (antes recuava duas e ia parar à Agenda).
  const _origCloseViagemDetail = closeViagemDetail;
  closeViagemDetail = function() {
    _origCloseViagemDetail();
    if (_navStack.length > 0 && _navStack[_navStack.length-1]?.type === 'viagem_detail') {
      _navVoltarJaTratado = true;
      history.back(); // o popstate retira o estado do stack e não faz mais nada
    }
  };


