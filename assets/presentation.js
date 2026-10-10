import {syncLanguageLinks} from './i18n.js';
const root=document.querySelector('[data-deck]');
if(root){
 const slides=[...root.querySelectorAll('[data-slide]')],prev=root.querySelector('[data-deck-prev]'),next=root.querySelector('[data-deck-next]'),all=root.querySelector('[data-deck-all]'),full=root.querySelector('[data-deck-full]');let index=0,overview=false;
 function show(n,{focus=false,write=true}={}){index=Math.max(0,Math.min(slides.length-1,n));for(const [i,s] of slides.entries())s.hidden=!overview&&i!==index;prev.disabled=index===0;next.disabled=index===slides.length-1;root.querySelector('[data-deck-status]').textContent=`${index+1} / ${slides.length}`;all.setAttribute('aria-pressed',String(overview));root.classList.toggle('deck-overview',overview);if(write){history.replaceState(null,'','#slide-'+(index+1));syncLanguageLinks();}if(focus)slides[index].focus({preventScroll:true});}
 function restore(){const n=Number(location.hash.match(/^#slide-(\d+)$/)?.[1]||1);show(n-1,{write:false});}
 prev.addEventListener('click',()=>show(index-1,{focus:true}));next.addEventListener('click',()=>show(index+1,{focus:true}));all.addEventListener('click',()=>{overview=!overview;show(index);});
 let focusMode=false;
 const outside=[...document.querySelectorAll('body>header,body>footer,.presentation-head,.deck-details,.materials-download-section')];
 function expand(value){focusMode=value;root.classList.toggle('is-expanded',value);document.body.classList.toggle('is-presenting',value);full.setAttribute('aria-pressed',String(value||!!document.fullscreenElement));for(const el of outside)el.inert=value;if(!value)full.focus();}
 full.setAttribute('aria-pressed','false');
 full.addEventListener('click',async()=>{if(focusMode){expand(false);return;}try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.requestFullscreen)await root.requestFullscreen();else expand(true);}catch{expand(true);}});
 addEventListener('fullscreenchange',()=>{full.setAttribute('aria-pressed',String(focusMode||!!document.fullscreenElement));});
 addEventListener('keydown',ev=>{if(focusMode&&ev.key==='Escape'){ev.preventDefault();expand(false);}if(focusMode&&ev.key==='Tab'){const buttons=[...root.querySelectorAll('button:not([disabled]):not([hidden])')],first=buttons[0],last=buttons.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}}});
 root.addEventListener('keydown',ev=>{if(['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName)||ev.altKey||ev.ctrlKey||ev.metaKey)return;let n;if(ev.key==='ArrowRight'||ev.key==='PageDown')n=index+1;else if(ev.key==='ArrowLeft'||ev.key==='PageUp')n=index-1;else if(ev.key==='Home')n=0;else if(ev.key==='End')n=slides.length-1;else return;ev.preventDefault();overview=false;show(n,{focus:true});});
 addEventListener('hashchange',restore);restore();root.dataset.enhanced='true';
}
