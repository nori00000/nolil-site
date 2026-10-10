import {t,lang,prefix,syncLanguageLinks} from './i18n.js';
import {loadProjects,resolveSelection,selectionURL,cardText} from './journey.js';
const $=id=>document.getElementById(id);
const projectSelect=$('project-choice');
if(projectSelect) {
  const roleSelect=$('role-choice'),message=$('selection-message'),note=$('personal-note');
  const notes=new Map();let renderedProject=null;let projects=[],current={},phase='loading',exportGeneration=0;
  const say=value=>{message.textContent=value;};
  const option=(value,label)=>{const node=document.createElement('option');node.value=value;node.textContent=label;return node;};
  const key=()=>current.role?`${current.project.slug}/${current.role.id}`:'';
  function render({project,role,message:notice=''}) {
    exportGeneration++;current={project,role};projectSelect.value=project?.slug||'';
    roleSelect.replaceChildren(option('',project?t('역할을 골라주세요'):t('프로젝트를 먼저 골라주세요')));
    if(project) for(const r of project.roles)roleSelect.append(option(r.id,r.title));
    roleSelect.disabled=!project;roleSelect.value=role?.id||'';
    $('role-title').textContent=role?role.action_label:project?t('나에게 맞는 역할을 골라주세요.'):t('궁금한 일에서 시작해요.');
    $('role-task').textContent=role?.prepare_now||t('프로젝트와 역할을 고르면 지금 혼자 해 볼 준비와 남길 기록을 볼 수 있어요.');
    $('role-details').hidden=!role;$('card-tools').hidden=!role;$('view-card').disabled=!role;
    for(const [id,field] of [['role-experience','experience'],['role-output','personal_output'],['role-question','next_question'],['role-future','task'],['role-bring','bring'],['role-support','support']])$(id).textContent=role?.[field]||'';
    note.value=notes.get(key())||'';$('copy-fallback').hidden=true;$('export-message').textContent='';
    $('role-project-link').href=project?`${prefix}/projects/${project.slug}/`:prefix+'/projects/';
    $('role-project-link').textContent=project?t('출발 자료와 최신화 계획 읽기 →'):t('탐구 살펴보기 →');
    renderChoices();
    say(notice||(role?(lang==='en'?`Selected: ${role.title}.`:`${role.title} 시작을 선택했어요.`):project?t('역할을 선택해 주세요.'):t('궁금한 탐구를 선택해 주세요.')));
  }
  function renderChoices(){
    const pRoot=$('project-options'),rRoot=$('role-options');
    if(!pRoot.children.length)for(const p of projects){
      const button=document.createElement('button');button.type='button';button.dataset.project=p.slug;
      const number=document.createElement('span');number.textContent=p.topic;button.append(number,document.createTextNode(p.entry_verb));pRoot.append(button);
    }
    for(const button of pRoot.children)button.setAttribute('aria-pressed',String(button.dataset.project===current.project?.slug));
    if(renderedProject!==current.project?.slug){
      rRoot.replaceChildren();for(const role of current.project?.roles||[]){const button=document.createElement('button');button.type='button';button.dataset.role=role.id;button.textContent=role.action_label;rRoot.append(button);}
      renderedProject=current.project?.slug;
    }
    for(const button of rRoot.children)button.setAttribute('aria-pressed',String(button.dataset.role===current.role?.id));
    document.querySelector('.participation').classList.toggle('has-selection',Boolean(current.role));
    $('role-choice-section').hidden=!current.project;$('role-preview').hidden=!current.role;$('view-card').hidden=!current.role;
    for(const node of document.querySelectorAll('.select-fallback'))node.hidden=true;
  }
  $('project-options').addEventListener('click',event=>{const button=event.target.closest('button[data-project]');if(button)change(projects.find(p=>p.slug===button.dataset.project));});
  $('role-options').addEventListener('click',event=>{const button=event.target.closest('button[data-role]');if(button)change(current.project,current.project.roles.find(r=>r.id===button.dataset.role));});
  function restore(){if(phase==='ready')render(resolveSelection(projects,location.href,lang));}
  function change(project,role){
    const next=selectionURL(location.href,project,role);
    if(next!==location.href)history.pushState(null,'',next);
    syncLanguageLinks();
    render({project,role});
  }
  projectSelect.addEventListener('change',()=>change(projects.find(p=>p.slug===projectSelect.value)));
  roleSelect.addEventListener('change',()=>change(current.project,current.project?.roles.find(r=>r.id===roleSelect.value)));
  note.addEventListener('input',()=>{if(key())notes.set(key(),note.value);});
  addEventListener('popstate',restore);addEventListener('pageshow',restore);
  $('view-card').addEventListener('click',()=>{$('role-title').focus();$('role-title').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
  async function copy(value,success){
    const generation=exportGeneration;
    $('copy-fallback').hidden=true;
    try {await navigator.clipboard.writeText(value);if(generation!==exportGeneration)return;$('export-message').textContent=success;}
    catch {
      if(generation!==exportGeneration)return;
      $('copy-fallback').hidden=false;$('copy-text').value=value;$('copy-text').focus();$('copy-text').select();
      $('export-message').textContent=t('자동 복사가 되지 않았어요. 아래 선택된 내용을 직접 복사해 주세요.');
    }
  }
  $('copy-card').addEventListener('click',()=>copy(cardText(current.project,current.role,note.value,lang),t('시작 메모를 복사했어요.')));
  $('copy-link').addEventListener('click',()=>copy(selectionURL(location.href,current.project,current.role,true),t('선택 링크를 복사했어요. 내 질문은 링크에 포함되지 않습니다.')));
  $('download-card').addEventListener('click',()=>{
    let url;
    try {
      const blob=new Blob([cardText(current.project,current.role,note.value,lang)],{type:'text/plain;charset=utf-8'});
      url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;
      link.download=`${lang==='en'?'HackerFarm_StartNote':'해커팜_시작메모'}_${current.project.slug}_${current.role.id}_20261010_v07.txt`;
      document.body.append(link);link.click();link.remove();
      $('export-message').textContent=t('파일 저장을 요청했어요. 브라우저 다운로드 목록에서 확인해 주세요.');
    } catch {
      $('copy-fallback').hidden=false;$('copy-text').value=cardText(current.project,current.role,note.value,lang);
      $('copy-text').focus();$('copy-text').select();$('export-message').textContent=t('파일을 만들지 못했어요. 아래 내용을 직접 복사해 주세요.');
    } finally {if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);}
  });
  async function load() {
    phase='loading';projectSelect.disabled=true;roleSelect.disabled=true;$('retry-load').hidden=true;
    $('selection-fields').setAttribute('aria-busy','true');say(t('역할 안내를 불러오는 중입니다.'));
    try {
      projects=await loadProjects(fetch,5000,prefix+'/data/participation.json');
      if(!projects.length){phase='empty';say(t('공개된 프로젝트의 역할 안내를 준비하고 있습니다.'));return;}
      phase='ready';projectSelect.replaceChildren(option('',t('프로젝트를 골라주세요')),...projects.map(p=>option(p.slug,p.title)));
      projectSelect.disabled=false;restore();
    } catch {phase='error';say(t('역할 안내를 불러오지 못했어요. 다시 시도하거나 프로젝트 상세에서 역할을 읽어보세요.'));$('retry-load').hidden=false;}
    finally {$('selection-fields').setAttribute('aria-busy','false');}
  }
  $('retry-load').addEventListener('click',load);$('role-preview').hidden=true;$('role-choice-section').hidden=true;$('view-card').hidden=true;load();
}
