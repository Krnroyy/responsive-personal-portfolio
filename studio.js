(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!window.Motion || reduced.matches) return;
  const { animate, inView } = window.Motion;
  // All content is visible without the animation library or JavaScript.
  const animations = [];
  function safely(fn) { try { const animation = fn(); if (animation?.stop) animations.push(animation); } catch (_) {} }
  const hero = document.querySelector('.hero-copy');
  if (hero) safely(() => animate(hero, { opacity: [0.2, 1], y: [18, 0] }, { duration: 0.7, ease: [0.16, 1, 0.3, 1] }));
  document.querySelectorAll('.project, .pg-section-line, .about, .pg-contact-panel').forEach(element => {
    inView(element, () => {
      if (!reduced.matches) safely(() => animate(element, { opacity: [0.4, 1], y: [16, 0] }, { duration: 0.55, ease: [0.16, 1, 0.3, 1] }));
    }, { amount: 0.08 });
  });
  document.querySelectorAll('.ed-orbit').forEach((element, i) => {
    safely(() => animate(element, { opacity: [0.2, 0.65, 0.2], scale: [0.95, 1.04, 0.95] }, { duration: 7 + i * 2, repeat: Infinity, ease: 'easeInOut' }));
  });
  // Respect preference changes while the page is open too.
  reduced.addEventListener('change', event => { if (event.matches) animations.forEach(animation => animation.stop()); });
})();
