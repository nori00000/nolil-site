# 선별 마케팅 스킬 도입안

기준 저장소: `superamped/ai-marketing-skills`

전체 스킬을 설치하지 않고 다음 스킬만 검토합니다.

| 스킬 | 놀일 적용 | 출력 조건 |
|---|---|---|
| conversion-audit | 첫 화면·CTA·신뢰·가격 불안 진단 | 화면 근거와 사용자 가설 필수 |
| search-page-audit | SEO·GEO·E-E-A-T·구조화 데이터 점검 | 주소·전화·일정 사실 확인 필수 |
| competitor-discovery | 지역·모임·리트릿 경쟁 범주 분류 | 검색일·출처·비교 기준 기록 |
| competitor-site-analysis | 경쟁사의 CTA·가격·신뢰 장치 비교 | 카피 복사 금지 |
| community-discovery | 고양·일산·모임 수요자의 실제 표현 수집 | 개인정보·비공개 글 제외 |
| content-strategy | 무료 진입·참여 기록·재방문 콘텐츠 축 설계 | 실제 운영 사실 기반 |

광고 집행, 인플루언서 섭외, 자동 이메일 발송, 자동 게시 스킬은 별도 승인 전까지 사용하지 않습니다.

## 실행 순서

```text
marketing-context.md
→ conversion-audit
→ 브라우저 screenshot·레이아웃 계약
→ 사용자 5초/첫 클릭 테스트
→ search-page-audit
→ competitor/community 조사
→ content-strategy
```

## 보안·운영 규칙

- 외부 스킬은 커밋 SHA를 고정하고 설치 전 `SKILL.md`와 scripts를 읽습니다.
- API 키는 환경변수로만 전달하고 저장소에 커밋하지 않습니다.
- 신청자 이름·전화번호·이메일·메모를 스킬 입력에 넣지 않습니다.
- AI가 후기·참가자 수·가격·일정을 만들어내지 못하게 `marketing-context.md`의 금지 규칙을 적용합니다.
- 외부 게시·광고비 지출·고객 메시지 발송은 사람 승인 없이는 실행하지 않습니다.
- 결과에는 출처, 검색일, 불확실성, 다음 검증 방법을 남깁니다.
