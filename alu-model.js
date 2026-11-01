/* Behavioural teaching model of rtl/alu8_pipeline.sv, baseline two-stage ALU.
   Reference: Krnroyy/pipelined-8bit-alu @ c140a3a429d74734fc7379b5488d85d32537f82d.
   Runs JavaScript arithmetic; it does not execute or verify SystemVerilog. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PortfolioALU = factory();
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const operations = ['ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLL', 'SRL', 'Reserved'];
  function evaluate(a, b, op) {
    if (![a, b, op].every(Number.isInteger) || a < 0 || a > 255 || b < 0 || b > 255 || op < 0 || op > 7)
      throw new RangeError('Operands must be bytes and opcode must be 0–7.');
    let result = 0, carry = 0, overflow = 0;
    const shift = b & 7;
    switch (op) {
      case 0:
        result = (a + b) & 255;
        carry = (a + b) >>> 8;
        overflow = ((~(a ^ b) & (result ^ a)) >>> 7) & 1;
        break;
      case 1:
        result = (a - b) & 255;
        carry = Number(a >= b); // SUB carry = no unsigned borrow.
        overflow = (((a ^ b) & (result ^ a)) >>> 7) & 1;
        break;
      case 2: result = a & b; break;
      case 3: result = a | b; break;
      case 4: result = a ^ b; break;
      case 5:
        result = (a << shift) & 255;
        carry = shift ? (a >>> (8 - shift)) & 1 : 0;
        break;
      case 6:
        result = a >>> shift;
        carry = shift ? (a >>> (shift - 1)) & 1 : 0;
        break;
    }
    // Reserved returns zero: Z=1, C=0, V=0 (as assigned by the RTL).
    return { result, zero: Number(result === 0), carry, overflow };
  }
  function create() {
    return { edge: 0, accepted: 0, completed: 0,
      stage: { valid: false, id: null, a: 0, b: 0, op: 0 },
      output: { valid: false, id: null, a: 0, b: 0, op: 0, result: 0, zero: 0, carry: 0, overflow: 0 } };
  }
  function step(state, request) {
    // Validate even invalid-cycle input for a predictable public API.
    evaluate(request.a, request.b, request.op);
    const accepted = request.valid === true;
    const prior = state.stage;
    const output = prior.valid
      ? { ...prior, ...evaluate(prior.a, prior.b, prior.op), valid: true }
      : { ...state.output, valid: false }; // Output bits hold during a bubble.
    return { edge: state.edge + 1, accepted: state.accepted + Number(accepted),
      completed: state.completed + Number(prior.valid),
      stage: accepted
        ? { valid: true, id: state.accepted + 1, a: request.a, b: request.b, op: request.op }
        : { ...prior, valid: false }, output };
  }
  return Object.freeze({ operations: Object.freeze(operations), evaluate, create, step });
});
