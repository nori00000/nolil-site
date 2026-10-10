// Progressive interactions. All research remains readable without this module.
for(const root of document.querySelectorAll('[data-tabs]')) {
 const list=root.querySelector('[data-tab-list]');
 const buttons=[...list.querySelectorAll('[data-tab]')];
 const panels=[...root.querySelectorAll(':scope > [data-panel]')];
 if(!buttons.length||buttons.length!==panels.length)continue;
 list.hidden=false;list.setAttribute('role','tablist');
 buttons.forEach((button,i)=>{
  button.id='tab-'+button.dataset.tab;button.setAttribute('role','tab');button.setAttribute('aria-controls',button.dataset.tab);
  const panel=panels.find(p=>p.id===button.dataset.tab);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;
  button.addEventListener('click',()=>activate(i));
  button.addEventListener('keydown',event=>{
   let next;
   if(event.key==='ArrowRight')next=(i+1)%buttons.length;
   else if(event.key==='ArrowLeft')next=(i-1+buttons.length)%buttons.length;
   else if(event.key==='Home')next=0;
   else if(event.key==='End')next=buttons.length-1;
   else return;
   event.preventDefault();activate(next);buttons[next].focus();
  });
 });
 function activate(index){
  buttons.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;});
  panels.forEach(panel=>{const selected=panel.id===buttons[index].dataset.tab;panel.hidden=!selected;panel.toggleAttribute('data-active',selected);});
 }
 activate(0);
}
for(const figure of document.querySelectorAll('.light-exhibit')){
 const control=figure.querySelector('[data-light-control]');if(!control)continue;
 figure.querySelector('.light-controls').hidden=false;
 control.addEventListener('input',()=>{
  const value=Number(control.value),fold=(value-50)*.8;
  const A=[135+fold,155],B=[248+fold*.3,63],C=[470-fold,129],D=[505-fold,287],E=[341-fold*.2,345],F=[165+fold,281],G=[271+fold*.8,250];
  const polygon=points=>'M'+points.map(p=>p.join(' ')).join(' L')+' Z';
  figure.querySelector('[data-paper=body]').setAttribute('d',polygon([A,B,C,D,E,F]));
  figure.querySelector('[data-paper=left]').setAttribute('d',polygon([B,G,E,F,A]));
  figure.querySelector('[data-paper=right]').setAttribute('d',polygon([G,C,D,E]));
  figure.querySelector('[data-paper=fold]').setAttribute('d',`M${B.join(' ')} L${G.join(' ')} L${C.join(' ')} M${G.join(' ')} L${E.join(' ')}`);
  figure.querySelector('output').textContent=value+'%';
  figure.querySelector('.fold-question').textContent=value<33?'넓게 펼친 면 · 빛이 통과할 자리를 골라보세요.':value>66?'좁게 접힌 틈 · 어떤 부분을 열어두고 싶나요?':'면과 틈 사이, 어디로 빛을 통과시키고 싶나요?';
 });
}
const library=document.querySelector('[data-library]');
if(library){
 const search=document.getElementById('library-search'),filters=[...library.querySelectorAll('[data-filter]')],families=[...library.querySelectorAll('[data-family]')];
 library.querySelector('.library-controls').hidden=false;
 let group='all';
 function filter(persist=true){
  const q=search.value.trim().normalize('NFKC').toLocaleLowerCase();let count=0;
  for(const row of families){const show=(group==='all'||row.dataset.group===group)&&row.dataset.search.normalize('NFKC').toLocaleLowerCase().includes(q);row.hidden=!show;if(show)count++;}
  for(const button of filters)button.setAttribute('aria-pressed',String(button.dataset.filter===group));
  document.getElementById('library-count').textContent=`${families.length}개 조사군 중 ${count}개`;
  document.getElementById('library-empty').hidden=count>0;
  if(persist){const url=new URL(location.href);url.searchParams.delete('q');url.searchParams.delete('topic');if(q)url.searchParams.set('q',search.value.trim());if(group!=='all')url.searchParams.set('topic',group);history.replaceState(null,'',url);}
 }
 function restore(){const params=new URL(location.href).searchParams;search.value=params.get('q')||'';const desired=params.get('topic');group=filters.some(b=>b.dataset.filter===desired)?desired:'all';filter(false);}
 search.addEventListener('input',()=>filter());
 for(const button of filters)button.addEventListener('click',()=>{group=button.dataset.filter;filter();});
 function reset(){search.value='';group='all';filter();search.focus();}
 document.getElementById('library-reset').addEventListener('click',reset);library.querySelector('[data-reset-library]').addEventListener('click',reset);
 addEventListener('popstate',restore);addEventListener('pageshow',restore);restore();
}
