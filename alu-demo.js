(() => {
  'use strict';
  const root = document.getElementById('alu-lab');
  const model = window.PortfolioALU;
  if (!root || !model) return;
  const $ = selector => root.querySelector(selector);
  const aInput = $('#alu-a'), bInput = $('#alu-b'), opInput = $('#alu-op');
  const stepButton = $('[data-alu-step]'), streamButton = $('[data-alu-stream]');
  const validButton = $('[data-alu-valid]'), status = $('[data-alu-status]');
  const form = $('[data-alu-form]');
  const history = [];
  let state = model.create(), valid = true, timeout = 0, running = false;
  const hex = n => '0x' + n.toString(16).toUpperCase().padStart(2, '0');
  const bits = n => n.toString(2).padStart(8, '0');
  const signed = n => n > 127 ? n - 256 : n;
  const signedText = n => (signed(n) > 0 ? '+' : '') + signed(n);
  const presets = { overflow: [127, 1, 0], carry: [255, 1, 0], borrow: [3, 5, 1], shift: [129, 1, 5] };
  const operationNotes = [
    '8-bit result; signed overflow and unsigned carry differ.',
    'C=1 means no unsigned borrow; C=0 means a borrow.',
    'Bitwise AND; C=0 and V=0.', 'Bitwise OR; C=0 and V=0.', 'Bitwise XOR; C=0 and V=0.',
    'Shift distance uses only the low three bits of B.', 'Logical right shift; high bits fill with zero.',
    'Reserved returns 0; Z=1, C=0 and V=0.'
  ];
  function readInputs() {
    if (!form.checkValidity()) return null;
    const a = Number(aInput.value), b = Number(bInput.value), op = Number(opInput.value);
    return { a, b, op, valid };
  }
  function setStatus(message, error = false) {
    status.textContent = message; status.dataset.error = String(error);
  }
  function renderInputs() {
    for (const [input, selector] of [[aInput, '[data-alu-a-bits]'], [bInput, '[data-alu-b-bits]']]) {
      $(selector).textContent = input.validity.valid && input.value.trim() !== ''
        ? `${bits(Number(input.value))} · signed ${signedText(Number(input.value))}`
        : 'Enter a whole byte, 0–255.';
    }
    const op = Number(opInput.value);
    let note = operationNotes[op];
    if ((op === 5 || op === 6) && bInput.validity.valid && bInput.value.trim() !== '')
      note += ` Current distance: ${Number(bInput.value) & 7}.`;
    $('[data-alu-operation-note]').textContent = note;
    validButton.setAttribute('aria-pressed', String(valid));
    $('[data-alu-valid-value]').textContent = Number(valid);
  }
  function expression(request) {
    const op = request.op;
    if (op === 7) return 'Reserved opcode → zero';
    const symbol = ['+', '−', 'AND', 'OR', 'XOR', '<<', '>>'][op];
    return `${request.a} ${symbol} ${op >= 5 ? request.b & 7 : request.b}`;
  }
  function render() {
    $('[data-alu-edge]').textContent = state.edge;
    const s = state.stage, o = state.output;
    $('[data-alu-stage]').dataset.valid = String(s.valid);
    $('[data-alu-s1-valid]').textContent = `VALID ${Number(s.valid)}`;
    $('[data-alu-s1-op]').textContent = model.operations[s.op];
    $('[data-alu-s1-data]').textContent = `A ${hex(s.a)} · B ${hex(s.b)}`;
    $('[data-alu-s1-id]').textContent = s.valid ? `Request #${s.id}` : (s.id ? 'Bubble; register bits retained' : 'No request captured');
    $('[data-alu-comb]').textContent = s.valid ? hex(model.evaluate(s.a, s.b, s.op).result) : '—';
    $('[data-alu-expression]').textContent = s.valid ? `${expression(s)} · request #${s.id}` : 'No valid S1 request to deliver.';
    $('[data-alu-output]').dataset.valid = String(o.valid);
    $('[data-alu-out-valid]').textContent = `VALID ${Number(o.valid)}`;
    $('[data-alu-result]').textContent = hex(o.result);
    $('[data-alu-result-bits]').textContent = bits(o.result);
    $('[data-alu-result-number]').textContent = `Unsigned ${o.result} · signed ${signed(o.result)}`;
    $('[data-alu-result-id]').textContent = o.valid ? `Request #${o.id} · ${model.operations[o.op]}`
      : o.id ? `Held bits from #${o.id}; not valid now` : 'Reset value; not a valid result';
    root.querySelectorAll('[data-alu-flag]').forEach(flag => {
      const n = o[flag.dataset.aluFlag]; flag.dataset.on = String(n === 1); flag.querySelector('b').textContent = n;
    });
    const tbody = $('[data-alu-history]');
    tbody.replaceChildren();
    for (const row of history) {
      const tr = document.createElement('tr');
      for (const value of row) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
      tbody.append(tr);
    }
    if (!history.length) {
      const tr = document.createElement('tr'), td = document.createElement('td');
      td.colSpan = 3; td.textContent = 'No clock edges yet.'; tr.append(td); tbody.append(tr);
    }
    renderInputs();
  }
  function pulse() {
    root.classList.remove('alu-flash'); void root.offsetWidth; root.classList.add('alu-flash');
  }
  function clock() {
    const request = readInputs();
    if (!request) {
      form.reportValidity(); setStatus('Enter whole operands from 0 to 255. No clock edge was applied.', true); return false;
    }
    state = model.step(state, request);
    const s = state.stage, o = state.output;
    history.unshift([state.edge, s.valid ? `#${s.id} ${model.operations[s.op]}` : 'Bubble (VALID 0)',
      o.valid ? `#${o.id} ${hex(o.result)} · Z${o.zero} C${o.carry} V${o.overflow}` : `Invalid · held ${hex(o.result)}`]);
    history.splice(6);
    render(); pulse();
    setStatus(`Edge ${state.edge}: ${s.valid ? `captured request #${s.id}` : 'captured a bubble'}. ` +
      (o.valid ? `Output request #${o.id}: ${expression(o)} → ${hex(o.result)}; Z=${o.zero}, C=${o.carry}, V=${o.overflow}.`
        : 'Output VALID is 0; result bits hold their previous value.'));
    return true;
  }
  function stopStream(announce = false) {
    clearTimeout(timeout); timeout = 0;
    const wasRunning = running; running = false;
    root.querySelectorAll('[data-alu-form] input,[data-alu-form] select,[data-alu-preset],[data-alu-valid],[data-alu-step]').forEach(e => { e.disabled = false; });
    streamButton.textContent = 'Run 4-request stream';
    if (wasRunning && announce) setStatus('Stream paused. Pipeline state is retained; step manually or reset.');
  }
  stepButton.addEventListener('click', () => clock());
  form.addEventListener('submit', event => { event.preventDefault(); if (!running) clock(); });
  form.addEventListener('input', () => {
    renderInputs();
    setStatus(readInputs() ? 'Inputs prepared for the next rising edge. Registered values have not changed.'
      : 'Enter whole operands from 0 to 255. Registered values have not changed.', !readInputs());
  });
  validButton.addEventListener('click', () => {
    valid = !valid; renderInputs();
    setStatus(valid ? 'VALID is 1. The next edge will capture the selected request.'
      : 'VALID is 0. The next edge captures a bubble; any previous S1 request can still complete.');
  });
  root.querySelectorAll('[data-alu-preset]').forEach(button => button.addEventListener('click', () => {
    const [a, b, op] = presets[button.dataset.aluPreset];
    aInput.value = a; bInput.value = b; opInput.value = op; valid = true; renderInputs();
    setStatus('Example prepared. Step once to capture it, then again to see its registered result.');
  }));
  $('[data-alu-reset]').addEventListener('click', () => {
    const discarded = Number(state.stage.valid); stopStream(); state = model.create(); history.length = 0;
    root.classList.remove('alu-flash'); valid = true; render();
    setStatus(`Reset asserted: registers and flags cleared${discarded ? '; the pending S1 request was discarded' : ''}. Inputs are retained for your next experiment.`);
  });
  streamButton.addEventListener('click', () => {
    if (running) { stopStream(true); return; }
    running = true;
    root.querySelectorAll('[data-alu-form] input,[data-alu-form] select,[data-alu-preset],[data-alu-valid],[data-alu-step]').forEach(e => { e.disabled = true; });
    streamButton.textContent = 'Stop stream';
    const requests = [[127, 1, 0], [255, 1, 0], [3, 5, 1], [129, 1, 5]];
    let index = 0;
    function next() {
      if (!running) return;
      if (root.hidden || document.hidden) { stopStream(true); return; }
      // Disabled form controls are excluded from form validation; model validates too.
      if (index < requests.length) {
        const [a, b, op] = requests[index]; aInput.value = a; bInput.value = b; opInput.value = op; valid = true;
      } else valid = false;
      clock(); index++;
      if (index <= requests.length) timeout = setTimeout(next, 1100);
      else { stopStream(); setStatus('Four requests captured on consecutive edges. Final edge drained the last result; VALID is now 0. Clock once more to see an output bubble.'); }
    }
    next();
  });
  new MutationObserver(() => { if (root.hidden && running) stopStream(true); }).observe(root, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden && running) stopStream(true); });
  $('[data-alu-interactive]').hidden = false;
  render();
})();
