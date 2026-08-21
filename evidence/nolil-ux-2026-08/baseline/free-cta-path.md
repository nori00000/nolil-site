# 변경 전 무료 CTA 경로

- 기준 커밋: `6f1f22489f4b17d144111a15b9d2eb8cffc279e3`
- 첫 행동: `무료로 한번 와보기`
- 도착 URL: `https://app.playworkgrow.club/meetings`
- 관찰: 무료 전용 상태를 URL로 재현할 수 없고, 홈페이지의 정적 일정은 모두 지난 날짜였다.
- 실패 재현: `rg -n 'fallbackSchedule|다음 모임 준비 중|href="https://app.playworkgrow.club/meetings"' config.js index.html`
- PASS 판정: 위 세 패턴이 모두 존재하면 변경 전 결함이 재현된 것이다.

시각 기준선은 인앱 Browser가 현재 세션에 노출되지 않아 캡처하지 못했다. HTML 원문과 로컬 HTTP를 기준선으로 보존한다.
