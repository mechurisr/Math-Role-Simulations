---
work_package_id: WP06
title: 어긋난 세 원 (M8, 분리 가능)
dependencies:
- WP04
requirement_refs:
- C-006
- C-007
- C-008
- FR-018
- NFR-003
planning_base_branch: mission/03-seismic-analyst
merge_target_branch: mission/03-seismic-analyst
branch_strategy: Planning artifacts for this mission were generated on mission/03-seismic-analyst. During implementation this WP is built directly on mission/03-seismic-analyst (no lanes/worktrees, docs/agents/main.md section 6); completed changes stay on mission/03-seismic-analyst and reach main through the PR.
subtasks:
- T027
- T028
- T029
- T030
phase: Phase 5 - Story 4
history:
- !!omap
  - at: '2026-11-21T08:01:24Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/03-seismic-analyst/src/missions/residual.ts
create_intent:
- episodes/03-seismic-analyst/src/model/residual.ts
- episodes/03-seismic-analyst/src/view/residual.ts
- episodes/03-seismic-analyst/src/missions/residual.ts
- episodes/03-seismic-analyst/tests/residual.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/03-seismic-analyst/src/model/residual.ts
- episodes/03-seismic-analyst/src/view/residual.ts
- episodes/03-seismic-analyst/src/missions/residual.ts
- episodes/03-seismic-analyst/tests/residual.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP06 – 어긋난 세 원 (M8, 분리 가능)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

판독 오차로 세 원이 한 점에서 만나지 않는 M8을 만든다: ① M6 진앙에서 잔차 제곱합 계산, 왜 제곱인지 설명, ② 확대 지도에서 잔차 제곱합 최소점 찾기, ③ "측정에 가장 잘 맞는 점 ≠ 진짜 진앙" 읽기.

**독립 확인**: ① 52.92(±0.1) 통과. ② ↑↓←→ 버튼만으로 (100, 140)에서 출발해 (96.6, 136.2) 근처로 가서 보내면 통과(최소점에서 1 km 이내), 1.2 km 밖이면 불통과. 끄는 동안 페이지가 스크롤되지 않는다. 이 WP를 빼도 M1~M7이 완결된다.

## Context

- 스펙 M8 행, US4, FR-018, C-006(근심 쓰지 않음)·C-007(정직한 표현)·C-008, NFR-003 M8 ② 예외 · answers.md M8 · research R6 · data-model `M8_READINGS`, `M8_VIEW`
- WP02의 `drag.ts`, WP03의 `map.ts`·`circles.ts`, WP01의 `judge.ts`를 쓴다
- `view/map.ts`는 WP03 소유 — T029는 소유 밖 수정(이유 기록)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/03-seismic-analyst`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다. 끝나면 `feat(WP06): …`로 커밋한다.

## Subtasks

### T027: `model/residual.ts` + `tests/residual.test.ts` [P]

```ts
export function residuals(p: Point, circles: Circle[]): number[]   // |p − c| − r
export function sumSquares(p: Point, circles: Circle[]): number
export function leastSquaresPoint(circles: Circle[], start: Point): Point // 가우스–뉴턴 (research R6)
```

- 가우스–뉴턴: 시작점 (100, 140), 갱신량 < 1e-12 km 또는 100회에서 멈춤. 정규방정식 2×2를 직접 푼다. **근심(두 근축 교점)을 쓰지 않는다**(C-006)
- 테스트 (answers.md M8, 반지름 100.8 / 58.8 / 88.2):
  - (100, 140)에서 잔차 (+4.2, +4.2, −4.2), F = 52.92 (1e-9)
  - 최소점 (96.5816, 136.1635), F_min 1.3913 — NFR-003 예외 기준 1e-6 km / 1e-6 km² (기준값은 더 많은 자리로 테스트에 고정: 계산해서 소수 열째 자리까지 기록하고 출처를 "가우스–뉴턴, answers.md와 4자리 일치"로)
  - 독립 기준 1: 0.01 km 격자(x 95~98, y 135~138) 최소가 최소점과 0.01 km 이내
  - 독립 기준 2: 최소점에서 수치 경사 |∇F| < 1e-6
  - 최소점에서 1 km 떨어진 8방향 F가 모두 2.4 이상 (answers.md 2.41 ~ 3.36)
  - 같은 입력 두 번 → 같은 결과(결정성)

### T028: `view/residual.ts` [P]

- 관측소 A·B·C의 잔차 막대: 0 기준선에서 +는 오른쪽, −는 왼쪽, 숫자(소수 둘째 자리)와 부호
- 잔차 제곱합을 큰 숫자로 계속 표시(FR-018, 검토 R3) — 끌거나 버튼을 누를 때마다 즉시 갱신
- 문구: "측정에 가장 잘 맞는 점"(C-007). "진짜 진앙", "오차가 없는 점"이라고 쓰지 않는다

### T029: `view/map.ts` 보강 (소유 밖)

- 확대 보기 옵션: 범위 x 88~108, y 128~148(`M8_VIEW`), 2 km 격자, 360px에서 1 km ≈ 18 px
- 추정점: `bindPointerDrag`로 끌기, 0.1 km 스냅, ↑↓←→ 버튼(44×44, 0.1 km씩). 현재 좌표 표시
- 세 원은 M8 판독값 반지름으로만(M3~M6 원 숨김), 새 반지름 고정 표시(검토 m10)
- 커밋 메시지에 "M8 확대 보기·추정점 추가 (WP03 소유)"

### T030: `missions/residual.ts` M8 + 판정 테스트

- 상황: 세 관측소 판독이 0.5 s씩 어긋남(A 12.0, B 7.0, C 10.5) → 새 반지름 표시 → 세 원이 한 점에서 안 만남
- ① M6 진앙 (100, 140)에서 세 잔차와 잔차 제곱합 계산해 보내기(±0.1 km², `judgeValue`)
- 설명: 그냥 더하면 4.2 + 4.2 − 4.2 = 4.2로 −가 +를 지움, (+3, −3, 0) 예시는 합 0인데 두 원에서 3 km씩 벗어남 → 그래서 제곱해 더함(검토 R4, US4 시나리오 2)
- ② 확대 지도에서 최소점 찾기 → 보내기(`judgePoint`, 기준 = `leastSquaresPoint` 결과, ±1 km). 틀리면 잔차 제곱합이 더 작아지는 방향 힌트(수치 경사의 반대 방향을 화살표로)
- ③ 결과: 최소점과 M6 진앙을 함께 표시, 둘 사이 5.1 km, "측정에 가장 잘 맞는 점이 진짜 진앙과 같다는 보장은 없다" 설명(US4 시나리오 4)
- 판정 테스트: ① 52.82 / 53.02 통과·52.81 / 53.03 불통과, ② 최소점 + (0.99, 0) 통과·+ (1.01, 0) 불통과

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 문구에 "근심", "진짜 진앙"이 추정점 설명으로 나오지 않음 (`grep`으로 확인)
- `missions/index.ts`에서 M8을 빼면 M1~M7이 그대로 완결됨(직접 확인 후 되돌림)

## Risks

- 최소점 부근이 평평해(1 km에 F 약 2배) 감으로 찾기 어려움 → 큰 숫자와 버튼
- 가우스–뉴턴 시작점이 멀면 먼 국소 최소((136, 59) 부근)로 갈 수 있음 — 시작점 고정, 확대 범위 밖은 끌 수 없음

## Reviewer Guidance

근심을 쓰지 않는지, 기준값이 독립 기준 두 가지와 맞는지, 문구가 C-007을 지키는지 확인한다.
