// 떠 있는 계산기 식 해석·결과 표시 (kitty-specs/floating-calculator-01M755VB, NFR-001)
// 기대값은 같은 폴더 answers.md §1~§4 그대로. 값은 상대 오차 1e-12(0이면 절대 1e-12), 표시는 문자열 일치
import { describe, expect, it } from 'vitest';
import { CALC_ERROR_TEXT, evaluate, formatResult, type CalcError } from '../src/math';

const value = (s: string) => { const r = evaluate(s); if (!r.ok) throw new Error(`${s} → ${r.reason}`); return r.value; };
const shown = (s: string) => formatResult(value(s));
const close = (got: number, want: number) =>
  want === 0 ? expect(Math.abs(got)).toBeLessThanOrEqual(1e-12) : expect(Math.abs(got - want) / Math.abs(want)).toBeLessThanOrEqual(1e-12);

// §1 우선순위·결합 규칙
const P_CASES: [string, string, number, string][] = [
  ['P1', '√9+7', 10, '10'],
  ['P2', '√2π', 4.442882938158366, '4.442882938'],
  ['P3', '√√16', 2, '2'],
  ['P4', '2√9', 6, '6'],
  ['P5', '2^3^2', 512, '512'],
  ['P6', '2^-1', 0.5, '0.5'],
  ['P7', '2^-1^2', 0.5, '0.5'],
  ['P8', '-2^2', -4, '-4'],
  ['P9', '(-2)^2', 4, '4'],
  ['P10', '2×-3', -6, '-6'],
  ['P11', '2--3', 5, '5'],
  ['P12', '1÷2π', 0.15915494309189535, '0.1591549431'],
  ['P13', '6÷2(1+2)', 1, '1'],
  ['P14', '2π^2', 19.739208802178716, '19.7392088'],
  ['P15', '2^3π', 25.132741228718345, '25.13274123'],
  ['P16', '3(4+5)', 27, '27'],
  ['P17', '(1+2)(3+4)', 21, '21'],
  ['P18', 'π2', 6.283185307179586, '6.283185307'],
  ['P19', '8÷4÷2', 1, '1'],
  ['P20', '10-4-3', 3, '3'],
  ['P21', '2+3×4', 14, '14'],
  ['P22', '.5+3.', 3.5, '3.5'],
  ['P23', '4^0.5', 2, '2'],
  ['P24', '(-8)^3', -512, '-512'],
  ['P25', '(-8)^(6÷3)', 64, '64'],
  ['P26', '√(9)+7', 10, '10'],
];

// §2 오류 사례
const E_CASES: [string, string, CalcError][] = [
  ['E1', '', 'syntax'],
  ['E2', '()', 'syntax'],
  ['E3', '1+', 'syntax'],
  ['E4', '√', 'syntax'],
  ['E5', '2^', 'syntax'],
  ['E6', '×2', 'syntax'],
  ['E7', '1.2.3', 'syntax'],
  ['E8', '.', 'syntax'],
  ['E9', '(1+2', 'brackets'],
  ['E10', '1+2)', 'brackets'],
  ['E11', ')1(', 'brackets'],
  ['E12', '1÷0', 'divZero'],
  ['E13', '1÷(2-2)', 'divZero'],
  ['E14', '0^-1', 'divZero'],
  ['E15', '√-4', 'notReal'],
  ['E16', '√(1-2)', 'notReal'],
  ['E17', '(-8)^(1÷3)', 'negBase'],
  ['E18', '0^0', 'notReal'],
  ['E19', '10^400', 'tooLarge'],
  ['E20', '10^309', 'tooLarge'],
  ['E21', '√(2', 'brackets'],
];

// §3 결과 표시
const D_CASES: [string, string, string][] = [
  ['D1', '0.1+0.2', '0.3'],
  ['D2', '1÷3', '0.3333333333'],
  ['D3', '2÷3', '0.6666666667'],
  ['D4', 'π', '3.141592654'],
  ['D5', '2^40', '1.099511628×10^12'],
  ['D6', '10^10', '1×10^10'],
  ['D7', '9999999999', '9999999999'],
  ['D8', '9999999999.6', '1×10^10'],
  ['D9', '0.000001', '0.000001'],
  ['D10', '0.0000001', '1×10^-7'],
  ['D11', '1-1', '0'],
  ['D12', '0×-1', '0'],
  ['D13', '-1234.5', '-1234.5'],
  ['D14', '10^-400', '0'],
  ['D15', '10^308', '1×10^308'],
];

// §4 레이스 엔지니어 미션 식
const M_CASES: [string, string, string][] = [
  ['M1 참고', '√(1.6×9.8×80)×3.6', '127.5030353'],
  ['M2', '127.5÷90.2', '1.413525499'],
  ['M3', '√(1.0×9.8×80)×3.6', '100.8'],
  ['M4', '√(1.6×9.8×106÷(1-1.6×3.2×106÷800))×3.6', '258.8036771'],
  ['M7 코너 3', '√(1.0×800×9.8÷(800÷90-1.0×1.6))×3.6', '118.067364'],
];

describe('evaluate — 우선순위·결합 (answers §1)', () => {
  it.each(P_CASES)('%s %s = %d', (_id, s, want, disp) => {
    close(value(s), want);
    expect(formatResult(value(s))).toBe(disp);
  });
});

describe('evaluate — 오류 (answers §2)', () => {
  it.each(E_CASES)('%s "%s" → %s', (_id, s, reason) => expect(evaluate(s)).toEqual({ ok: false, reason }));
});

describe('formatResult — 표시 (answers §3)', () => {
  it.each(D_CASES)('%s %s → %s', (_id, s, disp) => expect(shown(s)).toBe(disp));
});

describe('레이스 엔지니어 미션 식 (answers §4)', () => {
  it.each(M_CASES)('%s %s → %s', (_id, s, disp) => expect(shown(s)).toBe(disp));
});

describe('기호와 문구', () => {
  it('키패드 기호(− × ÷)와 ASCII(- * /)가 같은 값', () => {
    expect(value('6÷2(1+2)')).toBe(value('6/2(1+2)'));
    expect(value('2×−3')).toBe(value('2*-3'));
    expect(value('10−4−3')).toBe(value('10-4-3'));
    expect(evaluate('√−4')).toEqual({ ok: false, reason: 'notReal' });
  });
  it('√ 키로 넣은 모양: √( … ) 는 괄호 전체에 적용, √4−1 의 − 는 빼기', () => {
    expect(value('√(1.0×9.8×80)')).toBe(28);
    expect(value('√1.0×9.8×80')).toBeCloseTo(784, 9);  // 괄호 없이 쓰면 √는 한 항만 (스펙 2절 규칙 2)
    expect(value('√4−1')).toBe(1);
    expect(value('√9^2')).toBe(9);                       // √ 가 ^ 보다 먼저 (규칙 2 > 규칙 3)
  });
  it('오류 문구 6종이 한/영 모두 있음 (스펙 2절 표)', () => {
    expect(Object.keys(CALC_ERROR_TEXT).sort()).toEqual(['brackets', 'divZero', 'negBase', 'notReal', 'syntax', 'tooLarge']);
    for (const t of Object.values(CALC_ERROR_TEXT)) {
      expect(typeof t === 'object' && t.ko.length > 0 && t.en.length > 0).toBe(true);
    }
    expect(CALC_ERROR_TEXT.negBase).toEqual({ ko: '밑이 음수이고 지수가 정수가 아니면 여기서는 계산하지 않습니다', en: "A negative base with a non-integer exponent isn't evaluated here" });
  });
});
