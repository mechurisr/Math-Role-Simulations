---
work_package_id: WP02
title: 무전 판정과 기본 미션 M1~M3
dependencies:
- WP01
requirement_refs:
- FR-005
- FR-009
- FR-010
- FR-011
- FR-016
- NFR-005
planning_base_branch: mission/02-race-engineer
merge_target_branch: mission/02-race-engineer
branch_strategy: Planning artifacts for this mission were generated on mission/02-race-engineer. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/02-race-engineer unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
- T010
- T011
phase: Phase 2 - Story 1
history:
- !!omap
  - at: '2026-10-31T07:30:00Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/02-race-engineer/src/model/judge.ts
create_intent:
- episodes/02-race-engineer/src/model/judge.ts
- episodes/02-race-engineer/tests/judge.test.ts
- episodes/02-race-engineer/src/missions/index.ts
- episodes/02-race-engineer/src/missions/basic.ts
- episodes/02-race-engineer/src/view/radio.ts
- engine/src/ui/formula.ts
- engine/tests/formula.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/02-race-engineer/src/model/judge.ts
- episodes/02-race-engineer/tests/judge.test.ts
- episodes/02-race-engineer/src/missions/index.ts
- episodes/02-race-engineer/src/missions/basic.ts
- episodes/02-race-engineer/src/view/radio.ts
- engine/src/ui/formula.ts
- engine/tests/formula.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – 무전 판정과 기본 미션 M1~M3

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

무전 입력과 판정, MathML 수식 헬퍼를 만들고 M1~M3을 튜토리얼로 잇는다.

**독립 확인**: M1~M3을 끝까지 풀어 판정을 받고, 다시 열어도 진행이 남는다.

## Context

- 스펙: [../spec.md](../spec.md) · 정답: [../answers.md](../answers.md) · 계획: [../plan.md](../plan.md) · 결정: [../research.md](../research.md) · 모델: [../data-model.md](../data-model.md)
- 수식·물리값 옆에 공식과 출처 주석 (PRJ-001). 에피소드는 `@series/engine`만 import (PRJ-003)
- 학습자 문구는 `P(ko, en)` (PRJ-007). 모든 조작 44×44 px (PRJ-004)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/02-race-engineer`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다 (docs/agents/main.md 6절). 끝나면 `feat(WP02): …`로 커밋한다.

## Subtasks

### T007: `model/judge.ts`: 공통 판정 함수와 `RadioAnswer`·`Verdict`

data-model.md 타입을 쓴다. 숫자 입력은 원값을 그대로 비교하고 단위 왕복 변환 값으로 판정하지 않는다. 빈 값·NaN·0 이하는 `invalid`(시도로 치지 않음). M1: 한계 − 5 ≤ v ≤ 한계(같으면 통과). `withinTolerance(value, answer, tol)`. 판정 여유 0.01은 여기 넣지 않는다(M7 전용, WP04).

### T008: `tests/judge.test.ts`: M1~M3 경계

M1은 122.51, 127.50 통과, 127.51 미끄러짐, 122.49 시간 손실(정밀 하한 122.503). M2 1.41 통과, 0.71 불통과(방향 고정 확인). M3 ±2. invalid 입력. 단언이 실제로 도는지 한 번 일부러 실패시켜 확인.

### T009: `engine/src/ui/formula.ts` + 테스트: MathML 헬퍼 (research R2)

분수·근호·위첨자를 만드는 작은 함수들을 두고 문자열 인자는 이스케이프한다. `engine/src/ui/index.ts`에 export(소유 밖이지만 한 줄 추가, 이유 기록). 다크 테마는 `currentColor`로 읽히게. 호출처는 T010의 M3 유도 안내.

### T010: `view/radio.ts`: 무전 입력·전송·결과 표시

소수 입력(`inputmode="decimal"`), 단위 표시, 전송 버튼 44 px. 틀리면 높은지 낮은지와 힌트를 보여 주고 다시 시도. 빈 값 안내. "한계 없음" 버튼은 넘겨받은 미션에서만 보이게 옵션으로 둔다. 언어를 바꿔도 입력값 유지.

### T011: `missions/basic.ts`, `missions/index.ts`: M1~M3 단계와 진행 저장, `main.ts` 연결

M1 슬라이더 탐색 → M2 r=40·r=80 측정, 비율 입력 라벨 `v(80)/v(40)`, 관계 선택지(비례/제곱근 비례/제곱 비례) → M3 힘의 균형에서 식을 유도하는 안내(FR-016)와 공식 카드, 그 뒤 무전. `createTutorial`의 gate·on 사용, 끝낸 미션은 `race-engineer:*` 키로 저장(R7). 깨진 값은 처음 상태. `main.ts` 수정은 연결만.

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 새 호출처 없는 코드가 없음 (죽은 코드 점검)

## Risks

M3 유도 안내가 짧으면 M4 이후 식 세우기가 막힌다. 미션 문구 분량.

## Reviewer Guidance

answers.md 값과 테스트 기대값을 대조하고, 판정이 입력 원값을 비교하는지 확인한다. 소유 밖 파일 수정은 이유가 기록되어 있어야 한다.
