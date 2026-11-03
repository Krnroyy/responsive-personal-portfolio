(() => {
 'use strict';
 const art=document.querySelector('.dk-art'),assembly=art?.querySelector('.dk-assembly'),circuit=art?.querySelector('.dk-circuit');
 if(!art||!assembly||!circuit||assembly.classList.contains('edge-repaired'))return;
 const svgNS='http://www.w3.org/2000/svg';
 function element(name,className,parent){const e=document.createElement(name);e.className=className;parent.append(e);return e;}
 function face(parent,x,y,width,height,z,angle){
  const e=element('div','edge-wall',parent);
  Object.assign(e.style,{left:`${x-width/2}px`,top:`${y}px`,width:`${width}px`,height:`${height+.5}px`,transformOrigin:'50% 0',transform:`translateZ(${z}px) rotateZ(${angle}deg) rotateX(-90deg)`});
 }
 // An extruded rounded perimeter, with overlapping segment edges to avoid hairline gaps.
 function volume(className,x,y,w,h,r,top,depth){
  const shell=element('div',`edge-volume ${className}`,assembly);shell.setAttribute('aria-hidden','true');
  face(shell,x+w/2,y+h-.35,w-2*r+.7,depth,top,0);
  face(shell,x+w/2,y+.35,w-2*r+.7,depth,top,180);
  face(shell,x+w-.35,y+h/2,h-2*r+.7,depth,top,90);
  face(shell,x+.35,y+h/2,h-2*r+.7,depth,top,-90);
  const corners=[[x+r,y+r,180],[x+w-r,y+r,270],[x+w-r,y+h-r,0],[x+r,y+h-r,90]],segments=24;
  const step=Math.PI/2/segments,chord=2*r*Math.sin(step/2)+1.0,rad=r*Math.cos(step/2)-.15;
  for(const [cx,cy,start] of corners)for(let i=0;i<segments;i++){
   const degrees=start+(i+.5)*90/segments,a=degrees*Math.PI/180;
   face(shell,cx+rad*Math.cos(a),cy+rad*Math.sin(a),chord,depth,top,degrees-90);
  }
  return shell;
 }
 volume('edge-board-volume',0,0,360,360,22,0,32);
 volume('edge-chip-volume',103,103,154,154,9,48,45);
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
 // Copper routes leave the toe pads, fan out without crossings, and terminate at plated vias.
 circuit.replaceChildren();circuit.setAttribute('viewBox','0 0 360 360');
 for(let side=0;side<4;side++){
  const g=document.createElementNS(svgNS,'g');g.setAttribute('transform',`rotate(${side*90} 180 180)`);circuit.append(g);
  for(let i=0;i<11;i++){
   const x=120+i*12,end=90+i*18,bend=293+Math.abs(end-x),d=`M${x} 284 V293 L${end} ${bend} V340`;
   const land=document.createElementNS(svgNS,'rect');land.setAttribute('class','edge-land');land.setAttribute('x',String(x-4));land.setAttribute('y','275');land.setAttribute('width','8');land.setAttribute('height','11');land.setAttribute('rx','1');g.append(land);
   const route=document.createElementNS(svgNS,'path');route.setAttribute('class','edge-route');route.setAttribute('d',d);g.append(route);
   const flow=document.createElementNS(svgNS,'path');flow.setAttribute('class','edge-route-flow'+((i+side)%4===0?' edge-flow-coral':''));flow.setAttribute('d',d);flow.style.setProperty('--edge-delay',`${-(i*.19+side*.53)}s`);g.append(flow);
   const via=document.createElementNS(svgNS,'circle');via.setAttribute('class','edge-via');via.setAttribute('cx',String(end));via.setAttribute('cy','340');via.setAttribute('r','2.2');g.append(via);
  }
 }
 assembly.classList.add('edge-repaired');art.classList.add('edge-art');
 const button=document.getElementById('dk-motion-toggle');let visible=true;
 function syncMotion(){assembly.classList.toggle('edge-flow-paused',!visible||document.hidden||button?.getAttribute('aria-pressed')==='true');}
 button?.addEventListener('click',syncMotion);document.addEventListener('visibilitychange',syncMotion);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',syncMotion);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();},{rootMargin:'60px'}).observe(art);
 function size(){const width=art.getBoundingClientRect().width;art.style.setProperty('--edge-mobile-scale',String(Math.max(.38,Math.min(.7,(width-14)/540))));}
 new ResizeObserver(size).observe(art);size();syncMotion();
})();
