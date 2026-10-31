# Tasks: 레이스 엔지니어 — 구심가속도와 마찰 한계

**Mission**: `race-engineer-01M68BAF` · **Branch**: `mission/02-race-engineer` (planning/merge target 동일, PR은 `main`으로)
**Inputs**: [spec.md](spec.md) · [plan.md](plan.md) · [research.md](research.md) · [data-model.md](data-model.md) · [quickstart.md](quickstart.md)

구현은 기능 브랜치에서 직접 하고 WP마다 커밋한다 (`feat(WPnn): …`). `/spec-kitty.implement`·`spec-kitty merge`는 쓰지 않는다 (docs/agents/main.md 6절).

## WP 나누기

WP는 "계산 + 그 계산을 쓰는 화면"으로 묶었다. 공용 도구도 첫 호출처와 같은 WP에 둔다: 수식 헬퍼는 WP02, 그래프 도구는 WP03. `main.ts`·`strings.ts`는 WP01 소유이고 뒤 WP는 연결 몇 줄만 고친다(소유 밖 수정, 이유 기록). WP05를 빼도 M1~M7이 완결된다.

순서: WP01 → WP02 → WP03 → WP04 → WP05 → WP06 (병렬 없음). MVP는 WP01~WP02.

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | 뼈대: `episodes/_template/` 복사, `episode.json`(number 2, slug `02-race-engineer`, status draft, 난이도 3), `package.json` 이름, `pnpm install` | WP01 | |
| T002 | `model/constants.ts`: g, m, μ, k, 최고 속도 + 출처 주석 | WP01 | |
| T003 | `model/corner.ts`: `requiredForce`, `availableForce`, `gripLimit`, `kmhToMs`, `msToKmh` | WP01 | |
| T004 | `tests/corner.test.ts`: 해석값·독립 기준·경계·fast-check 속성 테스트 | WP01 | |
| T005 | `view/scene.ts`: 코너, 차, 미끄러짐 애니메이션 (research R4) | WP01 | |
| T006 | `view/bars.ts`와 조작부: 힘 막대, 속도·반지름 슬라이더, 노면·윙 버튼, 조건 카드(FR-015), 세 상태 표시 | WP01 | |
| T007 | `model/judge.ts`: 공통 판정 함수와 `RadioAnswer`·`Verdict` | WP02 | |
| T008 | `tests/judge.test.ts`: M1~M3 경계 | WP02 | |
| T009 | `engine/src/ui/formula.ts` + 테스트: MathML 헬퍼 (research R2) | WP02 | |
| T010 | `view/radio.ts`: 무전 입력·전송·결과 표시 | WP02 | |
| T011 | `missions/basic.ts`, `missions/index.ts`: M1~M3 단계와 진행 저장, `main.ts` 연결 | WP02 | |
| T012 | `engine/src/ui/plot.ts` + 테스트: 축척·축·눈금·곡선 | WP03 | |
| T013 | 그래프 범위 계산 + `tests/graph-range.test.ts` (research R3) | WP03 | |
| T014 | `view/graph.ts`: 두 곡선, 교점, 340 km/h 선, 상태 문구 | WP03 | |
| T015 | `missions/downforce.ts`: M4, M5 | WP03 | |
| T016 | `missions/downforce.ts`: M6 | WP03 | |
| T017 | `model/race-radio.ts`: 코너 표와 코너·미션 판정 | WP04 | |
| T018 | `tests/race-radio.test.ts`: answers.md M7 표 전체 | WP04 | |
| T019 | `missions/race.ts`: M7 흐름과 결과 화면 | WP04 | |
| T020 | `view/notes.ts`: 단순화 고지 (FR-012) | WP04 | |
| T021 | `model/friction-circle.ts` + 테스트 | WP05 | |
| T022 | `view/circle.ts`: 원, 횡가속도 기준선, 끌 수 있는 점 | WP05 | |
| T023 | `missions/braking.ts`: M8 | WP05 | |
| T024 | `e2e/race-engineer.spec.ts`: 360px 터치로 M1~M8 완주 | WP06 | |
| T025 | 터치 크기·가로 스크롤 측정 | WP06 | |
| T026 | 테마·언어 | WP06 | |
| T027 | `playwright.config.ts` testMatch, `episode.json` status published | WP06 | |
| T028 | 전체 확인: quickstart 절차, `pnpm check`, `pnpm test:e2e`, `pnpm build` | WP06 | |

## WP01 – 코너 한계 계산과 장면

**Prompt**: [tasks/WP01-corner-limit-scene.md](tasks/WP01-corner-limit-scene.md)

**Goal**: 에피소드 뼈대를 만들고 세 한계 상태 계산과, 그 계산을 쓰는 코너 장면·힘 막대·조작부를 한 번에 완성한다.

**Independent test**: M1 조건(r=80, 건조, 윙 없음)에서 속도를 바꿔 출발하면 한계 이하는 통과, 초과는 접선으로 미끄러진다.

**Dependencies**: 없음

T001 뼈대: `episodes/_template/` 복사, `episode.json`(number 2, slug `02-race-engineer`, status draft, 난이도 3), `package.json` 이름, `pnpm install` (WP01)
T002 `model/constants.ts`: g, m, μ, k, 최고 속도 + 출처 주석 (WP01)
T003 `model/corner.ts`: `requiredForce`, `availableForce`, `gripLimit`, `kmhToMs`, `msToKmh` (WP01)
T004 `tests/corner.test.ts`: 해석값·독립 기준·경계·fast-check 속성 테스트 (WP01)
T005 `view/scene.ts`: 코너, 차, 미끄러짐 애니메이션 (research R4) (WP01)
T006 `view/bars.ts`와 조작부: 힘 막대, 속도·반지름 슬라이더, 노면·윙 버튼, 조건 카드(FR-015), 세 상태 표시 (WP01)

**Risks**: 템플릿 복사 시 예제가 남는 것, 애니메이션과 판정이 어긋나는 것(판정은 계산에서만).

## WP02 – 무전 판정과 기본 미션 M1~M3

**Prompt**: [tasks/WP02-radio-basic-missions.md](tasks/WP02-radio-basic-missions.md)

**Goal**: 무전 입력과 판정, MathML 수식 헬퍼를 만들고 M1~M3을 튜토리얼로 잇는다.

**Independent test**: M1~M3을 끝까지 풀어 판정을 받고, 다시 열어도 진행이 남는다.

**Dependencies**: WP01

T007 `model/judge.ts`: 공통 판정 함수와 `RadioAnswer`·`Verdict` (WP02)
T008 `tests/judge.test.ts`: M1~M3 경계 (WP02)
T009 `engine/src/ui/formula.ts` + 테스트: MathML 헬퍼 (research R2) (WP02)
T010 `view/radio.ts`: 무전 입력·전송·결과 표시 (WP02)
T011 `missions/basic.ts`, `missions/index.ts`: M1~M3 단계와 진행 저장, `main.ts` 연결 (WP02)

**Risks**: M3 유도 안내가 짧으면 M4 이후 식 세우기가 막힌다. 미션 문구 분량.

## WP03 – 다운포스 그래프와 미션 M4~M6

**Prompt**: [tasks/WP03-downforce-graph-missions.md](tasks/WP03-downforce-graph-missions.md)

**Goal**: 범용 그래프 도구와 v–힘 그래프를 만들고 M4~M6을 완성한다.

**Independent test**: M4 교점이 답과 일치하고, M6에서 반지름을 키우면 그립 한계 > 최고 속도 → 교점이 축 밖 → 교점 없음 순서로 바뀐다.

**Dependencies**: WP02

T012 `engine/src/ui/plot.ts` + 테스트: 축척·축·눈금·곡선 (WP03)
T013 그래프 범위 계산 + `tests/graph-range.test.ts` (research R3) (WP03)
T014 `view/graph.ts`: 두 곡선, 교점, 340 km/h 선, 상태 문구 (WP03)
T015 `missions/downforce.ts`: M4, M5 (WP03)
T016 `missions/downforce.ts`: M6 (WP03)

**Risks**: 경계 근처 값 폭증, 교점이 축 밖일 때 그림이 무의미해 보이는 것.

## WP04 – 최종 미션 M7 레이스 무전과 단순화 고지

**Prompt**: [tasks/WP04-race-radio-mission.md](tasks/WP04-race-radio-mission.md)

**Goal**: 코너 5개 판정과 결과, 모델 단순화 고지를 만든다.

**Independent test**: 코너 4를 틀리면 나머지가 맞아도 불통과, 코너 4 포함 4/5면 통과.

**Dependencies**: WP03

T017 `model/race-radio.ts`: 코너 표와 코너·미션 판정 (WP04)
T018 `tests/race-radio.test.ts`: answers.md M7 표 전체 (WP04)
T019 `missions/race.ts`: M7 흐름과 결과 화면 (WP04)
T020 `view/notes.ts`: 단순화 고지 (FR-012) (WP04)

**Risks**: 0.01 km/h 여유가 다른 미션으로 번지는 것.

## WP05 – 마찰원 심화 미션 M8

**Prompt**: [tasks/WP05-friction-circle-mission.md](tasks/WP05-friction-circle-mission.md)

**Goal**: 마찰원 계산과 끌기 화면으로 M8을 만든다. 이 WP를 빼도 M1~M7은 완결된다.

**Independent test**: M8만 열어 점을 기준선을 따라 끌고 값을 무전해 판정을 받는다.

**Dependencies**: WP04

T021 `model/friction-circle.ts` + 테스트 (WP05)
T022 `view/circle.ts`: 원, 횡가속도 기준선, 끌 수 있는 점 (WP05)
T023 `missions/braking.ts`: M8 (WP05)

**Risks**: 작은 화면의 끌기 정밀도. 숫자 표시로 보완.

## WP06 – 모바일 검증과 공개

**Prompt**: [tasks/WP06-mobile-verification-publish.md](tasks/WP06-mobile-verification-publish.md)

**Goal**: 360px 전 미션 완주 e2e로 검증하고 랜딩에 공개한다.

**Independent test**: `pnpm check`, `pnpm test:e2e` 전체 통과, 01 이전 비교 변경 없음.

**Dependencies**: WP05

T024 `e2e/race-engineer.spec.ts`: 360px 터치로 M1~M8 완주 (WP06)
T025 터치 크기·가로 스크롤 측정 (WP06)
T026 테마·언어 (WP06)
T027 `playwright.config.ts` testMatch, `episode.json` status published (WP06)
T028 전체 확인: quickstart 절차, `pnpm check`, `pnpm test:e2e`, `pnpm build` (WP06)

**Risks**: WebKit의 MathML 표시, 긴 e2e 시간.

## 구현 뒤 보강: 설명 다시 쓰기 (사람 요청, 2026-10-31)

첫 빌드를 본 사람이 문제의 뜻과 계산의 의미를 알 수 없다고 판단해 FR-017·FR-018을 추가했다. 계산·정답·판정은 바꾸지 않았다.

T029 M1~M8을 상황 → 직접 보기 → 의미 → 계산 → 왜 중요한가 순서로 다시 쓰고 풀이 예시 추가 (FR-017)
T030 장면에 힘 화살표 추가 (FR-018)
T031 표현 정리: 넓은 코너 → 반지름이 두 배, 급한·완만한 코너. M2·M5 재기를 버튼으로
T032 완주 e2e를 새 흐름에 맞춤

