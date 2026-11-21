---
work_package_id: WP03
title: 지도·원·두 원이 만나는 직선 (M3~M4)
dependencies:
- WP02
requirement_refs:
- FR-001
- FR-004
- FR-005
- FR-006
- FR-012
- NFR-003
planning_base_branch: mission/03-seismic-analyst
merge_target_branch: mission/03-seismic-analyst
branch_strategy: Planning artifacts for this mission were generated on mission/03-seismic-analyst. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/03-seismic-analyst unless the human explicitly redirects the landing branch.
subtasks:
- T011
- T012
- T013
- T014
- T015
- T016
phase: Phase 3 - Story 2
history:
- at: '2026-11-21T08:01:24Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/03-seismic-analyst/src/view/map.ts
create_intent:
- episodes/03-seismic-analyst/src/model/circles.ts
- episodes/03-seismic-analyst/src/model/line.ts
- episodes/03-seismic-analyst/src/view/map.ts
- episodes/03-seismic-analyst/src/view/formula-panel.ts
- episodes/03-seismic-analyst/src/missions/circles.ts
- episodes/03-seismic-analyst/tests/circles.test.ts
- episodes/03-seismic-analyst/tests/line.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/03-seismic-analyst/src/model/circles.ts
- episodes/03-seismic-analyst/src/model/line.ts
- episodes/03-seismic-analyst/src/view/map.ts
- episodes/03-seismic-analyst/src/view/formula-panel.ts
- episodes/03-seismic-analyst/src/missions/circles.ts
- episodes/03-seismic-analyst/tests/circles.test.ts
- episodes/03-seismic-analyst/tests/line.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – 지도·원·두 원이 만나는 직선 (M3~M4)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

원·교점·직선의 순수 계산과 km 지도·식 패널을 만들고, M3(관측소 하나: 원)과 M4(관측소 둘: 두 원이 만나는 직선)를 완성한다.

**독립 확인**: M3 후보 판정 정답이 예/예/예/아니오/아니오. M4 슬라이더 20 / 21 / 22 / 188 / 189 / 190 km에서 교점 0 / 1 / 2 / 2 / 1 / 0, 직선 (168, 0, 16800)·(1, 0, 100)·(−1, 0, −100) 통과.

## Context

- 스펙 M3·M4 행, US2 시나리오 1~4, Edge Cases(교점·직선·M3 후보), 지도 범위 · answers.md 공통 식·M3·M4 · research R5·R7 · data-model `Circle`, `Line`, `Intersection`
- 판정은 확정된 정답 반지름으로 한다 (중간값 확정 규칙, 검토 R7·R8)
- `missions/index.ts`·`main.ts`는 WP01 소유 — 연결 몇 줄은 소유 밖 수정(이유 기록)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/03-seismic-analyst`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다. 끝나면 `feat(WP03): …`로 커밋한다.

## Subtasks

### T011: `model/circles.ts` + `tests/circles.test.ts` [P]

```ts
export function expand(c: Circle): { D: number; E: number; F: number } // x² + y² + Dx + Ey + F = 0
export function onCircle(p: Point, c: Circle): 'on' | 'inside' | 'outside' // 정수 입력은 정확히 (x−a)² + (y−b)² vs r²
export function intersect(c1: Circle, c2: Circle): Intersection          // 개수 먼저 (research R5)
export function radicalLine(p: Circle, q: Circle): Line                  // 원 P − 원 Q (data-model 불변식)
```

- 개수: D² 와 (r₁ + r₂)², (r₁ − r₂)²를 비교. 정수 입력은 정확히, 실수는 상대 허용 1e-12로 접함. count 0이면 교점을 계산하지 않는다
- 테스트 (answers.md):
  - A 전개 (−32, −154, −4840), B (r 63) 전개 (−200, −154, 11960)
  - M3 다섯 후보: on / on / on / inside / outside — (40, 183)은 outside (거리 108.68)
  - A–B: r_B = 20 / 21 / 22 / 188 / 189 / 190 → 0(inside) / 1 / 2 / 2 / 1 / 0(inside)
  - A–B (r_B 63): 교점 (100, 140), (100, 14) (1e-9), `radicalLine` = (168, 0, 16800)
  - fast-check(시드 고정): 임의의 두 원에서 count 2이면 두 교점이 두 원 위(1e-9)이고 `radicalLine` 위에 있다

### T012: `model/line.ts` + `tests/line.test.ts` [P]

research R7 규칙:

```ts
export function normalize(l: Line): Line | 'invalid'   // (a, b) = (0, 0) → 'invalid'
export function sameLine(input: Line, answer: Line, tol = 1e-6): boolean
```

- 절댓값이 가장 큰 성분으로 나누고, 첫 0 아닌 성분이 양수가 되게 부호를 맞춘 뒤 성분마다 비교
- 테스트: (1, 0, 100)·(168, 0, 16800)·(−1, 0, −100)이 (1, 0, 100)과 같음 / (1, 0, 101) 다름 / (0, 0, 5) invalid / (8, 3, 1220)·(336, 126, 51240)·(−8, −3, −1220) 같음 / (8, 3, 842) 다름 (WP04가 M6에 씀)

### T013: `view/map.ts`

- 캔버스 지도 0~200 km × 0~200 km, 정사각형, 20 km 격자와 축 숫자. y는 위가 북쪽
- 그리기 항목: 관측소(삼각형+이름), 원(범위 밖은 캔버스 가장자리에서 잘림 — clip), 원 옆 방정식 라벨(엔진 formula 또는 텍스트), 교점 깜빡임과 개수 표시, 직선 ax + by = c(지도 범위로 자른 선분, b = 0이면 수직선), 후보 점
- 점 고르기: 탭한 위치를 km로 바꿔 콜백 (WP05 M7에서 씀). 후보 점 탭 영역 44×44
- 옵션으로 보기 범위를 받게 만들어 둔다 (WP06 확대 보기에서 씀). 단, 지금 호출처가 없는 옵션은 만들지 않는다 — 기본값 하나만
- 테마 색 다시 읽기 (WP01과 같은 방식)

### T014: `view/formula-panel.ts`

- 두 원의 식을 펼친 형태로 위아래에 쓰고, 빼는 과정을 단계별로 보여 준다: x², y²가 지워짐 → 남은 일차식 → ax + by = c (FR-012). 엔진 `formula`(MathML) 사용
- 계수 입력 a, b, c (소수·음수 허용, `inputmode="decimal"`), 보내기 버튼 44 px, 입력하면 지도에 직선 미리보기

### T015: M3 (`missions/circles.ts`)

상황(관측소 하나뿐, 진앙은 어디?) → A의 거리 계산(±2 km, `judgeIntermediate` → 105로 확정, 원 그림) → 의미(원 = 관측소에서 거리가 같은 점들) → 후보 5개를 하나씩 원의 방정식에 넣어 판정, 대입 값과 r²의 비교를 식으로 보여 줌(US2 시나리오 1) → 모두 맞으면 통과 → 왜 중요한가(관측소 하나로는 방향을 모름). 판정은 확정 반지름 105로만

### T016: M4 (`missions/circles.ts`)

탐색: B의 반지름 슬라이더 0~250 km(1 km 간격) → 교점 개수와 "교점 없음(한 원이 다른 원 안)" 표시, 접하는 21·189에서 1개, 그 사이 2개. 이 배치(중심 거리 84 < r_A 105)에서는 두 원이 떨어져 만나지 않는 경우가 없다 → B의 거리 계산(±2, 63으로 확정) → 펼친 식과 빼기 안내 → 계수 입력 → `sameLine`으로 판정, 틀리면 그려진 직선이 교점을 지나지 않는 것을 보여 주고 재시도(US2 시나리오 4) → 왜 중요한가(직선 하나로 후보가 두 점으로 줄어듦). 판정은 확정 r_B = 63으로 만든 직선과 비교

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 새 호출처 없는 코드가 없음

## Risks

- 부동소수로 접함을 판정하면 21·189에서 흔들릴 수 있다 → 정수 경로
- M3 후보 (40, 183)은 지도에서 원에 가까워 보인다 — 판정은 식으로만

## Reviewer Guidance

교점 개수 판정이 계산보다 먼저인지, 판정이 확정 반지름을 쓰는지, 테스트 기대값이 answers.md M3·M4와 같은지 확인한다.
