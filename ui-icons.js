/* A single vector family avoids platform emoji fonts, including dynamically updated UI. */
(() => {
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 const shapes={
  '↗':['up-right','M7 17 17 7M7 7h10v10'],
  '↖':['up-left','M17 17 7 7M7 17V7h10'],
  '↑':['up','M12 19V5M5 12l7-7 7 7'],
  '↓':['down','M12 5v14M5 12l7 7 7-7'],
  '←':['left','M19 12H5m7-7-7 7 7 7'],
  '→':['right','M5 12h14m-7-7 7 7-7 7'],
  '☰':['menu','M5 6h14M5 12h14M5 18h14'],
  '×':['close','m6 6 12 12M6 18 18 6'],
  'Ⅱ':['pause','M9 5v14M15 5v14'],
  '▷':['play','m8 5 11 7-11 7Z']
 };
 const characters=/[↗↖↑↓←→☰×Ⅱ▷]/g;
 function icon(char){const [name,d]=shapes[char],svg=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path');svg.setAttribute('class',`ui-icon ui-icon-${name}`);svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.75');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');p.setAttribute('d',d);svg.append(p);return svg;}
 function decorate(root){
  if(!root||root.closest?.('svg'))return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const p=node.parentElement;return p&&!p.closest('svg,script,style,code,pre,option,textarea')&&/[↗↖↑↓←→☰×Ⅱ▷]/.test(node.data)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}}),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){const frag=document.createDocumentFragment();let from=0;for(const hit of node.data.matchAll(characters)){frag.append(document.createTextNode(node.data.slice(from,hit.index)),icon(hit[0]));from=hit.index+hit[0].length;}frag.append(document.createTextNode(node.data.slice(from)));node.replaceWith(frag);}
 }
 document.querySelectorAll('a,button,.alu-wire').forEach(decorate);
 const roots=new Set();let frame=0;
 new MutationObserver(records=>{
  for(const record of records){const el=record.target.nodeType===Node.TEXT_NODE?record.target.parentElement:record.target;
   if(!(el instanceof Element)||el.closest('svg'))continue;
   const root=el.closest('a,button,.alu-wire');if(root)roots.add(root);
   for(const node of record.addedNodes){if(node.nodeType!==Node.ELEMENT_NODE||node.localName==='svg')continue;node.querySelectorAll?.('a,button,.alu-wire').forEach(e=>roots.add(e));}
  }
  if(!roots.size||frame)return;
  frame=requestAnimationFrame(()=>{frame=0;const work=[...roots];roots.clear();work.forEach(decorate);});
 }).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
