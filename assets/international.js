import {loadProjects,selectionURL} from './journey.js';
import {syncLanguageLinks} from './i18n.js';
const u=JSON.parse(document.querySelector('#interface-copy').textContent),$=id=>document.getElementById(id);
if(document.querySelector('[data-int-library]')){
 const rows=[...document.querySelectorAll('[data-int-family]')],q=$('library-search');
 function filter(write=true){const term=q.value.normalize('NFKC').toLocaleLowerCase().trim();let count=0;for(const row of rows){row.hidden=!row.textContent.normalize('NFKC').toLocaleLowerCase().includes(term);if(!row.hidden)count++;}$('library-count').textContent=`${count} / ${rows.length} · ${u.count}`;$('library-empty').hidden=count>0;if(write){const url=new URL(location.href);url.searchParams.delete('q');if(term)url.searchParams.set('q',q.value);history.replaceState(null,'',url);syncLanguageLinks();}}
 function restore(){q.value=new URL(location.href).searchParams.get('q')||'';filter(false);}
 q.addEventListener('input',()=>filter());$('library-reset').addEventListener('click',()=>{q.value='';filter();q.focus();});addEventListener('popstate',restore);restore();
}
if(document.querySelector('[data-int-participation]')){
 let projects=[],current={},generation=0;const notes=new Map();const note=$('personal-note');const key=()=>current.role?current.project.slug+'/'+current.role.id:'';
 function render(project,role,message=''){generation++;current={project,role};$('role-choice-section').hidden=!project;$('role-preview').hidden=!role;$('role-options').replaceChildren();
 for(const r of project?.roles||[]){const b=document.createElement('button');b.type='button';b.dataset.role=r.id;b.textContent=r.title;b.setAttribute('aria-pressed',String(r===role));b.addEventListener('click',()=>change(project,r));$('role-options').append(b);}
 for(const b of $('project-options').children)b.setAttribute('aria-pressed',String(b.dataset.project===project?.slug));
 for(const [id,value] of [['role-title',role?.title],['role-task',role?.prepare_now],['role-output',role?.personal_output],['role-question',role?.next_question]])$(id).textContent=value||'';
 note.value=notes.get(key())||'';$('copy-fallback').hidden=true;$('export-message').textContent='';$('selection-message').textContent=message||(role?u.selected+': '+role.title:project?u.chooseRole:u.choose);document.querySelector('.participation').classList.toggle('has-selection',!!role);
 }
 function change(project,role){const url=selectionURL(location.href,project,role);if(url!==location.href)history.pushState(null,'',url);render(project,role);syncLanguageLinks();}
 function restore(){const q=new URL(location.href).searchParams,p=projects.find(x=>x.slug===q.get('project')),r=p?.roles.find(x=>x.id===q.get('role'));render(p,r,(q.get('project')&&!p||q.get('role')&&!r)?u.invalid:'');}
 async function load(){$('selection-message').textContent=u.loading;$('retry-load').hidden=true;$('selection-fields').setAttribute('aria-busy','true');try{projects=await loadProjects(fetch,5000,'/'+u.lang+'/data/participation.json');$('project-options').replaceChildren();for(const p of projects){const b=document.createElement('button');b.type='button';b.dataset.project=p.slug;b.textContent=p.title;b.addEventListener('click',()=>change(p));$('project-options').append(b);}restore();}catch{$('selection-message').textContent=u.loadFail;$('retry-load').hidden=false;}finally{$('selection-fields').setAttribute('aria-busy','false');}}
 note.addEventListener('input',()=>{if(key())notes.set(key(),note.value.slice(0,500));});
 function card(){const {project:p,role:r}=current;return [u.memo,u.issued,u.memoState,'',p.title,r.title,u.prepare+': '+r.prepare_now,u.output+': '+r.personal_output,u.question+': '+r.next_question,u.note+': '+(note.value.trim().slice(0,500)||u.none),'',u.membership,u.price,u.capacity,u.sessions,u.plan].join('\n');}
 function fallback(text){$('copy-fallback').hidden=false;$('copy-text').value=text;$('copy-text').focus();$('copy-text').select();$('export-message').textContent=u.copyFail;}
 async function copy(text){const request=generation;try{await navigator.clipboard.writeText(text);if(request===generation)$('export-message').textContent=u.copied;}catch{if(request===generation)fallback(text);}}
 $('copy-card').addEventListener('click',()=>{if(current.role)copy(card());});$('copy-link').addEventListener('click',()=>{if(current.role)copy(selectionURL(location.href,current.project,current.role,true));});
 $('download-card').addEventListener('click',()=>{if(!current.role)return;let url;try{url=URL.createObjectURL(new Blob([card()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`HackerFarm_${u.lang}_${current.project.slug}_${current.role.id}_20261010_v09.txt`;document.body.append(a);a.click();a.remove();$('export-message').textContent=u.downloaded;}catch{fallback(card());}finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);}});
 $('retry-load').addEventListener('click',load);addEventListener('popstate',()=>{if(projects.length)restore();});addEventListener('pageshow',()=>{if(projects.length)restore();});load();
}
