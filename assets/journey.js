import {englishCopy} from './i18n-en.js';
export function validateParticipation(data) {
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const id = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  if (!data || !Array.isArray(data.projects)) throw new Error('invalid data');
  const unique = values => new Set(values).size === values.length;
  if (!unique(data.projects.map(p => p?.slug))) throw new Error('duplicate projects');
  for (const p of data.projects) {
    if (!p || !id(p.slug) || !text(p.title) || !text(p.topic) || !text(p.entry_verb) || !Array.isArray(p.roles) || !p.roles.length || !unique(p.roles.map(r => r?.id))) throw new Error('invalid project');
    for (const r of p.roles) {
      if (!r || !id(r.id) || !['title','task','bring','support','prepare_now','experience','personal_output','next_question','action_label'].every(k => text(r[k]))) throw new Error('invalid role');
    }
  }
  return data.projects;
}
export function resolveSelection(projects, href, lang = 'ko') {
  const params = new URL(href).searchParams;
  const desired = params.get('project');
  const project = projects.find(p => p.slug === desired);
  const role = project?.roles.find(r => r.id === params.get('role'));
  const message = desired && !project ? '선택한 프로젝트를 찾을 수 없어요. 목록에서 다시 골라주세요.' : params.get('role') && !role ? '선택한 역할을 찾을 수 없어요. 프로젝트와 역할을 다시 골라주세요.' : '';
  return {project, role, message:lang==='en'?(englishCopy[message]??message):message};
}
export function selectionURL(href, project, role, share = false) {
  const url = new URL(share ? ((new URL(href).pathname.match(/^\/(en|zh|ja|es|fr)\//)?.[0]||'/')+'start/') : href, href);
  url.searchParams.delete('project');url.searchParams.delete('role');
  if(project) url.searchParams.set('project', project.slug);
  if(role) url.searchParams.set('role', role.id);
  return url.href;
}
export function cardText(project, role, note = '', lang = 'ko') {
  if(lang==='en')return ['Hacker Farm / STUDIO — My starting note','Issued 2026-10-10 · v08','A personal preparation note, not an application or reservation.','',
    `Project: ${project.title}`,`Role: ${role.title}`,`Starting experience: ${role.experience}`,'',
    `Try on your own now: ${role.prepare_now}`,`What to keep: ${role.personal_output}`,`Next question: ${role.next_question}`,
    `My question: ${note.trim().slice(0,500)||'(not written yet)'}`,'',
    `Possible on-site activity (planned): ${role.task}`,`Materials to consider: ${role.bring}`,`Possible support (unconfirmed): ${role.support}`,
    'First-season plan: 12 places, KRW 360,000 per person for 12 weeks, six three-hour sessions. Dates and detailed terms are being prepared; applications and payments are not open.',
    'We are developing a shared farm membership fee model, without property rental revenue.'
  ].join('\n');
  return ['해커팜 — 나의 시작 메모','발행일 2026-10-10 · v08','개인 준비 메모 · 신청·예약이 아닙니다.', '',
    `프로젝트: ${project.title}`,`역할: ${role.title}`,`시작 경험: ${role.experience}`,'',
    `지금 혼자 해 볼 준비: ${role.prepare_now}`,`남길 것: ${role.personal_output}`,`다음 질문: ${role.next_question}`,
    `내 질문: ${note.trim().slice(0,500) || '(아직 적지 않음)'}`,'',
    `향후 현장에서 해 볼 일 (계획): ${role.task}`,`준비물 구상: ${role.bring}`,`지원 구상 (미확정): ${role.support}`,
    '첫 시즌 기준안: 정원 12명, 12주 가입비 36만 원, 3시간씩 6회. 개시일·세부 조건 준비 중. 현재 신청·결제를 받지 않습니다.',
    '공유 농장 회원 가입비 모델을 준비하며 부동산 임대수익을 기반으로 삼지 않습니다.'
  ].join('\n');
}
export async function loadProjects(fetcher = fetch, timeout = 5000, endpoint = '/data/participation.json') {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetcher(endpoint, {credentials:'omit',signal:controller.signal});
        if(!response.ok) throw new Error('data unavailable');
        return validateParticipation(await response.json());
      })(),
      new Promise((_, reject) => {timer=setTimeout(() => {controller.abort();reject(new Error('timeout'));}, timeout);})
    ]);
  } finally {clearTimeout(timer);}
}
