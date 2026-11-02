(() => {
  'use strict';
  const root=document.getElementById('processor-lab'),model=window.PortfolioProcessor;
  if(!root||!model)return;
  const $=q=>root.querySelector(q),select=$('#rv-example'),stepButton=$('[data-rv-step]'),runButton=$('[data-rv-run]');
  let state=model.create(select.value),running=false,timer=0;
  const history=[];
  const hex=n=>'0x'+(n>>>0).toString(16).toUpperCase().padStart(8,'0');
  function stop(){clearTimeout(timer);timer=0;running=false;}
  function status(text){$('[data-rv-status]').textContent=text;}
  function render(message){
    for(const name of ['cycles','retired','stalls','redirects']) $(`[data-rv-${name}]`).textContent=state[name];
    const stages={if:model.instruction(state.program,state.pc),id:state.id,ex:state.ex,mem:state.mem,wb:state.wb};
    for(const [name,packet] of Object.entries(stages)){
      const card=$(`[data-rv-stage="${name}"]`);
      card.dataset.valid=String(Boolean(packet));card.dataset.state=state.flush&&['id','ex'].includes(name)?'flush':state.stalled&&['if','id','ex'].includes(name)?'hold':'normal';
      card.querySelector('[data-rv-instruction]').textContent=packet?model.text(packet):state.flush&&['id','ex'].includes(name)?'Flushed / bubble':'Bubble';
      card.querySelector('[data-rv-pc]').textContent=packet?`PC ${hex(packet.pc)}${state.stalled&&['if','id'].includes(name)?' · held':''}`:state.stalled&&name==='ex'?'Load-use bubble':'No valid instruction';
    }
    const tbody=$('[data-rv-program]');tbody.replaceChildren();
    state.program.code.forEach((instruction,index)=>{
      const pc=index*4,locations=Object.entries(stages).filter(([,v])=>v&&v.pc===pc).map(([k])=>k.toUpperCase());
      const row=document.createElement('tr');row.dataset.active=String(locations.length>0);
      for(const value of ['0x'+pc.toString(16).padStart(2,'0'),model.text({...instruction,pc}),locations.join(' · ')||'—']){
        const cell=document.createElement('td');cell.textContent=value;row.append(cell);
      }
      tbody.append(row);
    });
    $('[data-rv-program-note]').textContent=state.program.board?'The board ROM uses these eight instructions plus NOP padding. The browser pauses after the final loop jump first retires.':'Finite teaching listing. Fetches beyond its end become bubbles; the pipeline then drains.';
    const regs=$('[data-rv-registers]');regs.replaceChildren();
    state.regs.slice(0,8).forEach((value,index)=>{
      const div=document.createElement('div'),label=document.createElement('span'),output=document.createElement('output');
      label.textContent='x'+index;output.textContent=value;output.title=hex(value);div.append(label,output);regs.append(div);
    });
    $('[data-rv-mem0]').textContent=state.memory[0];$('[data-rv-mem4]').textContent=state.memory[1];
    $('[data-rv-led-wrap]').hidden=!state.program.board;
    $('[data-rv-led]').textContent=(state.ledDone?state.memory[1]&15:0).toString(2).padStart(4,'0');
    $('[data-rv-status]').dataset.kind=state.flush?'flush':state.stalled?'hold':'normal';
    stepButton.disabled=running||state.done;runButton.disabled=state.done;select.disabled=running;
    runButton.textContent=running?'Stop':'Run slowly';
    const log=$('[data-rv-history]');log.replaceChildren();
    for(const event of history){const item=document.createElement('li');item.textContent=event;log.append(item);}
    if(message)status(message);
  }
  function clock(){
    if(state.done)return false;
    state=model.step(state);
    history.unshift(`Edge ${state.cycles}: ${state.events.join(' ')}`);history.splice(6);
    if(state.done)stop();
    const main=state.events.find(e=>e.startsWith('EX redirects')||e.startsWith('Load-use'))||state.events[0];
    const extras=state.events.filter(e=>e!==main&&(e.startsWith('Forward')||e.startsWith('Browser example')||e.startsWith('Finite browser')));
    render(`Edge ${state.cycles}: ${[main,...extras].join(' ')}`);
    root.classList.remove('rv-edge');void root.offsetWidth;root.classList.add('rv-edge');
    return true;
  }
  stepButton.addEventListener('click',clock);
  runButton.addEventListener('click',()=>{
    if(running){stop();render('Automatic stepping stopped. Pipeline state is retained.');return;}
    running=true;render();
    function next(){
      if(!running)return;
      if(root.hidden||document.hidden){stop();render('Automatic stepping stopped while the demo is hidden. State is retained.');return;}
      if(state.cycles>=80){stop();render('Automatic stepping stopped at the browser safety limit. Reset or reload the example.');return;}
      clock();if(running&&!state.done)timer=setTimeout(next,900);
    }
    next();
  });
  $('[data-rv-reset]').addEventListener('click',()=>{
    stop();state=model.reset(state);history.length=0;root.classList.remove('rv-edge');
    render('Core reset applied: PC, registers, valid pipeline state and LED-done latch cleared. RAM retained; no old in-flight instruction can complete.');
  });
  function reload(){
    stop();state=model.create(select.value);history.length=0;root.classList.remove('rv-edge');
    render('Fresh example loaded: registers, pipeline and RAM cleared. Step to capture the instruction shown in IF.');
  }
  $('[data-rv-reload]').addEventListener('click',reload);select.addEventListener('change',reload);
  new MutationObserver(()=>{if(root.hidden&&running){stop();render('Automatic stepping stopped when you switched demos. State is retained.');}}).observe(root,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){stop();render('Automatic stepping stopped when the page became hidden. State is retained.');}});
  $('[data-rv-interactive]').hidden=false;render();
})();
