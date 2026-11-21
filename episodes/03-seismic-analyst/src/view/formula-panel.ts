// 원의 방정식과 펼친 식을 MathML로 (FR-012, FR-014). 숫자 부호를 "+ −"로 정리해 씀
import { math, mi, mn, mo, row, sup } from '@series/engine/ui';
import { expand, type Circle } from '../model/circles';

const sq = (s: string) => sup(s, mn(2));
const x = mi('x'), y = mi('y');
const fmt = (n: number) => String(Math.round(n * 1000) / 1000);

// (x − a)²: a가 0이면 x²
const shifted = (v: string, a: number) => a === 0 ? sq(v) : sq(row(mo('('), v, mo(a > 0 ? '−' : '+'), mn(fmt(Math.abs(a))), mo(')')));

// (x − a)² + (y − b)² = r²
export const circleEq = (c: Circle) => math(shifted(x, c.center.x), mo('+'), shifted(y, c.center.y), mo('='), sq(mn(fmt(c.r))));

// 항 하나를 부호와 함께 (첫 항이 아니면 + 또는 −)
const term = (k: number, v?: string) => k === 0 ? '' : row(mo(k > 0 ? '+' : '−'), Math.abs(k) === 1 && v ? '' : mn(fmt(Math.abs(k))), v ?? '');

// x² + y² + Dx + Ey + F = 0
export function expandedEq(c: Circle) {
  const { D, E, F } = expand(c);
  return math(sq(x), mo('+'), sq(y), term(D, x), term(E, y), term(F), mo('='), mn(0));
}
