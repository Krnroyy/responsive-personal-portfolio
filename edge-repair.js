(() => {
'use strict';
const art=document.querySelector('.dk-art'),assembly=art?.querySelector('.dk-assembly'),model=window.PortfolioSignalSequence;
if(!art||!assembly||!model)return;
art.classList.add('signal-board','solid-board');
const sculpture=art.querySelector('.dk-sculpture'),button=document.getElementById('dk-motion-toggle');
sculpture.setAttribute('aria-label','Blue chip and circuit board. Slowed full-adder input transitions enter left pins; output transitions leave right pins after illustrative logic delays. Decorative background trails are not physical wiring. Drag or use arrow keys to rotate.');
const canvas=document.createElement('canvas');canvas.className='solid-chip-canvas';canvas.setAttribute('aria-hidden','true');sculpture.append(canvas);
const ctx=canvas.getContext('2d');if(!ctx){art.classList.remove('solid-board');return;}
const bottom=art.querySelector('.dk-art-bottom'),readout=document.createElement('span');readout.className='signal-readout';
const values=document.createElement('span'),note=document.createElement('small');readout.append(values,note);bottom.prepend(readout);
art.querySelector('.dk-live-dot').textContent='INPUT → LOGIC → OUTPUT';
let palette={},visible=true,frame=0,last=0,time=0,dpr=1,dirty=true,lastMatrix='',lastText='';
function colors(){const c=getComputedStyle(document.documentElement),light=document.documentElement.dataset.theme==='light';palette={board:c.getPropertyValue('--dk-board').trim(),chip:c.getPropertyValue('--dk-chip').trim(),edge:c.getPropertyValue('--dk-edge').trim(),ink:c.getPropertyValue('--ink').trim(),muted:c.getPropertyValue('--muted').trim(),blue:light?'#285eac':'#9bbcff',coral:light?'#a94e38':'#ffa99a',lead:light?'#8196b4':'#a9bddb',side:light?'#9aacc5':'#192438',chipSide:light?'#b1c2da':'#28364d'};dirty=true;sync();}
const point=(x,y,z)=>[x,y,z];
function outline(x,y,w,h,c){return[[x+c,y],[x+w-c,y],[x+w,y+c],[x+w,y+h-c],[x+w-c,y+h],[x+c,y+h],[x,y+h-c],[x,y+c]];}
// One shared ring at each height. Every edge has exactly two incident faces.
function extrude(ring,top,bottom,fill,side){const a=ring.map(([x,y])=>point(x,y,top)),b=ring.map(([x,y])=>point(x,y,bottom));const faces=[{v:a,fill},{v:[...b].reverse(),fill:side}];for(let i=0;i<ring.length;i++){const j=(i+1)%ring.length;faces.push({v:[a[i],b[i],b[j],a[j]],fill:side});}return{faces,center:[ring.reduce((s,v)=>s+v[0],0)/ring.length,ring.reduce((s,v)=>s+v[1],0)/ring.length,(top+bottom)/2]};}
const boardRing=outline(0,0,360,360,10),chipRing=outline(103,103,154,154,5);
function rotatePin(v,side){const a=side*Math.PI/2,x=v[0]-180,y=v[1]-180;return[180+x*Math.cos(a)-y*Math.sin(a),180+x*Math.sin(a)+y*Math.cos(a),v[2]];}
function lead(side,i){const x=120+i*12,profile=[[256.5,19],[265.5,19],[274.5,3],[283.5,3],[283.5,1],[273.5,1],[264.5,17],[256.5,17]];
const a=profile.map(([y,z])=>rotatePin([x-3,y,z],side)),b=profile.map(([y,z])=>rotatePin([x+3,y,z],side));
const faces=[{v:a,fill:palette.side},{v:[...b].reverse(),fill:palette.side}];for(let n=0;n<a.length;n++){const j=(n+1)%a.length;faces.push({v:[a[n],b[n],b[j],a[j]],fill:n===0||n===2?palette.lead:palette.edge});}return{faces,center:rotatePin([x,270,10],side)};}
let matrix;
function camera(v){return matrix.transformPoint({x:v[0]-180,y:v[1]-180,z:v[2],w:1});}
function project(v){const p=camera(v),s=1000/(1000-p.z);return{x:180+p.x*s,y:180+p.y*s,z:p.z};}
function polygon(vertices,fill,stroke=fill,width=.65){const p=vertices.map(project);ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();}}
function mesh(body){body.faces.map(f=>({...f,z:f.v.reduce((s,v)=>s+camera(v).z,0)/f.v.length})).sort((a,b)=>a.z-b.z).forEach(f=>polygon(f.v,f.fill));}
function line(points,color,width=1){const p=points.map(project);ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
function ring(points,z,color,width){line([...points,points[0]].map(([x,y])=>[x,y,z]),color,width);}
function label(text,x,y,z,size,color,weight='400'){const p=project([x,y,z]),px=project([x+1,y,z]),py=project([x,y+1,z]);ctx.save();ctx.transform(px.x-p.x,px.y-p.y,py.x-p.x,py.y-p.y,p.x,p.y);ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${size>30?'system-ui, sans-serif':'ui-monospace, monospace'}`;ctx.textAlign='center';ctx.fillText(text,0,0);ctx.restore();}
function dot(p,color,r=2){const q=project(p);ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
const nets=[
{id:'a',pin:132,out:false,route:[[24,112,0],[44,112,0],[64,132,0],[76.5,132,0]],label:'A'},
{id:'b',pin:180,out:false,route:[[24,180,0],[76.5,180,0]],label:'B'},
{id:'cin',pin:228,out:false,route:[[24,248,0],[44,248,0],[64,228,0],[76.5,228,0]],label:'Cin'},
{id:'sum',pin:156,out:true,route:[[283.5,156,0],[300,156,0],[320,136,0],[336,136,0]],label:'Sum'},
{id:'carry',pin:204,out:true,route:[[283.5,204,0],[300,204,0],[320,224,0],[336,224,0]],label:'Carry'}
];
for(const n of nets){n.contact=n.out?[[256.5,n.pin,19],[265.5,n.pin,19],[274.5,n.pin,3],[283.5,n.pin,3],[283.5,n.pin,0]]:[[76.5,n.pin,0],[76.5,n.pin,3],[85.5,n.pin,3],[94.5,n.pin,19],[103.5,n.pin,19]];}
function at(points,t){const lengths=points.slice(1).map((p,i)=>Math.hypot(...p.map((x,j)=>x-points[i][j]))),total=lengths.reduce((a,b)=>a+b,0);let d=t*total;for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1)return points[i].map((x,j)=>x+(points[i+1][j]-x)*Math.min(1,d/lengths[i]));d-=lengths[i];}}
function segment(points,start,end){if(end<=start)return[];const ls=points.slice(1).map((p,i)=>Math.hypot(...p.map((x,j)=>x-points[i][j]))),total=ls.reduce((a,b)=>a+b,0);let d=0;const result=[at(points,start)];for(let i=1;i<points.length-1;i++){d+=ls[i-1];if(d/total>start&&d/total<end)result.push(points[i]);}result.push(at(points,end));return result;}
function draw(){const transform=getComputedStyle(assembly).transform;if(!transform||transform==='none')return;matrix=new DOMMatrix(transform);const state=model.sample(time);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,600,600);ctx.translate(120,120);
mesh(extrude(boardRing,0,-16,palette.board,palette.side));
// Continuous perimeter bands are drawn from the exact mesh vertices, never separate CSS panels.
for(let i=0;i<boardRing.length;i++){const a=boardRing[i],b=boardRing[(i+1)%boardRing.length],q=[[...a,0],[...a,-16],[...b,-16],[...b,0]].map(project);let area=0;for(let j=0;j<4;j++)area+=q[j].x*q[(j+1)%4].y-q[(j+1)%4].x*q[j].y;if(area>0){line([[...a,-15.7],[...b,-15.7]],palette.coral,.65);line([[...a,-8],[...b,-8]],palette.edge,.6);}}ring(outline(5,5,350,350,8),.1,palette.edge,.7);
for(let side=0;side<4;side++)for(let i=0;i<11;i++){const x=120+i*12;polygon([[x-4,275,.1],[x+4,275,.1],[x+4,286,.1],[x-4,286,.1]].map(p=>rotatePin(p,side)),palette.edge,null);}
for(const[x,y]of[[25,25],[335,25],[335,335],[25,335],[93,93],[267,93],[93,267],[267,267]]){dot([x,y,.1],palette.edge,1.8);dot([x,y,.12],palette.board,.8);}
line([[132,24,.2],[132,76,.2]],palette.edge,1.4);line([[228,24,.2],[228,76,.2]],palette.edge,1.4);line([[132,43,.2],[228,43,.2]],palette.edge,1.2);
label('VDD',132,18,.2,7,palette.blue);label('GND',228,18,.2,7,palette.blue);label('C1',180,33,.2,7,palette.blue);
for(const n of nets){const v=state.nets[n.id],color=n.out?palette.coral:palette.blue;line(n.route,palette.edge,1.15);const progress=Math.max(0,Math.min(1,n.out?(v.progress-.25)/.75:v.progress/.75));if(v.from===v.to){if(v.to)line(n.route,color,1.3);}else{const pts=segment(n.route,v.to?0:progress,v.to?progress:1);if(pts.length>1)line(pts,color,1.3);}const end=n.route[n.out?n.route.length-1:0];dot(end,palette.edge,2.2);label(n.label,end[0],end[1]+(n.id==='cin'||n.id==='carry'?13:-9),.2,7,palette.blue);}
label('DIGITAL / 01',78,338,.3,8,palette.blue);label('+',330,334,.3,19,palette.coral);
const parts=[];
for(let side=0;side<4;side++)for(let i=0;i<11;i++)parts.push(lead(side,i));
parts.push(extrude(chipRing,32,3,palette.chip,palette.chipSide));
parts.push(extrude(outline(171,39,18,8,1),4,.4,'#8b8070','#665e50'));
for(const x of[167,187])parts.push(extrude(outline(x,39,6,8,.4),4.3,.4,palette.lead,palette.edge));
parts.sort((a,b)=>camera(a.center).z-camera(b.center).z);
for(const body of parts){mesh(body);if(body.faces[0].v.length===8&&body.center[0]===180&&body.center[1]===180){ring(outline(104.5,104.5,151,151,4.5),32.15,palette.edge,.85);ring(outline(110,110,140,140,3),32.2,palette.edge,.55);dot([117,117,32.2],palette.coral,1.9);label('SYSTEM THINKING',180,140,32.3,6,palette.blue);label('RTL',180,193,32.3,46,palette.ink,'500');label('DESIGN · VERIFY · REFINE',180,220,32.3,5.5,palette.muted);}}
for(const n of nets){const v=state.nets[n.id];if(!v.active)continue;const contact=n.out?v.progress<.25:v.progress>.75;const p=contact?at(n.contact,n.out?v.progress/.25:(v.progress-.75)/.25):at(n.route,n.out?(v.progress-.25)/.75:v.progress/.75);dot([p[0],p[1],p[2]+.3],n.out?palette.coral:palette.blue,2);}
const p=state.pins,text=`A ${p.a} · B ${p.b} · Cin ${p.cin} → S ${p.sum} · C ${p.carry}`;if(text!==lastText){values.textContent=text;lastText=text;}note.textContent=state.state.toLowerCase()+' · slowed';lastMatrix=transform;dirty=false;}
function running(){return visible&&!document.hidden&&button?.getAttribute('aria-pressed')!=='true';}
function tick(now){frame=0;if(running()){if(last)time+=Math.min((now-last)/1000,.05);last=now;}else last=0;if(visible&&(running()||dirty||getComputedStyle(assembly).transform!==lastMatrix))draw();if(visible&&!document.hidden)frame=requestAnimationFrame(tick);}
function sync(){if(!visible||document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else if(!frame)frame=requestAnimationFrame(tick);}
function size(){dpr=Math.min(devicePixelRatio||1,2);canvas.width=600*dpr;canvas.height=600*dpr;art.style.setProperty('--edge-mobile-scale',String(Math.max(.38,Math.min(.7,(art.getBoundingClientRect().width-14)/540))));dirty=true;sync();}
new ResizeObserver(size).observe(art);new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();},{rootMargin:'60px'}).observe(art);new MutationObserver(colors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});document.addEventListener('visibilitychange',sync);button?.addEventListener('click',sync);colors();size();
})();
