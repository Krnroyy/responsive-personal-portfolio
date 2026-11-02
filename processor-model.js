/* Six-operation teaching model, based on the documented five-stage pipeline.
   Not an HDL interpreter, full RV32I implementation, or hardware timing model. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.PortfolioProcessor=factory();
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const u32=n=>n>>>0;
  const I=(op,rd=0,rs1=0,rs2=0,imm=0,target=0)=>Object.freeze({op,rd,rs1,rs2,imm,target});
  const programs=Object.freeze({
    board:{name:'ZCU104 · 12 → 13',board:true,code:[I('ADDI',1,0,0,5),I('ADDI',2,0,0,7),I('ADD',3,1,2),I('SW',0,0,3,0),I('LW',4,0,0,0),I('ADDI',5,4,0,1),I('SW',0,0,5,4),I('JAL',0,0,0,0,28)],pauseAt:28},
    forwarding:{name:'Back-to-back dependencies',code:[I('ADDI',1,0,0,5),I('ADDI',2,1,0,7),I('ADD',3,2,1),I('ADD',4,3,3)]},
    load:{name:'Load-use interlock',code:[I('ADDI',1,0,0,42),I('SW',0,0,1),I('LW',2,0),I('ADD',3,2,2),I('SW',0,0,3,4)]},
    branch:{name:'Taken branch · kill wrong path',code:[I('ADDI',1,0,0,1),I('BEQ',0,1,1,0,16),I('SW',0,0,1),I('ADDI',2,0,0,99),I('ADDI',2,0,0,7),I('SW',0,0,2,4)]}
  });
  function source1(i){return ['ADDI','ADD','LW','SW','BEQ'].includes(i.op);}
  function source2(i){return ['ADD','SW','BEQ'].includes(i.op);}
  function writes(i){return ['ADDI','ADD','LW','JAL'].includes(i.op)&&i.rd!==0;}
  function instruction(program,pc){
    if(pc%4) throw new RangeError('Instruction address must be word aligned.');
    const i=program.code[pc/4];
    if(i) return {...i,pc};
    // The real board ROM is initialized with NOPs around its final JAL loop.
    return program.board?{...I('ADDI'),pc,padding:true}:null;
  }
  function create(key='board'){
    const program=typeof key==='string'?programs[key]:key;
    if(!program||!Array.isArray(program.code)) throw new Error('Unknown example program.');
    return {program,pc:0,regs:Array(32).fill(0),memory:Array(16).fill(0),id:null,ex:null,mem:null,wb:null,
      cycles:0,retired:0,stalls:0,redirects:0,ledDone:false,done:false,events:[],retirement:null,flush:false,stalled:false};
  }
  function reset(state){return {...create(state.program),memory:state.memory.slice()};}
  function text(i){
    if(!i) return 'Bubble';
    if(i.padding) return 'NOP (ROM padding)';
    if(i.op==='ADDI') return `ADDI x${i.rd}, x${i.rs1}, ${i.imm}`;
    if(i.op==='ADD') return `ADD x${i.rd}, x${i.rs1}, x${i.rs2}`;
    if(i.op==='LW') return `LW x${i.rd}, ${i.imm}(x${i.rs1})`;
    if(i.op==='SW') return `SW x${i.rs2}, ${i.imm}(x${i.rs1})`;
    if(i.op==='BEQ') return `BEQ x${i.rs1}, x${i.rs2}, 0x${i.target.toString(16)}`;
    if(i.op==='JAL') return `JAL x${i.rd}, 0x${i.target.toString(16)}`;
    throw new Error('Only ADDI, ADD, LW, SW, BEQ and JAL are modelled.');
  }
  function step(s){
    if(s.done) return s;
    const n={...s,regs:s.regs.slice(),memory:s.memory.slice(),cycles:s.cycles+1,events:[],retirement:null,flush:false,stalled:false};
    // Commit prior WB; decode sees WB through the same-cycle register bypass.
    if(s.wb){
      n.retired++;n.retirement={...s.wb};
      if(writes(s.wb)) n.regs[s.wb.rd]=s.wb.result;
      n.events.push(`Retire ${text(s.wb)}${writes(s.wb)?` → x${s.wb.rd}=${s.wb.result}`:''}.`);
    }
    n.regs[0]=0;
    // MEM's store side effect and asynchronous load read feed the next WB.
    n.wb=s.mem?{...s.mem}:null;
    if(s.mem&&['LW','SW'].includes(s.mem.op)){
      const address=s.mem.address;
      if(address%4||address>=64) throw new RangeError('This model supports aligned words in 64 bytes of RAM.');
      if(s.mem.op==='LW') n.wb.result=s.memory[address/4];
      else{
        n.memory[address/4]=s.mem.store;
        if(address===4) n.ledDone=true;
        n.events.push(`MEM writes ${s.mem.store} to RAM[${address}].`);
      }
    }
    function operand(reg,latched,used,port){
      if(!used||reg===0) return 0;
      if(s.mem&&writes(s.mem)&&s.mem.op!=='LW'&&s.mem.rd===reg){n.events.push(`Forward MEM → EX (${port}): x${reg}=${s.mem.result}.`);return s.mem.result;}
      if(s.wb&&writes(s.wb)&&s.wb.rd===reg){n.events.push(`Forward WB → EX (${port}): x${reg}=${s.wb.result}.`);return s.wb.result;}
      return latched;
    }
    let redirect=null;
    n.mem=s.ex?{...s.ex}:null;
    if(s.ex){
      const i=s.ex,a=operand(i.rs1,i.a,source1(i),'A'),b=operand(i.rs2,i.b,source2(i),'B');
      if(i.op==='ADDI') n.mem.result=u32(a+i.imm);
      else if(i.op==='ADD') n.mem.result=u32(a+b);
      else if(i.op==='LW'||i.op==='SW'){n.mem.address=u32(a+i.imm);n.mem.store=b;}
      else if(i.op==='BEQ'){if(a===b) redirect=i.target;else n.events.push('EX branch not taken.');}
      else if(i.op==='JAL'){n.mem.result=u32(i.pc+4);redirect=i.target;}
      else throw new Error('Unsupported teaching-model opcode.');
    }
    const hazard=s.ex?.op==='LW'&&s.ex.rd!==0&&s.id&&
      ((source1(s.id)&&s.id.rs1===s.ex.rd)||(source2(s.id)&&s.id.rs2===s.ex.rd));
    if(redirect!==null){
      if(redirect%4) throw new RangeError('Branch target must be word aligned.');
      n.pc=u32(redirect);n.id=null;n.ex=null;n.redirects++;n.flush=true;
      n.events.push(`EX redirects fetch to 0x${redirect.toString(16)}. Younger ID/fetched instructions are discarded; older instructions continue.`);
    }else if(hazard){
      n.ex=null;n.id=s.id;n.pc=s.pc;n.stalls++;n.stalled=true;
      n.events.push(`Load-use stall on x${s.ex.rd}: hold PC and ID; insert an EX bubble. The load continues to MEM.`);
    }else{
      n.ex=s.id?{...s.id,a:n.regs[s.id.rs1],b:n.regs[s.id.rs2]}:null;
      if(s.id&&s.wb&&writes(s.wb)&&((source1(s.id)&&s.id.rs1===s.wb.rd)||(source2(s.id)&&s.id.rs2===s.wb.rd)))
        n.events.push(`WB → ID bypass: decode sees the updated x${s.wb.rd}.`);
      n.id=instruction(s.program,s.pc);n.pc=u32(s.pc+4);
    }
    if(s.program.pauseAt!==undefined&&n.retirement?.pc===s.program.pauseAt){
      n.done=true;n.events.push('Browser example pauses after the first final-loop jump retires. The hardware continues looping.');
    }else if(!s.program.board&&!n.id&&!n.ex&&!n.mem&&!n.wb&&n.pc>=s.program.code.length*4){
      n.done=true;n.events.push('Finite browser example has drained; this is not a hardware HALT instruction.');
    }
    if(!n.events.length) n.events.push('Pipeline advances. No retirement or hazard on this edge.');
    return n;
  }
  return Object.freeze({programs,create,reset,step,text,instruction});
});
