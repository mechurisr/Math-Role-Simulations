---
work_package_id: WP07
title: 모바일 검증과 공개
dependencies:
- WP05
- WP06
requirement_refs:
- C-003
- FR-019
- FR-020
- NFR-001
- NFR-002
- NFR-006
planning_base_branch: mission/03-seismic-analyst
merge_target_branch: mission/03-seismic-analyst
branch_strategy: Planning artifacts for this mission were generated on mission/03-seismic-analyst. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/03-seismic-analyst unless the human explicitly redirects the landing branch.
subtasks:
- T031
- T032
- T033
- T034
- T035
- T036
phase: Phase 6 - Polish
history:
- at: '2026-11-21T08:01:24Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: e2e/
create_intent:
- e2e/seismic-analyst.spec.ts
- e2e/seismic-analyst-m8.spec.ts
- e2e/seismic-analyst-from.spec.ts
execution_mode: code_change
model: ''
owned_files:
- e2e/seismic-analyst.spec.ts
- e2e/seismic-analyst-m8.spec.ts
- e2e/seismic-analyst-from.spec.ts
- e2e/mobile.spec.ts
- playwright.config.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP07 – 모바일 검증과 공개

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

360px 터치로 M1~M8을 끝까지 도는 e2e, 터치 크기·가로 스크롤·테마·언어 확인, `?from=` 확인용 바로가기를 만들고, 에피소드를 공개(published)로 바꾼 뒤 전체를 확인한다.

**독립 확인**: `pnpm check`, `pnpm test:e2e`, `pnpm build`가 통과하고, 랜딩(`/`)에 03 지진 분석관이 보이며 열린다.

## Context

- 스펙 NFR-001·002·006, FR-019·020, SC-002·003·004 · quickstart.md · 02의 `e2e/race-engineer*.spec.ts`(구조 참고, 복사 아닌 새 작성)
- 작업 흐름 공통 규칙: 조건부 단언(`if (…) expect`)이나 아직 나타나지 않은 요소를 재는 단언은 한 번 일부러 실패시키거나 측정값을 출력해 실제로 실행되는지 확인
- Firefox는 `setViewportSize`가 멈출 수 있어 `test.use({ viewport })`로 (기존 기록). WebKit 로컬 확인은 Docker pw-server(메모리 기록)
- `pnpm preview`를 띄웠다면 끝낼 때 4173 포트 node 프로세스까지 종료
- `main.ts`·`episode.json`은 WP01 소유 — T034·T035는 소유 밖 수정(이유 기록)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/03-seismic-analyst`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다. 끝나면 `feat(WP07): …` 또는 `test(WP07): …`로 커밋한다.

## Subtasks

### T031: `e2e/seismic-analyst.spec.ts`

- `test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true })`
- M1~M7을 터치(`tap`)와 버튼으로 끝까지: M1 25 → M2 마커 버튼으로 3.0/18.0 → 126 → M3 105와 판정 → M4 슬라이더 21에서 "1개" 확인 → 63 → (168, 0, 16800) → M5 → M6 (8, 3, 1220) → (100, 140) → M7 세 관측소 → 좌표
- 각 미션에서 보이는 조작 요소가 모두 44×44 이상(측정 요소가 0개면 실패하게 — 02의 `touchSizes` 방식), 가로 스크롤 ≤ 360
- M7: 판독 전 거리 입력이 비활성인지(US3 시나리오 1)
- SC-003: M4 슬라이더 20 / 21 / 22 / 188 / 189 / 190에서 개수 표시
- 정답 숫자는 answers.md에서 가져왔다고 주석

### T032: `e2e/seismic-analyst-m8.spec.ts` [P]

- `?from=M8`(T034)로 시작. ① 52.92 → ② 버튼으로 추정점을 (96.6, 136.2)까지(버튼 탭 횟수 계산) → 통과
- 끌기 중 `window.scrollY`가 변하지 않음, 추정점 버튼 44×44

### T033: `e2e/mobile.spec.ts` 주소 추가와 테마·언어 [P]

- `mobile.spec.ts`의 URL 목록에 `/episodes/03-seismic-analyst/` 추가 (01·02 테스트는 건드리지 않음)
- `seismic-analyst.spec.ts`에 테마 전환 뒤 캔버스가 비지 않는지(픽셀 샘플)와 언어 전환 뒤 입력값 유지 확인을 추가

### T034: `?from=M1..M8` 바로가기 + `e2e/seismic-analyst-from.spec.ts`

- research R8: 첫 시작만 그 미션의 첫 단계로 열고 진행 기록에 남기지 않음. 앞 미션의 확정값(반지름 등)은 그 미션이 필요한 만큼 채움. 링크는 만들지 않음
- `main.ts`에 몇 줄(소유 밖, 이유 기록). e2e: `?from=M7`로 열면 M7 첫 단계, 다시 열면 기록에 M7 이전 완료가 없음
- `docs/deploy.md`의 바로가기 설명에 03 한 줄 추가(02 항목 옆)

### T035: 공개 전환

- `playwright.config.ts`의 firefox·webkit `testMatch`에 `seismic-analyst[\w-]*` 추가
- `episode.json` `status` → `published`, 랜딩에서 카드가 보이고 열리는지 확인

### T036: 전체 확인

- quickstart.md 8항목을 직접 확인하고 결과를 PR 본문용으로 기록
- `pnpm check`, `pnpm test:e2e`(01 이전 비교 포함 약 8분), `pnpm build` — 실패를 숨기지 않는다
- 엔진·01·02 변경 없음 확인(`git diff --stat main -- engine episodes/01-calculus-howitzer episodes/02-race-engineer`)
- 4173 포트 프로세스 정리

## Definition of Done

- 모든 subtask 완료, 위 명령 모두 통과
- 새로 추가한 조건부 단언을 한 번 일부러 실패시켜 확인함
- 독립 확인 통과

## Risks

- e2e가 길어져 시간 제한에 걸림 → `test.describe.configure({ timeout })`
- 01 이전 비교가 이 WP의 변경 없이도 흔들리면 원인을 기록하고 사람에게 알림

## Reviewer Guidance

측정 요소가 0개일 때 실패하는지, M7 순서 강제가 e2e로도 확인되는지, 공개 전환이 마지막 커밋에 있는지 본다.
