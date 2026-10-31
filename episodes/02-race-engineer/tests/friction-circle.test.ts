import { describe, expect, it } from 'vitest';
import { kmhToMs } from '../src/model/corner';
import { circleRadius, insideCircle, lateralAccel, maxBraking } from '../src/model/friction-circle';

const v = kmhToMs(200), c = { radius: 106, mu: 1.6, k: 3.2 };

describe('M8: 200 km/h인 순간', () => {
  it('answers.md 값', () => {
    expect(circleRadius(v, c.mu, c.k)).toBeCloseTo(35.433, 3);
    expect(lateralAccel(v, c.radius)).toBeCloseTo(29.117, 3);
    expect(maxBraking(v, c)).toBeCloseTo(20.191, 3);
  });
  it('벡터 크기가 원의 반지름과 같음', () => {
    const a = maxBraking(v, c)!, r = circleRadius(v, c.mu, c.k), h = Math.hypot(a, lateralAccel(v, c.radius));
    expect(Math.abs(h - r) / r).toBeLessThan(1e-9);
  });
  it('원 안과 밖', () => {
    const r = circleRadius(v, c.mu, c.k), ay = lateralAccel(v, c.radius);
    expect(insideCircle(20, ay, r)).toBe(true);
    expect(insideCircle(21, ay, r)).toBe(false);
  });
});

describe('maxBraking', () => {
  it('다운포스 없는 코너의 한계에서는 제동 여유가 0', () => {
    const limit = Math.sqrt(1.6 * 9.8 * 80), b = maxBraking(limit, { radius: 80, mu: 1.6, k: 0 });
    expect(b === null || b < 1e-6).toBe(true);
  });
  it('횡가속도만으로 한계를 넘으면 null', () => expect(maxBraking(50, { radius: 80, mu: 1.6, k: 0 })).toBeNull());
});
