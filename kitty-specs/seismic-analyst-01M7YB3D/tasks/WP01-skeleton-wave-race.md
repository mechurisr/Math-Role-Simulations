---
work_package_id: WP01
title: 뼈대와 두 파의 경주 (M1)
dependencies: []
requirement_refs:
- C-001
- C-002
- C-004
- C-005
- FR-002
- FR-007
- FR-008
- FR-009
- FR-010
- FR-013
- NFR-003
- NFR-004
- NFR-005
planning_base_branch: mission/03-seismic-analyst
merge_target_branch: mission/03-seismic-analyst
branch_strategy: Planning artifacts for this mission were generated on mission/03-seismic-analyst. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/03-seismic-analyst unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - Foundation + Story 1
history:
- at: '2026-11-21T08:01:24Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/03-seismic-analyst/
create_intent:
- episodes/03-seismic-analyst/episode.json
- episodes/03-seismic-analyst/index.html
- episodes/03-seismic-analyst/package.json
- episodes/03-seismic-analyst/src/main.ts
- episodes/03-seismic-analyst/src/strings.ts
- episodes/03-seismic-analyst/src/style.css
- episodes/03-seismic-analyst/src/model/constants.ts
- episodes/03-seismic-analyst/src/model/waves.ts
- episodes/03-seismic-analyst/src/model/judge.ts
- episodes/03-seismic-analyst/src/model/progress.ts
- episodes/03-seismic-analyst/src/view/race.ts
- episodes/03-seismic-analyst/src/missions/index.ts
- episodes/03-seismic-analyst/src/missions/distance.ts
- episodes/03-seismic-analyst/tests/waves.test.ts
- episodes/03-seismic-analyst/tests/judge.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/03-seismic-analyst/episode.json
- episodes/03-seismic-analyst/index.html
- episodes/03-seismic-analyst/package.json
- episodes/03-seismic-analyst/src/main.ts
- episodes/03-seismic-analyst/src/strings.ts
- episodes/03-seismic-analyst/src/style.css
- episodes/03-seismic-analyst/src/model/constants.ts
- episodes/03-seismic-analyst/src/model/waves.ts
- episodes/03-seismic-analyst/src/model/judge.ts
- episodes/03-seismic-analyst/src/model/progress.ts
- episodes/03-seismic-analyst/src/view/race.ts
- episodes/03-seismic-analyst/src/missions/index.ts
- episodes/03-seismic-analyst/src/missions/distance.ts
- episodes/03-seismic-analyst/tests/waves.test.ts
- episodes/03-seismic-analyst/tests/judge.test.ts
- pnpm-lock.yaml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – 뼈대와 두 파의 경주 (M1)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

`episodes/03-seismic-analyst`를 만들고, S-P 시간·거리 순수 계산과 모든 미션이 쓸 공통 판정(중간값 확정 포함)을 만든 뒤, 그 계산을 쓰는 M1 "두 파의 경주" 화면과 튜토리얼 진행을 완성한다.

**독립 확인**: M1에서 거리 슬라이더를 84 → 168 km로 옮기면 S-P 시간이 10 → 20 s로 바뀌고, 210 km의 S-P 시간 25 s(±0.5)를 보내 통과한다. 다시 열면 M1 완료가 남아 있다.

## Context

- 스펙: [../spec.md](../spec.md) · 정답: [../answers.md](../answers.md) · 계획: [../plan.md](../plan.md) · 결정: [../research.md](../research.md) · 모델: [../data-model.md](../data-model.md)
- 수식·물리값 옆에 공식과 출처 주석 (PRJ-001). 에피소드는 `@series/engine`만 import (PRJ-003, `pnpm check:boundaries`)
- 학습자 문구는 `P(ko, en)` (PRJ-007). 모든 조작 44×44 px (PRJ-004)
- 설명 깊이: 01 자주포 튜토리얼처럼 "상황 → 직접 보기 → 의미 → 계산 → 왜 중요한가"(FR-010). `episodes/01-calculus-howitzer/src/missions.ts`의 분량과 비교한다 (읽기만, import 금지)
- 엔진·01·02는 수정하지 않는다 (C-003, research R1)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/03-seismic-analyst`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다 (docs/agents/main.md 6절). 끝나면 `feat(WP01): …`로 커밋한다.

## Subtasks

### T001: 뼈대

- `episodes/_template/`을 `episodes/03-seismic-analyst/`로 복사한다 (`node_modules` 제외)
- `episode.json`: `id` `seismic-analyst`, `number` 3, `slug` `03-seismic-analyst`, `status` `draft`, 제목·역할·요약 한/영(스펙 Role Setting에서), `concepts` ["S-P 시간", "원의 방정식", "두 원의 교점", "잔차"], `difficulty` 3. 02의 `episode.json` 형식을 그대로 따른다
- `package.json` 이름 `@series/episode-03-seismic-analyst`, 의존 `@series/engine: workspace:*`
- `index.html`: 지도/기록 캔버스와 조작부 자리. 템플릿의 `motion.ts`와 그 테스트는 지운다
- `pnpm install`로 잠금 파일 갱신 (새 외부 패키지 없음 — 잠금 파일에 외부 패키지가 늘면 멈추고 보고)

### T002: `model/constants.ts`

data-model.md "상수" 표를 그대로 옮긴다. 값마다 주석에 출처와 상태를 적는다 (answers.md 물리값 표):

- `VP = 6.0`, `VS = 3.5` km/s — `[game value]`, 범위 출처 URL
- `PRACTICE_STATIONS`, `M2_RECORD`, `M3_CANDIDATES`, `GYEONGJU_EPICENTER`(USGS us10006p1f, 깊이 13 km), `M7_STATIONS`, `M8_READINGS`, `M8_VIEW` — 게임용 값은 `[game value]`
- 정답(거리·교점·진앙 km 좌표)은 상수로 넣지 않는다. 계산 함수로 구하고 테스트가 answers.md 값과 비교한다

### T003: `model/waves.ts` + `tests/waves.test.ts` [P]

```ts
export const pArrival = (d: number) => d / VP;           // s
export const sArrival = (d: number) => d / VS;
export const spTime = (d: number) => sArrival(d) - pArrival(d);       // = d (Vp − Vs) / (Vp Vs)
export const distanceFromSp = (dt: number) => dt * VP * VS / (VP - VS); // = 8.4 dt
```

테스트 (독립 기준과 비교, 상대 오차 1e-9):
- `distanceFromSp(1)` = 21 / 2.5 = 8.4 (손계산)
- 84 km → P 14, S 24, S-P 10 / 210 km → 25 / 126 km → 15 (answers.md M1·M2)
- fast-check(시드 고정): `spTime(k·d) = k·spTime(d)`, `distanceFromSp(spTime(d)) = d`
- 0 km → 0 s

### T004: `model/judge.ts` + `tests/judge.test.ts` [P]

data-model.md의 `Verdict`를 쓴다.

- `parseNumber(raw, { positive })`: 빈 값·숫자 아님 → `invalid`. 거리·반지름은 `positive: true`(0 이하 `invalid`), 좌표·계수는 음수 허용
- `judgeValue(input, answer, tol)`: |input − answer| ≤ tol이면 통과(경계 포함), 밖이면 `tooHigh`/`tooLow`
- `judgeIntermediate(input, answer, tol)`: 통과하면 `{ ok: true, confirmed: answer }` — **스펙 "중간값 확정 규칙"**. 화면과 다음 판정은 `confirmed`를 쓴다
- `judgePoint(p, answer, tol)`: 평면 거리 ≤ tol → 통과, 아니면 `far`
- 테스트: M1 24.5 / 25.5 통과, 24.49 / 25.51 불통과. 중간값 통과 시 `confirmed`가 정답값. invalid 입력(빈 값, "abc", 0, −3). 단언이 실제로 도는지 한 번 일부러 실패시켜 확인(작업 흐름 공통 규칙)

### T005: `view/race.ts`

- 진앙(왼쪽)과 관측소(오른쪽) 사이를 P파(빠름)·S파(느림) 원호가 퍼져 나가는 애니메이션. 거리 슬라이더 0~300 km, 1 km 간격
- 아래에 시간 막대 두 줄: P 도착, S 도착, 그 사이 구간에 "S-P 시간 = … s" 라벨. 값은 `waves.ts`에서만 계산
- 슬라이더 값·S-P 시간을 텍스트로도 보여 준다 (e2e가 읽을 수 있게 id 부여)
- 색은 `readCssVars(THEME_KEYS)`를 로드 뒤(`afterStylesLoaded`)와 `onThemeChange`에서 다시 읽는다 (Issue #36 교훈, research R3)

### T006: 미션 진행과 연결

- `missions/index.ts`: 미션 목록과 튜토리얼 단계 조립. `createTutorial`의 `gate`·`on` 사용
- `missions/distance.ts`: M1 단계 — 상황(재난 문자 발송팀이 기다림) → 슬라이더로 보기 → 2배·3배 예상을 먼저 고르기(퀴즈) → 의미(같은 길을 빠르기가 다른 두 파가 갈 때 시간 차는 거리에 비례) → 210 km의 S-P 시간 보내기 → 왜 중요한가(시간 차만 알면 거리를 안다). 미션 문구는 이 파일 안에 `P(ko, en)`
- `model/progress.ts`: 끝낸 미션을 `save`/`load`(`seismic-analyst:*` 키). 깨진 값은 처음 상태. 다시 열면 이어서/처음부터 선택(FR-008)
- `main.ts`: 화면 연결, 언어 버튼(언어를 바꿔도 입력값 유지), 엔진 계산기(`createCalculator`) 띄우기, 조건 카드(Vp·Vs 항상 표시, FR-009)
- `strings.ts`: 공통 UI 문구만

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과 (타입·의존 규칙·단위 테스트)
- 독립 확인 통과 (`pnpm dev`로 직접)
- 새 호출처 없는 코드가 없음 (죽은 코드 점검)
- 엔진·01·02 파일 변경 없음 (`git diff --stat main -- engine episodes/01-calculus-howitzer episodes/02-race-engineer`가 비어 있음)

## Risks

- 중간값 확정을 공통 함수로 만들지 않으면 WP02~06에서 판정이 제각각이 된다
- 템플릿에서 지운 파일이 남아 죽은 코드가 되지 않게

## Reviewer Guidance

answers.md M1·M2 값과 테스트 기대값을 대조하고, 상수에 정답이 박혀 있지 않은지, 모든 물리값에 출처 주석이 있는지 확인한다.
