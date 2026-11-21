# Implementation Plan: 지진 분석관 — S-P 시간 차와 원의 교점

**Branch**: `mission/03-seismic-analyst` (target/merge: same, PR은 `main`으로) | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/seismic-analyst-01M7YB3D/spec.md` (검토 반영: [spec-review.md](spec-review.md))

## Summary

세 번째 에피소드 `episodes/03-seismic-analyst`를 만든다. 학습자는 지진 기록에서 S-P 시간을 읽어 거리를 구하고, 관측소 둘레의 원과 두 원의 식을 뺀 직선으로 진앙을 찾는다. 계산은 순수 함수(거리, 두 원 교점, 직선 같음 판정, 잔차 제곱합 최소점, 위도·경도 환산)이고, 화면은 Canvas 2D, 진행은 기존 튜토리얼 엔진을 쓴다. 엔진·01·02는 수정하지 않는다. M7 해안선은 퍼블릭 도메인 데이터를 한 번 변환한 정적 경로를 커밋한다.

## Technical Context

**Language/Version**: TypeScript (strict), HTML/CSS — 기존 모노레포 그대로
**Primary Dependencies**: Vite, `@series/engine` (i18n, sim, tutorial, ui — `formula`, `plot`, `calculator`, `save`/`load`). 새 런타임·개발 의존성 없음 (fast-check 4.10.2는 02에서 이미 추가됨)
**Storage**: `@series/engine/ui`의 `save`/`load` (localStorage, 미션 진행). 못 쓰면 저장 없이 동작
**Testing**: Vitest(순수 계산, 고정 시드 속성 테스트), Playwright(전 미션 완주, 360px, 터치 크기, M7 순서 강제, 01·02 회귀). 새 e2e 파일은 CI의 Firefox·WebKit `testMatch`에도 추가
**Target Platform**: 최신 데스크톱·모바일 브라우저 (Chromium, Firefox, WebKit/iOS Safari)
**Project Type**: web (정적 사이트, 에피소드 추가)
**Performance Goals**: 끌기·슬라이더 중 지도·잔차 갱신이 한 프레임 안. 두 파 애니메이션 60 fps 목표
**Constraints**: 360px 세로·가로 스크롤 0·44×44 px(NFR-001, 002), 상대 오차 1e-9 / M8 ② 1e-6(NFR-003), 난수 없음(NFR-004), 한/영 100%(NFR-005), 대비 4.5:1(NFR-006), 외부 지도 타일 0건(NFR-007), 01·02·엔진 불변(C-003), 환산 고정(C-010)
**Scale/Scope**: 새 에피소드 1개, 미션 8개, 해안선 변환 스크립트 1개

## Charter Check

헌장: `.kittify/charter/charter.md` (PRJ-001~010)

| 규칙 | 이 계획에서 | 판정 |
|---|---|---|
| PRJ-001 출처 주석 | `model/constants.ts`·`model/geo.ts`의 모든 값에 출처·[game value] 표시. 해안선 파일 머리에 출처·커밋·SHA-256 | 준수 |
| PRJ-002 단위 테스트 | 정수 판정, 교점 일반 공식, 하버사인 비교, 격자 최소·∇F = 0, 속성 테스트로 독립 비교 | 준수 |
| PRJ-003 엔진만 의존 | 03은 엔진만 import. 02의 끌기·바로가기는 복사하지 않고 03 안에 새로 작성 | 준수 |
| PRJ-004 모바일 | 지도/기록 탭 전환, 0.1 단위 미세 조정 버튼, M8 확대 지도, 360px 완주 e2e, 터치 크기 측정 | 준수 |
| PRJ-005 수학 오류 시 중단 | 근심 문제를 사람에게 물어 결정(C-006), 스펙 검토 지적 전부 반영 | 준수 |
| PRJ-006 스펙 항목 | 8항목·answers 분리 완료 | 준수 |
| PRJ-007 한/영 | 모든 문구 `P(ko, en)` | 준수 |
| PRJ-008 PR·CI | 기능 브랜치 → PR. 코드 변경이라 e2e 전체 실행 | 준수 |
| PRJ-009 비밀값 | 해당 없음 | 준수 |
| PRJ-010 | 해당 사항 없음 (헌장 그대로) | 준수 |

위반 없음 → Complexity Tracking 생략. Phase 1 설계 뒤 재확인: 변화 없음.

## Project Structure

### Documentation (this mission)

```
kitty-specs/seismic-analyst-01M7YB3D/
├── spec.md · answers.md · spec-review.md
├── plan.md · research.md · data-model.md · quickstart.md
└── tasks.md   (/spec-kitty.tasks 출력)
```

### Source Code (repository root)

```
scripts/build-coastline.mjs   # 1회성: Natural Earth 10m 육지 → 지도 범위 자르기 → C-010 환산 → 단순화 → TS 출력 (의존성 없음)
.gitignore                    # 원본 데이터 경로 추가
episodes/03-seismic-analyst/
├── episode.json · index.html · package.json
├── src/
│   ├── main.ts · strings.ts · style.css
│   ├── missions/           # index, distance(M1~2), circles(M3~6), gyeongju(M7), residual(M8)
│   ├── model/
│   │   ├── constants.ts    # Vp·Vs, 연습 지도, M2 기록, M7 관측소, M8 판독값
│   │   ├── waves.ts        # 도착 시각·S-P 시간·거리
│   │   ├── circles.ts      # 원의 식 전개, 교점 개수·교점, 두 원의 직선
│   │   ├── line.ts         # 직선 정규형·같음 판정·두 직선 교점
│   │   ├── residual.ts     # 잔차·잔차 제곱합·가우스–뉴턴 최소점
│   │   ├── geo.ts          # 위도·경도 → km (C-010 고정)
│   │   ├── seismogram.ts   # 합성 기록 (P·S 도착, 구간)
│   │   ├── judge.ts        # 공통 판정 + 중간값 확정
│   │   ├── progress.ts     # 진행 저장
│   │   └── coastline.ts    # 생성 파일 (스크립트 출력, 손대지 않음)
│   └── view/
│       ├── map.ts · race.ts · seismogram.ts · residual.ts · formula-panel.ts · notes.ts · drag.ts
└── tests/                  # model 단위·속성 테스트
e2e/seismic-analyst.spec.ts · e2e/seismic-analyst-m8.spec.ts · e2e/mobile.spec.ts(주소 추가) · e2e/touch-targets.spec.ts(주소 추가)
playwright.config.ts        # testMatch에 seismic-analyst[\w-]* 추가
```

**Structure Decision**: 에피소드 구조는 `episodes/_template/`을 따른다. `engine/`, `episodes/01-calculus-howitzer/`, `episodes/02-race-engineer/`는 수정하지 않는다.

## Implementation Concern Map

> 작업 패키지가 아니라 관심사 목록이다. `/spec-kitty.tasks`에서 "계산 + 그 계산을 쓰는 화면"으로 묶는다.

### IC-01 — 에피소드 뼈대와 두 파의 경주

- **Purpose**: 에피소드를 만들고(draft), S-P 시간·거리 계산과 M1 애니메이션·M2 지진 기록 판독을 보여 준다
- **Relevant requirements**: FR-002, FR-003, FR-007~011, FR-013~015, NFR-003~005, C-004
- **Affected surfaces**: `episodes/03-seismic-analyst/` 뼈대, `model/constants.ts`, `model/waves.ts`, `model/seismogram.ts`, `model/judge.ts`, `model/progress.ts`, `view/race.ts`, `view/seismogram.ts`, `missions/distance.ts`, `strings.ts`, `main.ts`
- **Sequencing/depends-on**: none
- **Risks**: 기록 가로축은 기록 시작 기준(발생 시각 숨김, research R4). 마커 0.1 s 스냅·◀ ▶ 버튼. 중간값 확정 규칙을 판정 공통 함수로 처음부터 넣기

### IC-02 — 지도·원·교점 (M3~M5)

- **Purpose**: km 지도에 원을 그리고 원의 방정식 판정, 교점 개수 탐색, 두 원의 직선 입력, 교점 계산을 만든다
- **Relevant requirements**: FR-001, FR-004~006, FR-012, SC-003
- **Affected surfaces**: `model/circles.ts`, `model/line.ts`, `view/map.ts`, `view/formula-panel.ts`, `missions/circles.ts`
- **Sequencing/depends-on**: IC-01
- **Risks**: 교점 개수 판정을 교점 계산보다 먼저(음수 제곱근). 접하는 경계 21·189 km에서 부동소수 판정(research R5). 범위 밖 원은 가장자리에서 잘림

### IC-03 — 진앙 확정 (M6)

- **Purpose**: 원 A − 원 C 일반형 직선 입력, 두 직선 교점, 세 원 공통점이 하나뿐임을 보여 준다
- **Relevant requirements**: FR-006, FR-007, US2 시나리오 5·6
- **Affected surfaces**: `model/line.ts`(두 직선 교점), `missions/circles.ts`, `view/map.ts`
- **Sequencing/depends-on**: IC-02
- **Risks**: IC-02와 같은 파일을 건드려 한 WP로 묶는 편이 안전

### IC-04 — 2016 경주 지진 (M7)

- **Purpose**: 해안선 지도, 가상 관측소 3곳의 순차 처리(판독 → 거리 → 원), USGS 비교와 진원·진앙 설명
- **Relevant requirements**: FR-016, FR-017, NFR-007, C-009, C-010, US3
- **Affected surfaces**: `scripts/build-coastline.mjs`, `.gitignore`, `model/geo.ts`, `model/coastline.ts`(생성), `missions/gyeongju.ts`, `view/map.ts`, `view/notes.ts`
- **Sequencing/depends-on**: IC-02 (IC-03과 병렬 가능)
- **Risks**: 해안선과 관측소가 같은 환산을 써야 함(C-010). φ_ref 36.0° 고정 테스트(관측소 1이 반올림 경계 0.024 s). 생성 파일 크기 확인(research R2)

### IC-05 — 어긋난 세 원 (M8, 분리 가능)

- **Purpose**: 잔차·잔차 제곱합, 왜 제곱인지 설명, 확대 지도에서 최소점 찾기
- **Relevant requirements**: FR-018, C-006~C-008, NFR-003(M8 ② 예외), US4
- **Affected surfaces**: `model/residual.ts`, `view/residual.ts`, `view/drag.ts`, `missions/residual.ts`
- **Sequencing/depends-on**: IC-03
- **Risks**: 끌기 중 페이지 스크롤 방지(`touch-action: none`). 최소점은 가우스–뉴턴, 같은 시작점·정지 조건으로 결정적(research R6). 이 관심사를 빼도 M1~M7이 완결돼야 함

### IC-06 — 모바일 검증과 공개

- **Purpose**: 전 미션 완주 e2e, 확인용 바로가기, 공개 전환
- **Relevant requirements**: FR-019, FR-020, NFR-001, NFR-002, NFR-006, SC-002, SC-004
- **Affected surfaces**: `e2e/seismic-analyst*.spec.ts`, `e2e/mobile.spec.ts`, `e2e/touch-targets.spec.ts`, `playwright.config.ts`, `episode.json`, `main.ts`(바로가기)
- **Sequencing/depends-on**: IC-01~05
- **Risks**: 조건부 단언·아직 없는 요소를 재는 단언은 한 번 일부러 실패시켜 실행 확인(작업 흐름 공통 규칙). Firefox `setViewportSize` 멈춤은 `test.use`로 회피(기존 기록)
