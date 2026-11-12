// 떠 있는 계산기의 식 해석과 결과 표시 (순수 함수, 화면과 분리 — 헌장 PRJ-002, 스펙 C-001)
// 규칙: kitty-specs/floating-calculator-01M755VB/spec.md 2절 (우선순위 표, 오류 6종, 결과 표시)
// 문법·결정 근거: 같은 폴더의 data-model.md 1절, research.md R1~R4. 기대값: answers.md §1~§4
// eval·Function 같은 문자열 실행은 쓰지 않는다 (FR-001)
import { P, type Text } from '../i18n';

export type CalcError = 'syntax' | 'brackets' | 'divZero' | 'notReal' | 'negBase' | 'tooLarge';
export type EvalResult = { ok: true; value: number } | { ok: false; reason: CalcError };

// 스펙 2절 오류 표의 문구 그대로
export const CALC_ERROR_TEXT: Record<CalcError, Text> = {
  syntax: P('식을 확인하세요', 'Check the expression'),
  brackets: P('괄호 짝이 맞지 않습니다', "Brackets don't match"),
  divZero: P('0으로 나눌 수 없습니다', "Can't divide by zero"),
  notReal: P('실수로 계산할 수 없습니다', 'Not defined for real numbers'),
  negBase: P('밑이 음수이고 지수가 정수가 아니면 여기서는 계산하지 않습니다', "A negative base with a non-integer exponent isn't evaluated here"),
  tooLarge: P('결과가 너무 큽니다', 'Result too large'),
};

class CalcFail extends Error { constructor(readonly reason: CalcError) { super(reason); } }
const fail = (r: CalcError): never => { throw new CalcFail(r); };
// 연산마다 검사: 마지막에만 보면 10^400÷10^400 (∞/∞ = NaN) 처럼 원인이 사라짐 (research R3)
const finite = (v: number) => Number.isFinite(v) ? v : fail('tooLarge');

type Tok = { t: 'num'; v: number } | { t: 'op'; v: string };
const OPS = '+−×÷^√()π';

// 키패드 기호(− × ÷)와 ASCII(- * /)를 같은 토큰으로 본다
function normalize(s: string) {
  return s.replace(/\s+/g, '').replace(/-/g, '−').replace(/\*/g, '×').replace(/\//g, '÷');
}

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const lit = s.slice(i, j);
      // 소수점이 둘이거나(1.2.3) 숫자 없이 소수점만(.) → 식 오류. .5 와 3. 은 허용
      if ((lit.match(/\./g) ?? []).length > 1 || lit === '.') fail('syntax');
      out.push({ t: 'num', v: Number(lit) }); i = j;
    } else if (OPS.includes(c)) { out.push({ t: 'op', v: c }); i++; }
    else fail('syntax');
  }
  return out;
}

// 괄호 짝은 문법보다 먼저 본다 (research R2: E9~E11, E21이 "괄호 짝"을 기대)
function bracketsBalanced(s: string) {
  let d = 0;
  for (const c of s) { if (c === '(') d++; else if (c === ')' && --d < 0) return false; }
  return d === 0;
}

function sqrt(a: number) { return a < 0 ? fail('notReal') : Math.sqrt(a); }
function pow(a: number, b: number) {
  if (a === 0 && b < 0) fail('divZero');
  if (a === 0 && b === 0) fail('notReal');            // 교과서는 a ≠ 0 일 때만 a⁰ = 1
  if (a < 0 && !Number.isInteger(b)) fail('negBase');   // 계산된 지수 값으로 판단 ((-8)^(6÷3) 은 계산)
  return finite(a ** b);
}

// 재귀 하강. 아래 함수일수록 먼저 계산 (data-model.md 1절 문법과 1:1)
function parse(toks: Tok[]): number {
  let i = 0;
  const peek = () => toks[i];
  const isOp = (v: string) => { const k = toks[i]; return !!k && k.t === 'op' && k.v === v; };
  const take = (v: string) => { if (isOp(v)) { i++; return true; } return false; };
  // 붙여 쓴 곱이 이어지는가: 다음 토큰이 숫자·π·(·√ 로 시작 (− 는 아님: 2−3 은 빼기)
  const startsOperand = () => { const k = peek(); return !!k && (k.t === 'num' || k.v === 'π' || k.v === '(' || k.v === '√'); };

  function expr(): number {                    // 규칙 7: + − 왼쪽부터
    let v = term();
    for (;;) {
      if (take('+')) v = finite(v + term());
      else if (take('−')) v = finite(v - term());
      else return v;
    }
  }
  function term(): number {                    // 규칙 6: × ÷ 왼쪽부터
    let v = unary();
    for (;;) {
      if (take('×')) v = finite(v * unary());
      else if (take('÷')) { const d = unary(); if (d === 0) fail('divZero'); v = finite(v / d); }
      else return v;
    }
  }
  function unary(): number {                   // 규칙 5: 단항 − 는 ^ 와 붙여 쓴 곱보다 나중
    return take('−') ? -unary() : implicit();
  }
  function implicit(): number {                // 규칙 4: 붙여 쓴 곱은 × ÷ 보다 먼저
    let v = power();
    while (startsOperand()) v = finite(v * power());
    return v;
  }
  function power(): number {                   // 규칙 3: ^ 는 오른쪽부터
    const b = root();
    return take('^') ? pow(b, expUnary()) : b;
  }
  function expUnary(): number {                // 지수 자리의 단항 − (2^-1, 2^-1^2)
    return take('−') ? -expUnary() : power();
  }
  function root(): number {                    // 규칙 2: √ 는 바로 뒤 한 항 (√√16, √-4 포함)
    return take('√') ? sqrt(rootArg()) : atom();
  }
  function rootArg(): number {
    return take('−') ? -rootArg() : root();
  }
  function atom(): number {                    // 규칙 1
    const k = peek();
    if (!k) return fail('syntax');             // 연산자나 √ 로 끝남, 빈 식
    if (k.t === 'num') { i++; return k.v; }
    if (k.v === 'π') { i++; return Math.PI; }  // IEEE 754 배정밀도에서 π에 가장 가까운 값
    if (take('(')) { const v = expr(); if (!take(')')) fail('syntax'); return v; }
    return fail('syntax');                     // 빈 괄호 (), 연산자로 시작 등
  }

  const v = expr();
  if (i < toks.length) fail('syntax');
  return v;
}

export function evaluate(input: string): EvalResult {
  const s = normalize(input);
  if (!bracketsBalanced(s)) return { ok: false, reason: 'brackets' };
  try {
    return { ok: true, value: parse(tokenize(s)) };
  } catch (e) {
    if (e instanceof CalcFail) return { ok: false, reason: e.reason };
    return { ok: false, reason: 'syntax' };
  }
}

// 유효숫자 최대 10자리, 끝 0 제거. 반올림한 뒤 |값| ≥ 10¹⁰ 또는 < 10⁻⁶ (0 제외) 이면 a×10^n (research R4)
// 10⁻⁶ ≤ |값| < 10²¹ 에서 String() 은 지수 표기를 쓰지 않으므로 그 사이는 String 그대로
export function formatResult(v: number): string {
  if (v === 0) return '0';                     // −0 포함, 언더플로한 값(10^-400)도 여기
  const r = Number(v.toPrecision(10));
  const a = Math.abs(r);
  if (a >= 1e10 || a < 1e-6) {
    const [m, e] = r.toExponential(9).split('e');
    const mant = m.includes('.') ? m.replace(/0+$/, '').replace(/\.$/, '') : m;
    return `${mant}×10^${Number(e)}`;
  }
  return String(r);
}
