(() => {
  'use strict';
  const bench = document.getElementById('labs');
  if (!bench) return;
  const filter = bench.querySelector('.demo-filter');
  const buttons = [...bench.querySelectorAll('[data-demo-filter]')];
  const panels = [...bench.querySelectorAll('[data-demo-panel]')];
  const status = document.getElementById('demo-filter-status');
  function choose(key, announce = true) {
    if (key !== 'all' && !panels.some(panel => panel.dataset.demoPanel === key)) return;
    panels.forEach(panel => { panel.hidden = key !== 'all' && panel.dataset.demoPanel !== key; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.demoFilter === key)));
    if (announce && status) status.textContent = key === 'all' ? 'Showing all demos in order.' : `Showing ${buttons.find(button => button.dataset.demoFilter === key).textContent}.`;
    // Re-evaluate the navigation after section heights change.
    dispatchEvent(new Event('scroll'));
  }
  function revealTarget(hash) {
    if (!hash || hash === '#') return false;
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return false; }
    const panel = target?.closest('[data-demo-panel]');
    if (!panel) return false;
    if (panel.hidden) choose(panel.dataset.demoPanel);
    return true;
  }
  filter.hidden = false;
  choose('signal', false);
  revealTarget(location.hash);
  buttons.forEach(button => button.addEventListener('click', () => {
    choose(button.dataset.demoFilter);
    if (location.hash && location.hash !== '#labs') {
      try { history.replaceState(null, '', '#labs'); } catch (_) {}
    }
  }));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) revealTarget(link.getAttribute('href'));
  }, true);
  addEventListener('hashchange', () => {
    if (revealTarget(location.hash)) {
      const target = document.getElementById(location.hash.slice(1));
      target?.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  });
  // One brief theme-coloured response per click. No gold sweep or duplicate glow.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', event => {
    const target = event.target.closest('.sx-control,.sx-tabs button,.sx-trace-button,.demo-filter button,.project-filter button');
    if (!target || reduced.matches) return;
    target.classList.remove('demo-click');
    void target.offsetWidth;
    target.classList.add('demo-click');
  });
  document.addEventListener('animationend', event => {
    if (event.animationName === 'demo-click-once') event.target.classList.remove('demo-click');
  });
})();
