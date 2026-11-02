---
work_package_id: WP06
title: 모바일 검증과 공개
dependencies:
- WP05
requirement_refs:
- FR-014
- NFR-001
- NFR-002
- NFR-005
- NFR-006
planning_base_branch: mission/02-race-engineer
merge_target_branch: mission/02-race-engineer
branch_strategy: Planning artifacts for this mission were generated on mission/02-race-engineer. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/02-race-engineer unless the human explicitly redirects the landing branch.
subtasks:
- T024
- T025
- T026
- T027
- T028
phase: Phase 6 - Polish
history:
- !!omap
  - at: '2026-10-31T07:30:00Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: e2e/
create_intent:
- e2e/race-engineer.spec.ts
execution_mode: code_change
model: ''
owned_files:
- e2e/race-engineer.spec.ts
- e2e/mobile.spec.ts
- playwright.config.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP06 – 모바일 검증과 공개

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

360px 전 미션 완주 e2e로 검증하고 랜딩에 공개한다.

**독립 확인**: `pnpm check`, `pnpm test:e2e` 전체 통과, 01 이전 비교 변경 없음.

## Context

- 스펙: [../spec.md](../spec.md) · 정답: [../answers.md](../answers.md) · 계획: [../plan.md](../plan.md) · 결정: [../research.md](../research.md) · 모델: [../data-model.md](../data-model.md)
- 수식·물리값 옆에 공식과 출처 주석 (PRJ-001). 에피소드는 `@series/engine`만 import (PRJ-003)
- 학습자 문구는 `P(ko, en)` (PRJ-007). 모든 조작 44×44 px (PRJ-004)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/02-race-engineer`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다 (docs/agents/main.md 6절). 끝나면 `feat(WP06): …`로 커밋한다.

## Subtasks

### T024: `e2e/race-engineer.spec.ts`: 360px 터치로 M1~M8 완주

결과 DOM 속성으로 애니메이션 끝을 기다린다. 미끄러짐, 무전 오답, 코너 4 필수, M6 세 상태. 모바일 스크롤 없음.

### T025: 터치 크기·가로 스크롤 측정

단계마다 모든 조작 요소 44×44 px, `scrollWidth` ≤ 360. 나타난 뒤 재는지 측정값을 한 번 출력해 단언이 실제로 도는지 확인. `e2e/mobile.spec.ts`의 주소 목록에 추가.

### T026: 테마·언어

라이트·다크에서 수식과 그래프 대비, 영어 전환 후 한글 문구 없음, 언어 전환 때 입력값 유지.

### T027: `playwright.config.ts` testMatch, `episode.json` status published

CI의 Firefox·WebKit 대상에 `race-engineer` 추가. MathML은 세 브라우저에서 확인. `episode.json`을 published로(소유 밖 한 줄, 이유 기록). 랜딩 목록에 나오는지 확인.

### T028: 전체 확인: quickstart 절차, `pnpm check`, `pnpm test:e2e`, `pnpm build`

01 테스트와 이전 비교가 변경 없이 통과하는지 확인. `pnpm preview`를 띄웠으면 4173 포트 프로세스까지 종료.

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 새 호출처 없는 코드가 없음 (죽은 코드 점검)

## Risks

WebKit의 MathML 표시, 긴 e2e 시간.

## Reviewer Guidance

answers.md 값과 테스트 기대값을 대조하고, 판정이 입력 원값을 비교하는지 확인한다. 소유 밖 파일 수정은 이유가 기록되어 있어야 한다.
