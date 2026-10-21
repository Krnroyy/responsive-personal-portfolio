(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Theme is stored only on this device; storage being unavailable is harmless.
  const themeButton = $('#theme-toggle');
  function syncThemeLabel() {
    const dark = document.documentElement.dataset.theme === 'dark';
    $('#theme-label').textContent = dark ? 'Light' : 'Dark';
    themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0d1820' : '#f6f5ef';
  }
  themeButton.hidden = false;
  syncThemeLabel();
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('portfolio-theme', theme); } catch (_) {}
    syncThemeLabel();
  });

  const menuButton = $('#menu-toggle');
  const nav = $('#main-nav');
  menuButton.hidden = false;
  function closeMenu() { nav.classList.remove('nav-open'); menuButton.setAttribute('aria-expanded', 'false'); }
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('nav-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('nav-open')) { closeMenu(); menuButton.focus(); }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

  // An always-valid source presents a deterministic byte stream. READY controls acceptance.
  const model = window.PortfolioHandshake;
  let state = model.create();
  const demo = $('.demo-card');
  const hex = byte => '0x' + byte.toString(16).toUpperCase().padStart(2, '0');
  let flashTimer;
  function renderDemo(message) {
    $('#demo-byte').textContent = hex(state.byte);
    $('#demo-count').textContent = state.accepted;
    $('#demo-edges').textContent = state.edges;
    $('#ready-value').textContent = state.ready ? '1' : '0';
    $('#ready-toggle').setAttribute('aria-pressed', String(state.ready));
    $('#receiver-indicator').textContent = state.ready ? 'Receiver ready' : 'Receiver stalled';
    demo.classList.toggle('receiver-ready', state.ready);
    $('#demo-status').textContent = message;
  }
  $('.demo-controls').hidden = false;
  renderDemo('READY is low. Step the clock: the beat will be held.');
  $('#ready-toggle').addEventListener('click', () => {
    state = model.toggle(state);
    renderDemo(state.ready ? `READY is high. The next rising edge accepts ${hex(state.byte)}.` : `Receiver stalled. ${hex(state.byte)} stays at the output.`);
  });
  $('#clock-step').addEventListener('click', () => {
    const result = model.step(state);
    state = result.state;
    renderDemo(result.transferred ? `Edge ${state.edges}: accepted ${hex(result.acceptedByte)}. Now presenting ${hex(state.byte)}.` : `Edge ${state.edges}: no transfer. ${hex(state.byte)} is still held.`);
    clearTimeout(flashTimer);
    demo.classList.remove('edge-flash', 'transfer-flash');
    void demo.offsetWidth;
    demo.classList.add('edge-flash');
    if (result.transferred) demo.classList.add('transfer-flash');
    flashTimer = setTimeout(() => demo.classList.remove('edge-flash', 'transfer-flash'), 650);
  });
  $('#demo-reset').addEventListener('click', () => {
    clearTimeout(flashTimer); demo.classList.remove('edge-flash', 'transfer-flash');
    state = model.create(); renderDemo('Illustration reset. READY is low; the first beat is 0xA1.');
  });

  const projects = $$('.project[data-category]');
  const filters = $$('.project-filter button');
  $('.project-filter').hidden = false;
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    projects.forEach(project => {
      project.hidden = filter !== 'all' && project.dataset.category !== filter;
      if (!project.hidden) project.classList.add('revealed');
    });
    const shown = projects.filter(project => !project.hidden).length;
    $('#filter-status').textContent = `Showing ${shown} of ${projects.length} projects.`;
  }));

  // Native dialog provides keyboard focus containment; source anchors remain the no-JS fallback.
  const dialog = $('#image-dialog');
  const imageLinks = $$('[data-lightbox]');
  let currentImage = 0;
  let returnFocus = null;
  function showImage(index) {
    currentImage = (index + imageLinks.length) % imageLinks.length;
    const link = imageLinks[currentImage];
    const image = link.querySelector('img');
    const caption = link.closest('figure').querySelector('figcaption');
    $('#image-dialog-image').src = link.href;
    $('#image-dialog-image').alt = image.alt;
    $('#image-dialog-caption').textContent = caption.textContent.trim();
    $('#image-position').textContent = `${currentImage + 1} / ${imageLinks.length}`;
  }
  if (typeof dialog.showModal === 'function') {
    imageLinks.forEach((link, index) => link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); returnFocus = link; showImage(index); dialog.showModal();
      document.body.classList.add('dialog-open'); $('#image-close').focus();
    }));
    $('#image-close').addEventListener('click', () => dialog.close());
    $('#image-prev').addEventListener('click', () => showImage(currentImage - 1));
    $('#image-next').addEventListener('click', () => showImage(currentImage + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(currentImage - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showImage(currentImage + 1); }
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    }});
    dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (returnFocus) returnFocus.focus(); });
  }

  if ('IntersectionObserver' in window && !reducedMotion) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); reveal.unobserve(entry.target); }
    }), { threshold: 0.08 });
    $$('.project, .approach-grid > div, .about > div').forEach(element => { element.classList.add('reveal'); reveal.observe(element); });
    document.documentElement.classList.add('motion-ready');
  }
  const backTop = $('#back-top');
  const progress = $('.scroll-progress');
  let scrollPending = false;
  const sectionNav = $$('nav [data-section]');
  function updateScroll() {
    const available = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? Math.min(1, Math.max(0, scrollY / available)) : 0})`;
    backTop.hidden = scrollY < 650;
    let active = '';
    sectionNav.forEach(link => { const section = document.getElementById(link.dataset.section); if (section.getBoundingClientRect().top <= 180) active = link.dataset.section; });
    sectionNav.forEach(link => {
      const selected = link.dataset.section === active;
      link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    scrollPending = false;
  }
  addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener('resize', updateScroll);
  backTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' }));
  updateScroll();
})();

// TIMER LAB FUNCTIONAL FIX
(() => {
  const root = document.querySelector("#timer-lab");
  if (!root || root.dataset.timerLabFixed === "true") return;
  root.dataset.timerLabFixed = "true";

  const reloadInput = root.querySelector("[data-reload]");
  const startButton = root.querySelector("[data-start]");
  const resetButton = root.querySelector("[data-reset]");
  const clearButton = root.querySelector("[data-clear]");
  const countDisplay = root.querySelector("[data-count]");
  const statusDisplay = root.querySelector("[data-status]");
  const irqDisplay = root.querySelector("[data-irq]");
  const message = root.querySelector("[data-message]");
  const log = root.querySelector("[data-log]");

  if (!reloadInput || !startButton || !resetButton || !clearButton ||
      !countDisplay || !statusDisplay || !irqDisplay || !message || !log) {
    console.error("Timer Lab is missing a required control.");
    return;
  }

  let count = 0;
  let busy = false;
  let irq = false;
  let intervalId = null;

  function addTrace(text) {
    const item = document.createElement("li");
    item.textContent = text;
    log.appendChild(item);

    while (log.children.length > 8) {
      log.removeChild(log.firstElementChild);
    }
  }

  function render() {
    countDisplay.textContent = String(count);
    statusDisplay.textContent = busy ? "BUSY" : (irq ? "IRQ PENDING" : "IDLE");
    irqDisplay.textContent = irq ? "HIGH" : "LOW";
    startButton.disabled = busy;
    reloadInput.disabled = busy;
    clearButton.disabled = !irq;
  }

  startButton.addEventListener("click", () => {
    if (busy) return;

    if (!reloadInput.checkValidity()) {
      message.textContent = "Enter a whole number from 1 to 12.";
      reloadInput.reportValidity();
      return;
    }

    const reload = Number(reloadInput.value);
    if (!Number.isInteger(reload) || reload < 1 || reload > 12) {
      message.textContent = "Enter a whole number from 1 to 12.";
      reloadInput.focus();
      return;
    }

    count = reload;
    busy = true;
    irq = false;

    addTrace(`Sequence: program RELOAD = ${reload}.`);
    addTrace("Driver: write CONTROL.START = 1.");
    addTrace(`Monitor: COUNT = ${count}, STATUS = BUSY.`);
    addTrace(`Scoreboard: expecting ${reload} countdown ticks.`);

    message.textContent = "Timer started. One model tick is one countdown step.";
    render();

    intervalId = window.setInterval(() => {
      count -= 1;

      if (count === 0) {
        busy = false;
        irq = true;
        window.clearInterval(intervalId);
        intervalId = null;

        addTrace("Monitor: COUNT = 0, interrupt is pending.");
        addTrace("Scoreboard: timer completion matched — PASS.");
        message.textContent = "Timer completed. Clear the interrupt to run it again.";
      } else {
        addTrace(`Monitor: COUNT = ${count}, STATUS = BUSY.`);
      }

      render();
    }, 700);
  });

  clearButton.addEventListener("click", () => {
    if (!irq) return;

    irq = false;
    addTrace("Driver: write CONTROL.CLEAR_IRQ = 1.");
    addTrace("Scoreboard: interrupt cleared — PASS.");
    message.textContent = "Interrupt cleared. The timer is ready to start again.";
    render();
  });

  resetButton.addEventListener("click", () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }

    count = 0;
    busy = false;
    irq = false;
    addTrace("Reset: count, busy state, and interrupt returned to zero.");
    message.textContent = "Model reset. Choose a reload value and start.";
    render();
  });

  render();
})();
