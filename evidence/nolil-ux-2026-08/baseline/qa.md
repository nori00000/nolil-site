# 기준선 QA

- Manual QA: `python3 -m http.server 4173 --bind 127.0.0.1` 후 `curl -I http://127.0.0.1:4173/`; HTTP 200이면 PASS. 서버 종료 후 포트 미청취 확인.
- malformed input: 해당 없음 — 정적 홈페이지는 사용자 입력을 처리하지 않음.
- prompt injection: 해당 없음 — 외부 텍스트를 실행하지 않음.
- cancel/resume: evidence는 파일 단위로 재개 가능.
- stale state: 기준 커밋과 캡처 시각을 기록.
- dirty worktree: 승인된 plan/.omo 외 관련 없는 변경이 없음을 시작 시 확인.
- hung command: 로컬 HTTP와 정적 검사는 짧은 명령으로 제한.
- flaky tests: DOM 계수와 원문 검색은 결정적 입력 사용.
- misleading success: HTTP 200만으로 UX 성공을 주장하지 않고 사용자 검증을 별도 대기 상태로 둠.
- repeated interruptions: 기준 커밋이 기록되어 동일 입력으로 재실행 가능.
- Cleanup: 로컬 HTTP 서버는 검증 직후 종료하며 PID/포트 잔존 여부를 확인.
