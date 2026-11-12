# Data Model: 공통 엔진 떠 있는 미니 계산기

## 1. 식 문법 (`engine/src/math/expression.ts`)

스펙 2절 우선순위 표를 층으로 옮긴 것. 아래 층일수록 먼저 계산된다.

```
expr      := term (('+' | '−') term)*                 # 규칙 7, 왼쪽부터
term      := unary (('×' | '÷') unary)*               # 규칙 6, 왼쪽부터
unary     := '−' unary | implicit                     # 규칙 5 (식 맨 앞, '(' 뒤, 연산자 뒤)
implicit  := power power*                             # 규칙 4, 다음 토큰이 숫자·π·'('·'√'이면 곱
power     := root ('^' expUnary)?                     # 규칙 3, 오른쪽부터
expUnary  := '−' expUnary | power                     # 지수 자리의 단항 −
root      := '√' rootArg | atom                       # 규칙 2
rootArg   := '−' rootArg | root                       # √ 뒤 단항 − (√-4), √√16
atom      := number | 'π' | '(' expr ')'              # 규칙 1
number    := digits ('.' digits?)? | '.' digits
```

- 토큰 동일시: `-`=`−`, `*`=`×`, `/`=`÷`. 공백은 무시(키패드로는 생기지 않음)
- `implicit` 반복 조건에 `−`는 없다. `2−3`은 빼기다
- 검증 예: `2^-1^2` → power(2, expUnary(−power(1^2))) = 0.5, `2^3π` → implicit(power(2^3), π), `√9^2` → power(root(9), 2) = 9

## 2. 타입

```ts
type CalcError = 'syntax' | 'brackets' | 'divZero' | 'notReal' | 'negBase' | 'tooLarge';
type EvalResult = { ok: true; value: number } | { ok: false; reason: CalcError };

function evaluate(expr: string): EvalResult;     // 순수
function formatResult(value: number): string;   // 순수, 유효숫자 10, a×10^n
const CALC_ERROR_TEXT: Record<CalcError, Text>; // P(ko, en), 스펙 2절 표 문구 그대로
```

| reason | ko | en |
|---|---|---|
| syntax | 식을 확인하세요 | Check the expression |
| brackets | 괄호 짝이 맞지 않습니다 | Brackets don't match |
| divZero | 0으로 나눌 수 없습니다 | Can't divide by zero |
| notReal | 실수로 계산할 수 없습니다 | Not defined for real numbers |
| negBase | 밑이 음수이고 지수가 정수가 아니면 여기서는 계산하지 않습니다 | A negative base with a non-integer exponent isn't evaluated here |
| tooLarge | 결과가 너무 큽니다 | Result too large |

## 3. 계산기 상태 (`engine/src/calculator/`)

```ts
interface CalculatorOptions {
  avoid?: () => HTMLElement | null;   // 피해야 할 아래 고정 카드 (02: 튜토리얼 카드 #tut)
}
interface Calculator {
  setAvailable(on: boolean): void;    // false: 접고 버튼 숨김, 식 유지
  onResult(cb: (shown: string | null) => void): void;  // 값 결과 문자열 또는 null
  readonly open: boolean;
}
function createCalculator(o?: CalculatorOptions): Calculator;
```

내부 상태: `expr: string`(표시용 기호 그대로), `result: EvalResult | null`, `open: boolean`, `available: boolean`.

### 상태 전이

| 지금 | 사건 | 다음 | 부수 효과 |
|---|---|---|---|
| 숨김 | `setAvailable(true)` | 접힘 | 버튼 보임 |
| 접힘·펼침 | `setAvailable(false)` | 숨김 | 패널 닫고 버튼 숨김, `body.calc-open` 제거, 식·결과 유지 |
| 접힘 | 버튼 | 펼침 | `body.calc-open` 추가, 배치 계산 |
| 펼침 | 버튼·닫기(×)·Esc | 접힘 | `body.calc-open` 제거. Esc는 전파 중지 |
| 펼침 | 바깥 클릭(무전 입력란 포함) | 펼침 | 없음 |
| 펼침 | 숫자·연산자 키 | 펼침 | `expr += 기호`, `result = null` → `onResult(null)` |
| 펼침 | `√` | 펼침 | `expr += '√('`, `result = null` |
| 펼침 | `⌫` | 펼침 | 마지막 한 글자 삭제, `result = null` |
| 펼침 | `C` | 펼침 | `expr = ''`, `result = null` |
| 펼침 | `=` | 펼침 | `result = evaluate(expr)`; ok면 `onResult(formatResult(v))`, 아니면 `onResult(null)` |

불변식: `result`가 있으면 그것은 지금 `expr`의 계산 결과다(식을 고치면 비움). `onResult`는 값 결과일 때만 문자열.

## 4. 배치 값

| 이름 | 값 | 근거 |
|---|---|---|
| 카드와 버튼 간격 | 8px | 스펙 4절 |
| 계산기가 열린 동안 카드 최대 높이 | 38vh | 스펙 4절, R4 |
| 화면 위 최소 여백 | 8px | 스펙 4절 |
| z-index 원형 버튼·계산기 | 1002 이상 1100 미만 (카드 1001 위, 툴팁 1100 아래) | 스펙 4절 |
| 키 크기 | 44×44px 이상, 간격 4px, 5열 | FR-005, answers Physical values |
