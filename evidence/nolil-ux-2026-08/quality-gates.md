# 놀일 품질 게이트

## 기준 변경

Lighthouse 점수는 기술 품질의 보조 지표입니다. 홈페이지 합격은 다음 네 층을 함께 통과해야 합니다.

1. 고정 모바일·태블릿·데스크톱 실제 화면
2. 레이아웃·이미지·CTA 계약
3. 실제 사용자 이해도와 첫 클릭
4. 동의와 masking을 지킨 행동 데이터

## 필수 화면 매트릭스

| 화면 | 뷰포트 | 필수 확인 |
|---|---:|---|
| 홈 | 360×800 | 수평 스크롤, 제목, 무료 CTA |
| 홈 | 390×844 | hero 이미지, CTA, 다음 섹션 힌트 |
| 홈 | 412×915 | 고정 CTA와 채팅 위젯 겹침 |
| 홈 | 768×1024 | 카드·메뉴 재배치 |
| 홈 | 1440×900 | 개인 무료 경로와 단체 경로의 위계 |
| 단체 문의 | 390×844 | 모바일 첫 화면과 전화 CTA |
| 무료 모임 | 실제 앱 화면 | 무료 필터와 신청 첫 행동 |

## 레이아웃 계약

- `scrollWidth`는 viewport width를 넘지 않는다.
- 모바일 hero는 이미지가 첫 화면을 독점하지 않는다.
- 핵심 피사체가 잘리지 않는다.
- 핵심 사진의 `cover` 사용은 의도된 crop과 `object-position`을 가진다.
- 무료 모임 CTA가 첫 화면 또는 첫 자연 스크롤에 노출된다.
- 단체 대관 CTA는 보조 경로로 분리되고 개인 무료 CTA를 가리지 않는다.
- 전화 링크는 `href="tel:01022957100"`을 유지한다.
- 모바일 고정 CTA와 방문자 채팅 launcher/panel은 겹치지 않는다.
- 모든 주요 이미지가 로드되고 alt 텍스트가 있다.

## 검증 계층

### 브라우저·시각

Playwright `toHaveScreenshot()`을 1차 자동화 후보로 사용합니다. 처음에는 actual/expected/diff를 리뷰 아티팩트로 남기고, baseline이 안정된 뒤 홈 hero·무료 CTA·단체 문의만 required check로 올립니다.

### 기술·접근성

Lighthouse CI는 성능·SEO·Best Practices·접근성 예산을 검사합니다. axe 또는 Accessibility Insights는 레이블·대비·focus·semantic 문제를 검사합니다. 이 두 도구는 이미지 구도와 구매 의사를 판정하지 않습니다.

### 사용자

5초 테스트와 첫 클릭 테스트를 기존 사용자와 처음 보는 사용자로 나누어 실행합니다.

- “이 사이트는 무엇을 하는가?”
- “무료로 처음 와보려면 어디를 누르는가?”
- “단체 대관을 문의하려면 어디를 누르는가?”
- “비용과 다음 행동이 충분히 명확한가?”

### 행동 데이터

동의 전에는 분석 스크립트를 로드하지 않습니다. 식별정보를 이벤트 값으로 보내지 않고 다음 이벤트만 사용합니다.

```text
homepage_view
hero_free_meeting_click
free_meeting_click
group_inquiry_click
tel_click
form_start
form_submit_success
```

## PR 증거 패키지

홈페이지 UX 변경 PR에는 다음을 포함합니다.

- 360×800, 390×844, 412×915, 768×1024, 1440×900 screenshot
- actual / expected / diff
- 레이아웃 계약 결과
- Lighthouse mobile 결과
- axe 또는 수동 접근성 결과
- 변경한 주장과 `marketing-context.md` 근거
- 사용자 테스트에서 검증할 가설

## 실패 시 merge 중단

수평 스크롤, 핵심 이미지 crop, 첫 화면 CTA 소실, 채팅·고정 CTA 겹침, 전화 링크 변형, 구조화 데이터 오류, 근거 없는 마케팅 주장 중 하나라도 있으면 merge 전에 수정합니다.
