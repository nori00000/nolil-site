# 놀일 전환 측정 PII 스캔 절차

현재 상태: 홈페이지 로컬 검증 완료. 실제 참여자 데이터나 운영 앱 export는 이 저장소에 없습니다.

## 목적

홈페이지와 전환 이벤트가 개인 식별 정보를 분석 도구로 보내지 않는지 확인합니다.

## 금지 데이터

- 이름, 전화번호, 이메일
- 신청서 자유 입력 원문
- 카카오톡 ID, 텔레그램 사용자명
- 직장명, 소속 교회명, 세부 주소 등 조합 식별 가능 정보

## 수동 스캔 절차

1. 브라우저 devtools Network 탭을 열고 preserve log를 켭니다.
2. `localStorage.removeItem("nolil_analytics_consent")` 상태에서 `/index.html`을 새로고침합니다.
3. `googletagmanager`, `clarity.ms`, `wcs.naver` 요청이 0건인지 확인합니다.
4. 동의를 `granted`로 설정한 뒤 새로고침합니다.
5. 무료 CTA, 단체 대관, 전화 링크를 각각 한 번 클릭합니다.
6. 분석 요청 payload와 query string에 금지 데이터가 없는지 확인합니다.
7. 신청서가 있는 운영 앱 검증은 별도 export 없이 devtools payload만 확인합니다.

## 결과 기록 양식

| date | tester | environment | consent_before_requests | consent_after_events_checked | pii_found | notes |
| --- | --- | --- | ---: | --- | --- | --- |
| 2026-08-21 | Codex | local Playwright | 0 | homepage allowlist 6종, GA4·Clarity 로드, 거부·철회 | 0 | `npm run test:a11y`: 7 passed. 네이버 WCS는 ID 미발급으로 운영 로드 미검증 |

## 합격 기준

- 동의 전 분석 요청 0건
- 이벤트명, URL path, 집계용 campaign 값 외 개인 식별 정보 0건
- 자유 입력 원문이 분석 도구 payload에 포함된 사례 0건
