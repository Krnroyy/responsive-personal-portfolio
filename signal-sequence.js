/* Educational timing model; seconds are display time, not measured circuit delay. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PortfolioSignalSequence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const GRAY=Object.freeze([0,1,3,2,6,7,5,4]),PERIOD=3.6,TRAVEL=.7,LOGIC=.45;
 function bits(n){return{a:(n>>2)&1,b:(n>>1)&1,cin:n&1};}
 function adder(v){return{sum:v.a^v.b^v.cin,carry:(v.a&v.b)|(v.a&v.cin)|(v.b&v.cin)};}
 function net(from,to,launch,t){const progress=Math.max(0,Math.min(1,(t-launch)/TRAVEL));return{from,to,progress,source:t>=launch?to:from,sink:t>=launch+TRAVEL?to:from,active:from!==to&&t>=launch&&t<launch+TRAVEL};}
 function sample(seconds){
  const time=Math.max(0,Number.isFinite(seconds)?seconds:0),step=Math.floor(time/PERIOD),phase=time-step*PERIOD;
  const old=bits(GRAY[step%8]),next=bits(GRAY[(step+1)%8]),before=adder(old),after=adder(next);
  const nets={a:net(old.a,next.a,0,phase),b:net(old.b,next.b,0,phase),cin:net(old.cin,next.cin,0,phase),sum:net(before.sum,after.sum,TRAVEL+LOGIC,phase),carry:net(before.carry,after.carry,TRAVEL+LOGIC+.3,phase)};
  const pins={a:nets.a.sink,b:nets.b.sink,cin:nets.cin.sink,sum:nets.sum.source,carry:nets.carry.source};
  const state=phase<TRAVEL?'INPUT TRANSITION':phase<TRAVEL+LOGIC?'LOGIC SETTLING':Object.values(nets).some(n=>n.active)?'OUTPUT TRANSITION':'STABLE';
  return{step,phase,nets,pins,state,target:{...next,...after},active:Object.values(nets).filter(n=>n.active).length};
 }
 return Object.freeze({sample,adder,GRAY,PERIOD,TRAVEL,LOGIC});
});
