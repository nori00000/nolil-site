# 놀일 최종 전환 감사 템플릿

이 문서는 운영 배포 후 실제 데이터로 채우는 감사 양식입니다. 현재 수치는 없습니다.

## 감사 전제

- 측정 ID가 발급되어 있고 `config.js`에 입력되어 있어야 합니다.
- 발급 계정·속성·도메인 확인은 `measurement-provisioning.md`에 기록합니다.
- 방문자 동의 전에는 GA4, Clarity, Naver WCS 요청이 없어야 합니다.
- 이벤트 값에는 이름, 전화번호, 이메일, 신청 메시지, 자유 입력 원문이 없어야 합니다.
- 운영 앱의 신청 완료 수치는 홈페이지 클릭 수와 별도로 확인합니다.

## 하드 게이트

| gate | threshold | evidence | result |
| --- | --- | --- | --- |
| 동의 전 분석 요청 | 0 requests | Playwright network log 또는 브라우저 devtools export | PASS (local) |
| 이벤트 PII 포함 | 0 fields | `pii-scan-placeholder.md` 절차 결과 | PASS (homepage local) |
| 모바일 수평 스크롤 | 0 affected required viewports | `npm run test:contract` | PASS (local) |
| 전화 링크 | `tel:01022957100` 유지 | Playwright contract | TBD |
| 무료 CTA 첫 화면 노출 | 360×800, 390×844, 412×915 통과 | Playwright screenshots/contracts | TBD |
| 단체 대관 경로 | 2 clicks 이내 `group.html` 도달 80% 이상 | 사용자 검증 집계 | TBD |
| 무료 상세 도달 | 도움 없이 80% 이상 | 사용자 검증 집계 | TBD |
| 5초 이해도 | 사람·재능·모임 중 두 요소 이상 75% 이상 | 사용자 검증 집계 | TBD |

하나라도 실패하면 배포 홍보 또는 광고 집행 전에 수정합니다.

## 퍼널 집계

| step | event_or_source | count | conversion_from_previous | note |
| --- | --- | ---: | ---: | --- |
| 홈페이지 방문 | `homepage_view` | TBD | TBD | 동의 사용자만 |
| hero 무료 CTA 클릭 | `free_meeting_click` | TBD | TBD | `#ctaHero` 포함 |
| 무료 모임 목록 클릭 | 운영 앱 로그 | TBD | TBD | 앱 데이터 별도 |
| 신청 시작 | 운영 앱 로그 또는 `form_start` | TBD | TBD | 개인정보 원문 제외 |
| 신청 완료 | 운영 앱 로그 또는 `form_submit_success` | TBD | TBD | 개인정보 원문 제외 |
| 단체 문의 클릭 | `group_inquiry_click` | TBD | TBD | 개인 무료 퍼널과 분리 |
| 전화 클릭 | `tel_click` | TBD | TBD | 개인/단체 맥락 분리 필요 |

## 판정

- `pass`: 모든 하드 게이트 통과, 사용자 검증 기준 충족
- `fix-before-traffic`: 기술 게이트는 통과했지만 이해도·첫 클릭 기준 미달
- `block`: 개인정보, 동의 전 요청, 전화 링크, 주요 CTA 소실 중 하나 이상 실패
