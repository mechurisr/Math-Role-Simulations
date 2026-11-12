# Tasks: 공통 엔진 떠 있는 미니 계산기

**Mission**: `floating-calculator-01M755VB` · **Branch**: `mission/engine-floating-calculator` (PR → `main`) · **Issue**: #31
**Inputs**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [answers.md](answers.md), [quickstart.md](quickstart.md)

구현은 기능 브랜치에서 WP 순서대로 직접 하고 WP마다 커밋한다 (`feat(WPnn): …`). `/spec-kitty.implement`는 쓰지 않는다 (docs/agents/main.md 6절).

## Subtask Index

| ID | 내용 | WP | Parallel |
|---|---|---|---|
| T001 | 식 해석 `evaluate` (토큰화·괄호 검사·재귀 하강·계산 오류) | WP01 | |
| T002 | 결과 표시 `formatResult`, 오류 문구 `CALC_ERROR_TEXT` | WP01 | |
| T003 | 단위 테스트: answers P1~P26, E1~E21, D1~D15, §4 미션 식 | WP01 | [P] |
| T004 | 계산기 모듈: 원형 버튼·패널·키패드(5열 23키)·상태·`√(`·한/영 | WP01 | |
| T005 | 접기 규칙과 Esc 우선 처리, `setAvailable`, `onResult` | WP01 | |
| T006 | 카드 피하기 배치(ResizeObserver, 8px, R8)와 `calc-open` 38vh | WP01 | |
| T007 | 엔진 공개 경로 `@series/engine/calculator`, 의존 규칙 | WP01 | |
| T008 | 02 적용: 단계별 `setAvailable`, 무전 입력란 위 결과 줄 | WP01 | |
| T009 | e2e 설정: `e2e/calculator.spec.ts` 뼈대, CI testMatch | WP02 | |
| T010 | 단계 표시·식 유지·Esc 테스트 (US3, US4) | WP02 | |
| T011 | 배치 테스트: 360×640 겹침 0, 360×568 가림 0, 44px, 가로 스크롤 (NFR-002) | WP02 | |
| T012 | M3 완주 테스트: 키패드 입력 → 결과 줄 → 보내기 → 통과 (US1, SC-001) | WP02 | |
| T013 | 전체 회귀·단언 실행 확인 (일부러 실패), 스크린샷 | WP02 | |

## WP01 — 엔진 계산기와 레이스 엔지니어 적용

- **Goal**: 식 계산 순수 함수와 떠 있는 계산기를 엔진에 넣고, 02의 무전 단계·자유 조작에서 쓸 수 있게 한다 (MVP)
- **Priority**: P1 (US1, US2 핵심 + US3, US4)
- **Independent test**: `pnpm check` 통과(단위 테스트 전부). `pnpm dev`로 quickstart 손 확인 1~8
- **Prompt**: [tasks/WP01-engine-calculator.md](tasks/WP01-engine-calculator.md) (~330 lines)
- **Dependencies**: none

T001 식 해석 evaluate (WP01)
T002 결과 표시 formatResult와 오류 문구 (WP01)
T003 식 해석 단위 테스트 (WP01)
T004 계산기 모듈 DOM·상태·키패드 (WP01)
T005 접기 규칙·Esc·setAvailable·onResult (WP01)
T006 카드 피하기 배치와 38vh (WP01)
T007 엔진 공개 경로와 의존 규칙 (WP01)
T008 레이스 엔지니어 적용과 입력란 위 결과 줄 (WP01)

- **Implementation sketch**: T001→T002→T003으로 순수 함수를 먼저 끝내고 `pnpm test`로 고정 → T004~T006 화면 → T007 export → T008 02 연결
- **Parallel**: T003은 T001·T002 시그니처가 정해지면 먼저 써도 됨 (테스트 우선)
- **Risks**: 문법 층 순서(붙여 쓴 곱 vs `×÷` vs `^`), 괄호 검사를 파싱보다 먼저, 반올림 후 10¹⁰ 경계, 카드 높이 변화 추적, 기존 e2e의 44px 검사(자유 조작에서 원형 버튼이 보임)

## WP02 — 브라우저 테스트

- **Goal**: 배치·가림·단계 표시·Esc·완주를 실제 렌더로 단언해 NFR-002, NFR-003, SC-001, SC-003~005를 닫는다
- **Priority**: P1 (헌장 PRJ-004, 정식 경로 PR 조건)
- **Independent test**: `pnpm exec playwright test e2e/calculator.spec.ts` 통과, `pnpm test:e2e` 전체 통과(기존 테스트 무수정)
- **Prompt**: [tasks/WP02-browser-tests.md](tasks/WP02-browser-tests.md) (~250 lines)
- **Dependencies**: WP01

T009 e2e 뼈대와 CI testMatch (WP02)
T010 단계 표시·식 유지·Esc 테스트 (WP02)
T011 배치·가림·44px 테스트 (WP02)
T012 M3 완주 테스트 (WP02)
T013 전체 회귀와 단언 실행 확인 (WP02)

- **Implementation sketch**: 도우미(시작, 단계 이동, 계산기 열기, 키 누르기) → 단계 표시 → 배치 → 완주 → 전체 실행
- **Parallel**: T010~T012는 같은 파일이라 순서대로
- **Risks**: WebKit의 ResizeObserver 타이밍 → `expect.poll`. 아직 나타나지 않은 요소를 재는 단언은 일부러 한 번 실패시켜 실제로 도는지 확인 (main.md 공통 규칙)

## Coverage

| 요구 | WP |
|---|---|
| FR-001~003, NFR-001, C-001, C-005 | WP01 (T001~T003) |
| FR-004~009, FR-012, NFR-004 | WP01 (T004~T007) |
| FR-010, FR-011, FR-013, C-002, C-003 | WP01 (T008) |
| NFR-002, NFR-003, NFR-005(머지 후 수동), SC-001~005 | WP02 |
| C-004 범위 밖 | 두 WP 모두 (만들지 않음) |
