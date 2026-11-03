/* Cover-flow navigation around the original project content and live lab engines. */
(() => {
 'use strict';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const $=(s,r=document)=>r.querySelector(s);
 const all=(s,r=document)=>[...r.querySelectorAll(s)];
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const arrow=direction=>`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${direction==='left'?'M19 12H5m7-7-7 7 7 7':'M5 12h14m-7-7 7 7-7 7'}"></path></svg>`;
 const illustrations={
  processor:`<path class="orb-track" d="M8 70h264M35 20v18m51-18v18m51-18v18m51-18v18m51-18v18"/><g class="orb-block"><rect x="16" y="45" width="38" height="54" rx="8"/><rect x="67" y="45" width="38" height="54" rx="8"/><rect x="118" y="45" width="38" height="54" rx="8"/><rect x="169" y="45" width="38" height="54" rx="8"/><rect x="220" y="45" width="38" height="54" rx="8"/></g><g class="orb-label"><text x="35" y="76">IF</text><text x="86" y="76">ID</text><text x="137" y="76">EX</text><text x="188" y="76" font-size="10">MEM</text><text x="239" y="76">WB</text></g><path class="orb-warm" d="M118 108h38"/><text class="orb-note" x="140" y="131">FIVE-STAGE RV32I SUBSET</text>`,
  fifo:`<path class="orb-track" d="M14 73h44m166 0h42"/><g class="orb-block"><rect x="56" y="30" width="168" height="86" rx="15"/><rect x="72" y="47" width="27" height="52" rx="5"/><rect x="108" y="47" width="27" height="52" rx="5"/><rect x="144" y="47" width="27" height="52" rx="5"/><rect x="180" y="47" width="27" height="52" rx="5"/></g><path class="orb-warm" d="M80 58v30m36-30v30"/><circle class="orb-dot" cx="29" cy="73" r="3"/><text class="orb-note" x="140" y="136">VALID / READY / TRANSFER</text>`,
  alu:`<path class="orb-track" d="M18 39h48l21 24m-69 52h48l21-25m106-14h69"/><path class="orb-block" d="M86 24h88l25 25v54l-25 24H86l18-51Z"/><text class="orb-label orb-label-large" x="145" y="86">A+B</text><path class="orb-warm" d="M214 70v13m13-13v13m13-13v13"/><text class="orb-note" x="140" y="148">8-BIT / PIPELINED RTL</text>`,
  timer:`<circle class="orb-block" cx="140" cy="76" r="52"/><circle class="orb-track" cx="140" cy="76" r="40"/><path class="orb-track" d="M140 24v10m0 84v10m-52-52h10m84 0h10M24 76h48m136 0h48"/><path class="orb-warm" d="M140 45v32l21 14"/><circle class="orb-dot" cx="140" cy="77" r="4"/><text class="orb-note" x="140" y="148">RELOAD / COUNT / INTERRUPT</text>`,
  crypto:`<path class="orb-track" d="M20 48h55m-55 29h55m-55 29h55m130-58h55m-55 29h55m-55 29h55"/><rect class="orb-block" x="77" y="20" width="126" height="119" rx="19"/><path class="orb-warm" d="M119 65V50a21 21 0 0 1 42 0v15"/><rect class="orb-block" x="108" y="65" width="64" height="50" rx="10"/><circle class="orb-dot" cx="140" cy="86" r="4"/><path class="orb-track" d="M140 88v11"/><text class="orb-note" x="140" y="155">ENCRYPT / AUTHENTICATE</text>`,
  cmos:`<path class="orb-track" d="M18 46h55l30 29m-85 43h55l30-29m84-6h75"/><path class="orb-block" d="M102 30h33a53 53 0 0 1 0 106h-33Z"/><path class="orb-warm" d="M85 47v70m-8-70v70"/><text class="orb-label" x="132" y="88">Σ</text><circle class="orb-dot" cx="233" cy="83" r="4"/><text class="orb-note" x="140" y="156">CMOS / SUM / CARRY</text>`,
  signal:`<path class="orb-track" d="M10 83h58m145 0h55"/><path class="orb-block" d="m87 36 93 47-93 47Z"/><circle class="orb-warm" cx="190" cy="83" r="9"/><path class="orb-warm" d="M22 39h20V20h20M218 126h20v-19h20"/><text class="orb-note" x="140" y="151">INPUT / LOGIC / OUTPUT</text>`
 };
 function illustration(kind){return `<svg viewBox="0 0 280 164" class="orbit-art" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${illustrations[kind]||illustrations.processor}</svg>`;}
 const projectInfo={
  'project-rv32i':{kind:'processor',tag:'PROCESSOR RTL',line:'Forwarding, hazards and verification.'},
  'project-fifo':{kind:'fifo',tag:'RTL + VERIFICATION',line:'Data integrity through backpressure.'},
  'project-alu':{kind:'alu',tag:'RTL TO GDS',line:'Architecture, equivalence and area.'},
  'project-timer':{kind:'timer',tag:'AXI4-LITE + UVM',line:'Registers, countdown and interrupts.'},
  'project-aes':{kind:'crypto',tag:'FPGA SYSTEMS',line:'Streaming authenticated encryption.'},
  'project-cmos':{kind:'cmos',tag:'CMOS DESIGN',line:'Transistor-level logic foundations.'}
 };
 const demoInfo={
  signal:{kind:'signal',title:'Logic & signal flow',tag:'LOGIC EXPLORER',line:'Follow an input through a circuit.'},
  processor:{kind:'processor',title:'RV32I pipeline',tag:'PROCESSOR LAB',line:'Watch instructions move and retire.'},
  alu:{kind:'alu',title:'Pipelined ALU',tag:'ARITHMETIC LAB',line:'Step operations and inspect the flags.'},
  handshake:{kind:'fifo',title:'FIFO handshake',tag:'STREAMING LAB',line:'Change READY. Follow each transfer.'},
  timer:{kind:'timer',title:'AXI timer',tag:'REGISTER LAB',line:'Write registers and count clock edges.'},
  crypto:{kind:'crypto',title:'Image security',tag:'BROWSER CRYPTO',line:'Encrypt, verify and test tampering.'}
 };

 class CoverFlow {
  constructor({name,label,items,onSelect,onOpen}){
   this.name=name;this.items=items;this.index=0;this.onSelect=onSelect;this.onOpen=onOpen;this.dragOffset=0;this.listMode=false;
   this.root=document.createElement('div');this.root.className=`orbit-deck orbit-${name}`;this.root.id=`${name}-collection`;
   this.root.innerHTML=`<div class="orbit-topline"><span class="orbit-collection">${escape(label)}</span><button type="button" class="orbit-view-toggle" aria-pressed="false">List view</button></div><div class="orbit-viewport" role="region" aria-roledescription="carousel" aria-label="${escape(label)}" tabindex="0" aria-describedby="${name}-orbit-help"><div class="orbit-depth-field" aria-hidden="true"><i></i><i></i><i></i></div><div class="orbit-cards"></div></div><p class="sr-only" id="${name}-orbit-help">Use the left and right arrow keys to select a card, Home for the first card, and End for the last. Swipe horizontally on touch screens. Select the front card to open its content below.</p><div class="orbit-navigation"><button type="button" class="orbit-arrow orbit-prev" aria-label="Previous ${name==='projects'?'project':'demo'}">${arrow('left')}</button><div class="orbit-position"><span class="orbit-counter"></span><div class="orbit-progress" aria-hidden="true"></div></div><button type="button" class="orbit-arrow orbit-next" aria-label="Next ${name==='projects'?'project':'demo'}">${arrow('right')}</button></div><p class="sr-only orbit-announcement" aria-live="polite" aria-atomic="true"></p>`;
   this.stage=$('.orbit-viewport',this.root);this.cardHost=$('.orbit-cards',this.root);this.prev=$('.orbit-prev',this.root);this.next=$('.orbit-next',this.root);this.toggle=$('.orbit-view-toggle',this.root);
   this.prev.addEventListener('click',()=>this.move(-1));this.next.addEventListener('click',()=>this.move(1));
   this.stage.addEventListener('keydown',event=>{if(!this.items.length)return;let index=this.index;if(event.key==='ArrowRight')index=(index+1)%this.items.length;else if(event.key==='ArrowLeft')index=(index-1+this.items.length)%this.items.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=this.items.length-1;else return;event.preventDefault();this.select(index,true);$('.orbit-card.is-current',this.root)?.focus({preventScroll:true});});
   this.stage.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)<=Math.abs(event.deltaY)||Math.abs(event.deltaX)<2)return;event.preventDefault();const now=performance.now();if(now-(this.wheelTime||0)<220)return;this.wheelDelta=(this.wheelDelta||0)+event.deltaX;if(Math.abs(this.wheelDelta)>46){this.move(Math.sign(this.wheelDelta));this.wheelDelta=0;this.wheelTime=now;}},{passive:false});
   this.bindGestures();this.setItems(items);new ResizeObserver(()=>this.layout()).observe(this.stage);reduce.addEventListener('change',()=>this.layout());
  }
  setItems(items){const key=this.items[this.index]?.key;this.items=items;this.index=Math.max(0,items.findIndex(e=>e.key===key));this.cardHost.replaceChildren();this.cards=items.map((item,index)=>{
   const card=document.createElement('button');card.type='button';card.className='orbit-card';card.dataset.orbitKey=item.key;card.setAttribute('aria-controls',item.panelId);
   card.innerHTML=`<span class="orbit-card-meta"><span>${escape(item.tag)}</span><span class="orbit-card-number">${String(item.number||index+1).padStart(2,'0')}</span></span><span class="orbit-illustration">${illustration(item.kind)}</span><span class="orbit-card-title">${escape(item.title)}</span><span class="orbit-card-description">${escape(item.line)}</span><span class="orbit-card-action"><span>${this.name==='projects'?'View project':'Open demo'}</span>${arrow('right')}</span>`;
   card.addEventListener('click',()=>{if(Date.now()<(this.suppressUntil||0))return;if(index===this.index)this.onOpen?.(this.items[index]);else this.select(index,true);});
   card.addEventListener('pointermove',event=>{if(!fine.matches||reduce.matches||index!==this.index||this.drag?.locked)return;const r=card.getBoundingClientRect();card.style.setProperty('--orbit-rx',`${(.5-(event.clientY-r.top)/r.height)*2.2}deg`);card.style.setProperty('--orbit-ry',`${((event.clientX-r.left)/r.width-.5)*3}deg`);},{passive:true});
   card.addEventListener('pointerleave',()=>{card.style.removeProperty('--orbit-rx');card.style.removeProperty('--orbit-ry');});
   this.cardHost.append(card);return card;
  });$('.orbit-progress',this.root).innerHTML=items.map(()=>'<i></i>').join('');this.layout();}
  layout(){
   const width=this.stage.clientWidth||1000,cardWidth=width<460?212:width<760?264:312;this.stage.style.setProperty('--orbit-card-width',`${cardWidth}px`);
   const step=cardWidth*(width<460?.62:.77);
   this.cards.forEach((card,index)=>{let offset=index-this.index;if(this.items.length>2){offset=(offset+this.items.length)%this.items.length;if(offset>this.items.length/2)offset-=this.items.length;}const abs=Math.abs(offset),direction=Math.sign(offset),hidden=abs>2;if(reduce.matches||offset!==0){card.style.removeProperty('--orbit-rx');card.style.removeProperty('--orbit-ry');}
    card.classList.toggle('is-current',offset===0);card.classList.toggle('is-neighbour',abs===1);card.style.setProperty('--orbit-x',`${offset*step+this.dragOffset}px`);card.style.setProperty('--orbit-y',`${Math.min(abs,3)*13}px`);card.style.setProperty('--orbit-z',`${offset===0?28:-Math.min(abs,3)*94}px`);card.style.setProperty('--orbit-angle',`${reduce.matches?0:-direction*Math.min(53,abs*39)}deg`);card.style.setProperty('--orbit-scale',String(offset===0?1:abs===1?.94:.84));card.style.setProperty('--orbit-opacity',hidden?'0':offset===0?'1':abs===1?'.84':'.5');card.style.zIndex=String(10-Math.min(abs,9));card.style.pointerEvents=hidden?'none':'auto';card.setAttribute('aria-pressed',String(offset===0));card.setAttribute('aria-hidden',String(hidden));card.setAttribute('aria-label',`${itemName(this.items[index])}. ${index+1} of ${this.items.length}.${offset===0?' Selected. Open content below.':' Select this card.'}`);card.tabIndex=offset===0?0:-1;
   });
   this.prev.disabled=this.items.length<2;this.next.disabled=this.items.length<2;$('.orbit-counter',this.root).textContent=this.items.length?`${String(this.index+1).padStart(2,'0')} / ${String(this.items.length).padStart(2,'0')}`:'No projects';all('.orbit-progress i',this.root).forEach((dot,i)=>dot.classList.toggle('is-current',i===this.index));
  }
  select(index,notify=false){if(!this.items.length)return;const next=Math.max(0,Math.min(this.items.length-1,index)),changed=next!==this.index;this.index=next;this.layout();if(notify){this.onSelect?.(this.items[this.index]);if(changed)$('.orbit-announcement',this.root).textContent=`${this.index+1} of ${this.items.length}: ${this.items[this.index].title}.`;}}
  move(direction){if(this.items.length)this.select((this.index+direction+this.items.length)%this.items.length,true);}
  bindGestures(){
   const finish=event=>{const d=this.drag;if(!d||event.pointerId!==d.id)return;this.drag=null;this.root.classList.remove('is-dragging');this.dragOffset=0;if(d.locked){this.suppressUntil=Date.now()+350;const distance=event.clientX-d.x,velocity=performance.now()-d.lastTime<100?(d.velocity||0):0,travel=distance+velocity*95;if(Math.abs(distance)>34||Math.abs(velocity)>.35){const step=Math.sign(travel||distance)*Math.min(2,Math.max(1,Math.round(Math.abs(travel)/170)));this.select((this.index-step+this.items.length)%this.items.length,true);}else this.layout();}else this.layout();if(this.stage.hasPointerCapture(event.pointerId))this.stage.releasePointerCapture(event.pointerId);};
   this.stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastTime:performance.now(),locked:false};});
   this.stage.addEventListener('pointermove',event=>{const d=this.drag;if(!d||event.pointerId!==d.id)return;const now=performance.now(),dx=event.clientX-d.x,dy=event.clientY-d.y;if(!d.locked&&Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)*1.2){d.locked=true;this.stage.setPointerCapture(event.pointerId);this.root.classList.add('is-dragging');}if(d.locked){event.preventDefault();this.dragOffset=Math.max(-160,Math.min(160,dx))*.48;this.layout();}d.velocity=(event.clientX-d.lastX)/Math.max(1,now-d.lastTime);d.lastX=event.clientX;d.lastTime=now;});
   this.stage.addEventListener('pointerup',finish);this.stage.addEventListener('pointercancel',event=>{if(this.drag?.id===event.pointerId){this.drag=null;this.dragOffset=0;this.root.classList.remove('is-dragging');this.layout();}});
   this.stage.addEventListener('click',event=>{if(Date.now()<(this.suppressUntil||0)){event.preventDefault();event.stopImmediatePropagation();}},true);
  }
 }
 const itemName=item=>item.title;
 const projects=all('.project[data-category]'),projectSection=$('#projects'),projectFilters=all('.project-filter [data-filter]');
 if(!projects.length||!projectSection)return;
 const projectItems=projects.map((node,index)=>({key:node.id,panelId:node.id,title:$('h3',node).textContent.trim(),number:index+1,...(projectInfo[node.id]||{kind:'processor',tag:'ENGINEERING PROJECT',line:'Design, evidence and verification.'})}));
 let projectList=false,projectCategory='all';
 function showProject(item){if(!item||projectList)return;projects.forEach(node=>{node.hidden=node.id!==item.key;node.classList.add('revealed');});const status=$('#filter-status');if(status)status.textContent=`Selected project: ${item.title}.`;dispatchEvent(new Event('scroll'));}
 function showProjectList(){projects.forEach(node=>{node.hidden=projectCategory!=='all'&&node.dataset.category!==projectCategory;});const status=$('#filter-status');if(status)status.textContent=`Showing ${projects.filter(node=>!node.hidden).length} of ${projects.length} projects.`;$('.orbit-announcement',projectDeck.root).textContent='';}
 function openProject(item){const target=document.getElementById(item.panelId);target?.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});const heading=target?.querySelector('h3');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
 const projectDeck=new CoverFlow({name:'projects',label:'PROJECT COLLECTION',items:projectItems,onSelect:showProject,onOpen:openProject});
 $('.project-filter',projectSection).after(projectDeck.root);
 projectFilters.forEach(button=>button.addEventListener('click',()=>{projectCategory=button.dataset.filter;const eligible=projectItems.filter(item=>projectCategory==='all'||document.getElementById(item.key).dataset.category===projectCategory);projectDeck.setItems(eligible);if(projectList)showProjectList();else showProject(projectDeck.items[projectDeck.index]);}));
 projectDeck.toggle.addEventListener('click',()=>{projectList=!projectList;projectDeck.listMode=projectList;projectDeck.root.classList.toggle('is-list-mode',projectList);projectDeck.toggle.setAttribute('aria-pressed',String(projectList));projectDeck.toggle.textContent=projectList?'3D view':'List view';if(projectList)showProjectList();else showProject(projectDeck.items[projectDeck.index]);dispatchEvent(new Event('scroll'));});
 showProject(projectItems[0]);
 function revealProject(hash){let target;try{target=document.getElementById(decodeURIComponent(hash.slice(1)));}catch(_){return;}const project=target?.closest('.project');if(!project)return;if(projectCategory!=='all'&&!projectDeck.items.some(i=>i.key===project.id))projectFilters.find(b=>b.dataset.filter==='all')?.click();const index=projectDeck.items.findIndex(i=>i.key===project.id);if(index>=0)projectDeck.select(index,true);}
 document.addEventListener('click',event=>{const a=event.target.closest('a[href^="#"]');if(a)revealProject(a.getAttribute('href'));},true);
 addEventListener('hashchange',()=>revealProject(location.hash));revealProject(location.hash);

 const bench=$('#labs'),demoFilter=$('.demo-filter',bench),demoButtons=all('[data-demo-filter]',demoFilter);
 const demoItems=Object.entries(demoInfo).map(([key,data],index)=>{const panel=$(`[data-demo-panel="${key}"]`,bench);if(!panel.id)panel.id=`${key}-lab-panel`;return{key,panelId:panel.id,number:index+1,...data};});
 let demoList=false;
 function chooseDemo(item){if(!item)return;demoButtons.find(b=>b.dataset.demoFilter===item.key)?.click();}
 function openDemo(item){const panel=document.getElementById(item.panelId);panel?.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});const heading=panel?.querySelector('h2,h3,h4,h5,h6');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
 const demoDeck=new CoverFlow({name:'demos',label:'INTERACTIVE LAB COLLECTION',items:demoItems,onSelect:chooseDemo,onOpen:openDemo});demoFilter.before(demoDeck.root);demoFilter.classList.add('orbit-legacy-filter');
 function syncDemo(){const key=demoButtons.find(b=>b.getAttribute('aria-pressed')==='true')?.dataset.demoFilter;const index=demoItems.findIndex(item=>item.key===key);if(index>=0&&index!==demoDeck.index)demoDeck.select(index,false);}
 demoDeck.toggle.addEventListener('click',()=>{demoList=!demoList;demoDeck.root.classList.toggle('is-list-mode',demoList);bench.classList.toggle('orbit-demo-list',demoList);demoDeck.toggle.setAttribute('aria-pressed',String(demoList));demoDeck.toggle.textContent=demoList?'3D view':'List view';if(demoList)demoButtons.find(b=>b.dataset.demoFilter==='all')?.click();else chooseDemo(demoDeck.items[demoDeck.index]);dispatchEvent(new Event('scroll'));});
 new MutationObserver(syncDemo).observe(demoFilter,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});syncDemo();
 document.documentElement.classList.add('orbit-ready');
})();
