# Mission Specification: WebKit 캔버스 테마 색과 레이스 엔지니어 e2e 세 엔진

**Mission Branch**: `mission/engine-webkit-theme-colors`  
**Created**: 2026-11-08  
**Status**: Draft — **가벼운 경로** (라벨 `light`: `answers.md`·스펙 검토·plan/tasks 생략, docs/agents/main.md "경로")  
**Input**: Issue #36 (PR #35 크로스체크 반영 중 발견, 사람 채택·경로 결정 2026-11-08) — WebKit에서 페이지를 처음 열면 캔버스가 테마 색 대신 검정으로 그려진다. 레이스 엔지니어의 새 e2e 두 파일은 CI에서 chromium으로만 돈다

## Episode Design *(기존 에피소드 01·02와 템플릿 공통 수정: 바뀌는 항목만)*

1~3, 5~8: N/A — 역할·수학·학습 목표·진행·정답과 무관. 화면 색만 바로잡는다.

### 4. Core Interaction

조작은 그대로다. WebKit(Safari 엔진)에서 처음 열었을 때도 캔버스 그림이 다른 브라우저와 같은 테마 색으로 보이게 한다.

| 화면 | 지금 (WebKit, 캐시 없이 처음 열 때) | 바뀐 뒤 |
|---|---|---|
| 자주포 지형·그래프 | 선·채움이 검정 | 테마 색 |
| 레이스 엔지니어 코너 그림·마찰원 | 선·채움·글자가 검정 (다크 테마에서 축 이름이 배경에 묻힘) | 테마 색 |
| Chrome·Firefox | 테마 색 | 그대로 |

조사 결과 (2026-11-08, Docker 공식 Playwright 이미지 v1.64.1의 WebKit): 페이지 스크립트가 실행될 때 WebKit은 스타일시트를 아직 다 적용하지 않아 테마 색 값이 비어 있다. 세 곳(두 에피소드, 템플릿)은 이 시점에 색을 한 번 읽고 테마가 바뀔 때만 다시 읽으므로, 빈 값이 남아 캔버스 기본색(검정)이 된다. 같은 페이지에서 CSS가 캐시에 있으면 정상이라 늘 재현되지는 않는다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Safari 학습자도 테마 색으로 본다 (Priority: P1)

아이폰 Safari로 에피소드를 처음 연 학습자가, 다른 브라우저와 같은 색의 지형·코너·마찰원을 보고 다크 테마에서도 그림의 글자를 읽는다.

**Acceptance Scenarios**:

1. **Given** WebKit, 캐시 없음, 라이트 테마, **When** 레이스 엔지니어를 연다, **Then** 코너 그림이 테마 색(검정만이 아닌)으로 그려진다
2. **Given** WebKit, 캐시 없음, 다크 테마, **When** M8 마찰원 단계에 들어간다, **Then** 축 이름 글자가 배경과 4.5:1 이상 대비로 그려진다
3. **Given** WebKit, 캐시 없음, **When** 자주포를 연다, **Then** 지형·그래프가 테마 색으로 그려진다
4. **Given** Chrome 또는 Firefox, **When** 같은 화면을 연다, **Then** 지금과 같다 (기존 테스트 무수정 통과)
5. **Given** 페이지를 연 뒤, **When** 시스템 테마를 바꾼다, **Then** 지금처럼 새 테마 색으로 다시 그려진다

### Edge Cases

- CSS가 이미 캐시에 있어 처음부터 색이 있는 경우에도 한 번 더 읽어 다시 그리는 것이 화면을 깜빡이게 하지 않는다 (같은 색으로 다시 그림)
- 튜토리얼 진행 중이거나 애니메이션이 도는 중에 다시 그려져도 상태가 바뀌지 않는다

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | 늦게 적용된 스타일 반영 | 학습자로서, 스타일시트가 늦게 적용되는 브라우저에서도 페이지를 다 읽은 뒤에는 캔버스가 테마 색으로 그려지기를 원한다. 두 에피소드와 템플릿에 같은 방식으로 적용한다 | High | Open |
| FR-002 | 레이스 엔지니어 e2e 세 엔진 | 개발자로서, 레이스 엔지니어의 모든 브라우저 테스트 파일(`race-engineer*.spec.ts`)이 CI의 Firefox·WebKit에서도 돌기를 원한다 (PR #33·#35 스펙의 "CI 세 엔진"과 실제를 맞춤) | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | 확인 | 수락 시나리오 1~3을 WebKit에서, 4는 기존 테스트로 단언. 시나리오 2는 기존 `race-engineer-m8.spec.ts` 대비 테스트가 CI WebKit에서 통과하는 것으로 확인. 각 단언은 수정 전 코드에서 한 번 실패하는 것을 확인 | Testability | High | Open |
| NFR-002 | CI 시간 | CI e2e 단계 증가 2분 이내 (PR #35 기준 15분 16초와 비교해 PR 본문에 기록) | Performance | Medium | Open |
| NFR-003 | 실제 기기 | 머지 후 아이폰 Safari 시크릿 탭으로 배포 사이트를 처음 열어 캔버스 색 확인 1회 (사람) | Usability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | 계산 불변 | 계산·물리값 코드(`src/model/`, 엔진 수학)는 바꾸지 않는다 — 바뀌게 되면 멈추고 사람에게 묻는다 (가벼운 경로 조건) | Technical | High | Open |
| C-002 | 범위 | 처음 열 때 캔버스 크기가 스타일 적용 전에 계산될 수 있는 문제는 범위 밖 (화면 증상 미관찰) | Business | Medium | Open |

## Success Criteria *(mandatory)*

- **SC-001**: WebKit에서 캐시 없이 처음 연 두 에피소드의 캔버스에 테마 색이 아닌 검정으로만 그린 그림이 0개다
- **SC-002**: 레이스 엔지니어 브라우저 테스트 파일 2개(`race-engineer.spec.ts`, `race-engineer-m8.spec.ts`)와 새 테마 색 테스트(`theme-colors.spec.ts`)가 모두 세 엔진에서 실행된다 (지금 레이스 엔지니어 1개)
- **SC-003**: Chrome·Firefox의 기존 화면·테스트 변화 0

## Assumptions

- 가벼운 경로: 난이도 1, 계산·물리값·학습 흐름 불변, 화면 색만 (사람 결정 2026-11-08, Issue #36)
- Docker WebKit 재현을 실제 Safari의 대리로 본다. 실제 기기 확인은 NFR-003
- 세 곳 모두 엔진의 테마 변경 처리를 쓰므로 엔진 쪽 한 곳 수정으로 함께 고친다 (DM-01M6X65A7HJMHMEX8VTA6K2MSC)
