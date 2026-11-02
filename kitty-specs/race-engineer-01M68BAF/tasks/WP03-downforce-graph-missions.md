---
work_package_id: WP03
title: 다운포스 그래프와 미션 M4~M6
dependencies:
- WP02
requirement_refs:
- FR-006
- FR-007
- NFR-006
planning_base_branch: mission/02-race-engineer
merge_target_branch: mission/02-race-engineer
branch_strategy: Planning artifacts for this mission were generated on mission/02-race-engineer. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/02-race-engineer unless the human explicitly redirects the landing branch.
subtasks:
- T012
- T013
- T014
- T015
- T016
phase: Phase 3 - Story 2
history:
- !!omap
  - at: '2026-10-31T07:30:00Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/02-race-engineer/src/view/graph.ts
create_intent:
- episodes/02-race-engineer/src/view/graph.ts
- episodes/02-race-engineer/src/missions/downforce.ts
- engine/src/ui/plot.ts
- engine/tests/plot.test.ts
- episodes/02-race-engineer/tests/graph-range.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/02-race-engineer/src/view/graph.ts
- episodes/02-race-engineer/src/missions/downforce.ts
- engine/src/ui/plot.ts
- engine/tests/plot.test.ts
- episodes/02-race-engineer/tests/graph-range.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – 다운포스 그래프와 미션 M4~M6

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

범용 그래프 도구와 v–힘 그래프를 만들고 M4~M6을 완성한다.

**독립 확인**: M4 교점이 답과 일치하고, M6에서 반지름을 키우면 그립 한계 > 최고 속도 → 교점이 축 밖 → 교점 없음 순서로 바뀐다.

## Context

- 스펙: [../spec.md](../spec.md) · 정답: [../answers.md](../answers.md) · 계획: [../plan.md](../plan.md) · 결정: [../research.md](../research.md) · 모델: [../data-model.md](../data-model.md)
- 수식·물리값 옆에 공식과 출처 주석 (PRJ-001). 에피소드는 `@series/engine`만 import (PRJ-003)
- 학습자 문구는 `P(ko, en)` (PRJ-007). 모든 조작 44×44 px (PRJ-004)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/02-race-engineer`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다 (docs/agents/main.md 6절). 끝나면 `feat(WP03): …`로 커밋한다.

## Subtasks

### T012: `engine/src/ui/plot.ts` + 테스트: 축척·축·눈금·곡선

순수 축척 함수(값 → 픽셀)는 단위 테스트한다. 축·눈금·곡선 그리기는 캔버스 컨텍스트와 색을 인자로 받는다. 게임 상태를 모르게 둔다. 01의 `chart.ts`는 수정하지 않는다(R1).

### T013: 그래프 범위 계산 + `tests/graph-range.test.ts` (research R3)

교점 없음(none) / 축 밖(교점 > 1000 km/h) / 표시(가로축 340~1000으로 확장) 판정을 순수 함수로. r = 122.58 앞뒤, 156.24, 156.25, 156.26 경계 테스트. 경계 156.24는 약 2.2e4 km/h라 축 밖이다.

### T014: `view/graph.ts`: 두 곡선, 교점, 340 km/h 선, 상태 문구

라이트·다크 대비 4.5:1(NFR-006). 교점은 최대 1개. "교점 없음(한계 없음)"과 "교점이 축 밖"을 다른 문구로 표시. 360px에서는 그래프 단계에 막대를 줄인다.

### T015: `missions/downforce.ts`: M4, M5

M4 r=106, 윙 높음, ±3 km/h. 106 m는 역산값으로 표기. M5 입력 라벨 `v(100)/v(50)`, ±0.02, M2 비율보다 큰지 고르는 선택지. 힌트에 식 표시(MathML).

### T016: `missions/downforce.ts`: M6

반지름 슬라이더 40~200 m, 1 m 간격, 값 입력은 경계 반지름 ±2 m. "그립 한계 > 최고 속도"와 "한계 없음"을 나란히 비교하는 장면을 넣는다. M6 밖의 미션은 지정된 반지름만 쓴다.

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 새 호출처 없는 코드가 없음 (죽은 코드 점검)

## Risks

경계 근처 값 폭증, 교점이 축 밖일 때 그림이 무의미해 보이는 것.

## Reviewer Guidance

answers.md 값과 테스트 기대값을 대조하고, 판정이 입력 원값을 비교하는지 확인한다. 소유 밖 파일 수정은 이유가 기록되어 있어야 한다.
