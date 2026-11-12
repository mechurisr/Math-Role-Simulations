---
work_package_id: WP02
title: 브라우저 테스트
dependencies:
- WP01
requirement_refs:
- NFR-002
- NFR-003
- NFR-005
planning_base_branch: mission/engine-floating-calculator
merge_target_branch: mission/engine-floating-calculator
branch_strategy: Planning artifacts for this mission were generated on mission/engine-floating-calculator. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/engine-floating-calculator unless the human explicitly redirects the landing branch.
subtasks:
- T009
- T010
- T011
- T012
- T013
phase: Phase 2 - Verification
history:
- at: '2026-11-12T11:30:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: e2e/calculator.spec.ts
create_intent:
- e2e/calculator.spec.ts
execution_mode: code_change
model: ''
owned_files:
- e2e/calculator.spec.ts
- playwright.config.ts
role: implementer
tags: []
tracker_refs: []
---

# WP02 — 브라우저 테스트

## ⚡ Do This First: Load Agent Profile

배정된 프로필이 있으면 `/ad-hoc-profile-load <agent_profile>`로 먼저 불러온다. 비어 있으면 메인 세션 지시(`docs/agents/main.md`)와 헌장을 따른다.

## Objective

WP01의 계산기를 실제 브라우저에서 단언한다: 단계별 표시(US3), 접기·식 유지·Esc(US4), 360×640·360×568 배치(NFR-002, SC-003), M3 계산 후 통과(US1, SC-001), 기존 테스트 무수정 통과(NFR-003, SC-005).

## Branch Strategy

- `mission/engine-floating-calculator`에서 직접. WP01 커밋 뒤에 시작. 끝나면 `test(WP02): …` 커밋
- 최종 머지 대상도 같은 브랜치, 사람이 PR로 `main`에 머지

## Context

- 기존 도우미 패턴: `e2e/race-engineer.spec.ts` 1~40행 (`start`, `next`, `radio`, `touchSizes`, `noHScroll`), `e2e/race-engineer-from.spec.ts`(`?from=M3`)
- 02 단계: `episodes/02-race-engineer/src/missions/basic.ts` (M2 설명/예상 → M2 무전 94행, M3 무전 132행)
- 계산기 DOM id (WP01): `#calcFab`, `#calc`, `#calcExpr`, `#calcRes`, `#calcClose`, `[data-key]`, `#radioCalc`, 카드 `#tut`, 입력 `#radioIn`, 보내기 `#radioGo`, 다음 `#tutNext`

## Subtasks

### T009 뼈대와 CI 설정

**Files**: `e2e/calculator.spec.ts` (새로), `playwright.config.ts`

1. 파일 머리 주석: 미션 경로, 대응 요구(NFR-002, NFR-003, US1~US4)
2. `test.use({ hasTouch:true, isMobile:true })`, 뷰포트는 테스트마다 360×640 / 360×568
3. 도우미: `openAt(page, mission)` = `?from=` + 카드 보임 대기, `toRadioStep(page)` = 무전 입력란이 보일 때까지 `#tutNext`, `openCalc(page)`, `keys(page, '√1.0×9.8×80)×3.6=')` = 기호마다 `[data-key="…"]` 탭
4. `playwright.config.ts` CI firefox·webkit `testMatch`에 `calculator` 추가 (`(…|calculator)\.spec\.ts`)

### T010 단계 표시·식 유지·Esc

1. US3-1: M2 설명/예상 단계에서 `#calcFab` 숨김
2. US3-2: M2 무전 단계에서 보임
3. US3-3: 무전 단계에서 펼치고 식 입력 → 다음 단계(설명)로 → 버튼·패널 숨김 → 다음 무전 단계에서 펼치면 같은 식
4. US3-4: 튜토리얼 끝(건너뛰기) 뒤 자유 조작에서 보임. US3-5: `/episodes/01-calculus-howitzer/`에 `#calcFab` 없음
5. US4-1~3: 버튼·닫기·Esc로 접힘, 다시 펼치면 식·결과 유지, `C` 전부 지움, `⌫` 한 글자, `√` 뒤 `⌫`는 `(`만
6. US4-4 (R3): 튜토리얼 진행 중 펼친 채 Esc → 패널 접힘, `#tut` 보임, 단계 번호 같음, `localStorage['series:race-engineer:tutDone']` 없음. 접힌 상태 Esc → 튜토리얼 끝남(기존 동작)
7. 바깥(무전 입력란) 탭해도 접히지 않음 (FR-006)

### T011 배치·가림·44px

1. 360×640, M3 무전 단계: 펼치기 전 `#calcFab`이 `#tut` 위(버튼 아래 끝 ≤ 카드 위 끝 − 8 ± 1)이고 가운데 점 `elementFromPoint`가 버튼
2. 펼친 뒤: `#calc`와 `#tut`의 교집합 넓이 0, 카드 높이 ≤ 0.38×640 + 1, 패널 위 끝 ≥ 8. 측정값을 `test.info().annotations`로 남김
3. 360×640과 360×568에서 `#radioIn`, `#radioGo`, `#tutNext`, `#calcFab` 각각 가운데 점 `elementFromPoint`가 그 요소(또는 자손) — `expect.poll`로 배치 안정 대기
4. 모든 키·버튼·닫기 44×44 이상, `scrollWidth ≤ 360`
5. 언어를 English로 바꿔도 카드 높이 변화 뒤 버튼이 카드 위에 있음

### T012 M3 완주

1. 360×640, `?from=M3` → 무전 단계 → 펼침 → `√`가 `√(`로 들어가는지 → `1.0×9.8×80)×3.6=` → `#calcRes` = `100.8`
2. `#radioIn` 탭 → 패널 그대로 펼침, `#radioCalc`에 `100.8` 보임 (R5 c)
3. `100.8` 입력 → 보내기 → 통과 피드백. 같은 값을 계산기 없이 보낸 경우와 같은 결과 (FR-011)
4. 오류 식(`(-8)^(1÷3)` 대신 키패드로 `(−8)^(1÷3)=`)에 새 문구, `#radioCalc` 숨김
5. 식을 고치면 결과줄과 `#radioCalc`가 비워짐

### T013 전체 회귀와 단언 실행 확인

1. 조건부·나중에 나타나는 요소 단언(`#radioCalc`, `elementFromPoint`)을 하나씩 일부러 틀려 실패하는지 확인하고 되돌림 (main.md 공통 규칙)
2. `pnpm check`, `pnpm test:e2e` 전체 통과. 기존 테스트 파일은 수정하지 않음 (NFR-003)
3. PR용 스크린샷: 360×640 M3에서 펼친 상태, 입력란 위 결과 줄 상태
4. `pnpm preview`를 띄웠다면 4173 포트 node 종료

## Definition of Done

- [ ] `e2e/calculator.spec.ts` 통과 (로컬 chromium), CI 세 엔진 testMatch 포함
- [ ] `pnpm test:e2e` 전체 통과, 기존 테스트 무수정
- [ ] 단언 실행 확인 기록 (PR 본문)
- [ ] `test(WP02): …` 커밋

## Risks

- WebKit ResizeObserver 타이밍 → 위치 단언은 `expect.poll`
- `isMobile`에서 Esc는 `page.keyboard.press('Escape')`로 보냄 (터치 기기 가정과 별개로 키 이벤트 전달 확인)
- 360×568에서 가림이 발견되면 WP01 배치 규칙을 고친다. 스펙 규칙으로 해결이 안 되면 멈추고 사람에게 묻는다 (PRJ-005)

## Reviewer guidance

교집합·`elementFromPoint` 단언이 실제로 값을 재는지(측정값 주석), 기존 테스트 파일이 바뀌지 않았는지 본다.
