(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const header = document.querySelector('.site-header');
  function updateHeader() { header?.classList.toggle('dk-scrolled', scrollY > 18); }
  addEventListener('scroll', updateHeader, { passive: true }); updateHeader();

  document.querySelectorAll('[data-depth]').forEach(card => {
    let frame = 0;
    function reset() {
      cancelAnimationFrame(frame); card.classList.remove('dk-card-active');
      card.style.setProperty('--rx','0deg'); card.style.setProperty('--ry','0deg');
    }
    card.addEventListener('pointermove', event => {
      if (!fine.matches || reduce.matches) return;
      const rect = card.getBoundingClientRect();
      const x = Math.max(0,Math.min(1,(event.clientX - rect.left)/rect.width));
      const y = Math.max(0,Math.min(1,(event.clientY - rect.top)/rect.height));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.classList.add('dk-card-active');
        card.style.setProperty('--rx', `${(0.5-y)*8}deg`);
        card.style.setProperty('--ry', `${(x-0.5)*10}deg`);
        card.style.setProperty('--spot-x', `${x*100}%`);
        card.style.setProperty('--spot-y', `${y*100}%`);
      });
    });
    card.addEventListener('pointerleave', reset);
    reduce.addEventListener('change', reset);
  });

  const art = document.querySelector('.dk-art');
  const sculpture = art?.querySelector('.dk-sculpture');
  const assembly = art?.querySelector('.dk-assembly');
  const canvas = art?.querySelector('canvas');
  const button = document.getElementById('dk-motion-toggle');
  if (!art || !sculpture || !assembly || !canvas || !button) return;
  const ctx = canvas.getContext('2d');
  let running = !reduce.matches, visible = true, frame = 0, last = 0, time = 0;
  let width = 0, height = 0, blue = '', coral = '', opacity = .5;
  let pointerX = 0, pointerY = 0, drag = null, turn = 0, pitch = 0;
  function palette() {
    const css = getComputedStyle(document.documentElement);
    blue = css.getPropertyValue('--dk-blue-rgb').trim();
    coral = css.getPropertyValue('--dk-coral-rgb').trim();
    opacity = +css.getPropertyValue('--dk-trail-alpha') || .5;
    draw();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio);
    ctx?.setTransform(ratio,0,0,ratio,0,0); draw();
  }
  // Flowing ribbons echo the reference without imitating a measured signal.
  function draw() {
    const drift = Math.sin(time*.35);
    assembly.style.transform = `translateY(${Math.sin(time*.7)*7}px) rotateX(${55+pitch+Math.sin(time*.45)*3-pointerY*2}deg) rotateZ(${-32+turn+Math.sin(time*.32)*5+pointerX*3}deg)`;
    if (!ctx || width <= 0 || height <= 0) return;
    ctx.clearRect(0,0,width,height);
    ctx.globalCompositeOperation = 'source-over';
    for (let i=0;i<32;i++) {
      const spread=(i-15.5)*7;
      const pulse=.55+.45*Math.sin(time*.55+i*.38);
      const gradient=ctx.createLinearGradient(width*.1,height,width*.9,0);
      const rgb=i%4===0?coral:blue;
      gradient.addColorStop(0,`rgba(${rgb},0)`);
      gradient.addColorStop(.4,`rgba(${rgb},${opacity*pulse*.72})`);
      gradient.addColorStop(.62,`rgba(${rgb},${opacity*pulse})`);
      gradient.addColorStop(.80,`rgba(${rgb},${opacity*pulse*.38})`);
      gradient.addColorStop(.94,`rgba(${rgb},${opacity*pulse*.04})`);
      gradient.addColorStop(1,`rgba(${rgb},0)`);
      ctx.strokeStyle=gradient;ctx.lineWidth=i%5===0?2.5:.8;
      ctx.beginPath();ctx.moveTo(-width*.1,height*.95+spread);
      ctx.bezierCurveTo(width*.55,height*.8+spread+drift*24,width*.15,height*.3+spread-drift*28,width*.85+spread*.6,-height*.1);
      ctx.stroke();
      if (i%4===0) {
        ctx.save();ctx.setLineDash([2,46]);ctx.lineDashOffset=-time*24-i*7;
        ctx.strokeStyle=gradient;ctx.globalAlpha=.9;ctx.lineWidth=2;ctx.stroke();ctx.restore();
      }
    }
    // Fade the ribbons AND travelling dots together before the canvas boundary.
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    const edgeFade = ctx.createLinearGradient(0, height, 0, 0);
    edgeFade.addColorStop(0, 'rgba(0,0,0,0)');
    edgeFade.addColorStop(.14, 'rgba(0,0,0,1)');
    edgeFade.addColorStop(.67, 'rgba(0,0,0,1)');
    edgeFade.addColorStop(.86, 'rgba(0,0,0,.35)');
    edgeFade.addColorStop(.97, 'rgba(0,0,0,0)');
    edgeFade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeFade;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  function tick(now) {
    frame=0;
    if (!running || !visible || document.hidden) { last=0; return; }
    if (last) time+=Math.min((now-last)/1000,.05);
    last=now;draw();frame=requestAnimationFrame(tick);
  }
  function schedule() { if (!frame && running && visible && !document.hidden) frame=requestAnimationFrame(tick); }
  function render() {
    button.textContent=running?'Ⅱ':'▷';
    button.title=running?'Pause animation':'Play animation';
    button.setAttribute('aria-pressed',String(!running));
    button.setAttribute('aria-label',running?'Pause decorative motion':'Play decorative motion');
    art.querySelector('.dk-circuit-run')?.style.setProperty('animation-play-state',running?'running':'paused');
    if (!running) { cancelAnimationFrame(frame);frame=0;last=0; } else schedule();
  }
  button.addEventListener('click',() => { running=!running;render(); });
  reduce.addEventListener('change', event=> { if(event.matches){running=false;render();} });
  sculpture.addEventListener('pointerdown',event=> {
    if (event.button!==0) return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,turn,pitch};
    sculpture.setPointerCapture(event.pointerId);
  });
  sculpture.addEventListener('pointermove',event=> {
    const rect=sculpture.getBoundingClientRect();
    if(fine.matches){pointerX=(event.clientX-rect.left)/rect.width-.5;pointerY=(event.clientY-rect.top)/rect.height-.5;}
    if(drag && drag.id===event.pointerId) {
      turn=drag.turn+(event.clientX-drag.x)*.3;
      pitch=Math.max(-18,Math.min(18,drag.pitch-(event.clientY-drag.y)*.15));
    }
    if(!running && !reduce.matches) draw();
  });
  function endDrag() {drag=null;}
  sculpture.addEventListener('pointerup',endDrag);sculpture.addEventListener('pointercancel',endDrag);
  sculpture.addEventListener('lostpointercapture',endDrag);
  sculpture.addEventListener('pointerleave',()=>{pointerX=pointerY=0;});
  sculpture.addEventListener('keydown',event=> {
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home'){turn=pitch=0;}
    if(event.key==='ArrowLeft')turn-=8;if(event.key==='ArrowRight')turn+=8;
    if(event.key==='ArrowUp')pitch=Math.min(18,pitch+4);if(event.key==='ArrowDown')pitch=Math.max(-18,pitch-4);
    draw();
  });
  new ResizeObserver(resize).observe(art);
  new MutationObserver(palette).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;last=0;}},{rootMargin:'100px'}).observe(art);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else schedule();});
  palette();resize();render();
})();
