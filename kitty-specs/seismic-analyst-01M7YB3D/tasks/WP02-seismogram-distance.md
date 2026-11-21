---
work_package_id: WP02
title: 지진 기록 판독과 거리 (M2)
dependencies:
- WP01
requirement_refs:
- FR-003
- FR-007
- FR-011
- FR-014
- FR-015
- NFR-002
planning_base_branch: mission/03-seismic-analyst
merge_target_branch: mission/03-seismic-analyst
branch_strategy: Planning artifacts for this mission were generated on mission/03-seismic-analyst. During implementation this WP is built directly on mission/03-seismic-analyst (no lanes/worktrees, docs/agents/main.md section 6); completed changes stay on mission/03-seismic-analyst and reach main through the PR.
subtasks:
- T007
- T008
- T009
- T010
phase: Phase 2 - Story 1
history:
- !!omap
  - at: '2026-11-21T08:01:24Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/03-seismic-analyst/src/view/seismogram.ts
create_intent:
- episodes/03-seismic-analyst/src/model/seismogram.ts
- episodes/03-seismic-analyst/src/view/drag.ts
- episodes/03-seismic-analyst/src/view/seismogram.ts
- episodes/03-seismic-analyst/tests/seismogram.test.ts
- episodes/03-seismic-analyst/tests/m2.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/03-seismic-analyst/src/model/seismogram.ts
- episodes/03-seismic-analyst/src/view/drag.ts
- episodes/03-seismic-analyst/src/view/seismogram.ts
- episodes/03-seismic-analyst/tests/seismogram.test.ts
- episodes/03-seismic-analyst/tests/m2.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – 지진 기록 판독과 거리 (M2)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile).

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

## Objective

합성 지진 기록과 P·S 마커 판독을 만들고, 판독이 확정된 뒤 거리 식을 유도해 거리를 보내는 M2를 완성한다. 끌기 도우미 `view/drag.ts`는 여기서 처음 만들고 WP06이 다시 쓴다.

**독립 확인**: M2에서 마커를 3.0 / 18.0 s에 놓으면 판독 통과 → "확정된 값 15.0 s" 표시 → 126 km(±2)를 보내 통과. P 마커를 3.4 s에 두면 판독 불통과(힌트: 첫 흔들림이 시작되는 곳).

## Context

- 스펙 Core Interaction "지진 기록", M2 행, Edge Cases(마커), 중간값 확정 규칙 · answers.md M2 · research R4
- WP01의 `judge.ts`(`judgeIntermediate`, `judgeValue`)와 `waves.ts`를 쓴다
- `main.ts`·`missions/distance.ts`는 WP01 소유 — M2 단계 추가와 연결은 소유 밖 수정이며 커밋 메시지에 이유를 적는다

## Branch Strategy

계획·구현·머지 대상 모두 `mission/03-seismic-analyst`이고 PR은 `main`으로 보낸다. lane·worktree를 쓰지 않고 이 브랜치에서 직접 구현한다. 끝나면 `feat(WP02): …`로 커밋한다.

## Subtasks

### T007: `model/seismogram.ts` + `tests/seismogram.test.ts` [P]

data-model.md `Seismogram`:

```ts
export function recordFor(spTime: number): Seismogram  // { pArrival: 3, sArrival: 3 + spTime, end: 3 + spTime + 5 }
export function amplitude(rec: Seismogram, t: number): number // 결정적 파형 (난수 없음)
export const snapTenth = (t: number) => Math.round(t * 10) / 10
export function readSp(p: number, s: number): number | 'invalid' // s ≤ p 이면 'invalid'
```

- 파형: P 전에는 작은 잡음(결정적 사인 합), P 도착 뒤 진폭이 눈에 띄게 커지고 S 도착 뒤 더 크게. 첫 도착이 눈으로 분명해야 한다(research R4)
- **지진 발생 시각을 담지 않는다** (P 도착 시각 × Vp 지름길 방지, 검토 R10)
- 테스트: M2 기록(spTime 15) → 3 / 18 / 23 (answers.md M2, spec의 M2 기록과 일치), `amplitude`는 같은 입력에 같은 값, P 전 최대 진폭 < P 뒤 최대 진폭 < S 뒤 최대 진폭, `snapTenth(3.04) = 3.0`, `readSp(18, 3) = 'invalid'`

### T008: `view/drag.ts` [P]

```ts
export function bindPointerDrag(el: HTMLElement, onMove: (x: number, y: number) => void): () => void
```

- `pointerdown`에서 `setPointerCapture`, `pointermove`(누르는 동안), `pointerup`·`pointercancel`에서 끝. 좌표는 요소 기준 CSS px
- 요소에 `touch-action: none`을 걸어 끄는 동안 페이지가 스크롤되지 않게 (US4 시나리오 5와 같은 요구)
- 해제 함수를 돌려준다. 02의 `view/circle.ts` 끌기와 같은 방식이지만 복사하지 않고 새로 작성(research R1)

### T009: `view/seismogram.ts`

- 캔버스에 기록 구간 0 ~ end를 가로로. 1 s 눈금, 5 s마다 숫자. 가로축 라벨 "기록 시작부터의 시간 (s)" / "Time since recording started (s)"
- P·S 마커: 세로선 + 44×44 px 손잡이. `bindPointerDrag`로 끌고 `snapTenth`로 맞춤. 마커마다 ◀ ▶ 버튼(44×44, 0.1 s씩). 구간 밖으로 못 나감
- 현재 P·S 시각과 그 차를 텍스트로 표시 (id 부여)
- 360px에서 23 s 구간이면 1 s ≈ 14 px — 버튼이 주된 정밀 조작 수단

### T010: M2 단계 + `tests/m2.test.ts`

- `missions/distance.ts`에 M2 단계 추가: 상황 → 기록 읽기(판독 ±0.3 s, `judgeIntermediate`) → 통과하면 확정값 15.0 s로 마커가 맞춰지고 "확정된 값 15.0 s로 계산하세요" 안내(검토 m1) → 거리 식 유도(FR-011): "같은 거리 d를 두 파가 갔으니 d/Vs − d/Vp = Δt → d = Δt · VpVs/(Vp − Vs)"를 엔진 `formula`(MathML)로 단계별 표시, 숫자 예시(84 km ↔ 10 s)를 먼저 → 거리 보내기(±2 km, `judgeValue`) → 왜 중요한가
- 식과 기호 뜻(FR-015): 식 옆 (i)로 Vp, Vs, Δt, d의 뜻
- 테스트: 판독 14.7 / 15.3 통과·14.6 / 15.4 불통과, 통과하면 `confirmed` 15, 거리 124 / 128 통과·123.9 / 128.1 불통과 (answers.md M2)

## Definition of Done

- 모든 subtask 완료, `pnpm check` 통과
- 독립 확인 통과, 끄는 동안 페이지가 스크롤되지 않음(모바일 에뮬레이션으로 직접)
- 새 호출처 없는 코드가 없음

## Risks

- 마커 손잡이가 44 px보다 작아지기 쉽다 (캔버스 위 DOM 손잡이 권장)
- 판독 통과 뒤에도 학습자 판독값을 계속 표시하면 확정 규칙이 흐려진다

## Reviewer Guidance

기록에 발생 시각이 없는지, 확정 규칙대로 다음 단계가 정답값을 쓰는지, 테스트 기대값이 answers.md와 같은지 확인한다.
