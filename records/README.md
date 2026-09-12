# 회원 활동 기록 (records.json)

`{"records": [...]}`, 각 항목: `{meeting_id:정수, date:"YYYY-MM-DD", title, crop, summary(한 문장), image(선택, images/records/…), url(선택)}`
`meeting_id`는 앱 회차 id로 **필수**입니다 — 원천 회차가 있어야만 기록이 존재한다(1원천 1카드의 구조적 게이트). 없거나 정수가 아니면 그 항목은 빠지고, `url`이 없으면 `https://app.playworkgrow.club/meetings/<meeting_id>`로 이어집니다. 같은 `meeting_id`가 여러 번 오면 최신 `date` 1건만 남습니다.
홈 `#records`가 최신순 최대 6장을 렌더합니다. 스키마를 벗어난 항목(존재하지 않는 날짜·형식 불일치·title 없음)도 그 항목만 빠집니다. 사진은 실제 촬영분만, `images/records/` 아래 경로만 실립니다.
비어 있으면 홈에는 "첫 회차가 열리면 첫 기록이 여기 올라옵니다" 카드가 그대로 남습니다 — 기록을 지어내지 않습니다.
