# Decision Moment `01M7YBNH3KP0P0S8TV2705KY1J`

- **Mission:** `seismic-analyst-01M7YB3D`
- **Origin flow:** `specify`
- **Slot key:** `specify.scope.error-estimate-method`
- **Input key:** `error_estimate_method`
- **Status:** `resolved`
- **Created:** `2026-11-21T06:11:00.851767+00:00`
- **Resolved:** `2026-11-21T06:11:57.989558+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

M8에서 어긋난 세 원의 추정 진앙을 무엇으로 구할까? (근심은 판독 오차를 키워 실제 진앙에서 멀어질 수 있음)

## Options

- 잔차 제곱합을 끌어서 최소화
- 작은 삼각형의 무게중심
- 근심 + 한계 설명
- Other

## Final answer

잔차 제곱합 최소화: 점을 끌어 관측소별 잔차(거리−반지름)와 제곱합을 보고 최소점을 찾아 보냄. 근심은 쓰지 않음

## Rationale

_(none)_

## Change log

- `2026-11-21T06:11:00.851767+00:00` — opened
- `2026-11-21T06:11:57.989558+00:00` — resolved (final_answer="잔차 제곱합 최소화: 점을 끌어 관측소별 잔차(거리−반지름)와 제곱합을 보고 최소점을 찾아 보냄. 근심은 쓰지 않음")
