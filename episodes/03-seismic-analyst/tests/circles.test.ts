// 기대값: answers.md 공통 식·M3·M4. 독립 기준: 정수 대입, 교점이 두 원과 두 원의 직선 위에 있는지 (fast-check)
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { M3_CANDIDATES, PRACTICE_STATIONS } from '../src/model/constants';
import { expand, intersect, onCircle, radicalLine, type Circle } from '../src/model/circles';
import { distanceFromSp } from '../src/model/waves';

const [A, B] = PRACTICE_STATIONS;
const cA: Circle = { center: A.pos, r: distanceFromSp(A.spTime) };
const cB = (r: number): Circle => ({ center: B.pos, r });
const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(b)));

describe('circles', () => {
  it('A 반지름 105, B 63 (8.4 × 12.5, 8.4 × 7.5)', () => { close(cA.r, 105); close(distanceFromSp(B.spTime), 63); });
  it('펼친 식: A (−32, −154, −4840), B (−200, −154, 11960)', () => {
    const a = expand({ center: A.pos, r: 105 }), b = expand(cB(63));
    expect([a.D, a.E, a.F]).toEqual([-32, -154, -4840]);
    expect([b.D, b.E, b.F]).toEqual([-200, -154, 11960]);
  });
  it('M3 후보: 위·위·위·안·밖', () => {
    expect(M3_CANDIDATES.map(p => onCircle(p, { center: A.pos, r: 105 }))).toEqual(['on', 'on', 'on', 'inside', 'outside']);
    close(Math.hypot(40 - 16, 183 - 77), 108.6830253535482);
  });
  it.each([[20, 0], [21, 1], [22, 2], [188, 2], [189, 1], [190, 0]])('A와 B(r = %i): 교점 %i개', (r, n) => {
    expect(intersect({ center: A.pos, r: 105 }, cB(r)).count).toBe(n);
  });
  it('0개는 모두 한 원이 다른 원 안 (이 배치에서 떨어진 경우 없음)', () => {
    expect(intersect({ center: A.pos, r: 105 }, cB(20))).toEqual({ count: 0, reason: 'inside' });
    expect(intersect({ center: A.pos, r: 105 }, cB(190))).toEqual({ count: 0, reason: 'inside' });
    expect(intersect({ center: { x: 0, y: 0 }, r: 1 }, { center: { x: 5, y: 0 }, r: 1 })).toEqual({ count: 0, reason: 'apart' });
  });
  it('A–B(63): 교점 (100, 140), (100, 14), 직선 (168, 0, 16800)', () => {
    const r = intersect({ center: A.pos, r: 105 }, cB(63));
    expect(r.count).toBe(2);
    if (r.count !== 2) return;
    const pts = [...r.points].sort((p, q) => q.y - p.y);
    close(pts[0].x, 100); close(pts[0].y, 140); close(pts[1].x, 100); close(pts[1].y, 14);
    expect(radicalLine({ center: A.pos, r: 105 }, cB(63))).toEqual({ a: 168, b: 0, c: 16800 });
  });
  it('임의의 두 원에서 교점 2개면 두 원 위이고 두 원의 직선 위', () => {
    const coord = fc.integer({ min: -200, max: 200 }), rad = fc.integer({ min: 1, max: 300 });
    let checked = 0;
    fc.assert(fc.property(coord, coord, rad, coord, coord, rad, (x1, y1, r1, x2, y2, r2) => {
      const c1 = { center: { x: x1, y: y1 }, r: r1 }, c2 = { center: { x: x2, y: y2 }, r: r2 }, res = intersect(c1, c2);
      if (res.count !== 2) return;
      checked++;
      const l = radicalLine(c1, c2);
      for (const p of res.points) {
        for (const c of [c1, c2]) expect(Math.abs(Math.hypot(p.x - c.center.x, p.y - c.center.y) - c.r)).toBeLessThanOrEqual(1e-9 * c.r * 10);
        expect(Math.abs(l.a * p.x + l.b * p.y - l.c)).toBeLessThanOrEqual(1e-7 * Math.max(1, Math.abs(l.c)));
      }
    }), { seed: 25, numRuns: 500 });
    // 출력: 교점 2개인 경우가 실제로 검사되었는지
    console.log('two-point cases checked', checked);
    expect(checked).toBeGreaterThan(50);
  });
});
