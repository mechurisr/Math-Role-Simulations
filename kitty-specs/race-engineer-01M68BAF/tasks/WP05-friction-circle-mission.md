---
work_package_id: WP05
title: 마찰원 심화 미션 M8
dependencies:
- WP04
requirement_refs:
- C-007
- FR-013
planning_base_branch: mission/02-race-engineer
merge_target_branch: mission/02-race-engineer
branch_strategy: Planning artifacts for this mission were generated on mission/02-race-engineer. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/02-race-engineer unless the human explicitly redirects the landing branch.
subtasks:
- T021
- T022
- T023
phase: Phase 5 - Story 4 (separable)
history:
- !!omap
  - at: '2026-10-31T07:30:00Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/02-race-engineer/src/view/circle.ts
create_intent:
- episodes/02-race-engineer/src/model/friction-circle.ts
- episodes/02-race-engineer/tests/friction-circle.test.ts
- episodes/02-race-engineer/src/view/circle.ts
- episodes/02-race-engineer/src/missions/braking.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/02-race-engineer/src/model/friction-circle.ts
- episodes/02-race-engineer/tests/friction-circle.test.ts
- episodes/02-race-engineer/src/view/circle.ts
- episodes/02-race-engineer/src/missions/braking.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP05 – 마찰원 심화 미션 M8

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

마찰원 계산과 끌기 화면으로 M8을 만든다. 이 WP를 빼도 M1~M7은 완결된다.

**독립 확인**: M8만 열어 점을 기준선을 따라 끌고 값을 무전해 판정을 받는다.

## Context

- 스펙: [../spec.md](../spec.md) · 정답: [../answers.md](../answers.md) · 계획: [../plan.md](../plan.md) · 결정: [../research.md](../research.md) · 모델: [../data-model.md](../data-model.md)
- 수식·물리값 옆에 공식과 출처 주석 (PRJ-001). 에피소드는 `@series/engine`만 import (PRJ-003)
- 학습자 문구는 `P(ko, en)` (PRJ-007). 모든 조작 44×44 px (PRJ-004)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/02-race-engineer`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다 (docs/agents/main.md 6절). 끝나면 `feat(WP05): …`로 커밋한다.

## Subtasks

### T021: `model/friction-circle.ts` + 테스트

`gripRadius(v, surface, wing)` = μ(g + kv²/m), `lateralAccel(v, r)` = v²/r, `maxBraking` = √(한계² − a_y²), 횡가속도가 한계를 넘으면 0이 아니라 `null`. 테스트: answers.md 20.19, 35.43, 29.12, √(a_x² + a_y²) = 한계(1e-9). 200 km/h 순간값임을 주석에.

### T022: `view/circle.ts`: 원, 횡가속도 기준선, 끌 수 있는 점

`touch-action: none`으로 끌기 중 페이지 스크롤을 막는다. 점은 기준선을 따라 움직이고 점 옆에 제동 가속도 숫자를 표시한다(C5). 원의 반지름과 힌트 N = mg + kv²를 표시. 잡는 영역 44 px. 원 안/밖 상태 표시.

### T023: `missions/braking.ts`: M8

문구에 "200 km/h인 순간"을 명시. 값 ±1 m/s². 제동하면 속도가 변한다는 단서를 설명에. `missions/index.ts`에 한 줄로 등록해 빼기 쉽게 둔다.

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 새 호출처 없는 코드가 없음 (죽은 코드 점검)

## Risks

작은 화면의 끌기 정밀도. 숫자 표시로 보완.

## Reviewer Guidance

answers.md 값과 테스트 기대값을 대조하고, 판정이 입력 원값을 비교하는지 확인한다. 소유 밖 파일 수정은 이유가 기록되어 있어야 한다.
