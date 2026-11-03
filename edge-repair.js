(() => {
 'use strict';
 const art=document.querySelector('.dk-art'),assembly=art?.querySelector('.dk-assembly'),circuit=art?.querySelector('.dk-circuit'),model=window.PortfolioSignalSequence;
 if(!art||!assembly||!circuit||!model)return;
 const svgNS='http://www.w3.org/2000/svg';
 function element(name,className,parent){const e=document.createElement(name);e.className=className;parent.append(e);return e;}
 function svg(name,attrs,parent=circuit){const e=document.createElementNS(svgNS,name);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));parent.append(e);return e;}
 function polygon(x,y,w,h,c){return[[x+c,y],[x+w-c,y],[x+w,y+c],[x+w,y+h-c],[x+w-c,y+h],[x+c,y+h],[x,y+h-c],[x,y+c]];}
 function volume(className,points,top,depth){const shell=element('div','edge-volume '+className,assembly);shell.setAttribute('aria-hidden','true');for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],width=Math.hypot(b[0]-a[0],b[1]-a[1])+.8,angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;const f=element('div','edge-wall',shell);Object.assign(f.style,{left:((a[0]+b[0])/2-width/2)+'px',top:((a[1]+b[1])/2)+'px',width:width+'px',height:(depth+.4)+'px',transformOrigin:'50% 0',transform:`translateZ(${top}px) rotateZ(${angle}deg) rotateX(-90deg)`});}return shell;}
 volume('edge-board-volume',polygon(0,0,360,360,10),0,16);
 volume('edge-chip-volume',polygon(103,103,154,154,5),32,29);
 element('div','edge-chip-bottom',assembly).setAttribute('aria-hidden','true');
 // Eleven complete, connected leads per side. No clipped fragments from repeating backgrounds.
 const leads=element('div','edge-leads',assembly);leads.setAttribute('aria-hidden','true');
 for(let side=0;side<4;side++)for(let i=0;i<11;i++){
  const angle=side*90,rad=angle*Math.PI/180,dx=(120+i*12)-180,dy=76.5;
  const cx=180+dx*Math.cos(rad)-dy*Math.sin(rad),cy=180+dx*Math.sin(rad)+dy*Math.cos(rad);
  const pin=element('div','edge-lead',leads);Object.assign(pin.style,{left:`${cx-3}px`,top:`${cy}px`,transform:`rotateZ(${angle}deg)`});
  for(const part of ['solder','shoulder','ramp','toe','under-shoulder','under-ramp','under-toe','cap'])element('div',`edge-lead-part edge-lead-${part}`,pin);
  for(const right of [false,true]){
   const s=document.createElementNS(svgNS,'svg');s.setAttribute('class','edge-lead-profile'+(right?' edge-profile-right':''));s.setAttribute('viewBox','0 0 27 19');s.setAttribute('aria-hidden','true');
   const shape=document.createElementNS(svgNS,'polygon');shape.setAttribute('points','0,0 9,0 18,16 27,16 27,18 17,18 8,2 0,2');shape.setAttribute('fill','currentColor');s.append(shape);pin.append(s);
  }
 }

 circuit.replaceChildren();circuit.setAttribute('viewBox','0 0 360 360');
 svg('polygon',{points:'10.6,.6 349.4,.6 359.4,10.6 359.4,349.4 349.4,359.4 10.6,359.4 .6,349.4 .6,10.6',class:'signal-etch'});
 svg('polygon',{points:'14,7 346,7 353,14 353,346 346,353 14,353 7,346 7,14',class:'signal-etch',opacity:'.32'});
 // Complete solder lands for all contacts; only the five functional routes carry transitions.
 for(let side=0;side<4;side++){const g=svg('g',{transform:`rotate(${side*90} 180 180)`});for(let i=0;i<11;i++)svg('rect',{x:116+i*12,y:275,width:8,height:11,rx:1,class:'signal-pad'},g);}
 for(const[x,y]of[[25,25],[335,25],[335,335],[25,335],[93,93],[267,93],[93,267],[267,267]]){svg('circle',{cx:x,cy:y,r:2.1,class:'signal-via'});}
 // The VDD and GND feeds connect a local decoupling capacitor. Return is via an internal plane.
 for(const d of ['M132 24 V76','M228 24 V76','M132 43 H167','M193 43 H228'])svg('path',{d,class:'signal-power'});
 svg('text',{x:122,y:19,class:'signal-label'}).textContent='VDD';svg('text',{x:217,y:19,class:'signal-label'}).textContent='GND';svg('text',{x:174,y:34,class:'signal-label'}).textContent='C1';
 for(const x of[132,228])svg('circle',{cx:x,cy:24,r:2.3,class:'signal-via'});
 element('div','signal-capacitor',assembly).setAttribute('aria-hidden','true');
 volume('edge-cap-volume',polygon(171,39,18,8,1),4,3.6);
 for(const x of[167,187]){const terminal=element('div','signal-cap-terminal',assembly);terminal.style.left=x+'px';terminal.setAttribute('aria-hidden','true');volume('edge-cap-metal',polygon(x,39,6,8,.4),4.3,3.9);}

 const chip=art.querySelector('.dk-chip-top'),etch=document.createElementNS(svgNS,'svg');etch.setAttribute('class','signal-chip-etch');etch.setAttribute('viewBox','0 0 154 154');etch.setAttribute('aria-hidden','true');chip.prepend(etch);svg('polygon',{points:'7,1 147,1 153,7 153,147 147,153 7,153 1,147 1,7'},etch);svg('polygon',{points:'11,7 143,7 147,11 147,143 143,147 11,147 7,143 7,11'},etch);
 const definitions=[
  {id:'a',pin:132,d:'M24 112 H44 L64 132 H76.5',x:21,y:102,label:'A',out:false},
  {id:'b',pin:180,d:'M24 180 H76.5',x:21,y:170,label:'B',out:false},
  {id:'cin',pin:228,d:'M24 248 H44 L64 228 H76.5',x:18,y:261,label:'Cin',out:false},
  {id:'sum',pin:156,d:'M283.5 156 H300 L320 136 H336',x:318,y:126,label:'Sum',out:true},
  {id:'carry',pin:204,d:'M283.5 204 H300 L320 224 H336',x:307,y:239,label:'Carry',out:true}
 ];
 const nets=definitions.map(n=>{const base=svg('path',{d:n.d,class:'signal-route'});const high=svg('path',{d:n.d,class:'signal-high'+(n.out?' signal-output':'')});const front=svg('circle',{r:1.9,class:'signal-front'+(n.out?' signal-output':''),visibility:'hidden'});const length=base.getTotalLength(),terminal=base.getPointAtLength(n.out?length:0);svg('circle',{cx:terminal.x,cy:terminal.y,r:2.5,class:'signal-via'});svg('text',{x:n.x,y:n.y,class:'signal-label'}).textContent=n.label;const leadFront=element('i','signal-lead-front'+(n.out?' signal-lead-output':''),assembly);leadFront.setAttribute('aria-hidden','true');const lead=n.out?[[256.5,n.pin,19],[265.5,n.pin,19],[274.5,n.pin,3],[283.5,n.pin,3],[283.5,n.pin,.2]]:[[76.5,n.pin,.2],[76.5,n.pin,3],[85.5,n.pin,3],[94.5,n.pin,19],[103.5,n.pin,19]];return{...n,base,high,front,length,leadFront,lead};});
 art.classList.add('signal-board');
 const sculpture=art.querySelector('.dk-sculpture');sculpture.setAttribute('aria-label','Detailed chip illustration with a slowed full-adder signal sequence. Voltage transitions enter input pins, then new output transitions leave after illustrative logic delays. Not electron trajectories, a hardware simulation or measured timing. Drag to rotate or use arrow keys.');
 const caption=art.querySelector('.dk-live-dot');caption.textContent='INPUT → LOGIC → OUTPUT';
 const bottom=art.querySelector('.dk-art-bottom'),readout=element('span','signal-readout',bottom);bottom.prepend(readout);const values=element('span','signal-values',readout),note=element('small','signal-note',readout);note.textContent='Input transition · slowed';readout.title='Illustrative full-adder pin states, including deliberately slowed propagation delays';
 const button=document.getElementById('dk-motion-toggle');let visible=true,frame=0,last=0,time=0,lastText='',lastPhase='';
 function leadPoint(points,p){const lengths=points.slice(1).map((v,i)=>Math.hypot(...v.map((c,j)=>c-points[i][j])));let distance=p*lengths.reduce((a,b)=>a+b,0);for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1)return points[i].map((v,j)=>v+(points[i+1][j]-v)*Math.min(1,distance/lengths[i]));distance-=lengths[i];}}
 function draw(){const state=model.sample(time);for(const n of nets){const v=state.nets[n.id],L=n.length,bp=Math.max(0,Math.min(1,n.out?(v.progress-.25)/.75:v.progress/.75));if(v.from===v.to){n.high.style.opacity=v.to?'.8':'0';n.high.style.strokeDasharray='none';n.high.style.strokeDashoffset='0';}else if(v.progress===0){n.high.style.opacity=v.from?'.8':'0';n.high.style.strokeDasharray='none';n.high.style.strokeDashoffset='0';}else if(v.progress===1){n.high.style.opacity=v.to?'.8':'0';n.high.style.strokeDasharray='none';n.high.style.strokeDashoffset='0';}else{const length=(v.to?bp:1-bp)*L;n.high.style.opacity='.85';n.high.style.strokeDasharray=`${length} ${L+1}`;n.high.style.strokeDashoffset=v.to?'0':String(-bp*L);}const onLead=v.active&&(n.out?v.progress<.25:v.progress>.75);n.front.setAttribute('visibility',v.active&&!onLead?'visible':'hidden');n.leadFront.style.display=onLead?'block':'none';if(onLead){const lp=n.out?v.progress/.25:(v.progress-.75)/.25;const p=leadPoint(n.lead,lp);n.leadFront.style.transform=`translate3d(${p[0]-1.5}px,${p[1]-1.5}px,${p[2]+.4}px)`;}else if(v.active){const p=n.base.getPointAtLength(bp*L);n.front.setAttribute('cx',p.x);n.front.setAttribute('cy',p.y);}}
  const p=state.pins,text=`A ${p.a} · B ${p.b} · Cin ${p.cin} → S ${p.sum} · C ${p.carry}`;if(text!==lastText){values.textContent=text;lastText=text;}if(lastPhase!==state.state){note.textContent=state.state.toLowerCase()+' · slowed';art.dataset.signalPhase=state.state;lastPhase=state.state;}if(art.dataset.signalActive!==String(state.active))art.dataset.signalActive=String(state.active);
 }
 function running(){return visible&&!document.hidden&&button?.getAttribute('aria-pressed')!=='true';}
 function tick(now){frame=0;if(!running()){last=0;return;}if(last)time+=Math.min((now-last)/1000,.05);last=now;draw();frame=requestAnimationFrame(tick);}
 function sync(){if(!running()){cancelAnimationFrame(frame);frame=0;last=0;}else if(!frame)frame=requestAnimationFrame(tick);}
 button?.addEventListener('click',sync);document.addEventListener('visibilitychange',sync);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',sync);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{rootMargin:'60px'}).observe(art);
 function size(){art.style.setProperty('--edge-mobile-scale',String(Math.max(.38,Math.min(.7,(art.getBoundingClientRect().width-14)/540))));}new ResizeObserver(size).observe(art);size();draw();sync();
})();
