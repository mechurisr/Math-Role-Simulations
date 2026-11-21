// 기대값: research R7, answers.md M4·M6
import { describe, expect, it } from 'vitest';
import { normalize, sameLine } from '../src/model/line';

const L = (a: number, b: number, c: number) => ({ a, b, c });
describe('line', () => {
  it.each([[1, 0, 100], [168, 0, 16800], [-1, 0, -100], [0.5, 0, 50]])('(%s, %s, %s)는 x = 100과 같은 직선', (a, b, c) => expect(sameLine(L(a, b, c), L(1, 0, 100))).toBe(true));
  it('(1, 0, 101)은 다른 직선', () => expect(sameLine(L(1, 0, 101), L(1, 0, 100))).toBe(false));
  it('(0, 0, 5)는 직선이 아님', () => { expect(normalize(L(0, 0, 5))).toBe('invalid'); expect(sameLine(L(0, 0, 5), L(1, 0, 100))).toBe(false); });
  it.each([[8, 3, 1220], [336, 126, 51240], [-8, -3, -1220]])('(%s, %s, %s)는 8x + 3y = 1220과 같은 직선', (a, b, c) => expect(sameLine(L(a, b, c), L(8, 3, 1220))).toBe(true));
  it('(8, 3, 842)는 다른 직선', () => expect(sameLine(L(8, 3, 842), L(8, 3, 1220))).toBe(false));
  it('부호가 반대인 성분이 하나만 다르면 다른 직선', () => expect(sameLine(L(8, -3, 1220), L(8, 3, 1220))).toBe(false));
});
