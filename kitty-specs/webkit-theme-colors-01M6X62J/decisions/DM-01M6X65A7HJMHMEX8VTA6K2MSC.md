# Decision Moment `01M6X65A7HJMHMEX8VTA6K2MSC`

- **Mission:** `webkit-theme-colors-01M6X62J`
- **Origin flow:** `specify`
- **Slot key:** `specify.intent.summary-confirm`
- **Input key:** `intent_summary_confirm`
- **Status:** `resolved`
- **Created:** `2026-11-08T08:59:50.386059+00:00`
- **Resolved:** `2026-11-08T09:01:22.930768+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

Intent Summary: WebKit에서 처음 열 때(캐시 없음) 두 에피소드와 템플릿의 모든 캔버스가 테마 색 대신 검정으로 그려진다. 엔진의 테마 변경 처리에서 스타일시트가 다 읽힌 뒤 한 번 더 색을 읽고 다시 그리게 해 세 곳을 함께 고친다. firefox·webkit CI에서 race-engineer*.spec.ts를 모두 돌린다. 이대로 스펙을 쓸까요?

## Options

- 이대로 진행
- 수정
- Other

## Final answer

이대로 진행: 엔진 onThemeChange에서 스타일시트 로드 뒤 한 번 더 색을 읽어 세 곳(01, 02, _template)을 함께 고치고, firefox·webkit CI에서 race-engineer*.spec.ts 전부 실행. 캔버스 크기 문제는 범위 밖

## Rationale

_(none)_

## Change log

- `2026-11-08T08:59:50.386059+00:00` — opened
- `2026-11-08T09:01:22.930768+00:00` — resolved (final_answer="이대로 진행: 엔진 onThemeChange에서 스타일시트 로드 뒤 한 번 더 색을 읽어 세 곳(01, 02, _template)을 함께 고치고, firefox·webkit CI에서 race-engineer*.spec.ts 전부 실행. 캔버스 크기 문제는 범위 밖")
