# 놀일 홈페이지 UX·마케팅 개선 계획

## TL;DR
> **Summary**: 홈페이지를 “개인의 무료 모임 신청” 한 경로로 재구성하고, 단체 대관은 기존 `group.html`로 분리한다. 실제 주간 방문자와 최신 UX 도구로 이해도·첫 클릭·신청 성공을 전후 검증한다.
> **Deliverables**: 축소된 홈페이지 IA와 카피, 무료 모임 전용 앱 경로, 단체 대관 메뉴/하단 블록, 일정 단일 진실원천, 개인정보 안전한 측정, 실제 사용자 검증 보고서
> **Effort**: Large
> **Parallel**: YES — 4 waves
> **Critical Path**: 기준선/IA 확정 → 앱 무료 필터 + 홈페이지 개편 → 측정/QA → 실제 사용자 재검증

## Context

### Original Request
- 2026-08-21까지의 최신 UI/UX 분석 도구를 조사하고 놀일의 본래 목표가 사용자에게 전달되도록 구체적인 개선 방안을 수립한다.
- 홈페이지의 최우선 전환은 개인 사용자의 무료 모임 신청이다.
- 단체 대관은 별도 상단 메뉴와 홈페이지 하단 영역에서 기존 단체 페이지로 분기한다.
- 매주 오는 실제 사용자를 검증에 활용한다.

### Grounded Product Intent
- 브랜드 선언: 공간보다 사람이 중심이며, 혼자 있으면 취미로 끝나는 재능을 사람·모임·콘텐츠·작은 일로 연결한다. 근거: `stories/why-nolil.html:81-91`.
- 핵심 대상: 퇴직 후 첫 프로젝트를 찾는 사람, 손의 재능을 사람 만나는 일로 바꾸려는 사람, 사람의 이야기를 기록하려는 사람. 근거: `stories/people-we-wait.html`.
- 진입 방식: 무료 모임에서 얼굴을 먼저 보고 잘하는 것 하나를 한 줄로 꺼낸다. 근거: `stories/why-nolil.html:88-89`.
- 공개 UX 원칙: 현재 단계, 다음 행동 하나, 개인정보 경계를 보여준다. 근거: `/Users/leesangmin/Projects/worktrees/nolil-community-meeting-polls/omx_wiki/participant-journey-ux-hardening-2026-07-25.md:15-17`.

### Current Evidence
- 모바일 홈페이지는 약 47,000px, 16개 섹션, 49개 링크이며 길드 섹션은 약 22,173px 뒤에 시작한다.
- 홈페이지 `config.js`의 fallback 일정은 끝났기 때문에 “다음 모임 준비 중”으로 보이지만 운영 앱에는 8월 21일~9월 14일 실제 일정이 있다.
- `무료로 한번 와보기`는 일반 모임 목록으로 이동하며 첫 두 카드가 39,000원·10,000원이고 무료 오픈데이는 세 번째다.
- 기존 `group.html`은 B2B 카피, 전화 CTA, JSON-LD를 이미 갖춘 완성된 단체 페이지다. 새 페이지를 만들지 않는다.
- 정적 저장소에는 `package.json`, Playwright 설정, 자동 테스트 러너가 없다. 새 dependency 없이 정적 검사와 cmux 브라우저를 기본 검증 표면으로 삼는다.

### Latest Tool Research — 2026-08-21
- **cmux Browser**: 데스크톱·모바일 viewport, 스냅샷, 클릭, 스크린샷, 콘솔 오류를 현재 환경에서 바로 검증한다.
- **Lighthouse / PageSpeed Insights**: 성능·접근성·SEO 기준선. PSI는 lab과 field data를 구분한다. [공식 문서](https://developers.google.com/speed/docs/insights/v5/about)
- **Accessibility Insights FastPass**: 5분 자동 검사와 tab-stop 보조 검사. 새 저장소 dependency가 없다. [공식 문서](https://accessibilityinsights.io/docs/web/getstarted/fastpass/)
- **Lyssna**: 첫 인상의 의도 전달은 5초 테스트, CTA 직관성은 첫 클릭 테스트로 검증한다. [5초 테스트](https://help.lyssna.com/en/articles/4952945-five-second-test-sections), [첫 클릭 테스트](https://www.lyssna.com/guides/first-click-testing/)
- **Microsoft Clarity**: 모바일 heatmap, scroll depth, dead/rage click, session replay, LCP·INP·CLS 필터. 입력값은 기본 마스킹되지만 연속 여정/replay에는 관할별 동의와 정책 고지가 필요하다. [공식 문서](https://learn.microsoft.com/en-us/clarity/), [마스킹](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking), [FAQ](https://learn.microsoft.com/en-us/clarity/faq/)
- **GA4**: key event와 최대 10단계 funnel로 홈페이지→모임목록→상세→신청을 측정한다. [Funnel exploration](https://support.google.com/analytics/answer/9327974), [lead form 측정](https://support.google.com/analytics/answer/12944921)
- **보류**: Hotjar/Contentsquare는 Clarity와 중복, PostHog는 현재 정적 랜딩에 과함, BackstopJS·axe Playwright 패키지는 새 dependency가 필요, 유료 A/B 도구는 현재 표본 규모에서 통계적 가치가 낮다.

### Metis Review — Resolved Gaps
- `group.html`을 재사용하고 공개 메뉴명은 사용자의 표현을 따라 **단체 대관 문의**로 고정한다.
- hero에는 무료 모임 CTA 하나만 둔다. 단체 대관은 상단 메뉴와 하단 B2B 블록에만 둔다.
- 실제 사용자 표본은 기존 참가자만 쓰지 않고, 이번 주 첫 방문자/아직 신청하지 않은 잠재 참가자를 포함해 친숙성 편향을 기록한다.
- Clarity·GA4는 계정 ID, 개인정보 고지, 동의/마스킹 검토가 모두 끝나기 전에는 활성화하지 않는다.
- 운영 앱 변경은 별도 Rails 저장소의 전용 worktree에서 수행하고, 정적 사이트 worktree와 커밋을 섞지 않는다.
- 일정·팀 수·가격·잔여석 등 사실 주장은 운영 앱을 단일 진실원천으로 삼고 정적 fallback을 사람이 갱신하는 구조로 남기지 않는다.

## Work Objectives

### Core Objective
처음 온 개인이 모바일 첫 화면에서 5초 안에 “놀일은 내 경험과 재능을 사람·모임·작은 일로 연결하는 농장 커뮤니티”라고 이해하고, 다른 제안에 방해받지 않고 가까운 무료 모임을 찾아 신청하게 한다.

### Deliverables
- 홈페이지 섹션을 9개 이하로 축소한 단일 여정 IA
- hero의 단일 primary CTA와 한국어 핵심 가치 제안
- 기존 `group.html`로 연결되는 데스크톱·모바일 상단 메뉴 및 하단 B2B 블록
- 운영 앱의 무료 모임 필터/전용 목록 경로
- 홈페이지 일정과 운영 앱 사이의 진실원천 통합
- GA4 event taxonomy, Clarity 설정, 개인정보 고지 및 fail-closed 활성화
- 390×844, 768×1024, 1440×1000 브라우저 증거
- 5~8명 실제 사용자 전후 비교 보고서

### Definition of Done
- 모바일 첫 화면에는 primary CTA가 정확히 하나이며 문구는 `가까운 무료 모임 보기`다.
- 상단 메뉴의 `단체 대관 문의`와 하단 B2B 블록만 `group.html`을 주 경로로 노출한다.
- 홈페이지에서 `다음 모임 준비 중`이 표시되는 동안 운영 앱에 미래 무료 모임이 존재하는 불일치가 없다.
- 무료 CTA 도착 화면의 첫 상품은 미래 무료 모임이며 URL로 무료 필터 상태를 재현할 수 있다.
- 홈페이지는 9개 이하의 top-level section, 25개 이하의 사용자 노출 링크, 8,000자 이하의 main text를 유지한다.
- 5초 테스트 참가자의 75% 이상이 사람·재능·모임 중 2개 이상을 포함해 놀일을 설명한다.
- 첫 클릭 테스트 참가자의 80% 이상이 무료 모임 CTA를 선택한다.
- 무료 모임 찾기 과업 참가자의 80% 이상이 도움 없이 무료 모임 상세에 도달한다.
- 단체 대관 찾기 과업 참가자의 80% 이상이 2회 이내 클릭으로 `group.html`에 도달한다.
- Lighthouse mobile accessibility 95 이상, SEO 95 이상, Best Practices 90 이상을 달성한다. Performance는 기준선 대비 하락하지 않고 LCP/CLS/INP 원인을 기록한다.
- 키보드로 모든 메뉴와 CTA에 접근 가능하고, focus가 보이며, 모바일 고정 CTA가 본문을 가리지 않는다.
- `node --check config.js`, JSON-LD parse, `xmllint --noout sitemap.xml`, `git diff --check`, 로컬 HTTP 주요 URL 200 검사가 통과한다.

### Must Have
- 정확한 주소와 공식 전화번호 및 `tel:01022957100` 유지
- `Organization`/`LocalBusiness` JSON-LD 전화 `+821022957100` 유지
- 실제 농장·사람 사진과 50·60대 가독성 원칙 유지
- 신규 사용자에게 무료 모임을 첫 진입으로 제시
- 단체 대관의 매출 경로를 독립적으로 유지
- 데이터 수집 전 개인정보 고지·동의·마스킹 확인
- 각 저장소마다 별도 전용 worktree와 Lore 커밋 사용

### Must NOT Have
- 새 단체 페이지 생성 또는 기존 `group.html`과 중복되는 B2B URL
- hero에 단체 대관, AI 캠프, 1:1 상담, 편지 구독 CTA를 동급 노출
- 운영 앱과 별도로 관리하는 정적 날짜 목록
- 좌표·우편번호 등 확인되지 않은 장소 정보 추정
- 신청자 전화 placeholder를 공식 번호로 교체
- 새 dependency, 유료 A/B 플랫폼, Hotjar/PostHog 중복 도입
- 분석 ID가 없거나 동의 조건이 충족되지 않았는데 tracking script 로드
- 계획 승인 전 push, merge, deploy

## Verification Strategy
> 자동/도구 검증과 실제 사용자 검증을 분리한다. 실제 사용자 응답에는 이름·전화번호를 저장하지 않고 참가자 코드는 `E01`(기존), `N01`(신규/잠재)처럼 기록한다.

- Test decision: tests-after. 정적 저장소는 기존 도구만 사용하고 새 test dependency를 만들지 않는다. Rails 앱 변경은 기존 Rails controller/system test를 사용한다.
- Browser QA: cmux Browser에서 390×844, 768×1024, 1440×1000 viewport.
- Accessibility: Accessibility Insights FastPass + 키보드 순회; 자동화 추가가 승인될 때만 axe 도입을 별도 검토한다.
- Performance: Lighthouse/PSI baseline과 post-change를 동일 조건으로 저장한다.
- User research: 5~8명, 가능하면 기존 참가자 3~4명 + 첫 방문자/잠재 참가자 3~4명. 녹화는 별도 동의가 있을 때만 하며 기본은 비녹화·익명 메모다.
- Evidence directory: `evidence/nolil-ux-2026-08/` 아래 task별 JSON, PNG, Markdown을 저장하되 개인정보는 저장하지 않는다.

## Execution Strategy

### Parallel Execution Waves
- Wave 1: 기준선·사용자 테스트 프로토콜·새 IA/카피 결정
- Wave 2: Rails 무료 모임 경로, 홈페이지 재구성, B2B 경로 정리
- Wave 3: 일정 진실원천, 개인정보/계측, 접근성·성능 보정
- Wave 4: 실제 사용자 재검증, 결함 수정, 최종 감사

### Dependency Matrix
| Task | Depends on | Blocks |
|---|---|---|
| 1 | — | 2, 4, 8 |
| 2 | 1 | 3, 4, 5 |
| 3 | 2 | 4, 6, 8 |
| 4 | 2, 3 | 6, 7, 8 |
| 5 | 2 | 7, 8 |
| 6 | 3, 4 | 8 |
| 7 | 4, 5 | 8 |
| 8 | 4, 5, 6, 7 | Final Verification |

## TODOs

- [ ] 1. 현재 기준선과 실제 사용자 테스트 프로토콜 고정

  **What to do**: 현재 홈페이지와 운영 앱을 동일 날짜에 캡처한다. 모바일/데스크톱 첫 화면, 전체 섹션 위치, 링크·문자 수, 무료 CTA 도착 순서, Lighthouse/PSI, 접근성 FastPass 결과를 기록한다. 기존 참가자와 첫 방문자를 구분하는 5초 회상·첫 클릭·무료 모임 찾기·단체 대관 찾기 과업 스크립트와 익명 기록표를 만든다.

  **Must NOT do**: 참가자 이름·전화·음성·영상을 기본 수집하지 않는다. 현재 화면의 문제를 참가자에게 먼저 설명하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 2, 4, 8 | Blocked By: none

  **References**:
  - Product intent: `stories/why-nolil.html:81-91`
  - UX principle: `/Users/leesangmin/Projects/worktrees/nolil-community-meeting-polls/omx_wiki/participant-journey-ux-hardening-2026-07-25.md:15-17`
  - External: [Lyssna five-second tests](https://help.lyssna.com/en/articles/4952945-five-second-test-sections)

  **Acceptance Criteria**:
  - [ ] `evidence/nolil-ux-2026-08/baseline/`에 세 viewport PNG, Lighthouse 결과, 섹션/링크/문자 통계가 있다.
  - [ ] `evidence/nolil-ux-2026-08/user-test-protocol.md`에 중립적 과업, 동의 문구, 익명화 방식, 성공 판정이 있다.
  - [ ] baseline 참가자가 확보되면 5명 이상 결과를 기록하고, 미확보 시 프로토콜 완료와 모집 상태를 명시한다.

  **QA Scenarios**:
  ```
  Scenario: 현재 무료 CTA 경로
    Tool: cmux browser
    Steps: 390×844에서 홈을 열고 hero primary CTA를 클릭해 첫 세 카드의 가격과 순서를 기록
    Expected: 현재 상태가 재현되고 무료 항목의 실제 위치가 증거에 남음
    Evidence: evidence/nolil-ux-2026-08/baseline/free-cta-path.md

  Scenario: 개인정보 비수집
    Tool: rg
    Steps: evidence 디렉터리에서 전화번호·이메일 패턴 검색
    Expected: 실제 참가자 PII 0건
    Evidence: evidence/nolil-ux-2026-08/baseline/pii-scan.txt
  ```

  **Commit**: YES | Message: Lore 형식의 UX 기준선 기록 커밋 | Files: evidence 문서만

- [x] 2. 홈페이지의 단일 사용자 여정과 확정 카피 작성

  **What to do**: top-level section을 아래 9개로 고정한다: `(1) hero`, `(2) 실제 사람/증거`, `(3) 무료로 시작하는 3단계`, `(4) 가까운 무료 모임`, `(5) 기다리는 사람 3유형`, `(6) 재능이 모임·콘텐츠·일로 자라는 경로`, `(7) 실제 공간·접근 정보`, `(8) 단체 대관 B2B 블록`, `(9) 연락처/footer`. 온라인 AI 프로그램 8개, 상세 길드 가격표, 채널 모음, 중복 CTA는 홈에서 제거하거나 별도 기존 페이지로 이동·연결한다.

  **Copy decision**:
  - Eyebrow: `일산의 재능 길드하우스`
  - H1: `혼자 있으면 취미인 재능을, 사람과 만나 작은 일로.`
  - Subcopy: `놀일은 평생 쌓은 경험을 꺼내 함께 모임을 열고, 기록과 콘텐츠로 키우는 농장 커뮤니티입니다.`
  - Primary CTA: `가까운 무료 모임 보기`
  - Nav: `무료 모임`, `놀일은`, `공간·오시는 길`, `단체 대관 문의`
  - B2B heading: `교회·회사·모임이 함께 보낼 하루를 찾고 있나요?`

  **Must NOT do**: `PLAY WORK GROW`를 H1로 유지하지 않는다. `무료`, `단체`, `AI`, `길드 회비`를 같은 위계로 놓지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 4, 5 | Blocked By: 1

  **References**:
  - Design system: `DESIGN.md`
  - Current hero/nav: `index.html:1012-1031`
  - Target people: `stories/people-we-wait.html`
  - Guild concepts: `index.html:1217-1376`, `rules.html`

  **Acceptance Criteria**:
  - [ ] IA 문서에 각 섹션의 사용자 질문, 핵심 증거, 단일 다음 행동이 정의됨.
  - [ ] 기존 모든 섹션이 keep/merge/demote/remove 중 하나로 매핑됨.
  - [ ] 카피가 “누구·문제·방법·결과” 네 요소를 첫 화면 안에서 답함.

  **QA Scenarios**:
  ```
  Scenario: 5초 메시지 이해
    Tool: Lyssna 방식 또는 대면 5초 테스트
    Steps: 모바일 hero만 5초 노출 후 “무슨 곳인가, 누구를 위한가, 무엇을 하면 되는가” 질문
    Expected: 75% 이상이 사람·재능·모임 중 2개 이상과 무료 모임 행동을 회상
    Evidence: evidence/nolil-ux-2026-08/ia/hero-five-second.md

  Scenario: 단체 경로 비침범
    Tool: 문서 검사
    Steps: hero와 첫 3개 section의 CTA inventory 작성
    Expected: primary CTA는 무료 모임 1개, 단체 CTA는 상단 nav 외에 없음
    Evidence: evidence/nolil-ux-2026-08/ia/cta-inventory.json
  ```

  **Commit**: YES | Message: Lore 형식의 IA 결정 기록 커밋 | Files: 계획/증거 문서

- [x] 3. 운영 앱에 무료 모임 전용 목록 경로 추가

  **What to do**: Rails 저장소의 별도 전용 worktree에서 `GET /meetings?price=free`를 지원한다. `MeetingsController#index`가 `Meeting.open.upcoming`에 `price: 0` 필터를 적용하고 잘못된 filter 값은 전체 목록 또는 명시된 안전 기본값으로 처리한다. 페이지 제목과 설명을 `무료로 처음 와보기` 맥락으로 바꾸고 미래 무료 일정이 날짜순으로 먼저 보이게 한다.

  **Must NOT do**: 기존 `/meetings` 전체 목록 순서를 임의로 바꾸거나 유료 프로그램을 삭제하지 않는다. 정적 사이트 저장소에서 Rails 파일을 수정하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 6, 8 | Blocked By: 2

  **References**:
  - Controller: `/Users/leesangmin/Projects/worktrees/nolil-community-meeting-polls/app/controllers/meetings_controller.rb:1-4`
  - View: `/Users/leesangmin/Projects/worktrees/nolil-community-meeting-polls/app/views/meetings/index.html.erb:1-7`
  - Existing tests: `/Users/leesangmin/Projects/worktrees/nolil-community-meeting-polls/test/controllers/meetings_controller_test.rb:1-18`

  **Acceptance Criteria**:
  - [ ] `/meetings?price=free`는 열린 미래 `price=0` 모임만 날짜순 표시.
  - [ ] `/meetings`의 기존 전체 목록 동작은 회귀하지 않음.
  - [ ] 필터 결과가 없으면 “현재 신청 가능한 무료 모임이 없습니다”와 전체 모임 보기 행동을 표시.
  - [ ] controller test에 무료/유료 혼합, 결과 없음, 잘못된 filter 케이스 포함.

  **QA Scenarios**:
  ```
  Scenario: 무료 목록
    Tool: Rails test + local HTTP
    Steps: 무료·유료 미래 fixture로 price=free 요청
    Expected: 무료 모임만 200 응답에 존재하고 유료 제목은 없음
    Evidence: evidence/nolil-ux-2026-08/app/free-filter.txt

  Scenario: 무료 일정 없음
    Tool: Rails test
    Steps: 모든 무료 모임을 닫거나 과거로 만든 뒤 요청
    Expected: 빈 상태와 전체 모임 링크가 보이며 200
    Evidence: evidence/nolil-ux-2026-08/app/free-filter-empty.txt
  ```

  **Commit**: YES | Message: Lore 형식의 무료 모임 진입 경로 커밋 | Files: Rails controller/view/test

- [x] 4. 홈페이지를 9개 섹션 이하의 개인 중심 구조로 재구성

  **What to do**: Task 2 카피와 순서로 `index.html`을 재구성한다. hero primary CTA는 `https://app.playworkgrow.club/meetings?price=free`로 연결한다. 실제 사람 사례를 첫 세 섹션 안으로 올리고, 프로그램 카탈로그는 “지금 열리는 무료 모임” 중심의 간결한 카드로 대체한다. 길드 사다리는 가격표 전체가 아니라 `방문 → 대화 → 작은 실험 → 모임 열기 → 함께 일하기` 변화 경로로 요약하고 상세 규약 링크로 넘긴다.

  **Must NOT do**: 실제 후기·수입·성과를 창작하지 않는다. 기존 프로그램 페이지를 삭제하지 않는다. 정확한 주소·전화·JSON-LD를 훼손하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6, 7, 8 | Blocked By: 2, 3

  **References**:
  - Main page: `index.html`
  - Tokens: `tokens.css`
  - Design constraints: `DESIGN.md`
  - Contact truth: `config.js:1-38`, `index.html:1475-1481`

  **Acceptance Criteria**:
  - [ ] top-level section ≤9, visible link ≤25, main text ≤8,000자.
  - [ ] 첫 viewport에 대상·변화·방법·무료 CTA가 보임.
  - [ ] hero primary CTA 정확히 1개; secondary text link도 첫 viewport에는 없음.
  - [ ] 실제 사진, 본문 17px 원칙, reduced-motion 동작 유지.
  - [ ] 390px에서 수평 스크롤 0, 고정 UI가 본문/CTA를 가리지 않음.

  **QA Scenarios**:
  ```
  Scenario: 모바일 핵심 여정
    Tool: cmux browser
    Steps: 390×844 홈 로드 → hero 확인 → primary CTA 클릭 → 무료 목록 확인
    Expected: 한 CTA가 보이고 무료 모임 목록으로 도달
    Evidence: evidence/nolil-ux-2026-08/home/mobile-primary-path.png

  Scenario: 콘텐츠 과밀 회귀
    Tool: browser eval + Node
    Steps: section/link/mainText 수 집계
    Expected: 각각 ≤9/≤25/≤8000
    Evidence: evidence/nolil-ux-2026-08/home/content-budget.json
  ```

  **Commit**: YES | Message: Lore 형식의 개인 무료 모임 중심 홈 개편 커밋 | Files: `index.html`, 필요 시 기존 CSS 자산

- [x] 5. 단체 대관을 독립 보조 여정으로 정리

  **What to do**: desktop/mobile 상단 nav에 `단체 대관 문의`를 넣고 `group.html`로 연결한다. homepage 하단 contact 앞에 B2B 블록 하나를 두고 대상, 수용 인원, 가격 시작점, 문의 행동만 요약한다. `group.html`은 중복 홈 설명을 제거하고 단체 담당자의 질문인 인원, 구성, 우천, 주차, 비용, 연락처가 빠르게 보이도록 정리한다.

  **Must NOT do**: 새 B2B HTML 페이지나 별도 canonical URL을 만들지 않는다. hero에 B2B 버튼을 추가하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7, 8 | Blocked By: 2

  **References**:
  - Existing B2B page: `group.html`
  - Current homepage B2B duplication: `index.html:1037-1048`, `index.html:1386-1391`
  - Sitemap entry: `sitemap.xml`

  **Acceptance Criteria**:
  - [ ] desktop/mobile에서 `단체 대관 문의`가 2회 이내 클릭으로 `group.html` 도달.
  - [ ] homepage의 B2B 설명 블록은 1개뿐이고 primary 무료 CTA와 시각적으로 경쟁하지 않음.
  - [ ] `group.html`의 전화 링크, 주소, JSON-LD, canonical 유지.

  **QA Scenarios**:
  ```
  Scenario: 단체 담당자 경로
    Tool: cmux browser 390×844 및 1440×1000
    Steps: 상단 nav에서 단체 대관 문의 선택
    Expected: group.html로 이동하고 인원·가격·문의 수단이 첫 두 viewport 안에 보임
    Evidence: evidence/nolil-ux-2026-08/b2b/group-path.png

  Scenario: 중복 URL 방지
    Tool: rg + sitemap parse
    Steps: group 관련 canonical과 sitemap URL 검사
    Expected: 공식 B2B URL은 `/group.html` 하나
    Evidence: evidence/nolil-ux-2026-08/b2b/url-audit.txt
  ```

  **Commit**: YES | Message: Lore 형식의 단체 대관 보조 경로 커밋 | Files: `index.html`, `group.html`, 필요 시 `sitemap.xml`

- [x] 6. 운영 앱을 일정·가격·잔여석의 단일 진실원천으로 연결

  **What to do**: `config.js`의 수동 `fallbackSchedule`을 사용자에게 “실제 일정”으로 표시하는 경로에서 제거한다. 홈페이지는 무료 필터 URL로 이동하는 단일 카드 또는 앱이 제공하는 안전한 공개 데이터가 이미 있을 때만 최신 일정 미리보기를 렌더한다. 데이터 조회가 실패하면 “일정 페이지에서 확인”으로 fail-safe하고 “준비 중”이라고 사실을 단정하지 않는다.

  **Must NOT do**: CORS/공개 API를 추정하거나 화면 scraping을 추가하지 않는다. 정적 날짜를 복제하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 8 | Blocked By: 3, 4

  **References**:
  - Static fallback: `config.js:47-63`, `index.html:1580-1599`
  - Rails source: `/Users/leesangmin/Projects/worktrees/nolil-community-meeting-polls/app/controllers/meetings_controller.rb`

  **Acceptance Criteria**:
  - [ ] 저장소에 사용자 노출용 미래 일정 날짜 중복 목록이 없음.
  - [ ] 앱에 무료 일정이 있으면 CTA 도착 후 그 일정이 첫 항목으로 보임.
  - [ ] 앱 오류/빈 상태에도 거짓 `준비 중` 메시지 없이 명시적 일정 페이지 링크 제공.

  **QA Scenarios**:
  ```
  Scenario: 일정 존재
    Tool: local HTTP + cmux browser
    Steps: 미래 무료 meeting fixture 상태에서 홈→무료 목록 이동
    Expected: 동일 날짜·가격이 앱에서만 렌더됨
    Evidence: evidence/nolil-ux-2026-08/schedule/live-source.md

  Scenario: 앱/목록 빈 상태
    Tool: browser/fixture
    Steps: 무료 일정 0건 상태 재현
    Expected: 빈 상태 안내와 전체 목록 링크, 잘못된 예정 날짜 없음
    Evidence: evidence/nolil-ux-2026-08/schedule/empty-state.png
  ```

  **Commit**: YES | Message: Lore 형식의 일정 진실원천 통합 커밋 | Files: `config.js`, `index.html`, 필요한 Rails 변경

- [ ] 7. 개인정보 안전한 행동 측정과 전환 funnel 구성

  **What to do**: `privacy.html`에 GA4·Clarity의 목적, 수집 범주, 보존/거부 방식, 문의처를 명시한다. `config.js`의 fail-closed 패턴을 유지하며 Clarity ID와 consent 상태가 모두 있을 때만 로드한다. GA4 이벤트를 `view_home`, `select_free_meeting`, `view_free_meetings`, `select_meeting`, `begin_registration`, `generate_lead`, `select_group_inquiry`, `click_phone`으로 고정하고 PII를 parameter로 보내지 않는다. 정적 사이트와 Rails 앱이 같은 측정 속성/도메인 정책을 사용할지 문서화한다.

  **Must NOT do**: 전화번호, 이름, 메모, URL query의 개인정보를 GA4/Clarity custom tag로 보내지 않는다. ID가 없으면 외부 script를 로드하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 8 | Blocked By: 4, 5

  **References**:
  - Existing loader: `config.js:65-112`
  - Privacy page: `privacy.html`
  - External: [GA4 recommended events](https://support.google.com/analytics/answer/9267735), [Clarity masking](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking)

  **Acceptance Criteria**:
  - [ ] analytics ID/consent가 없을 때 GA4·Clarity network 요청 0건.
  - [ ] consent 후 테스트 이벤트가 DebugView/Clarity에 중복 없이 1회 기록.
  - [ ] event parameter allowlist에 PII가 없고 URL query 정제 규칙 존재.
  - [ ] privacy 문구와 실제 로더 동작이 일치.

  **QA Scenarios**:
  ```
  Scenario: 동의 전 fail-closed
    Tool: cmux browser console/network 가능한 범위 + DOM script 검사
    Steps: 빈 ID/미동의 상태로 홈 로드
    Expected: googletagmanager/clarity script 0개
    Evidence: evidence/nolil-ux-2026-08/analytics/fail-closed.json

  Scenario: PII 누출 방지
    Tool: static scan + test event capture
    Steps: 이벤트 코드와 전송 parameter에서 phone/name/note/email 검색
    Expected: PII parameter 0건
    Evidence: evidence/nolil-ux-2026-08/analytics/pii-audit.txt
  ```

  **Commit**: YES | Message: Lore 형식의 개인정보 안전 측정 커밋 | Files: `config.js`, `privacy.html`, CTA event hooks

- [ ] 8. 실제 사용자 재검증과 최종 전환 감사

  **What to do**: 변경 화면을 기존 참가자와 첫 방문자/잠재 참가자 총 5~8명에게 동일 프로토콜로 테스트한다. 5초 회상, 무료 모임 첫 클릭, 무료 일정 찾기, 단체 대관 찾기, “왜 돈을 낼 수/없는가” 짧은 인터뷰를 실시한다. 기준 미달 항목은 한 번에 한 가설만 수정하고 cmux Browser/정적 검사를 재실행한다.

  **Must NOT do**: 친분 있는 기존 사용자만으로 “신규 사용자 이해도”를 단정하지 않는다. 긍정 응답만 선별하지 않는다. 참가자 PII를 repo에 저장하지 않는다.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: Final Verification | Blocked By: 4, 5, 6, 7

  **References**:
  - Baseline protocol from Task 1
  - Homepage acceptance thresholds in Definition of Done
  - External: [Lyssna first-click testing](https://www.lyssna.com/guides/first-click-testing/)

  **Acceptance Criteria**:
  - [ ] 참가자 5~8명, 기존/신규 segment가 결과에 구분됨.
  - [ ] 5초 이해도 ≥75%, 무료 CTA first-click ≥80%, 두 findability 과업 ≥80%.
  - [ ] 각 실패는 관찰 사실·사용자 발화 요약·해석·수정 가설로 분리됨.
  - [ ] 전후 비교 보고서에 기준선, 결과, 남은 위험, 다음 측정일이 있음.

  **QA Scenarios**:
  ```
  Scenario: 개인 무료 모임 여정
    Tool: 실제 모바일 또는 cmux mobile viewport
    Steps: “무료로 처음 방문할 날짜를 찾아 신청 직전까지 가세요” 과업
    Expected: 80% 이상이 도움 없이 무료 상세까지 도달
    Evidence: evidence/nolil-ux-2026-08/user-test/free-meeting-results.md

  Scenario: 보조 B2B 여정
    Tool: 실제 모바일 또는 cmux mobile viewport
    Steps: “15명 회사 모임을 문의하려면 어디로 가겠습니까” 과업
    Expected: 80% 이상이 2회 이내 클릭으로 group.html 도달; 무료 CTA와 혼동하지 않음
    Evidence: evidence/nolil-ux-2026-08/user-test/group-results.md
  ```

  **Commit**: YES | Message: Lore 형식의 사용자 검증 결과 커밋 | Files: 익명 evidence와 최종 수정 파일

## Final Verification Wave

1. 두 저장소가 각각 전용 worktree인지 확인하고 원본 폴더 수정이 없는지 검증한다.
2. 정적 사이트에서 `git diff --check`, `node --check config.js`, JSON-LD `JSON.parse`, sitemap `xmllint`, 내부 링크와 tel 링크 검사를 실행한다.
3. Rails 앱에서 `meetings_controller_test`, 관련 system/controller tests, 전체 Rails test, RuboCop/Brakeman의 저장소 기존 명령을 실행한다.
4. 로컬 HTTP에서 `/`, `/group.html`, `/privacy.html`, `/meetings`, `/meetings?price=free`가 200인지 확인한다.
5. cmux Browser 390×844, 768×1024, 1440×1000에서 hero, mobile nav, 무료 CTA, B2B nav, contact, empty state를 캡처한다.
6. Lighthouse/PSI와 Accessibility Insights 결과를 baseline과 비교한다.
7. `rg`로 정적 날짜, 중복 B2B URL, 잘못된 전화, PII analytics parameter, 빈/중복 CTA를 감사한다.
8. 변경 파일과 diff를 사람이 읽을 수 있는 단위로 검토하고 저장소별 Lore 커밋을 만든다.
9. push/merge/deploy는 별도 사용자 지시가 있을 때만 수행한다. 배포 시 정적 사이트와 Rails 앱 순서를 기록하고, 무료 필터 앱 경로를 먼저 배포한 뒤 홈페이지 CTA를 배포한다.

## Success Metrics After Release
- 7일/최소 100 homepage sessions 중 먼저 충족되는 시점에 1차 검토. 트래픽이 100 미만이면 기간을 28일까지 연장하고 성급한 비율 결론을 내리지 않는다.
- Primary funnel: `view_home → select_free_meeting → view_free_meetings → select_meeting → begin_registration → generate_lead`.
- 보조 funnel: `view_home → select_group_inquiry → click_phone 또는 group lead`.
- 정성 지표: “농장 대관”만 회상한 비율, “재능·사람·모임” 회상률, 지불 의사 저해 이유 상위 3개.
- 수치 목표는 baseline 수집 후 확정하되, 이벤트 누락률 0%, 일정 불일치 0건, dead/rage click 상위 영역의 재현 가능한 원인 100% 분류를 먼저 달성한다.

## Rollback and Release Guardrails
- 각 저장소 커밋은 독립적으로 되돌릴 수 있게 분리한다.
- 앱의 무료 필터 경로가 운영에서 200과 올바른 결과를 반환하기 전 홈페이지 CTA를 그 URL로 전환하지 않는다.
- analytics는 config ID 제거만으로 즉시 fail-closed할 수 있어야 한다.
- 사용자 검증 기준이 크게 미달하면 기존 페이지 전체를 되돌리기보다 hero/CTA/section ordering 커밋을 단위별로 되돌린다.
