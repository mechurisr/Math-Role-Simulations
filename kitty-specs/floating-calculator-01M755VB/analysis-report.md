---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: floating-calculator-01M755VB
mission_id: 01M755VBKP6S48Z1T5C937EZCP
generated_at: '2026-11-12T11:15:03.855516+00:00'
analyzer_agent: unknown
input_artifacts:
  spec.md:
    path: kitty-specs/floating-calculator-01M755VB/spec.md
    sha256: 38f6c5837a28134d7f6f78187ebe298f8a1a37255691d11453620757d0552a5f
  plan.md:
    path: kitty-specs/floating-calculator-01M755VB/plan.md
    sha256: 85ec31fe35c1b658a2592d1a0246d0e1d6230735ecd9c207e95140c23383d1d5
  tasks.md:
    path: kitty-specs/floating-calculator-01M755VB/tasks.md
    sha256: 9b41a630eb6eb538df4c96cac86471f0ef72c6fef3d1ad3c887500a82e237092
  charter:
    path: .kittify/charter/charter.yaml
    sha256: 4fd37ecfe82fe44cda789fa2ae53b2395f4ab27ec47373f903fd8d01689e3a99
verdict: ready
issue_counts:
  critical: 0
  medium: 2
  high: 0
  low: 3
  info: 0
findings:
- id: U1
  severity: medium
  category: underspecification
  summary: With the calculator open the card shrinks to 38vh and scrolls; the radio input may sit below the card's scroll position, so NFR-002 elementFromPoint at 360x640 can hit nothing.
- id: I1
  severity: medium
  category: inconsistency
  summary: The fixed round button (z 1050) above the card can cover page controls the existing race-engineer e2e taps (#go, wing buttons) in radio steps, risking NFR-003 (existing tests unchanged).
- id: U2
  severity: low
  category: underspecification
  summary: While open, the calculator panel (~284x352) covers page controls above the card; spec does not say whether that is acceptable in radio steps that also need sliders.
- id: C1
  severity: low
  category: coverage
  summary: NFR-004 (100 ms response) has no measuring task; only argued in plan.
- id: C2
  severity: low
  category: coverage
  summary: NFR-005 (post-merge phone check) is mapped to WP02 but is a manual step after merge, not part of the WP's done criteria.
---

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| U1 | Underspecification | MEDIUM | spec.md 4절 "튜토리얼 카드와 함께 열릴 때", NFR-002; WP02 T011 | 계산기가 열리면 카드가 38vh로 줄고 넘치는 내용은 카드 안에서 스크롤된다. M3처럼 본문이 긴 단계에서는 무전 입력란이 카드 스크롤 아래에 있어 화면에 안 보일 수 있다. 그러면 NFR-002의 `elementFromPoint` 단언이 실패하고, 학습자도 입력란을 찾으려고 카드를 스크롤해야 한다 | 계산기를 펼칠 때(또는 결과가 나올 때) 카드 안에서 무전 입력란이 보이도록 스크롤한다는 한 줄을 4절에 넣거나, WP01 T006에 구현 지시로 추가 |
| I1 | Inconsistency | MEDIUM | spec.md 4절 버튼 자리·NFR-003; `e2e/race-engineer.spec.ts:21,68` | 무전 단계에서 원형 버튼이 카드 위 오른쪽에 고정되는데, 기존 완주 테스트는 같은 단계들에서 `#go`·윙 버튼을 탭한다. 버튼이 그 위에 오면 Playwright가 "다른 요소가 가로챔"으로 실패해 "기존 테스트 무수정 통과"가 깨진다 | WP01 끝에 기존 race-engineer e2e를 먼저 돌려 확인(이미 WP01 DoD에 있음). 겹치면 스펙 규칙 안에서 해결이 안 되므로 사람에게 물음 (예: 페이지 아래 여백 늘리기) |
| U2 | Underspecification | LOW | spec.md 4절, 5절 | 펼친 계산기는 카드 위 화면 대부분을 덮는다. M7처럼 무전 단계에서 슬라이더·주행 버튼도 쓰는 경우, 학습자는 계산기를 접어야 조작할 수 있다 | 의도라면 Assumptions에 한 줄. 접어도 식이 남으므로 학습 흐름에는 지장이 적음 |
| C1 | Coverage | LOW | spec.md NFR-004; tasks.md | 100ms 반응 속도를 재는 작업이 없다 (plan에서 파싱 비용으로만 논증) | 그대로 두거나 단위 테스트에 100자 식 계산 시간 상한 한 줄 |
| C2 | Coverage | LOW | spec.md NFR-005; WP02 | 머지 후 휴대폰 확인은 WP02 완료 조건이 아니라 머지 뒤 사람 확인 단계 | PR 본문 "리뷰 요청 사항"에 머지 후 확인으로 적음 |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 식 해석 | yes | T001, T003 | |
| FR-002 식 오류 | yes | T001, T002, T003 | 6종 |
| FR-003 결과 표시 | yes | T002, T003 | |
| FR-004 떠 있는 버튼 | yes | T004, T006, T011 | |
| FR-005 자체 키패드 | yes | T004, T011 | |
| FR-006 접기 규칙 | yes | T005, T010 | Esc 포함 |
| FR-007 식 유지 | yes | T005, T010 | |
| FR-008 카드와 배치 | yes | T006, T011 | U1 |
| FR-009 단계별 켜고 끄기 | yes | T005, T008, T010 | |
| FR-010 레이스 엔지니어 적용 | yes | T008, T010 | |
| FR-011 판정 불변 | yes | T008, T012 | |
| FR-012 한/영 | yes | T002, T004, T008, T011 | |
| FR-013 입력란 위 결과 | yes | T008, T012 | |
| NFR-001 단위 테스트 | yes | T003 | |
| NFR-002 모바일 배치 | yes | T011 | U1 |
| NFR-003 단계 표시·회귀 | yes | T010, T013 | I1 |
| NFR-004 반응 속도 | no | — | C1 |
| NFR-005 휴대폰 확인 | partial | — | C2 |
| C-001~C-005 | yes | T001, T007, T008 | |

**Charter Alignment Issues:** 없음. PRJ-001(출처 주석), PRJ-002(단위 테스트), PRJ-003(엔진 공개 경로), PRJ-004(360px·44px e2e), PRJ-005(멈추고 질문 규칙 C-005), PRJ-007(한/영) 모두 계획·작업에 반영됨.

**Unmapped Tasks:** 없음.

**Metrics:**

- Total Requirements: 23 (FR 13, NFR 5, C 5)
- Total Tasks: 13
- Coverage: 22/23 = 96% (NFR-004만 작업 없음, NFR-005는 머지 후)
- Ambiguity Count: 2 (U1, U2)
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- CRITICAL·HIGH 없음 → 구현 가능 (verdict ready)
- U1은 구현 전에 정하면 좋다: 4절에 "계산기를 펼치면 카드 안에서 무전 입력란이 보이게 스크롤" 추가 여부 (사람 결정)
- I1은 WP01 끝에 기존 e2e로 확인하고, 깨지면 사람에게 묻는다
