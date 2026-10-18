(() => {
  'use strict';
  const $ = id => document.getElementById('lab-' + id);
  if (!$('controls')) return;
  const maxBytes = 3 * 1024 * 1024;
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  let source = null, sealed = null, originalURL = null, recoveredURL = null;
  let epoch = 0, busy = false;
  const hex = bytes => Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
  const status = (message, state = '') => { $('status').textContent = message; $('status').dataset.state = state; };
  function controls() {
    $('encrypt').disabled = busy || !source;
    $('decrypt').disabled = $('tamper').disabled = busy || !sealed;
    $('sample').disabled = $('file').disabled = busy;
    $('actions').setAttribute('aria-busy', String(busy));
  }
  function clearRecovered() {
    if (recoveredURL) URL.revokeObjectURL(recoveredURL);
    recoveredURL = null;
    $('recovered').hidden = true; $('recovered').removeAttribute('src');
    $('recovered-empty').hidden = false;
    $('recovered-info').textContent = 'Awaiting verification';
  }
  function clearCipher() {
    sealed = null; clearRecovered();
    $('cipher').textContent = 'Choose an image, then encrypt.';
    $('cipher-info').textContent = 'Bytes shown as hexadecimal';
    $('iv').textContent = $('tag').textContent = 'Not generated';
  }
  function reset() {
    epoch++; busy = false; source = null; clearCipher();
    if (originalURL) URL.revokeObjectURL(originalURL);
    originalURL = null; $('original').hidden = true; $('original').removeAttribute('src');
    $('original-empty').hidden = false; $('file-info').textContent = 'Nothing selected';
    $('file').value = ''; controls(); status('Choose an image or use the sample to begin.');
  }
  async function load(blob, name) {
    const token = ++epoch; busy = true; source = null; clearCipher(); controls();
    status('Checking image…');
    let url;
    try {
      if (!allowed.includes(blob.type)) throw new Error('Choose a PNG, JPEG or WebP image.');
      if (!blob.size || blob.size > maxBytes) throw new Error('Choose an image smaller than or equal to 3 MiB.');
      url = URL.createObjectURL(blob);
      const image = new Image(); image.src = url; await image.decode();
      if (image.naturalWidth * image.naturalHeight > 25000000) throw new Error('Choose an image with at most 25 million pixels.');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (token !== epoch) return;
      if (originalURL) URL.revokeObjectURL(originalURL);
      originalURL = url; url = null;
      source = { bytes, type: blob.type };
      $('original').src = originalURL; $('original').hidden = false; $('original-empty').hidden = true;
      $('file-info').textContent = `${name} · ${bytes.length.toLocaleString()} bytes`;
      status('Image ready. Encrypt to generate a fresh key and IV.');
    } catch (error) {
      if (token === epoch) {
        if (originalURL) URL.revokeObjectURL(originalURL);
        originalURL = null; $('original').hidden = true; $('original').removeAttribute('src');
        $('original-empty').hidden = false; $('file-info').textContent = 'No valid image selected';
        status(error.message === 'The source image cannot be decoded.' ? 'This image could not be decoded. Try another file.' : (error instanceof DOMException ? 'This image could not be decoded. Try another file.' : error.message), 'error');
      }
    } finally {
      if (url) URL.revokeObjectURL(url);
      if (token === epoch) { busy = false; controls(); }
    }
  }
  async function operate(kind) {
    if (busy || !source || (kind !== 'encrypt' && !sealed)) return;
    const token = ++epoch, selected = source, frame = sealed;
    busy = true; clearRecovered(); controls(); status(kind === 'encrypt' ? 'Encrypting image bytes…' : 'Checking authentication…');
    try {
      if (kind === 'encrypt') {
        // A new key and IV are generated on every encryption; no nonce reuse.
        const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const bytes = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, selected.bytes));
        if (token !== epoch) return;
        sealed = { key, iv, bytes };
        $('cipher').textContent = hex(bytes.slice(0, 96)).match(/.{1,32}/g).join('\n') + (bytes.length > 96 ? '\n…' : '');
        $('cipher-info').textContent = `${bytes.length.toLocaleString()} bytes · includes 16-byte tag`;
        $('iv').textContent = hex(iv); $('tag').textContent = hex(bytes.slice(-16));
        status('Encrypted. Decrypt and verify, or test a changed ciphertext bit.', 'success');
      } else {
        const bytes = frame.bytes.slice();
        if (kind === 'tamper') bytes[0] ^= 1;
        let plain;
        try { plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: frame.iv, tagLength: 128 }, frame.key, bytes)); }
        catch (error) {
          if (token !== epoch) return;
          if (kind === 'tamper' && error.name === 'OperationError') {
            $('recovered-info').textContent = 'Blocked: authentication failed';
            status('Tamper rejected. Authentication failed; no recovered image released.', 'success'); return;
          }
          throw error;
        }
        if (token !== epoch) return;
        if (kind === 'tamper') throw new Error('Unexpected result: modified ciphertext authenticated. Reset the lab.');
        if (plain.length !== selected.bytes.length || !plain.every((v, i) => v === selected.bytes[i])) throw new Error('Recovered bytes do not match the original.');
        recoveredURL = URL.createObjectURL(new Blob([plain], { type: selected.type }));
        $('recovered').src = recoveredURL; $('recovered').hidden = false; $('recovered-empty').hidden = true;
        $('recovered-info').textContent = 'Verified · exact file-byte match';
        status('Authentication passed. Recovered file bytes exactly match the original.', 'success');
      }
    } catch (_) { if (token === epoch) status('The operation failed. Reset the lab and try again.', 'error'); }
    finally { if (token === epoch) { busy = false; controls(); } }
  }
  if (!window.crypto?.subtle) { status('This browser needs a secure context (HTTPS or localhost) and Web Crypto to run the lab.'); return; }
  $('controls').hidden = $('actions').hidden = false;
  $('file').addEventListener('change', () => { const file = $('file').files[0]; if (file) load(file, file.name); $('file').value = ''; });
  $('sample').addEventListener('click', () => {
    const sampleEpoch = epoch;
    const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 280;
    const c = canvas.getContext('2d'); c.fillStyle = '#102c36'; c.fillRect(0, 0, 480, 280);
    c.strokeStyle = '#6bcbb4'; c.lineWidth = 2;
    for (let x = 20; x < 480; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 280); c.stroke(); }
    c.fillStyle = '#102c36'; c.fillRect(58, 68, 364, 144);
    c.fillStyle = '#e3f6a2'; c.font = 'bold 44px sans-serif'; c.fillText('IMAGE → AES', 80, 135);
    c.fillStyle = '#d1e4e7'; c.font = '18px sans-serif'; c.fillText('Encrypt. Authenticate. Recover.', 81, 174);
    canvas.toBlob(blob => { if (blob && sampleEpoch === epoch) load(blob, 'Built-in sample.png'); }, 'image/png');
  });
  ['encrypt', 'decrypt', 'tamper'].forEach(kind => $(kind).addEventListener('click', () => operate(kind)));
  $('reset').addEventListener('click', reset);
  reset();
})();
