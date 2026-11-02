# Implementation Plan: 레이스 엔지니어 — 구심가속도와 마찰 한계

**Branch**: `mission/02-race-engineer` (target/merge: same, PR은 `main`으로) | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/race-engineer-01M68BAF/spec.md` (검토 반영: [spec-review.md](spec-review.md))

## Summary

두 번째 에피소드 `episodes/02-race-engineer`를 만든다. 학습자는 코너 조건에서 그립 한계 속도를 구해 무전으로 보낸다. 계산은 닫힌 식 순수 함수이고, 화면은 Canvas 2D, 진행은 기존 튜토리얼 엔진을 쓴다. 엔진에는 범용 그래프 도구와 MathML 수식 헬퍼를 새로 넣고, 01 에피소드는 건드리지 않는다.

## Technical Context

**Language/Version**: TypeScript (strict), HTML/CSS — 기존 모노레포 그대로
**Primary Dependencies**: Vite, `@series/engine` (i18n, sim, tutorial, ui). 새 런타임 의존성 없음. 개발 의존성 fast-check 4.10.2 추가
**Storage**: `@series/engine/ui`의 `save`/`load` (localStorage, 미션 진행). 튜토리얼 완료 기록은 엔진이 처리
**Testing**: Vitest(순수 계산, 고정 시드 속성 테스트), Playwright(전 미션 완주, 360px, 터치 크기, 01 회귀). 새 e2e 파일은 CI의 Firefox·WebKit `testMatch`에도 추가
**Target Platform**: 최신 데스크톱·모바일 브라우저 (Chromium, Firefox, WebKit/iOS Safari)
**Project Type**: web (정적 사이트, 에피소드 추가)
**Performance Goals**: 슬라이더 조작 중 막대·그래프 갱신이 한 프레임 안. 차 애니메이션 60 fps 목표
**Constraints**: 360px 세로·가로 스크롤 0·44×44 px(NFR-001, 002), 상대 오차 1e-9(NFR-003), 난수 없음(NFR-004), 한/영 100%(NFR-005), 대비 4.5:1(NFR-006), 01 불변(C-003)
**Scale/Scope**: 새 에피소드 1개, 미션 8개, 엔진 모듈 2개 추가

## Charter Check

헌장: `.kittify/charter/charter.md` (PRJ-001~010)

| 규칙 | 이 계획에서 | 판정 |
|---|---|---|
| PRJ-001 출처 주석 | `model/constants.ts`의 모든 값에 출처·[game value] 표시 | 준수 |
| PRJ-002 단위 테스트 | 해석해·수치해·유리수 판정·속성 테스트로 독립 비교 | 준수 |
| PRJ-003 엔진만 의존 | 02는 엔진만 import. 01 코드 복사 없이 엔진 새 도구 사용 | 준수 |
| PRJ-004 모바일 | 단계별 표시, 360px 완주 e2e, 터치 크기 측정 | 준수 |
| PRJ-005 수학 오류 시 중단 | 스펙 검토 수학 지적 없음, 모호함 반영 완료 | 준수 |
| PRJ-006 스펙 항목 | 8항목·answers 분리 완료 | 준수 |
| PRJ-007 한/영 | 모든 문구 `P(ko, en)` | 준수 |
| PRJ-008 PR·CI | 기능 브랜치 → PR. 코드 변경이라 e2e 전체 실행 | 준수 |
| PRJ-009 비밀값 | 해당 없음 | 준수 |

위반 없음 → Complexity Tracking 생략. Phase 1 설계 뒤 재확인: 변화 없음.

## Project Structure

### Documentation (this mission)

```
kitty-specs/race-engineer-01M68BAF/
├── spec.md · answers.md · spec-review.md
├── plan.md · research.md · data-model.md · quickstart.md
└── tasks.md   (/spec-kitty.tasks 출력)
```

### Source Code (repository root)

```
engine/src/ui/
├── plot.ts          # 새로: 축척·축·눈금·곡선 그리기 (01과 무관한 범용 도구)
└── formula.ts       # 새로: MathML 수식 헬퍼
engine/tests/        # plot 축척, formula 단위 테스트
episodes/02-race-engineer/
├── episode.json · index.html · package.json
├── src/
│   ├── main.ts · strings.ts · style.css
│   ├── missions/           # index, basic(M1~3), downforce(M4~6), race(M7), braking(M8)
│   ├── model/
│   │   ├── constants.ts        # 물리값
│   │   ├── corner.ts           # 필요한 힘·낼 수 있는 힘·한계 상태
│   │   ├── judge.ts            # 공통 판정
│   │   ├── race-radio.ts       # M7 코너 판정
│   │   └── friction-circle.ts  # 마찰원
│   └── view/
│       ├── scene.ts · bars.ts · radio.ts · graph.ts · circle.ts · notes.ts
└── tests/           # model 단위·속성 테스트
e2e/race-engineer.spec.ts · e2e/mobile.spec.ts(주소 추가)
playwright.config.ts # testMatch 추가
```

**Structure Decision**: 에피소드 구조는 `episodes/_template/`을 따른다. `episodes/01-calculus-howitzer/`는 수정하지 않는다.

## Implementation Concern Map

> 작업 패키지가 아니라 관심사 목록이다. `/spec-kitty.tasks`에서 "계산 + 그 계산을 쓰는 화면"으로 묶는다.

### IC-01 — 엔진 도구

- **Purpose**: 02에 필요한 그래프·수식 도구를 범용으로 추가한다
- **Relevant requirements**: FR-006, FR-011, C-002, C-003
- **Affected surfaces**: `engine/src/ui/plot.ts`, `engine/src/ui/formula.ts`, `engine/src/ui/index.ts`, `engine/tests/`
- **Sequencing/depends-on**: none
- **Risks**: 호출처가 02에만 있어 뒤 관심사와 묶지 않으면 죽은 코드 점검에 걸림. 수식 도구는 문자열 조립이므로 HTML 이스케이프 필요

### IC-02 — 코너 한계 계산과 장면

- **Purpose**: 세 한계 상태를 계산하고 코너·막대·미끄러짐을 보여 준다
- **Relevant requirements**: FR-001~004, FR-007, FR-015, NFR-003, C-004
- **Affected surfaces**: `episodes/02-race-engineer/` 뼈대, `model/constants.ts`, `model/corner.ts`, `view/scene.ts`, `view/bars.ts`
- **Sequencing/depends-on**: none
- **Risks**: 경계 조건을 값 계산보다 먼저 검사해야 함 (NaN). 애니메이션과 판정이 어긋나지 않게 판정은 계산에서만

### IC-03 — 판정과 미션 진행

- **Purpose**: 무전 판정과 M1~M7 진행을 만든다
- **Relevant requirements**: FR-005, FR-008~010, FR-012, FR-016, NFR-004, NFR-005
- **Affected surfaces**: `model/judge.ts`, `model/race-radio.ts`, `missions/`, `view/radio.ts`, `view/notes.ts`, `strings.ts`, `main.ts`
- **Sequencing/depends-on**: IC-02
- **Risks**: 판정은 입력 원값 비교, 0.01 km/h 여유는 M7 상한에만. 분량이 커서 미션 묶음으로 나눌 수 있음

### IC-04 — 다운포스 그래프

- **Purpose**: v–힘 그래프로 교점과 "교점 없음"·"축 밖"을 보여 준다
- **Relevant requirements**: FR-006, FR-007
- **Affected surfaces**: `view/graph.ts`, `engine/src/ui/plot.ts`
- **Sequencing/depends-on**: IC-01, IC-02
- **Risks**: 경계 근처에서 교점이 축 밖으로 나감 (research 결정 R3)

### IC-05 — 마찰원 (분리 가능)

- **Purpose**: M8을 추가한다
- **Relevant requirements**: FR-013, C-007
- **Affected surfaces**: `model/friction-circle.ts`, `view/circle.ts`, `missions/braking.ts`
- **Sequencing/depends-on**: IC-03
- **Risks**: 끌기 중 페이지 스크롤 방지. 이 관심사를 빼도 나머지가 완결돼야 함

### IC-06 — 모바일 검증과 공개

- **Purpose**: 전 미션 완주 e2e와 공개 전환을 마친다
- **Relevant requirements**: FR-014, NFR-001, NFR-002, NFR-006, SC-002, SC-004
- **Affected surfaces**: `e2e/race-engineer.spec.ts`, `e2e/mobile.spec.ts`, `playwright.config.ts`, `episode.json`
- **Sequencing/depends-on**: IC-02~05
- **Risks**: 같은 배포에 draft 에피소드 주소가 열릴 수 있으니 `status` 처리 확인
