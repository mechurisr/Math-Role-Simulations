# Tasks: 지진 분석관 — S-P 시간 차와 원의 교점

**Mission**: `seismic-analyst-01M7YB3D` · **Branch**: `mission/03-seismic-analyst` (planning/merge target 동일, PR은 `main`으로)
**Inputs**: [spec.md](spec.md) · [answers.md](answers.md) · [plan.md](plan.md) · [research.md](research.md) · [data-model.md](data-model.md) · [quickstart.md](quickstart.md)

구현은 기능 브랜치에서 직접 하고 WP마다 커밋한다 (`feat(WPnn): …`). `/spec-kitty.implement`·`spec-kitty merge`는 쓰지 않는다 (docs/agents/main.md 6절).

## WP 나누기

WP는 "계산 + 그 계산을 쓰는 화면"으로 묶었다. 공용 도구도 첫 호출처와 같은 WP에 둔다: 끌기 도우미 `view/drag.ts`는 지진 기록 마커가 처음 쓰므로 WP02, 지도 `view/map.ts`는 WP03. `main.ts`·`strings.ts`·`view/map.ts`는 처음 만든 WP가 소유하고, 뒤 WP는 연결·옵션 몇 줄만 고친다(소유 밖 수정, 커밋 메시지에 이유 기록). 미션 문구는 각 `missions/*.ts` 안에 둔다. 엔진·01·02는 수정하지 않는다(C-003). WP06을 빼도 M1~M7이 완결된다(C-008).

순서: WP01 → WP02 → WP03 → WP04 → WP05 → WP06 → WP07. WP05(M7)와 WP06(M8)은 WP04 뒤에 서로 독립이지만 `view/map.ts`를 함께 고치므로 차례로 한다. MVP는 WP01~WP02(M1~M2, 학습 목표 1).

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | 뼈대: `episodes/_template/` 복사, `episode.json`(number 3, slug `03-seismic-analyst`, status draft, 난이도 3), `package.json` 이름, `index.html`, `pnpm install` | WP01 | |
| T002 | `model/constants.ts`: Vp·Vs, 연습 지도, M2 기록, M3 후보, M7 관측소·USGS 진앙, M8 판독값·확대 범위 + 출처 주석 | WP01 | |
| T003 | `model/waves.ts` + `tests/waves.test.ts`: 도착 시각, S-P 시간, 거리 | WP01 | [P] |
| T004 | `model/judge.ts` + `tests/judge.test.ts`: 입력 해석, 허용 오차, 중간값 확정, 점 거리 판정 | WP01 | [P] |
| T005 | `view/race.ts`: 두 파의 경주 애니메이션과 시간 막대, 거리 슬라이더 | WP01 | |
| T006 | `missions/index.ts`·`missions/distance.ts`(M1)·`model/progress.ts`·`main.ts` 연결, 테마 색 다시 읽기 | WP01 | |
| T007 | `model/seismogram.ts` + `tests/seismogram.test.ts`: 기록 구간, 결정적 파형, 0.1 s 스냅 | WP02 | [P] |
| T008 | `view/drag.ts`: 포인터 캡처 끌기 도우미 (`touch-action: none`) | WP02 | [P] |
| T009 | `view/seismogram.ts`: 기록 그리기, P·S 마커 끌기·◀ ▶ 버튼, 판독값 표시 | WP02 | |
| T010 | `missions/distance.ts` M2: 판독 → 확정 → 거리 식 유도(FR-011, 수식) → 거리 보내기 + 판정 테스트 | WP02 | |
| T011 | `model/circles.ts` + `tests/circles.test.ts`: 식 전개, 교점 개수·교점, 두 원의 직선, fast-check | WP03 | [P] |
| T012 | `model/line.ts` + `tests/line.test.ts`: 정규형, 같은 직선 판정, (0, 0) 거부 | WP03 | [P] |
| T013 | `view/map.ts`: km 격자, 관측소, 원(잘림), 원의 방정식 라벨, 교점 깜빡임, 직선, 점 고르기 | WP03 | |
| T014 | `view/formula-panel.ts`: 펼친 식, 빼기 단계(FR-012), 계수 입력 | WP03 | |
| T015 | `missions/circles.ts` M3: 반지름 확정, 후보 5개 판정 | WP03 | |
| T016 | `missions/circles.ts` M4: 교점 개수 탐색, r_B 확정, 직선 입력 | WP03 | |
| T017 | `model/system.ts` + `tests/system.test.ts`: 두 직선 교점, 세 원 공통점 확인 | WP04 | [P] |
| T018 | `missions/epicenter.ts` M5: 두 교점 입력(순서 무관) | WP04 | |
| T019 | `missions/epicenter.ts` M6: 원 A − 원 C 직선, 두 직선 교점 보내기, 세 원 공통점 확인 | WP04 | |
| T020 | `view/map.ts` 보강: 직선이 지나는 점 강조, 틀린 점의 세 거리·세 반지름 표 | WP04 | |
| T021 | `scripts/build-coastline.mjs` + `.gitignore`: 해시 확인, 자르기, C-010 환산, 단순화, TS 출력 | WP05 | [P] |
| T022 | `model/geo.ts` + `tests/geo.test.ts`: 위도·경도 → km, 하버사인 비교, φ_ref 민감도 고정 테스트 | WP05 | [P] |
| T023 | `model/coastline.ts` 생성 + `tests/coastline.test.ts`: 크기·범위·포항 위치 점검 | WP05 | |
| T024 | `model/m7-flow.ts` + `tests/m7-flow.test.ts` + `missions/gyeongju.ts`: 관측소별 판독 → 거리 → 원, 좌표 판정 | WP05 | |
| T025 | `view/notes.ts`: USGS 비교, 진원·진앙 설명, 단순화 고지(FR-017) | WP05 | |
| T026 | `view/map.ts` 보강: 해안선 층, M7 지도 원점·축 라벨 | WP05 | |
| T027 | `model/residual.ts` + `tests/residual.test.ts`: 잔차, 잔차 제곱합, 가우스–뉴턴, 격자·경사 독립 기준 | WP06 | [P] |
| T028 | `view/residual.ts`: 부호 있는 잔차 막대, 큰 잔차 제곱합 숫자 | WP06 | [P] |
| T029 | `view/map.ts` 보강: 확대 보기(x 88~108, y 128~148), 추정점 끌기, ↑↓←→ 0.1 km 버튼 | WP06 | |
| T030 | `missions/residual.ts` M8 ①②③ + 왜 제곱인지 설명 + 판정 테스트 | WP06 | |
| T031 | `e2e/seismic-analyst.spec.ts`: 360px 터치로 M1~M7 완주, M7 순서 강제 | WP07 | |
| T032 | `e2e/seismic-analyst-m8.spec.ts`: M8 버튼·끌기 완주, 스크롤 안 됨 | WP07 | [P] |
| T033 | `e2e/mobile.spec.ts` 주소 추가, 미션마다 터치 크기 측정(`seismic-analyst.spec.ts` 안), 테마·언어 확인 | WP07 | [P] |
| T034 | `?from=M1..M8` 확인용 바로가기(`main.ts`) + e2e | WP07 | |
| T035 | `playwright.config.ts` testMatch, `episode.json` status published, 랜딩 확인 | WP07 | |
| T036 | 전체 확인: quickstart, `pnpm check`, `pnpm test:e2e`, `pnpm build`, 4173 포트 정리 | WP07 | |

## WP01 – 뼈대와 두 파의 경주 (M1)

**Prompt**: [tasks/WP01-skeleton-wave-race.md](tasks/WP01-skeleton-wave-race.md)

**Goal**: 에피소드 뼈대를 만들고, S-P 시간·거리 계산과 공통 판정(중간값 확정 포함), 그 계산을 쓰는 M1 두 파의 경주 화면을 완성한다.

**Independent test**: M1에서 거리 슬라이더를 84 → 168 km로 옮기면 S-P 시간이 10 → 20 s가 되고, 210 km의 S-P 시간 25 s(±0.5)를 보내 통과한다.

**Dependencies**: 없음 · **Priority**: P1 · **Estimated prompt size**: ~170 lines

T001 뼈대: `episodes/_template/` 복사, `episode.json`, `package.json`, `index.html`, `pnpm install` (WP01)
T002 `model/constants.ts`: 상수 + 출처 주석 (WP01)
T003 `model/waves.ts` + 테스트 (WP01)
T004 `model/judge.ts` + 테스트 (WP01)
T005 `view/race.ts` (WP01)
T006 `missions/index.ts`·`missions/distance.ts`(M1)·`model/progress.ts`·`main.ts` 연결 (WP01)

**Risks**: 판정 공통 함수에 중간값 확정을 처음부터 넣지 않으면 뒤 WP마다 다시 만들게 된다. 테마 색은 로드 뒤 다시 읽기(Issue #36 교훈).

## WP02 – 지진 기록 판독과 거리 (M2)

**Prompt**: [tasks/WP02-seismogram-distance.md](tasks/WP02-seismogram-distance.md)

**Goal**: 합성 지진 기록과 마커 판독(끌기·0.1 s 버튼), 판독 확정 뒤 거리 식 유도와 거리 판정을 만든다.

**Independent test**: M2에서 마커를 3.0 / 18.0 s에 놓으면 판독 통과 → 확정값 15.0 s 표시 → 126 km(±2)를 보내 통과. 마커를 0.4 s 어긋나게 놓으면 불통과.

**Dependencies**: WP01 · **Priority**: P1 · **Estimated prompt size**: ~150 lines

T007 `model/seismogram.ts` + 테스트 (WP02)
T008 `view/drag.ts` (WP02)
T009 `view/seismogram.ts` (WP02)
T010 `missions/distance.ts` M2 + 판정 테스트 (WP02)

**Risks**: 360px에서 1 s ≈ 14 px라 손가락만으로는 0.3 s를 맞추기 어려움 → ◀ ▶ 버튼 필수. 기록에 지진 발생 시각을 넣지 않기(R4).

## WP03 – 지도·원·두 원이 만나는 직선 (M3~M4)

**Prompt**: [tasks/WP03-map-circles-line.md](tasks/WP03-map-circles-line.md)

**Goal**: km 지도에 원을 그리고, 원의 방정식으로 후보 판정(M3), 교점 개수 탐색과 두 원의 식을 뺀 직선 입력(M4)을 만든다.

**Independent test**: M3 후보 판정이 예/예/예/아니오/아니오, M4 슬라이더 20 / 21 / 22 / 188 / 189 / 190 km에서 교점 0 / 1 / 2 / 2 / 1 / 0, 직선 (168, 0, 16800) 통과.

**Dependencies**: WP02 · **Priority**: P1 · **Estimated prompt size**: ~200 lines

T011 `model/circles.ts` + 테스트 (WP03)
T012 `model/line.ts` + 테스트 (WP03)
T013 `view/map.ts` (WP03)
T014 `view/formula-panel.ts` (WP03)
T015 `missions/circles.ts` M3 (WP03)
T016 `missions/circles.ts` M4 (WP03)

**Risks**: 교점 개수를 계산보다 먼저 판정(음수 제곱근). 접하는 경계는 정수 연산으로 정확히. 판정은 확정 반지름 기준.

## WP04 – 교점과 진앙 확정 (M5~M6)

**Prompt**: [tasks/WP04-crossings-epicenter.md](tasks/WP04-crossings-epicenter.md)

**Goal**: 직선을 원에 대입해 두 교점을 구하고(M5), 일반형 직선과 연립일차방정식으로 진앙을 확정한다(M6).

**Independent test**: M5 (100, 140)·(100, 14) 순서 바꿔도 통과, M6 직선 (8, 3, 1220) 통과·(8, 3, 842) 불통과, 좌표 (100, 140) 통과.

**Dependencies**: WP03 · **Priority**: P1 · **Estimated prompt size**: ~140 lines

T017 `model/system.ts` + 테스트 (WP04)
T018 `missions/epicenter.ts` M5 (WP04)
T019 `missions/epicenter.ts` M6 (WP04)
T020 `view/map.ts` 보강 (WP04, 소유 밖)

**Risks**: 스펙의 M6은 답을 고르는 방식이 아니라 두 직선의 교점을 계산해 보내는 방식(검토 R2 반영)이다.

## WP05 – 2016 경주 지진 (M7)

**Prompt**: [tasks/WP05-gyeongju-earthquake.md](tasks/WP05-gyeongju-earthquake.md)

**Goal**: 해안선 지도와 위도·경도 환산, 관측소별 순차 처리, USGS 비교와 진원·진앙 설명, 단순화 고지를 만든다.

**Independent test**: 판독 전에는 거리 입력이 닫혀 있고, 세 원을 그린 뒤 (109.4, 86.8) 근처를 보내면 통과하며 결과 화면에 USGS 진앙과의 거리·깊이 13 km 설명이 보인다.

**Dependencies**: WP04 · **Priority**: P2 · **Estimated prompt size**: ~200 lines

T021 `scripts/build-coastline.mjs` + `.gitignore` (WP05)
T022 `model/geo.ts` + 테스트 (WP05)
T023 `model/coastline.ts` 생성 + 테스트 (WP05)
T024 `model/m7-flow.ts` + 테스트 + `missions/gyeongju.ts` (WP05)
T025 `view/notes.ts` (WP05)
T026 `view/map.ts` 보강 (WP05, 소유 밖)

**Risks**: φ_ref 36.0° 고정(관측소 1이 반올림 경계에서 0.024 s). 해안선·관측소·USGS 점이 같은 환산을 쓰는지. 원본 데이터 커밋 금지.

## WP06 – 어긋난 세 원 (M8, 분리 가능)

**Prompt**: [tasks/WP06-residual-advanced.md](tasks/WP06-residual-advanced.md)

**Goal**: 잔차·잔차 제곱합과 최소점 계산, 확대 지도에서 추정점 찾기, 왜 제곱인지 설명을 만든다.

**Independent test**: ① 52.92(±0.1) 통과, ② (96.6, 136.2)에서 1 km 이내 통과, 버튼만으로 최소점에 갈 수 있음.

**Dependencies**: WP04 · **Priority**: P3 · **Estimated prompt size**: ~170 lines

T027 `model/residual.ts` + 테스트 (WP06)
T028 `view/residual.ts` (WP06)
T029 `view/map.ts` 보강 (WP06, 소유 밖)
T030 `missions/residual.ts` M8 + 판정 테스트 (WP06)

**Risks**: 근심을 쓰지 않음(C-006), 최소점을 "진짜 진앙"이라 쓰지 않음(C-007). 끌기 중 스크롤 방지.

## WP07 – 모바일 검증과 공개

**Prompt**: [tasks/WP07-mobile-verification-publish.md](tasks/WP07-mobile-verification-publish.md)

**Goal**: 전 미션 완주 e2e, 터치 크기·가로 스크롤·테마·언어 확인, 확인용 바로가기, 공개 전환과 전체 확인.

**Independent test**: `pnpm check`·`pnpm test:e2e`·`pnpm build` 통과, 랜딩에 03이 보임.

**Dependencies**: WP05, WP06 · **Priority**: P1 · **Estimated prompt size**: ~170 lines

T031 `e2e/seismic-analyst.spec.ts` (WP07)
T032 `e2e/seismic-analyst-m8.spec.ts` (WP07)
T033 `e2e/mobile.spec.ts` 주소 추가, 터치 크기·테마·언어 (WP07)
T034 `?from=` 바로가기 + e2e (WP07)
T035 `playwright.config.ts`, `episode.json` published (WP07)
T036 전체 확인 (WP07)

**Risks**: 조건부 단언·아직 없는 요소를 재는 단언은 한 번 일부러 실패시켜 실제로 도는지 확인. Firefox 뷰포트는 `test.use`로.
