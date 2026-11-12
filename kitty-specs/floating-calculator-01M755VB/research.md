# Research: 공통 엔진 떠 있는 미니 계산기

계획 단계의 기술 결정. 스펙에 남은 [NEEDS CLARIFICATION]은 없다. 새 의존성이 없어 공급망 점검·adversarial 검토 대상은 없다.

## R1. 식 해석 방식

- **Decision**: 직접 쓴 토큰화 + 재귀 하강 파서. 우선순위 층마다 함수 하나 (data-model.md 문법)
- **Rationale**: 스펙 2절 규칙 중 "붙여 쓴 곱이 `×÷`보다 먼저", "단항 −는 `^`보다 나중이지만 지수 자리에서는 허용", "√는 한 항"은 일반 계산기 라이브러리 관례와 다르다(예: math.js는 붙여 쓴 곱을 `×`와 같은 순위로 다룸). 층을 직접 쓰면 규칙과 코드가 1:1로 대응하고 answers 사례로 바로 검증된다. `eval`·`Function`은 FR-001이 금지
- **Alternatives considered**: math.js·expr-eval 같은 라이브러리(규칙 불일치, 의존성 추가), Shunting-yard(단항 −와 붙여 쓴 곱 처리가 재귀 하강보다 읽기 어려움)

## R2. 오류 판정 순서

- **Decision**: (1) 괄호 짝 검사(깊이가 음수가 되거나 끝에서 0이 아님 → 괄호 짝) → (2) 토큰화(소수점 둘·소수점만 → 식 확인) → (3) 파싱(빈 식·빈 괄호·연산자로 시작/끝 → 식 확인) → (4) 계산 중 수학 오류(0으로 나눔, 실수 아님, 음수 밑, 너무 큼)
- **Rationale**: E9~E11은 괄호 짝 이유를 기대하므로 문법 오류보다 먼저 봐야 한다(`(1+2`를 파서가 먼저 보면 "식 확인"이 됨). E21 `√(2`도 괄호 짝
- **Alternatives considered**: 파서 안에서 괄호 오류를 구분(오류 위치에 따라 이유가 흔들림)

## R3. 계산 중 오류

- **Decision**: 연산마다 검사한다. `a÷0` → 0으로 나눔. `0^b`(b<0) → 0으로 나눔, `0^0` → 실수 아님. `√a`(a<0) → 실수 아님. `a^b`(a<0, `!Number.isInteger(b)`) → 음수 밑. 연산 결과가 `!Number.isFinite` → 너무 큼. 결과 0으로의 언더플로는 오류가 아님(R6, D14)
- **Rationale**: 마지막에만 검사하면 `10^400÷10^400`(∞/∞ = NaN)처럼 원인이 사라진다. 정수 지수 판정은 계산된 값 기준(스펙 2절, P25)
- **Alternatives considered**: 결과만 검사(원인 문구가 틀어짐)

## R4. 결과 표시

- **Decision**: 0(−0 포함)은 `0`. 그 밖에는 `Number(v.toPrecision(10))`로 반올림한 뒤, 절댓값이 10¹⁰ 이상이거나 10⁻⁶ 미만이면 `toExponential(9)`의 가수에서 끝 0과 소수점을 지워 `a×10^n`, 아니면 `String(반올림값)`
- **Rationale**: 반올림 후 경계 판단(D8 `9999999999.6` → `1×10^10`). 10⁻⁶ ≤ |v| < 10¹⁰ 범위에서 `String`은 지수 표기를 쓰지 않는다(JS는 10²¹ 이상, 10⁻⁶ 미만에서만 지수 표기). 끝 0은 `Number` 변환으로 사라진다
- **Alternatives considered**: `Intl.NumberFormat`(유효숫자 지원하지만 지수 표기 형식을 맞추기 어렵고 로캘마다 구분 기호가 다름)

## R5. Esc 우선 처리

- **Decision**: 계산기가 `window.addEventListener('keydown', h, { capture: true })`. 펼쳐져 있고 키가 Escape면 접고 `e.stopPropagation()`
- **Rationale**: 이벤트는 window(캡처) → document(캡처) → … → document(버블) 순으로 전달된다. 튜토리얼은 `document`의 버블 단계 리스너(`engine/src/tutorial/index.ts:103`)이므로 window 캡처에서 멈추면 닿지 않는다. 튜토리얼 JS를 바꾸지 않아 기존 튜토리얼 테스트에 영향이 없다
- **Alternatives considered**: 튜토리얼이 "계산기 열림"을 물어보게 수정(엔진 모듈끼리 결합), `stopImmediatePropagation`(같은 대상의 다른 리스너가 없어 불필요)

## R6. 카드 위 배치

- **Decision**: `avoid()`가 주는 카드 요소를 `ResizeObserver`로 관찰하고, `resize`·카드 표시 변경 때 배치를 다시 계산한다. 버튼 `bottom = innerHeight − cardRect.top + 8`(카드가 숨겨져 있으면 기본 12px + safe-area). 계산기는 `right = 버튼 폭 + 버튼 오른쪽 여백 + 8`, `bottom = 버튼 bottom`, `top`이 8 미만이 되면 `bottom`을 줄여 `top = 8`. 계산기가 열려 있는 동안 `body.calc-open` → 튜토리얼 CSS `max-height:38vh`
- **Rationale**: 카드 높이는 단계·언어·결과 줄에 따라 바뀐다. CSS만으로는 "카드 위"를 표현할 수 없다(카드는 내용 높이 + max-height). 숨김(`hidden`)은 ResizeObserver에서 크기 0으로 잡힌다. 38vh·8px 근거는 answers Physical values
- **Alternatives considered**: CSS 변수로 카드 높이를 튜토리얼이 내보내기(튜토리얼 JS 수정), 버튼을 카드 안에 넣기(스펙 검토 C1 선택지 c, 사람이 a를 고름)

## R7. 휴대폰 키보드가 뜨지 않게

- **Decision**: 식 표시줄은 `<output>`(포커스 없음), 키는 `<button type="button">`. 키를 눌러도 포커스가 입력 요소로 가지 않는다
- **Rationale**: `inputmode="none"`의 입력란보다 단순하고, 무전 입력란에서 포커스를 빼앗지 않는다. 참고 자료(W3Cub `inputmode`)는 자체 키패드 근거
- **Alternatives considered**: `<input inputmode="none" readonly>`(일부 브라우저에서 커서·선택 동작이 남음)

## R8. 계산기를 보일 단계 (02)

- **Decision**: `onRender`에서 `setAvailable(!!step.radio && !step.radioHidden?.(state))`, `onEnd`에서 `setAvailable(true)`, 처음 로드는 `false`
- **Rationale**: 무전 입력란이 실제로 보이는 단계와 같다(M7은 다섯 코너를 다 답하면 숨김). 튜토리얼 완료 후 재방문 첫 화면은 스펙의 "튜토리얼 시작 전 첫 화면"으로 보고 숨김(사람 확인 2026-11-12)
- **Alternatives considered**: 단계마다 `calc: true` 속성을 따로 달기(무전 단계 목록과 중복, 빠뜨리기 쉬움)
