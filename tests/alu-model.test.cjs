'use strict';
const assert = require('node:assert/strict');
const model = require('../alu-model.js');
// Independent oracle: arithmetic range tests and bit-by-bit logic/shifting.
function oracle(a, b, op) {
  let raw = 0, carry = 0, overflow = 0;
  const signedA = a < 128 ? a : a - 256, signedB = b < 128 ? b : b - 256;
  if (op < 2) {
    raw = op === 0 ? a + b : a - b;
    carry = Number(op === 0 ? raw >= 256 : raw >= 0);
    const sr = op === 0 ? signedA + signedB : signedA - signedB;
    overflow = Number(sr < -128 || sr > 127);
  } else if (op < 5) {
    for (let k = 0; k < 8; k++) {
      const x = Math.floor(a / 2 ** k) % 2, y = Math.floor(b / 2 ** k) % 2;
      raw += (op === 2 ? Number(x === 1 && y === 1) : op === 3 ? Number(x === 1 || y === 1) : Number(x !== y)) * 2 ** k;
    }
  } else if (op < 7) {
    raw = a;
    for (let n = 0; n < b % 8; n++) {
      if (op === 5) { carry = Number(raw >= 128); raw = (raw * 2) % 256; }
      else { carry = raw % 2; raw = Math.floor(raw / 2); }
    }
  }
  const result = ((raw % 256) + 256) % 256;
  return { result, zero: Number(result === 0), carry, overflow };
}
let combinations = 0;
for (let op = 0; op < 8; op++) for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) {
  assert.deepEqual(model.evaluate(a, b, op), oracle(a, b, op), `${op},${a},${b}`); combinations++;
}
assert.deepEqual(model.evaluate(127, 1, 0), { result: 128, zero: 0, carry: 0, overflow: 1 });
assert.deepEqual(model.evaluate(255, 1, 0), { result: 0, zero: 1, carry: 1, overflow: 0 });
assert.deepEqual(model.evaluate(3, 5, 1), { result: 254, zero: 0, carry: 0, overflow: 0 });
assert.deepEqual(model.evaluate(129, 1, 5), { result: 2, zero: 0, carry: 1, overflow: 0 });
let state = model.create(), pending = null, held = { result: 0, zero: 0, carry: 0, overflow: 0 }, seed = 2026;
let count = 0;
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; }
for (let i = 0; i < 10000; i++) {
  if (i % 97 === 0) { state = model.create(); pending = null; held = { result: 0, zero: 0, carry: 0, overflow: 0 }; count = 0; }
  const req = { a: random() >>> 24, b: random() >>> 24, op: (random() >>> 24) % 8, valid: (random() >>> 24) % 5 !== 0 };
  const before = JSON.stringify(state), old = state;
  state = model.step(state, req);
  assert.equal(JSON.stringify(old), before, 'No input state mutation');
  assert.equal(state.output.valid, pending !== null);
  if (pending) { held = oracle(pending.a, pending.b, pending.op); assert.equal(state.output.id, pending.id); }
  for (const flag of ['result','zero','carry','overflow']) assert.equal(state.output[flag], held[flag], flag);
  if (req.valid) count++;
  assert.equal(state.accepted, count);
  assert.equal(state.stage.valid, req.valid);
  pending = req.valid ? { ...req, id: count } : null;
}
const captured = model.step(model.create(), { a: 255, b: 1, op: 0, valid: true });
assert.equal(captured.output.valid, false);
assert.equal(captured.stage.valid, true);
const drained = model.step(captured, { a: 0, b: 0, op: 0, valid: false });
assert.equal(drained.output.valid, true); assert.equal(drained.output.carry, 1);
const bubble = model.step(drained, { a: 0, b: 0, op: 0, valid: false });
assert.equal(bubble.output.valid, false); assert.equal(bubble.output.carry, 1);
assert.equal(model.create().output.zero, 0, 'Reset Z differs from computed zero');
for (const req of [[-1,0,0],[256,0,0],[1.5,0,0],[0,NaN,0],[0,0,8]]) assert.throws(() => model.evaluate(...req), RangeError);
console.log(`PASS: ${combinations.toLocaleString()} operation/operand combinations; 10,000 pipeline cycles with bubbles and reset; directed flags, holds and invalid inputs.`);
console.log('These are browser-model tests against an independent arithmetic oracle, not an HDL simulation.');

// Regression: INVALID payload is not sampled and must not block the prior output.
for (const invalid of [{a:NaN,b:undefined,op:99}, {a:-1,b:256,op:8}, {a:2.5,b:Infinity,op:-1}]) {
  const pending = model.step(model.create(), {a:255,b:1,op:0,valid:true});
  const drained = model.step(pending, {...invalid,valid:false});
  assert.equal(drained.edge, 2); assert.equal(drained.output.valid,true);
  assert.equal(drained.output.id,1); assert.equal(drained.output.result,0);
  assert.equal(drained.output.zero,1); assert.equal(drained.output.carry,1);
  assert.equal(drained.stage.valid,false); assert.equal(drained.stage.a,255);
  const held = model.step(drained,{...invalid,valid:false});
  assert.equal(held.output.valid,false); assert.equal(held.output.carry,1);
}
// Stream every legal request through the registered pipeline, including opcode boundaries.
let streamed = model.create(), expected = null, streamCount = 0;
for (let op=0;op<8;op++) for(let a=0;a<256;a++) for(let b=0;b<256;b++) {
  streamed=model.step(streamed,{a,b,op,valid:true});
  assert.equal(streamed.output.valid,expected!==null);
  if(expected) {
    for(const key of ['result','zero','carry','overflow']) assert.equal(streamed.output[key],expected[key]);
    assert.equal(streamed.output.id,streamCount);
  }
  expected=oracle(a,b,op);streamCount++;
}
streamed=model.step(streamed,{valid:false});
assert.equal(streamed.output.id,524288);assert.equal(streamed.output.valid,true);
for(const key of ['result','zero','carry','overflow']) assert.equal(streamed.output[key],expected[key]);
// Every opcode can precede/follow every other opcode, with or without a bubble or reset.
let pairs=0;
for(let first=0;first<8;first++) for(let second=0;second<8;second++) {
 for(const a of [0,127,128,255]) for(const b of [0,1,128,255]) for(const gap of ['none','bubble','reset']) {
  let st=model.step(model.create(),{a,b,op:first,valid:true});
  if(gap==='bubble') st=model.step(st,{valid:false});
  if(gap==='reset') st=model.create();
  st=model.step(st,{a:b,b:a,op:second,valid:true});
  assert.equal(st.output.valid,gap==='none');
  if(gap==='none') for(const key of ['result','zero','carry','overflow']) assert.equal(st.output[key],oracle(a,b,first)[key]);
  st=model.step(st,{valid:false});
  for(const key of ['result','zero','carry','overflow']) assert.equal(st.output[key],oracle(b,a,second)[key]);
  pairs++;
 }
}
console.log(`PASS: ${streamCount.toLocaleString()} valid requests through the pipeline; ${pairs.toLocaleString()} directed opcode-pair/bubble/reset sequences; ignored invalid-cycle payload regression.`);
