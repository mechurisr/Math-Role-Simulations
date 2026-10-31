import { describe, expect, it } from 'vitest';
import { frac, math, mi, mn, mo, root, row, sub, subsup, sup } from '../src/ui/formula';

describe('formula', () => {
  it('분수와 제곱', () => expect(frac(row(mi('m'), sup(mi('v'), mn(2))), mi('r'))).toBe('<mfrac><mrow><mi>m</mi><msup><mi>v</mi><mn>2</mn></msup></mrow><mi>r</mi></mfrac>'));
  it('근호와 블록 표시', () => expect(math(root(mi('x')))).toBe('<math display="block"><msqrt><mi>x</mi></msqrt></math>'));
  it('아래·위 첨자', () => expect(subsup(mi('a'), mi('x'), mn(2))).toBe('<msubsup><mi>a</mi><mi>x</mi><mn>2</mn></msubsup>'));
  it('아래 첨자', () => expect(sub(mi('a'), mi('x'))).toBe('<msub><mi>a</mi><mi>x</mi></msub>'));
  it('글자를 이스케이프', () => expect(mo('<')).toBe('<mo>&lt;</mo>'));
  it('&도 이스케이프', () => expect(mi('a&b')).toBe('<mi>a&amp;b</mi>'));
});
