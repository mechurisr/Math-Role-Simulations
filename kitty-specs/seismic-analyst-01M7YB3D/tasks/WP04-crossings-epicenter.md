---
work_package_id: WP04
title: 교점과 진앙 확정 (M5~M6)
dependencies:
- WP03
requirement_refs:
- FR-005
- FR-006
- FR-007
- FR-010
planning_base_branch: mission/03-seismic-analyst
merge_target_branch: mission/03-seismic-analyst
branch_strategy: Planning artifacts for this mission were generated on mission/03-seismic-analyst. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/03-seismic-analyst unless the human explicitly redirects the landing branch.
subtasks:
- T017
- T018
- T019
- T020
phase: Phase 3 - Story 2
history:
- at: '2026-11-21T08:01:24Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/03-seismic-analyst/src/missions/epicenter.ts
create_intent:
- episodes/03-seismic-analyst/src/model/system.ts
- episodes/03-seismic-analyst/src/missions/epicenter.ts
- episodes/03-seismic-analyst/tests/system.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/03-seismic-analyst/src/model/system.ts
- episodes/03-seismic-analyst/src/missions/epicenter.ts
- episodes/03-seismic-analyst/tests/system.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP04 – 교점과 진앙 확정 (M5~M6)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

M4의 직선을 원에 대입해 두 교점을 구하는 M5와, 원 A − 원 C의 일반형 직선을 입력하고 두 직선의 교점(연립일차방정식)으로 진앙을 확정하는 M6를 완성한다.

**독립 확인**: M5 (100, 140)·(100, 14)를 어느 순서로 넣어도 통과. M6 직선 (8, 3, 1220)·(336, 126, 51240) 통과·(8, 3, 842) 불통과, 좌표 (100, 140)(±1) 통과, 세 원 공통점이 하나뿐임이 화면에 보임.

## Context

- 스펙 M5·M6 행, US2 시나리오 5·6, 수학 개념(연립일차방정식) · answers.md M5·M6 · 검토 R2(M6에서 일반형), m13(세 원 공통점 유일)
- WP03의 `circles.ts`(`intersect`, `radicalLine`), `line.ts`(`sameLine`), `view/map.ts`, `view/formula-panel.ts`를 쓴다
- `view/map.ts`는 WP03 소유 — T020은 소유 밖 수정(이유 기록)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/03-seismic-analyst`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다. 끝나면 `feat(WP04): …`로 커밋한다.

## Subtasks

### T017: `model/system.ts` + `tests/system.test.ts` [P]

```ts
export function intersectLines(l1: Line, l2: Line): Point | 'parallel' | 'same'  // 크라메르 공식
export function commonPoints(circles: Circle[], candidates: Point[], tol = 1e-9): Point[] // 모든 원 위에 있는 후보
```

- 테스트 (answers.md M6): x = 100 (1, 0, 100)과 8x + 3y = 1220 → (100, 140) (1e-9). 평행 (1, 0, 100)·(2, 0, 50) → 'parallel', 같은 직선 → 'same'
- 원 A(105)·B(63)·C(84), 후보 [(100, 140), (100, 14)] → [(100, 140)]만. C에서 (100, 14)까지 √22932 ≈ 151.43 (answers.md)
- 독립 기준: 구한 점을 두 직선 식에 다시 넣어 잔차 0(1e-9)

### T018: M5 (`missions/epicenter.ts`)

상황(직선 위의 두 점이 후보) → 안내: M4 직선 x = 100을 원 B 식에 넣으면 (y − 77)² = 63² → 두 값. 숫자 예시를 먼저 보여 주고 계산은 학습자가 → 두 점 입력(x, y 두 칸씩) → 순서 무관하게 각 ±1 km(`judgePoint`를 두 짝 모두 시도) → 지도에 두 점 표시 → 왜 중요한가(관측소 둘로는 두 점 중 어디인지 모름). 판정 기준 교점은 `intersect(A, B)`로 계산(상수로 박지 않음)

### T019: M6 (`missions/epicenter.ts`)

- ① 원 C 추가(거리 84 확정 표시) → 원 A와 원 C의 펼친 식(formula-panel 재사용) → 계수 입력, `sameLine(input, radicalLine(A, C))`. 이번 직선은 a, b가 모두 0이 아님을 문구로 짚는다
- ② 두 직선(x = 100과 ① 직선)의 교점을 연립해 좌표 보내기(±1 km). 정답은 `intersectLines`로 계산
- ③ 지도에서 그 점이 M5의 두 점 중 하나이고 세 원이 모두 지나며, `commonPoints` 결과가 하나뿐임을 보여 줌 → 재난 문자 발송팀에 좌표 전달 연출 → 왜 중요한가(관측소 셋이면 한 점)
- 틀린 좌표: 그 점에서 세 관측소까지의 거리와 세 반지름을 나란히 보여 주고 재시도(US2 시나리오 6)

### T020: `view/map.ts` 보강 (소유 밖)

- 직선이 지나는 후보 점 강조(① 직선이 M5 두 점 중 하나만 지남 — US2 시나리오 5)
- 틀린 점 비교 표(세 거리·세 반지름) 자리
- 최소한으로 고치고 커밋 메시지에 "M6 표시용으로 map.ts에 강조·비교 표 추가 (WP03 소유)"를 적는다

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 새 호출처 없는 코드가 없음

## Risks

- M6에서 학습자가 직선을 건너뛰고 좌표만 보내지 않게 ①을 통과해야 ②가 열린다
- 정답 좌표를 상수로 박으면 answers.md와 어긋나도 테스트가 못 잡는다 — 항상 계산

## Reviewer Guidance

M6가 "고르기"가 아니라 "두 직선 교점 계산"인지, 세 원 공통점 표시가 계산 결과에서 나오는지 확인한다.
