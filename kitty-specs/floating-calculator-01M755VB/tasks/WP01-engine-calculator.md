---
work_package_id: WP01
title: 엔진 계산기와 레이스 엔지니어 적용
dependencies: []
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- NFR-001
- NFR-004
planning_base_branch: mission/engine-floating-calculator
merge_target_branch: mission/engine-floating-calculator
branch_strategy: Planning artifacts for this mission were generated on mission/engine-floating-calculator. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/engine-floating-calculator unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
phase: Phase 1 - MVP
history:
- at: '2026-11-12T11:30:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: engine/src/calculator/
create_intent:
- engine/src/math/expression.ts
- engine/tests/expression.test.ts
- engine/src/calculator/index.ts
- engine/src/calculator/calculator.css
execution_mode: code_change
model: ''
owned_files:
- engine/src/math/expression.ts
- engine/src/math/index.ts
- engine/tests/expression.test.ts
- engine/src/calculator/index.ts
- engine/src/calculator/calculator.css
- engine/src/tutorial/tutorial.css
- engine/package.json
- episodes/02-race-engineer/src/main.ts
- episodes/02-race-engineer/src/view/radio.ts
- episodes/02-race-engineer/src/style.css
- episodes/02-race-engineer/index.html
role: implementer
tags: []
tracker_refs: []
---

# WP01 — 엔진 계산기와 레이스 엔지니어 적용

## ⚡ Do This First: Load Agent Profile

배정된 프로필이 있으면 `/ad-hoc-profile-load <agent_profile>`로 먼저 불러온다. 비어 있으면 메인 세션 지시(`docs/agents/main.md`)와 헌장(`.kittify/charter/charter.md`)을 따른다.

## Objective

스펙 2절 규칙대로 식을 계산하는 순수 함수와, 튜토리얼 카드와 함께 쓰는 떠 있는 계산기를 엔진에 넣는다. 02 레이스 엔지니어의 무전 입력 단계와 자유 조작에서 계산기를 켜고, 무전 입력란 위에 결과 줄을 보인다. 판정·물리 코드(`episodes/02-race-engineer/src/model/`)는 건드리지 않는다 (C-003).

## Branch Strategy

- 계획·구현 브랜치: `mission/engine-floating-calculator`. 최종 머지 대상도 같고, 사람이 PR로 `main`에 머지한다
- Spec Kitty lane·worktree는 쓰지 않는다. 이 브랜치에서 직접 구현하고 끝나면 `feat(WP01): …`로 커밋한다

## Context

- 규칙과 기대값: `spec.md` 2절(우선순위 표, 오류 6종, 결과 표시), `answers.md` §1~§4
- 문법·타입·상태 전이: `data-model.md`. 결정 근거: `research.md` R1~R8
- 기존 코드: `engine/src/tutorial/index.ts`(카드 `#tut`, Esc는 `document` 버블 리스너 103행), `engine/src/tutorial/tutorial.css:6`(카드 48vh, z 1001), `engine/src/ui/components.css`(언어 버튼 1002, 툴팁 1100), `engine/src/i18n/index.ts`(`tr`, `P`, `tx`, `onLangChange`)
- 02: `episodes/02-race-engineer/src/main.ts:141` `createTutorial`의 `onRender`·`onEnd`, `src/view/radio.ts`, `src/missions/index.ts:21` `MissionStep.radio`/`radioHidden`

## Subtasks

### T001 식 해석 `evaluate`

**Files**: `engine/src/math/expression.ts` (새로, ~150줄)

1. 파일 머리에 출처 주석: 규칙은 `kitty-specs/floating-calculator-01M755VB/spec.md` 2절, π는 `Math.PI`(IEEE 754 배정밀도 최근접값)
2. 정규화: `-`→`−`, `*`→`×`, `/`→`÷`, 공백 제거
3. **괄호 검사 먼저** (research R2): 왼쪽부터 깊이를 세어 음수가 되거나 끝에서 0이 아니면 `{ ok:false, reason:'brackets' }` (E9 `(1+2`, E10 `1+2)`, E11 `)1(`, E21 `√(2`)
4. 토큰화: 숫자(`digits('.'digits?)?` 또는 `'.'digits`), `π`, 연산자, `√`, 괄호. 소수점 둘(`1.2.3`)·소수점만(`.`) → `syntax`
5. 재귀 하강 (data-model.md 1절 문법 그대로, 층마다 함수 하나):
   - `expr`(+,−) → `term`(×,÷) → `unary`(앞 −) → `implicit`(다음 토큰이 숫자·π·`(`·`√`이면 곱) → `power`(`root ('^' expUnary)?`, 오른쪽 결합) → `root`(`√ rootArg | atom`) → `atom`
   - `expUnary := '−' expUnary | power`, `rootArg := '−' rootArg | root`
   - 빈 식, 빈 괄호, 연산자로 끝남, `−` 외 연산자로 시작, 남은 토큰 → `syntax`
6. 계산 중 검사 (R3): `÷0` → `divZero`; `0^b`(b<0) → `divZero`; `0^0` → `notReal`; `√a`(a<0) → `notReal`; `a^b`(a<0, `!Number.isInteger(b)`) → `negBase`; 연산 결과 `!Number.isFinite` → `tooLarge`. 언더플로 0은 정상
7. 반환형 `EvalResult = { ok:true, value } | { ok:false, reason: CalcError }`. 예외를 밖으로 던지지 않는다 (내부에서 던지면 잡아서 `syntax`)

**Validation (손 계산과 같은지)**: `1÷2π`=0.159…, `2π^2`=19.739…, `2^3π`=25.13…, `2^-1^2`=0.5, `-2^2`=−4, `6÷2(1+2)`=1, `√9^2`=9, `√-4`→notReal, `(-8)^(6÷3)`=64, `(-8)^(1÷3)`→negBase

### T002 결과 표시와 오류 문구

**Files**: `engine/src/math/expression.ts`

1. `formatResult(v)` (R4): `v === 0`(−0 포함) → `'0'`. `r = Number(v.toPrecision(10))`. `|r| >= 1e10 || |r| < 1e-6` → `r.toExponential(9)`를 가수·지수로 나눠 가수의 끝 0·소수점 제거, `${가수}×10^${지수}`(지수의 `+` 제거). 그 밖은 `String(r)`
2. `CALC_ERROR_TEXT: Record<CalcError, Text>` — data-model.md 2절 표의 ko/en 그대로 (i18n은 `../i18n`의 `P`)
3. 경계 확인: D8 `9999999999.6` → `1×10^10`, D9 `0.000001` → `0.000001`, D10 → `1×10^-7`, D12 `0×-1` → `0`, D14 `10^-400` → `0`, D15 `10^308` → `1×10^308`

### T003 단위 테스트

**Files**: `engine/tests/expression.test.ts` (새로)

1. answers §1 P1~P26: `evaluate` 값이 기대값과 상대 오차 1e-12(0이면 절대 1e-12), `formatResult` 문자열 일치. 표 형태 배열 + `it.each`
2. §2 E1~E21: `reason` 코드 일치. E1 빈 식은 `''`
3. §3 D1~D15: `formatResult(evaluate(식).value)` 문자열 일치
4. §4 미션 식(M1 참고, M2, M3, M4, M7 코너 3): 표시 문자열 일치
5. 오류 문구 6종이 ko/en 모두 비어 있지 않고 스펙 2절 표와 같은지
6. 키패드 기호(`−×÷`)와 ASCII(`-*/`)가 같은 값을 내는지 한두 사례
7. 일부러 기대값 하나를 틀려 실패하는지 한 번 확인한 뒤 되돌린다

### T004 계산기 모듈

**Files**: `engine/src/calculator/index.ts` (새로, ~180줄), `engine/src/calculator/calculator.css` (새로)

1. `createCalculator(o: { avoid?: () => HTMLElement | null } = {})` → `{ setAvailable, onResult, get open }` (data-model.md 3절)
2. DOM: 원형 버튼 `button#calcFab`(`aria-expanded`, `aria-controls`, 접근성 이름 "계산기 열기/닫기"), 패널 `div#calc[role=dialog]`: 식 줄(`output#calcExpr` + 오른쪽 닫기 `button#calcClose` ×), 결과줄 `output#calcRes`(`aria-live="polite"`), 키패드 `div.calc-keys` 5열
3. 키 배치 (spec 4절 표): `C ⌫ ( ) ÷` / `7 8 9 √ ×` / `4 5 6 ^ −` / `1 2 3 π +` / `0`(2칸) `.` `=`(2칸). 모두 `<button type="button">`, 44×44 이상, 간격 4px, `data-key`
4. 키 동작 (상태 전이 표): 일반 키는 기호 추가, `√`는 `√(` 추가, `⌫` 마지막 한 글자, `C` 전부, `=`는 `evaluate`. 식을 고치면 결과 비움. 결과줄: 값이면 `formatResult`, 오류면 `CALC_ERROR_TEXT`
5. 접근성 이름: `−` "빼기/minus", `×` "곱하기/times", `÷` "나누기/divide", `^` "거듭제곱/power", `√` "제곱근/square root", `π` "파이/pi", `⌫` "한 글자 지우기/delete", `C` "모두 지우기/clear", `=` "계산/equals". `onLangChange`로 라벨·결과 문구 다시 그림 (식 유지)
6. 식 줄이 길면 줄바꿈(`overflow-wrap:anywhere`), 계산기 너비 고정
7. CSS: 테마 변수(`--panel`, `--ink`, `--line`, `--accent`) 사용, 버튼·패널 z-index 1050 (카드 1001 위, 툴팁 1100 아래), `position:fixed`

### T005 접기 규칙·Esc·노출 제어

**Files**: `engine/src/calculator/index.ts`

1. 원형 버튼 토글, 닫기(×)로 접기. 바깥 클릭에는 아무것도 하지 않는다
2. Esc (R5): `window.addEventListener('keydown', h, { capture:true })`. `open && e.key==='Escape'`이면 접고 `e.stopPropagation()`. 접혀 있으면 아무것도 안 함 → 튜토리얼이 기존대로 처리
3. 펼칠 때 `document.body.classList.add('calc-open')`, 접을 때 제거
4. `setAvailable(on)`: false면 접고 버튼 `hidden`, 식·결과 유지. true면 버튼 보임
5. `onResult(cb)`: 결과가 바뀔 때마다 `cb(값이면 formatResult 문자열, 아니면 null)`. 구독 즉시 현재 값으로 한 번 호출

### T006 카드 피하기 배치와 38vh

**Files**: `engine/src/calculator/index.ts`, `engine/src/calculator/calculator.css`, `engine/src/tutorial/tutorial.css`

1. `tutorial.css`에 `body.calc-open .tut{max-height:38vh}` 한 줄 + 주석(스펙 4절, answers Physical values)
2. `place()` (R6): `const c = o.avoid?.()`; 카드가 보이면(`!c.hidden && rect.height>0`) 버튼 `bottom = innerHeight − rect.top + 8`, 아니면 `max(12px, safe-area)`. 오른쪽 여백은 카드 오른쪽 끝과 맞춤(카드가 없으면 12px)
3. 계산기 패널: `right = 버튼 right + 버튼 폭 + 8`, `bottom = 버튼 bottom`, 폭은 `min(284px, 남는 폭)`. 패널 높이 h에 대해 `innerHeight − bottom − h < 8`이면 `bottom = innerHeight − 8 − h` (R8: 카드 위쪽에 겹침)
4. 호출 시점: `ResizeObserver`(카드·패널), `resize`, 펼침·접힘, 카드 `hidden` 변화(`MutationObserver` attributes `hidden`). `requestAnimationFrame` 한 번으로 묶기
5. 360×640 기대값: 카드 위 384.8, 버튼 아래 끝 376.8, 패널 위 끝 ≈24.8 (answers Physical values) — 개발 중 콘솔로 한 번 출력해 확인

### T007 공개 경로와 의존 규칙

**Files**: `engine/package.json`

1. `exports`에 `"./calculator": "./src/calculator/index.ts"` 추가. `engine/src/math/index.ts`에 `export * from './expression'`
2. CSS는 기존 `./css/*` 경로로 `@series/engine/css/calculator/calculator.css`
3. `pnpm check`의 `check:boundaries` 통과 확인 (에피소드는 엔진 공개 경로만)

### T008 레이스 엔지니어 적용

**Files**: `episodes/02-race-engineer/src/main.ts`, `src/view/radio.ts`, `index.html`(필요 시), `src/style.css`

1. `main.ts`: CSS import 추가, `const calc = createCalculator({ avoid: () => $('tut') })`. 처음엔 `setAvailable(false)`
2. `onRender`: `calc.setAvailable(!!step.radio && !step.radioHidden?.(c.state))`
3. `onEnd`: 자유 조작 진입 시 `calc.setAvailable(true)` (기존 `configure(FREE)`와 함께)
4. 입력란 위 결과 줄 (FR-013, R5 c): `radio.ts`에 `setCalcResult(s: string | null)` 추가. `#radioIn` 바로 위(`radio-row` 앞)에 `div#radioCalc` — `hidden`이 기본, 값이면 "계산기 결과 / Calculator result" + 큰 숫자. `calc.onResult(radio.setCalcResult)`로 연결. 언어 전환 시 라벨 갱신
5. 스타일: 결과 숫자 22~26px, 연한 배경 (캔버스 시안 `r5-c-카드안크게.html` 참고)
6. `src/model/`은 수정하지 않는다. 판정은 입력란 값만 본다 (FR-011)

## Definition of Done

- [ ] `pnpm check` 통과 (단위 테스트에 answers 사례 전부)
- [ ] 기존 `pnpm test:e2e` 중 race-engineer·mobile·touch-targets가 수정 없이 통과 (로컬 chromium)
- [ ] quickstart 손 확인 1~8 (360×640, 360×568)
- [ ] 새 문구 전부 한/영
- [ ] `feat(WP01): …` 커밋

## Risks

- 문법 층 순서 실수 → T003의 P12~P15가 잡음
- 기존 `touchSizes`는 보이는 모든 버튼을 잰다. 자유 조작에서 원형 버튼이 44px 미만이면 기존 테스트가 깨짐
- 카드 높이가 결과 줄로 늘어나면 360×568에서 입력란이 패널에 덮일 수 있음 → WP02 T011이 측정, 덮이면 결과 줄 여백을 줄이거나 사람에게 물음

## Reviewer guidance

`evaluate`가 `eval`/`Function`을 쓰지 않는지, 오류 판정 순서(괄호 → 토큰 → 문법 → 계산), Esc가 열린 상태에서만 전파를 막는지, 02에서 `src/model/` 변경이 없는지 본다.
