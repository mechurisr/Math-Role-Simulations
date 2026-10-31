---
work_package_id: WP01
title: 코너 한계 계산과 장면
dependencies: []
requirement_refs:
- C-002
- C-003
- C-004
- FR-001
- FR-002
- FR-003
- FR-004
- FR-007
- FR-015
- NFR-003
- NFR-004
planning_base_branch: mission/02-race-engineer
merge_target_branch: mission/02-race-engineer
branch_strategy: Planning artifacts for this mission were generated on mission/02-race-engineer. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/02-race-engineer unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - Foundation
history:
- !!omap
  - at: '2026-10-31T07:30:00Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/02-race-engineer/
create_intent:
- episodes/02-race-engineer/episode.json
- episodes/02-race-engineer/index.html
- episodes/02-race-engineer/package.json
- episodes/02-race-engineer/src/main.ts
- episodes/02-race-engineer/src/strings.ts
- episodes/02-race-engineer/src/style.css
- episodes/02-race-engineer/src/model/constants.ts
- episodes/02-race-engineer/src/model/corner.ts
- episodes/02-race-engineer/src/view/scene.ts
- episodes/02-race-engineer/src/view/bars.ts
- episodes/02-race-engineer/tests/corner.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/02-race-engineer/episode.json
- episodes/02-race-engineer/index.html
- episodes/02-race-engineer/package.json
- episodes/02-race-engineer/src/main.ts
- episodes/02-race-engineer/src/strings.ts
- episodes/02-race-engineer/src/style.css
- episodes/02-race-engineer/src/model/constants.ts
- episodes/02-race-engineer/src/model/corner.ts
- episodes/02-race-engineer/src/view/scene.ts
- episodes/02-race-engineer/src/view/bars.ts
- episodes/02-race-engineer/tests/corner.test.ts
- package.json
- pnpm-lock.yaml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – 코너 한계 계산과 장면

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

에피소드 뼈대를 만들고 세 한계 상태 계산과, 그 계산을 쓰는 코너 장면·힘 막대·조작부를 한 번에 완성한다.

**독립 확인**: M1 조건(r=80, 건조, 윙 없음)에서 속도를 바꿔 출발하면 한계 이하는 통과, 초과는 접선으로 미끄러진다.

## Context

- 스펙: [../spec.md](../spec.md) · 정답: [../answers.md](../answers.md) · 계획: [../plan.md](../plan.md) · 결정: [../research.md](../research.md) · 모델: [../data-model.md](../data-model.md)
- 수식·물리값 옆에 공식과 출처 주석 (PRJ-001). 에피소드는 `@series/engine`만 import (PRJ-003)
- 학습자 문구는 `P(ko, en)` (PRJ-007). 모든 조작 44×44 px (PRJ-004)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/02-race-engineer`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다 (docs/agents/main.md 6절). 끝나면 `feat(WP01): …`로 커밋한다.

## Subtasks

### T001: 뼈대: `episodes/_template/` 복사, `episode.json`(number 2, slug `02-race-engineer`, status draft, 난이도 3), `package.json` 이름, `pnpm install`

`episodes/_template/README.md` 절차를 따른다. 템플릿의 예제 `model/motion`과 예제 테스트는 지운다. `status`는 WP06에서 published로 바꾼다.
검증: `/episodes/02-race-engineer/`가 열리고 `pnpm check:boundaries` 통과.

### T002: `model/constants.ts`: g, m, μ, k, 최고 속도 + 출처 주석

answers.md "Physical values"의 값과 표시를 그대로 옮긴다. g = 9.8은 01과 같은 근거 주석(표준중력 9.80665 반올림). m·μ·k·최고 속도는 `[game value]`. 젖음 μ는 OpenStax 표 6.1 비율 근거를 적는다. 01의 상수를 import하지 않는다.

### T003: `model/corner.ts`: `requiredForce`, `availableForce`, `gripLimit`, `kmhToMs`, `msToKmh`

`gripLimit`은 data-model.md의 판별 유니언을 돌려준다. **`m − μkr ≤ 0`을 먼저 검사**하고 그때는 속도를 계산하지 않는다(NaN 방지, 판정 여유 없음). 공식 주석: F_req = mv²/r, F_avail = μ(mg + kv²), v² = μgr/(1 − μkr/m), 출처 OpenStax 6.3과 NASA Lift Equation. `kind`는 finite(최고 속도 이하) / aboveTopSpeed / none.

### T004: `tests/corner.test.ts`: 해석값·독립 기준·경계·fast-check 속성 테스트

fast-check를 루트 개발 의존성으로 추가(`pnpm add -Dw fast-check@4.10.2`, 잠금 파일 변경과 레지스트리 URL 확인, research R6).
- answers.md M1·M3·M4·M5a·b, M7 코너값 비교 (상대 오차 1e-9)
- OpenStax 예제 6.15: μ = v²/(rg)
- M4를 이분법 수치해와 비교, 답을 넣어 F_req = F_avail
- 경계 156.24 finite 또는 aboveTopSpeed / 156.25 none / 156.26 none, `Number.isNaN` 없음
- 속성(시드 고정): k=0이면 √(μgr), r·μ 증가에 v 단조 증가, none이면 임의 v에서 F_req ≤ F_avail

### T005: `view/scene.ts`: 코너, 차, 미끄러짐 애니메이션 (research R4)

위에서 본 코너는 도식이다. 반지름 라벨을 크게 표시하고 r 40 vs 80의 곡률 차이가 보이게 그린다(축척 고지). 판정은 `gripLimit`으로 출발 때 먼저 정하고, 애니메이션은 결과만 표현한다. 진입 구간에서 표시 힘이 올라가다 넘치는 지점의 접선 방향으로 미끄러진다. `startFixedStepLoop` 사용. e2e가 끝을 기다릴 수 있도록 결과를 DOM 속성으로 노출한다.

### T006: `view/bars.ts`와 조작부: 힘 막대, 속도·반지름 슬라이더, 노면·윙 버튼, 조건 카드(FR-015), 세 상태 표시

두 막대는 같은 눈금이다. 슬라이더 간격 속도 1 km/h, 반지름 1 m. 조건 카드는 m·g·μ·k·r을 항상 표시. 세 상태 문구: 값 / "그립 한계 > 최고 속도" / "한계 없음"; aboveTopSpeed에서는 숫자를 보이지 않는다. 모든 조작 44×44 px, 문구 한/영(`defineStrings`), 테마 색은 `readCssVars`.

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과
- 새 호출처 없는 코드가 없음 (죽은 코드 점검)

## Risks

템플릿 복사 시 예제가 남는 것, 애니메이션과 판정이 어긋나는 것(판정은 계산에서만).

## Reviewer Guidance

answers.md 값과 테스트 기대값을 대조하고, 판정이 입력 원값을 비교하는지 확인한다. 소유 밖 파일 수정은 이유가 기록되어 있어야 한다.
