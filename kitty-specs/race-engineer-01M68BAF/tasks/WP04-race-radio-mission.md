---
work_package_id: WP04
title: 최종 미션 M7 레이스 무전과 단순화 고지
dependencies:
- WP03
requirement_refs:
- FR-008
- FR-012
planning_base_branch: mission/02-race-engineer
merge_target_branch: mission/02-race-engineer
branch_strategy: Planning artifacts for this mission were generated on mission/02-race-engineer. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/02-race-engineer unless the human explicitly redirects the landing branch.
subtasks:
- T017
- T018
- T019
- T020
phase: Phase 4 - Story 3
history:
- !!omap
  - at: '2026-10-31T07:30:00Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/02-race-engineer/src/missions/race.ts
create_intent:
- episodes/02-race-engineer/src/missions/race.ts
- episodes/02-race-engineer/src/model/race-radio.ts
- episodes/02-race-engineer/tests/race-radio.test.ts
- episodes/02-race-engineer/src/view/notes.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/02-race-engineer/src/missions/race.ts
- episodes/02-race-engineer/src/model/race-radio.ts
- episodes/02-race-engineer/tests/race-radio.test.ts
- episodes/02-race-engineer/src/view/notes.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP04 – 최종 미션 M7 레이스 무전과 단순화 고지

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

코너 5개 판정과 결과, 모델 단순화 고지를 만든다.

**독립 확인**: 코너 4를 틀리면 나머지가 맞아도 불통과, 코너 4 포함 4/5면 통과.

## Context

- 스펙: [../spec.md](../spec.md) · 정답: [../answers.md](../answers.md) · 계획: [../plan.md](../plan.md) · 결정: [../research.md](../research.md) · 모델: [../data-model.md](../data-model.md)
- 수식·물리값 옆에 공식과 출처 주석 (PRJ-001). 에피소드는 `@series/engine`만 import (PRJ-003)
- 학습자 문구는 `P(ko, en)` (PRJ-007). 모든 조작 44×44 px (PRJ-004)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/02-race-engineer`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다 (docs/agents/main.md 6절). 끝나면 `feat(WP04): …`로 커밋한다.

## Subtasks

### T017: `model/race-radio.ts`: 코너 표와 코너·미션 판정

spec의 코너 5개를 고정 순서로. 성공: 0.97 × 한계 ≤ v ≤ 한계 + 0.01 km/h, 입력 원값 비교. 코너 4: "한계 없음" 선택만 성공, 340을 불러도 실패. 미션 통과: 코너 4 성공 포함 4개 이상. `gripLimit` none 코너에서 속도를 계산하지 않는다.

### T018: `tests/race-radio.test.ts`: answers.md M7 표 전체

코너 2의 324.21 통과(0.01 여유), 324.22 실패, 경계 안쪽 값으로 하한 확인. 4/5에서 코너 4가 빠지면 불통과. 조합 5C4 전부.

### T019: `missions/race.ts`: M7 흐름과 결과 화면

문구는 "미끄러지지 않는 그립 한계 속도"를 묻는다. 윙은 주어지고 고를 수 없다(C-006). 코너마다 무전 → 판정 → 차 주행. 끝에 코너별 결과, 4개 미만이면 다시. 결과 저장.

### T020: `view/notes.ts`: 단순화 고지 (FR-012)

윙의 항력 없음, 타이어 하중 민감도 없음, 게임용 값, 코너 반지름 역산값, 횡가속도가 실제 자료의 5 g보다 크게 나올 수 있음(코너 2는 6.90 g). "실제 F1과 같다"고 쓰지 않는다. 한/영.

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 새 호출처 없는 코드가 없음 (죽은 코드 점검)

## Risks

0.01 km/h 여유가 다른 미션으로 번지는 것.

## Reviewer Guidance

answers.md 값과 테스트 기대값을 대조하고, 판정이 입력 원값을 비교하는지 확인한다. 소유 밖 파일 수정은 이유가 기록되어 있어야 한다.
