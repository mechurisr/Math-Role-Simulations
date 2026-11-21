---
work_package_id: WP05
title: 2016 경주 지진 (M7)
dependencies:
- WP04
requirement_refs:
- C-009
- C-010
- FR-016
- FR-017
- NFR-007
planning_base_branch: mission/03-seismic-analyst
merge_target_branch: mission/03-seismic-analyst
branch_strategy: Planning artifacts for this mission were generated on mission/03-seismic-analyst. During implementation this WP is built directly on mission/03-seismic-analyst (no lanes/worktrees, docs/agents/main.md section 6); completed changes stay on mission/03-seismic-analyst and reach main through the PR.
subtasks:
- T021
- T022
- T023
- T024
- T025
- T026
phase: Phase 4 - Story 3
history:
- !!omap
  - at: '2026-11-21T08:01:24Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/03-seismic-analyst/src/missions/gyeongju.ts
create_intent:
- scripts/build-coastline.mjs
- episodes/03-seismic-analyst/src/model/geo.ts
- episodes/03-seismic-analyst/src/model/coastline.ts
- episodes/03-seismic-analyst/src/model/m7-flow.ts
- episodes/03-seismic-analyst/src/missions/gyeongju.ts
- episodes/03-seismic-analyst/src/view/notes.ts
- episodes/03-seismic-analyst/tests/geo.test.ts
- episodes/03-seismic-analyst/tests/coastline.test.ts
- episodes/03-seismic-analyst/tests/m7-flow.test.ts
execution_mode: code_change
model: ''
owned_files:
- scripts/build-coastline.mjs
- .gitignore
- episodes/03-seismic-analyst/src/model/geo.ts
- episodes/03-seismic-analyst/src/model/coastline.ts
- episodes/03-seismic-analyst/src/model/m7-flow.ts
- episodes/03-seismic-analyst/src/missions/gyeongju.ts
- episodes/03-seismic-analyst/src/view/notes.ts
- episodes/03-seismic-analyst/tests/geo.test.ts
- episodes/03-seismic-analyst/tests/coastline.test.ts
- episodes/03-seismic-analyst/tests/m7-flow.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP05 – 2016 경주 지진 (M7)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

한반도 남동부 해안선 지도와 위도·경도 → km 환산을 만들고, 가상 관측소 3곳을 하나씩 처리(판독 → 거리 → 원)한 뒤 진앙을 보내는 M7과, USGS 비교·진원 설명·단순화 고지를 완성한다.

**독립 확인**: 관측소 판독을 통과하기 전에는 그 거리 입력이 닫혀 있다. 세 원을 다 그린 뒤 (109.4, 86.8) 근처(±5 km)를 보내면 통과하고, 결과 화면에 USGS 진앙(위도·경도와 지도 점), 보낸 점과의 거리, 깊이 13 km 설명, 단순화 고지가 보인다. USGS 점이 포항 남서쪽 내륙(경주)에 놓인다.

## Context

- 스펙 M7 행·M7 지도 표, US3, FR-016·017, C-009·010, NFR-007 · answers.md M7(환산식, 관측소 표, 민감도), 물리값 표 · research R2(해안선), R4(기록)
- WP02의 `seismogram`·`drag`, WP03의 `map`·`circles`, WP01의 `judge`를 쓴다
- `view/map.ts`는 WP03 소유 — T026은 소유 밖 수정(이유 기록)

## Branch Strategy

계획·구현·머지 대상 모두 `mission/03-seismic-analyst`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다. 끝나면 `feat(WP05): …`로 커밋한다.

## Subtasks

### T021: `scripts/build-coastline.mjs` + `.gitignore` [P]

- Node 내장 모듈만(`node:fs`, `node:crypto`, `node:path`). npm 패키지 추가 금지
- 입력: `scripts/data/ne_10m_land.geojson` (`.gitignore`에 `scripts/data/` 추가). 없으면 내려받을 URL을 출력하고 멈춤: `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e/geojson/ne_10m_land.geojson`
- SHA-256이 `1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416`가 아니면 멈춤 (research R2)
- 단계: 경도 127.5~130.7°E, 위도 34.5~37.3°N 상자와 겹치는 다각형 고리만 → `geo.ts`와 **같은 식**으로 km(같은 상수를 스크립트에 복제하지 말고 숫자 세 개를 주석으로 대조 — 아니면 `geo.ts`를 import할 수 있게 `.mjs`에서 쓸 수 있는 형태로 둠. 둘 중 하나를 고르고 이유를 주석에) → 0.1 km 반올림 → 앞 점과 0.3 km 미만 점 제거 → −20~220 km 밖 점만 이어지는 구간 잘라냄
- 출력: `episodes/03-seismic-analyst/src/model/coastline.ts` — 머리 주석에 출처 URL·커밋·SHA-256·라이선스(퍼블릭 도메인)·생성 명령, 본문은 `export const COASTLINE: readonly (readonly number[])[]`(고리마다 x0, y0, x1, y1 … 평탄 배열). 30 KB 이하

### T022: `model/geo.ts` + `tests/geo.test.ts` [P]

```ts
export const ORIGIN = { lat: 35.0, lon: 128.0 }, PHI_REF = 36.0, EARTH_R = 6371; // C-010 고정, 출처 주석
export function toKm(g: GeoPoint): Point
export function toGeo(p: Point): GeoPoint
```

테스트 (answers.md M7):
- 원점 → (0, 0). 위도 1° → 111.195 km (2πR/360)
- USGS 진앙 → (109.408, 86.821) (1e-3)
- 관측소 (30, 40)·(110, 30)·(80, 170)에서 진앙까지 참 거리 92.183 / 56.824 / 88.224, `spTime` 반올림 11.0 / 6.8 / 10.5
- 하버사인 독립 비교: 세 거리 차이 각각 0.4 km 이내
- 민감도 고정 테스트: φ_ref를 36.0으로 썼을 때만 위 반올림이 나온다는 것을 주석으로, 관측소 1 참값 10.974 s가 10.95 경계 위임을 단언 (C-010이 깨지면 테스트가 잡게)
- `toGeo(toKm(g))` 왕복 1e-9

### T023: `model/coastline.ts` 생성 + `tests/coastline.test.ts`

- 원본을 내려받아 스크립트 실행. 생성 파일 커밋(원본은 커밋하지 않음 — `git status`로 확인)
- 테스트: 파일 크기 ≤ 30 KB(빌드 산출물이 아니라 소스 길이로), 모든 좌표가 −20~220 범위, 포항(36.019°N, 129.343°E — 출처 주석)·경주 진앙이 육지 다각형 안(점-다각형 포함 판정), 바다 쪽 점(예: 129.8°E, 35.8°N)은 밖
- 포항·바다 좌표는 테스트 전용 확인점이며 화면에 쓰지 않는다

### T024: `model/m7-flow.ts` + `tests/m7-flow.test.ts` + `missions/gyeongju.ts`

- 상태 기계(data-model "M7 관측소별 단계"): 관측소마다 `reading → distance → drawn`. 판독 통과(±0.3 s, 기록 Δt로 확정)해야 거리 입력이 열리고, 거리 통과(±2 km, 8.4 × 기록 Δt로 확정)해야 원이 그려짐. 세 관측소가 모두 `drawn`이면 좌표 입력이 열림
- 테스트: 순서를 건너뛰는 이벤트는 무시, 확정값 92.40 / 57.12 / 88.20, 좌표 판정은 USGS 진앙 km와의 거리 ≤ 5(경계 포함), 반올림 반지름 세 원의 진앙 쪽 교점 (109.48, 87.12)·(109.60, 86.92)·(110.17, 87.12)이 모두 통과 범위
- 미션: 상황(실제 지진, 2016-09-12 경주) → 관측소를 하나씩 탭(지진 기록 탭 ↔ 지도 탭) → 좌표 계산 또는 지도에서 세 원이 모인 곳 탭 → 판정 → 결과(T025)
- 기록은 `recordFor(기록 Δt)` — 발생 시각 없음

### T025: `view/notes.ts`

- M7 결과: USGS 진앙 35.7808°N 129.2162°E와 지도 점, 보낸 점과의 거리(소수 첫째 자리), 규모 Mw 5.4(USGS)만(기상청 값 쓰지 않음, 검토 m7)
- 진원·진앙 설명: 깊이 13 km, 진원 거리는 평면 거리보다 0.9 ~ 1.5 km 길다(answers.md)
- 단순화 고지(FR-017): 파 속도는 게임용 고정값(실제로는 깊이·암석에 따라 다름), 깊이 무시, 평면 지도 근사, 관측소는 가상 위치, 실제로는 수십 곳 관측소와 컴퓨터 계산. 예: 미시간 공대 예제 "S-P 24 s → 215 km"가 이 게임 식으로는 201.6 km(출처 URL)
- 모든 문구 한/영

### T026: `view/map.ts` 보강 (소유 밖)

- 해안선 층(육지 채움 + 해안선), 바다·육지 색은 테마 변수, 대비 4.5:1(NFR-006)
- M7 지도 축 라벨(km)과 원점 표기 "원점 35.0°N 128.0°E"
- 커밋 메시지에 "M7 해안선 층 추가 (WP03 소유)"

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 원본 데이터가 저장소에 없음, 생성 파일 머리 주석에 출처·해시
- 네트워크를 끊고도 지도가 그려짐(NFR-007)
- 독립 확인 통과

## Risks

- 스크립트와 `geo.ts`의 환산이 어긋나면 해안선과 USGS 점이 어긋난다(검토 R5) — 테스트의 포항·진앙 육지 판정이 잡는다
- 관측소 1이 반올림 경계에 가깝다 — φ_ref 고정 테스트

## Reviewer Guidance

해시 확인·원본 미커밋·같은 환산 사용을 확인하고, M7 순서 강제가 상태 기계 테스트로 덮였는지 본다.
