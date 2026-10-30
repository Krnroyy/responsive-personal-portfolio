(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const panel = document.querySelector('.vf-motion');
  const button = document.getElementById('vf-motion-toggle');
  const state = document.getElementById('vf-motion-state');
  let animations = [], playing = false;
  function start() {
    if (!window.Motion || !panel) return;
    if (!animations.length) {
      panel.querySelectorAll('.vf-flow').forEach((path, i) => {
        animations.push(Motion.animate(path, { strokeDashoffset: [0, -120] }, { duration: 3.5 + i % 3 * .45, repeat: Infinity, ease: 'linear' }));
      });
      panel.querySelectorAll('.vf-chip-glow').forEach(path => {
        animations.push(Motion.animate(path, { opacity: [.2, .75, .2] }, { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }));
      });
    } else animations.forEach(a => a.play());
    playing = true; render();
  }
  function pause() { animations.forEach(a => a.pause()); playing = false; render(); }
  function render() {
    if (!button || !state) return;
    button.textContent = playing ? 'Pause animation Ⅱ' : 'Play animation ▷';
    button.setAttribute('aria-pressed', String(!playing));
    state.textContent = playing ? 'Animation running' : 'Animation paused';
  }
  if (button && panel && window.Motion) {
    button.hidden = false;
    if (reduce.matches) render(); else start();
    button.addEventListener('click', () => playing ? pause() : start());
    reduce.addEventListener('change', event => { if (event.matches) pause(); });
  }
  const home = document.querySelector('.wordmark');
  if (home) home.addEventListener('click', () => {
    if (reduce.matches) return;
    home.classList.remove('vf-home-click');
    // The regular anchor still handles navigation; this only gives feedback.
    requestAnimationFrame(() => {
      home.classList.add('vf-home-click');
      if (window.Motion) {
        Motion.animate(home.querySelector('.vf-home-monogram'), { rotate: [0, -9, 5, 0], scale: [1, .91, 1.08, 1] }, { duration: .55 });
      }
    });
  });
})();
