'use strict';
const assert=require('node:assert/strict');
const model=require('../processor-model.js');
const ins=(op,rd=0,rs1=0,rs2=0,imm=0,target=0)=>({op,rd,rs1,rs2,imm,target});
// Sequential architectural reference: no pipeline registers, forwarding, or stalls.
function reference(program,initialMemory=Array(16).fill(0)){
  const regs=Array(32).fill(0),memory=initialMemory.slice(),trace=[];let pc=0;
  for(let guard=0;guard<200;guard++){
    const i=program.code[pc/4];if(!i)break;
    const a=regs[i.rs1],b=regs[i.rs2],row={pc,op:i.op};let next=pc+4,result;
    if(i.op==='ADDI')result=(a+i.imm)>>>0;
    else if(i.op==='ADD')result=(a+b)>>>0;
    else if(i.op==='LW')result=memory[(a+i.imm)/4];
    else if(i.op==='SW'){row.address=a+i.imm;row.store=b;memory[row.address/4]=b;}
    else if(i.op==='BEQ'){if(a===b)next=i.target;}
    else if(i.op==='JAL'){result=pc+4;next=i.target;}
    if(result!==undefined&&i.rd!==0){regs[i.rd]=result;row.rd=i.rd;row.value=result;}
    regs[0]=0;trace.push(row);
    if(program.pauseAt===pc)break;
    pc=next;if(guard===199)throw new Error('Reference watchdog');
  }
  return {regs,memory,trace};
}
function check(program,initialMemory){
  let state=model.create(program);if(initialMemory)state.memory=initialMemory.slice();
  const ref=reference(program,initialMemory),trace=[],events=[];
  for(let guard=0;!state.done&&guard<200;guard++){
    const before=JSON.stringify(state),prior=state;state=model.step(state);
    assert.equal(JSON.stringify(prior),before,'Model must not mutate its input state');
    assert.equal(state.regs[0],0);events.push(...state.events);
    const i=state.retirement;
    if(i){const row={pc:i.pc,op:i.op};
      if(['ADDI','ADD','LW','JAL'].includes(i.op)&&i.rd!==0){row.rd=i.rd;row.value=i.result;}
      if(i.op==='SW'){row.address=i.address;row.store=i.store;}
      trace.push(row);
    }
  }
  assert.equal(state.done,true,'Pipeline watchdog');
  assert.deepEqual(trace,ref.trace,'Retirement order and architectural effects');
  assert.deepEqual(state.regs,ref.regs,'Registers');assert.deepEqual(state.memory,ref.memory,'RAM');
  assert.equal(state.retired,ref.trace.length);
  return {state,events};
}
for(const [name,program] of Object.entries(model.programs)){
  const {state}=check(program);
  if(name==='board'){assert.deepEqual(state.memory.slice(0,2),[12,13]);assert.equal(state.ledDone,true);assert.equal(state.stalls,1);}
  if(name==='forwarding'){assert.equal(state.regs[4],34);assert.equal(state.stalls,0);}
  if(name==='load'){assert.equal(state.memory[1],84);assert.equal(state.stalls,1);}
  if(name==='branch'){assert.equal(state.memory[0],0);assert.equal(state.regs[2],7);assert.equal(state.redirects,1);}
}
const directed=[
  [ins('ADDI',1,0,0,5),ins('ADDI',1,1,0,1),ins('ADD',2,1,1)], // youngest MEM wins over older WB
  [ins('LW',0,0),ins('ADD',2,0,0)], // x0 load creates no dependency
  [ins('LW',1,0),ins('SW',0,0,1,4)], // load data is forwarded to a store after a bubble
  [ins('ADDI',1,0,0,1),ins('BEQ',0,1,0,0,16),ins('ADDI',2,0,0,8),ins('SW',0,0,2,4)],
  [ins('JAL',1,0,0,0,12),ins('SW',0,0,1),ins('ADDI',2,0,0,99),ins('ADD',2,1,1)],
  [ins('ADDI',1,0,0,-1),ins('ADDI',2,1,0,1),ins('ADD',0,1,1),ins('SW',0,0,2)],
  [ins('ADDI',1,0,0,3),ins('ADDI',2,0,0,4),ins('ADDI',3,0,0,5),ins('ADD',4,1,3)] // same-edge WB-to-ID
];
directed.forEach(code=>check({code},[42,...Array(15).fill(0)]));
let seed=20261102;
function random(n){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>8)%n;}
for(let test=0;test<500;test++){
  const length=12+random(15),code=[];
  for(let index=0;index<length;index++){
    const rd=random(8),a=random(8),b=random(8),target=Math.min(length,index+1+random(3))*4;
    switch(random(6)){
      case 0:code.push(ins('ADDI',rd,a,0,random(4096)-2048));break;
      case 1:code.push(ins('ADD',rd,a,b));break;
      case 2:code.push(ins('LW',rd,0,0,random(4)*4));break;
      case 3:code.push(ins('SW',0,0,b,random(4)*4));break;
      case 4:code.push(ins('BEQ',0,a,b,0,target));break;
      case 5:code.push(ins('JAL',rd,0,0,0,target));break;
    }
  }
  check({code});
}
// Reset at every early pipeline position: no old instruction completes after reset;
// RAM is retained, registers/valids and board done latch are cleared.
for(const program of Object.values(model.programs))for(let prefix=0;prefix<14;prefix++){
  let state=model.create(program);for(let k=0;k<prefix&&!state.done;k++)state=model.step(state);
  const memory=state.memory.slice(),reset=model.reset(state);
  assert.deepEqual(reset.memory,memory);assert.deepEqual(reset.regs,Array(32).fill(0));
  for(const stage of ['id','ex','mem','wb'])assert.equal(reset[stage],null);
  assert.equal(reset.ledDone,false);assert.equal(reset.pc,0);assert.equal(reset.retired,0);
  check(program,memory);
}
console.log('PASS: four built-in programs, seven directed forwarding/hazard/x0/wrap tests, 500 deterministic generated programs, 56 reset positions and restart checks.');
console.log('Each compares ordered retirements, all 32 registers and all 16 RAM words with an independent sequential reference. Browser model only; no RTL execution or ISA-compliance proof.');
