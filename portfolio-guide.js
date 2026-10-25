(() => {
  'use strict';
  // A lab or quick-link can point inside a project hidden by its filter.
  document.querySelectorAll('a[data-reveal-project]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      const project = target.closest('.project');
      if (project?.hidden) {
        document.querySelector('[data-filter="all"]')?.click();
        event.preventDefault();
        target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        // Follow native anchor focus behaviour after revealing the target.
        target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
        try { history.replaceState(null, '', link.hash); } catch (_) { /* Fragment URL is optional in local previews. */ }
      }
    });
  });
})();
// At the document bottom, Contact is current even when it cannot reach the top.
(() => {
  const update = () => requestAnimationFrame(() => {
    if (scrollY + innerHeight < document.documentElement.scrollHeight - 8) return;
    document.querySelectorAll('nav [data-section]').forEach(link => {
      const selected = link.dataset.section === 'contact';
      link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();
