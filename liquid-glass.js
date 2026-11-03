(() => {
 'use strict';
 document.documentElement.classList.add('liquid-glass');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const targets=document.querySelectorAll('button,.button,.lab-file,.project-links a,.project-evidence,.ed-register-visual,.vf-contact-route,.vf-education,.vf-toolkit,.dk-art');
 for(const el of targets){
  let pending=0,x=.5,y=.3;
  const reset=()=>{cancelAnimationFrame(pending);pending=0;el.style.removeProperty('--lg-x');el.style.removeProperty('--lg-y');el.style.removeProperty('--lg-px');el.style.removeProperty('--lg-py');el.style.removeProperty('--lg-rx');el.style.removeProperty('--lg-ry');el.style.removeProperty('--lg-hover');};
  el.addEventListener('pointermove',event=>{
   if(!fine.matches||reduced.matches||el.matches(':disabled'))return;
   const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
   x=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));y=Math.max(0,Math.min(1,(event.clientY-r.top)/r.height));
   if(pending)return;
   pending=requestAnimationFrame(()=>{pending=0;el.style.setProperty('--lg-x',`${(x*100).toFixed(2)}%`);el.style.setProperty('--lg-y',`${(y*100).toFixed(2)}%`);el.style.setProperty('--lg-px',String(x));el.style.setProperty('--lg-py',String(y));el.style.setProperty('--lg-hover','1');if(el.matches('.vf-contact-route')){el.style.setProperty('--lg-rx',`${((.5-y)*3).toFixed(2)}deg`);el.style.setProperty('--lg-ry',`${((x-.5)*4).toFixed(2)}deg`);}});
  },{passive:true});
  el.addEventListener('pointerleave',reset);el.addEventListener('pointercancel',reset);el.addEventListener('blur',reset);
  reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
 }
})();
