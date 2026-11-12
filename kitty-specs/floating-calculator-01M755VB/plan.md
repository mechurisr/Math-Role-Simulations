# Implementation Plan: 공통 엔진 떠 있는 미니 계산기

**Branch**: `mission/engine-floating-calculator` (target/merge: same, PR은 `main`으로) | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/floating-calculator-01M755VB/spec.md` (검토 반영: [spec-review.md](spec-review.md) "반영 결과")

## Summary

공통 엔진에 떠 있는 미니 계산기를 넣고 02 레이스 엔지니어의 무전 입력 단계와 자유 조작에 켠다. 식 해석·결과 표시는 엔진 수학 모듈의 순수 함수(`evaluate`, `formatResult`)로 두고, 화면은 새 엔진 모듈 `calculator`가 맡는다. 원형 버튼은 튜토리얼 카드 위로 올라가고, 계산기는 버튼 왼쪽에 펼쳐지며 그동안 카드 최대 높이를 38vh로 줄인다. Esc는 계산기가 먼저 가져가 튜토리얼 종료를 막는다. 에피소드는 단계마다 "보임/숨김"만 정하고, 무전 입력란 위 결과 줄을 엔진의 결과 알림으로 갱신한다. 판정 코드는 바꾸지 않는다.

## Technical Context

**Language/Version**: TypeScript (strict), HTML/CSS — 기존 모노레포 그대로
**Primary Dependencies**: Vite, `@series/engine` (i18n, ui, tutorial). 새 런타임·개발 의존성 없음 (공급망 점검 대상 없음)
**Storage**: 없음. 식과 결과는 페이지 메모리에만 (새로고침하면 사라짐 — 스펙은 "접었다 펼치기·단계 오가기"만 유지를 요구)
**Testing**: Vitest (`engine/tests/expression.test.ts`: answers P·E·D 전부), Playwright (`e2e/calculator.spec.ts`: 배치·가림·단계 표시·Esc·M3 완주·44px). 새 e2e 파일은 CI Firefox·WebKit `testMatch`에 추가
**Target Platform**: 최신 데스크톱·모바일 브라우저 (Chromium, Firefox, WebKit/iOS Safari)
**Project Type**: web (정적 사이트, 엔진 모듈 추가 + 기존 에피소드 수정)
**Performance Goals**: 키 입력 → 표시줄 갱신, `=` → 결과가 100ms 안 (NFR-004). 식 100자 이하 재귀 하강 파싱은 마이크로초 단위라 여유 큼
**Constraints**: 360×640 겹침 0, 360×568 조작 요소 가림 0, 44×44px, 가로 스크롤 0 (NFR-002), 기존 e2e 무수정 통과 (NFR-003), `src/model/` 불변 (C-003), eval 금지 (FR-001), 한/영 (FR-012)
**Scale/Scope**: 엔진 수학 파일 1개, 엔진 UI 모듈 1개(+CSS), 튜토리얼 CSS 한 줄, 02 에피소드 3~4개 파일 수정, e2e 1개

## Charter Check

헌장: `.kittify/charter/charter.md` (PRJ-001~010)

| 규칙 | 이 계획에서 | 판정 |
|---|---|---|
| PRJ-001 출처 주석 | 물리값 없음. π는 `Math.PI` 주석, 배치 수치(38vh, 8px)는 스펙·answers 근거 주석 | 준수 |
| PRJ-002 단위 테스트 | `evaluate`·`formatResult`에 answers의 P1~P26, E1~E21, D1~D15 전부 | 준수 |
| PRJ-003 엔진만 의존 | 02는 `@series/engine/calculator`(새 공개 경로)만 import. `check:boundaries` 통과 | 준수 |
| PRJ-004 모바일 | 360×640·360×568 배치 e2e, 44px 측정 | 준수 |
| PRJ-005 수학 오류 시 중단 | 스펙 검토 C2(문구 오류) 반영 완료. 구현 중 규칙으로 안 정해지는 식은 C-005대로 질문 | 준수 |
| PRJ-006 스펙 항목 | 8항목·answers 분리 완료 | 준수 |
| PRJ-007 한/영 | 키 접근성 이름·닫기·오류 6종·결과 줄 모두 `P(ko, en)` | 준수 |
| PRJ-008 PR·CI | 기능 브랜치 → PR. 정식 경로라 로컬 e2e 전체 실행 | 준수 |
| PRJ-009 비밀값 | 해당 없음 | 준수 |

위반 없음 → Complexity Tracking 생략. Phase 1 설계 뒤 재확인: 변화 없음.

## Project Structure

### Documentation (this mission)

```
kitty-specs/floating-calculator-01M755VB/
├── spec.md · answers.md · spec-review.md
├── plan.md · research.md · data-model.md · quickstart.md
└── tasks.md   (/spec-kitty.tasks 출력)
```

### Source Code (repository root)

```
engine/
├── package.json                 # exports에 "./calculator" 추가
├── src/math/
│   ├── expression.ts            # 새로: tokenize → parse → evaluate, formatResult (순수)
│   └── index.ts                 # export 추가
├── src/calculator/
│   ├── index.ts                 # 새로: createCalculator (버튼·패널·키패드·배치·Esc·결과 알림)
│   └── calculator.css           # 새로: z-index 1002~1099 사이, 44px 키, 5열 그리드
├── src/tutorial/tutorial.css    # body.calc-open .tut{max-height:38vh} 한 줄
└── tests/expression.test.ts     # 새로
episodes/02-race-engineer/
├── index.html                   # 무전 상자에 결과 줄 자리(#radioCalc), 계산기 CSS 링크
└── src/
    ├── main.ts                  # createCalculator, onRender·onEnd에서 setAvailable
    ├── view/radio.ts            # 결과 줄 갱신
    └── strings.ts               # (필요하면) 결과 줄 문구
e2e/calculator.spec.ts           # 새로
playwright.config.ts             # CI testMatch에 calculator 추가
```

**Structure Decision**: 계산은 `engine/src/math/`(순수, 단위 테스트), 화면은 새 엔진 모듈 `engine/src/calculator/`로 나눈다(C-001). 튜토리얼 엔진의 JS는 바꾸지 않고 CSS 한 줄만 더한다. 01 자주포는 수정하지 않는다.

## Design decisions

자세한 근거와 대안은 [research.md](research.md).

- **D1 식 해석**: 문자 단위 토큰화 → 재귀 하강 파서 → 값 계산. 문법은 data-model.md. `-`와 `−`, `*`/`×`, `/`/`÷`는 같은 토큰. 오류는 예외가 아닌 `{ ok:false, reason }` 반환
- **D2 정수 지수 판정**: 음수 밑일 때 계산된 지수에 `Number.isInteger` (P25, E17)
- **D3 Esc**: 계산기가 `window`에 캡처 단계 keydown을 걸고, 펼쳐져 있으면 접은 뒤 `stopPropagation()`. 튜토리얼의 `document` 버블 단계 리스너에 닿지 않는다. 튜토리얼 JS 수정 없음
- **D4 배치**: 카드(`#tut`)를 `ResizeObserver`로 보고, 카드가 보이면 버튼 `bottom = innerHeight − card.top + 8`. 계산기는 버튼 왼쪽, 아래 끝을 버튼 아래 끝에 맞추고 `top < 8`이면 `top = 8`로 내린다(R8). 카드 높이 축소는 `body.calc-open` 클래스 + 튜토리얼 CSS. 카드를 찾는 방법은 `createCalculator({ avoid: () => HTMLElement | null })` 옵션으로 받아 엔진 모듈끼리 직접 묶지 않는다
- **D5 단계별 켜고 끄기**: 엔진은 `setAvailable(boolean)`만 제공. `false`면 접고 버튼 숨김, 식 유지(FR-009). 02는 `onRender`에서 `step.radio && !step.radioHidden?.(state)`, `onEnd`(자유 조작)에서 `true`. 첫 화면(튜토리얼 시작 전, 완료 후 재방문 포함)은 `false`
- **D6 결과 알림**: `onResult(cb)`로 "값 결과 문자열 또는 null"을 알림. 02의 `radio.ts`가 `#radioCalc`에 "계산기 결과 100.8"로 표시(FR-013). 오류·빈 결과는 null → 줄 숨김
- **D7 휴대폰 키보드 차단**: 식 표시줄은 입력 요소가 아닌 `output`(`aria-live="polite"`)이라 OS 키보드가 뜨지 않는다. 키는 `<button>`

## Implementation Concern Map

> 작업 패키지가 아니라 관심사 목록이다. `/spec-kitty.tasks`에서 "계산 + 그 계산을 쓰는 화면"으로 묶는다.

### IC-01 — 식 해석과 결과 표시 (순수 함수)

- **Purpose**: 2절 규칙대로 식을 계산하고 결과 문자열을 만든다
- **Relevant requirements**: FR-001, FR-002, FR-003, NFR-001, C-001, C-005
- **Affected surfaces**: `engine/src/math/expression.ts`, `engine/src/math/index.ts`, `engine/tests/expression.test.ts`
- **Sequencing/depends-on**: none
- **Risks**: 붙여 쓴 곱(우선순위 4)이 `×÷`보다 높고 `^`보다 낮은 층이라 문법 층 순서를 틀리기 쉬움(`1÷2π`, `2π^2`, `2^3π`). 단항 −는 `^`보다 낮지만 지수 자리의 −는 허용(`2^-1^2`). 반올림 후 10¹⁰ 경계(D8). 호출처가 IC-02에 있으므로 같은 묶음에 넣어야 죽은 코드 점검을 피함

### IC-02 — 계산기 화면과 카드 배치 (엔진)

- **Purpose**: 원형 버튼·패널·키패드, 카드 위 배치, 38vh, Esc, 결과 알림을 엔진 모듈로 만든다
- **Relevant requirements**: FR-004~FR-009, FR-012, NFR-004
- **Affected surfaces**: `engine/src/calculator/`, `engine/package.json`, `engine/src/tutorial/tutorial.css`
- **Sequencing/depends-on**: IC-01
- **Risks**: 카드 높이 변화(단계 전환·언어 전환)를 놓치면 버튼이 카드에 깔림 → ResizeObserver + resize. `√` 키가 `√(`를 넣고 `⌫`는 한 글자만. 언어 전환 시 라벨 갱신(`data-i18n` 또는 재렌더)

### IC-03 — 레이스 엔지니어 적용과 입력란 위 결과

- **Purpose**: 02의 무전 단계와 자유 조작에서만 계산기를 켜고, 무전 입력란 위에 결과 줄을 보인다
- **Relevant requirements**: FR-010, FR-011, FR-013, C-002, C-003
- **Affected surfaces**: `episodes/02-race-engineer/index.html`, `src/main.ts`, `src/view/radio.ts`, `src/strings.ts`
- **Sequencing/depends-on**: IC-02
- **Risks**: 결과 줄이 카드 높이를 늘려 360×568에서 입력란이 계산기에 덮일 수 있음 → IC-04에서 측정. `src/model/` 변경 금지

### IC-04 — 브라우저 테스트

- **Purpose**: 배치·가림·단계 표시·Esc·완주를 실제 렌더로 단언한다
- **Relevant requirements**: NFR-002, NFR-003, SC-001, SC-003~SC-005, US1~US4
- **Affected surfaces**: `e2e/calculator.spec.ts`, `playwright.config.ts`
- **Sequencing/depends-on**: IC-03
- **Risks**: 아직 나타나지 않은 요소를 재는 단언은 한 번 일부러 실패시키거나 측정값을 출력해 실제로 도는지 확인(main.md 공통 규칙). WebKit에서 `elementFromPoint`·ResizeObserver 타이밍 차이 → 배치가 안정될 때까지 `expect.poll`
