// Interest handoff only; no email, personal notes, storage or analytics. 2026-10-18 v18.
const projects={'farm-observation':'observation','tools-and-stories':'tools','farm-light':'light'};
export const validInterest=value=>['observation','tools','light'].includes(value)?value:'';
export const interestForProject=slug=>Object.hasOwn(projects,slug)?projects[slug]:'';
export function updateNewsLinks(document,href,slug){
 const here=new URL(href),interest=interestForProject(slug);
 for(const link of document.querySelectorAll('a[href]')){
  const next=new URL(link.href,here);
  if(next.origin!==here.origin||!/^\/(?:en\/|zh\/|ja\/|es\/|fr\/)?news\/$/.test(next.pathname))continue;
  next.search='';next.hash='';if(interest)next.searchParams.set('interest',interest);link.href=next.href;
 }
}
export function syncNewsLanguageLinks(document,href){
 const here=new URL(href);
 if(!/^\/(?:en\/|zh\/|ja\/|es\/|fr\/)?news\/$/.test(here.pathname))return false;
 const select=document.querySelector('[data-news-form] #news-interest');
 const interest=validInterest(select?select.value:here.searchParams.get('interest'));
 for(const link of document.querySelectorAll('[data-language-link]')){
  const next=new URL(link.href,here);next.search='';next.hash='';
  if(interest)next.searchParams.set('interest',interest);link.href=next.href;
 }
 return true;
}
export function mountNewsInterest(window,document){
 const select=document.querySelector('[data-news-form] #news-interest');if(!select)return;
 const languageLinks=()=>syncNewsLanguageLinks(document,window.location.href);
 // Leave browser-restored choices intact on back/forward navigation.
 if(!select.value)select.value=validInterest(new URL(window.location.href).searchParams.get('interest'));
 languageLinks();
 select.addEventListener('change',()=>{
  const next=new URL(window.location.href);next.searchParams.delete('interest');
  if(validInterest(select.value))next.searchParams.set('interest',select.value);
  window.history.replaceState(window.history.state,'',next.href);languageLinks();
 });
 window.addEventListener('pageshow',languageLinks);
 window.addEventListener('popstate',()=>{select.value=validInterest(new URL(window.location.href).searchParams.get('interest'));languageLinks();});
}
if(typeof window!=='undefined')mountNewsInterest(window,document);
