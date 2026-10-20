  // Chazak — arranque da app (DOMContentLoaded) — carregado por último

  document.addEventListener('DOMContentLoaded', () => {
    // Registar Service Worker real (FASE 2 — PWA Offline)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    }
    // Scroll-to-top listener
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', function() {
        const isMoc = document.getElementById('sec-mocidade')?.classList.contains('active');
        const isTracker = document.getElementById('moc-tracker')?.style.display !== 'none';
        const btn = document.getElementById('scroll-top-btn');
        if (btn) {
          if (isMoc && isTracker && this.scrollTop > 150) btn.classList.add('visible');
          else btn.classList.remove('visible');
        }
      });
    }

    loadDB();
    _sbSuspendDirty = true;   // ajustes automáticos de arranque não são alterações do utilizador
    initLuoghi();
    initJovens();
    migrarViagensEncontrosParaId();
    initEventos();
    _sbSuspendDirty = false;
    setHeaderDate();
    renderCalendar();
    renderPlanner();
    renderTracker();
    renderServicos();
    updateStats();
    atualizarBadgeAniversarios();
    // Start on Agenda (home)
    switchTab('agenda');
    sbRenderStatus();
    mostrarBoasVindasSeVazio();
    sbSincronizar();
  });

