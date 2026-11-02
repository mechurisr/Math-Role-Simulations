import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { G, MASS } from '../src/model/constants';
import { availableForce, cornerValues, gripLimit, holdsGrip, kmhToMs, msToKmh, requiredForce, type GripLimit } from '../src/model/corner';

const SEED = 20261031;   // 속성 테스트도 결정적으로 (PRJ-002)
const close = (a: number, b: number) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(1e-9);
const speed = (l: GripLimit) => { if (l.kind === 'none') throw new Error('한계 없음'); return l.speed; };
const kmh = (radius: number, mu: number, k: number) => msToKmh(speed(gripLimit({ radius, mu, k })));
// 독립 기준: 닫힌 식을 쓰지 않고 F_req = F_avail을 이분법으로 풂
function bisect(radius: number, mu: number, k: number) {
  let lo = 0, hi = 1000;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; requiredForce(m, radius) > availableForce(m, mu, k) ? hi = m : lo = m; }
  return lo;
}

describe('gripLimit: answers.md 값', () => {
  it.each([
    ['M1', 80, 1.6, 0, 127.503], ['M2 r=40', 40, 1.6, 0, 90.159], ['M3', 80, 1, 0, 100.8], ['M4', 106, 1.6, 3.2, 258.804],
    ['M4 윙 없음', 106, 1.6, 0, 146.767], ['M5 r=50', 50, 1.6, 3.2, 122.238], ['M5 r=100', 100, 1.6, 3.2, 237.588],
    ['M7-1', 60, 1.6, 1.6, 122.842], ['M7-2', 120, 1.6, 3.2, 324.207], ['M7-3', 90, 1, 1.6, 118.067], ['M7-5', 70, 1, 3.2, 111.122],
  ])('%s', (_, r, mu, k, want) => expect(kmh(r, mu, k)).toBeCloseTo(want, 2));
  it('M3은 정확히 28 m/s', () => close(speed(gripLimit({ radius: 80, mu: 1, k: 0 })), 28));
  it('M4 횡가속도 4.98 g', () => expect(speed(gripLimit({ radius: 106, mu: 1.6, k: 3.2 })) ** 2 / 106 / G).toBeCloseTo(4.975, 3));
  it('OpenStax 예제 6.15: r = 500 m, μ = 625/(500 g)이면 v = 25 m/s', () => close(speed(gripLimit({ radius: 500, mu: 625 / (500 * G), k: 0 })), 25));
  it('M2 비율 √2, M5 비율 √34 / 3', () => {
    close(kmh(80, 1.6, 0) / kmh(40, 1.6, 0), Math.SQRT2);
    close(kmh(100, 1.6, 3.2) / kmh(50, 1.6, 3.2), Math.sqrt(34) / 3);
  });
});

describe('gripLimit: 독립 기준', () => {
  it.each([[106, 1.6, 3.2], [60, 1.6, 1.6], [90, 1, 1.6], [80, 1, 0]])('이분법과 일치 r=%d μ=%d k=%d', (r, mu, k) => close(speed(gripLimit({ radius: r, mu, k })), bisect(r, mu, k)));
  it('답을 넣으면 두 힘이 같음', () => {
    const v = speed(gripLimit({ radius: 106, mu: 1.6, k: 3.2 }));
    close(requiredForce(v, 106), availableForce(v, 1.6, 3.2));
  });
});

describe('세 한계 상태', () => {
  it.each([
    [156.24, 'aboveTopSpeed'], [156.25, 'none'], [156.26, 'none'], [200, 'none'], [122, 'finite'], [123, 'aboveTopSpeed'],
  ])('건조·윙 높음 r=%d → %s', (r, kind) => {
    const l = gripLimit({ radius: r, mu: 1.6, k: 3.2 });
    expect(l.kind).toBe(kind);
    if (l.kind !== 'none') expect(Number.isNaN(l.speed)).toBe(false);
  });
  it.each([[1, 3.2, 250], [1.6, 1.6, 312.5], [1, 1.6, 500]])('경계 μ=%d k=%d r=%d는 한계 없음', (mu, k, radius) => expect(gripLimit({ radius, mu, k }).kind).toBe('none'));
  it('코너 조건을 값으로 변환', () => expect(cornerValues({ radius: 106, surface: 'wet', wing: 'mid' })).toEqual({ radius: 106, mu: 1, k: 1.6 }));
});

describe('holdsGrip', () => {
  const l = gripLimit({ radius: 80, mu: 1, k: 0 });
  it('한계와 같으면 통과, 넘으면 실패', () => {
    expect(holdsGrip(l, msToKmh(speed(l)))).toBe(true);
    expect(holdsGrip(l, 100.8)).toBe(true);
    expect(holdsGrip(l, 100.81)).toBe(false);
  });
  it('한계 없음은 언제나 통과', () => expect(holdsGrip({ kind: 'none' }, 1e6)).toBe(true));
  it('단위 변환', () => expect(kmhToMs(100.8)).toBeCloseTo(28, 12));
});

describe('속성', () => {
  const mu = fc.double({ min: 0.3, max: 2, noNaN: true }), radius = fc.double({ min: 20, max: 400, noNaN: true }), v = fc.double({ min: 1, max: 500, noNaN: true });
  const opts = { seed: SEED, numRuns: 500 };
  it('k = 0이면 √(μgr)', () => fc.assert(fc.property(mu, radius, (m, r) => { close(speed(gripLimit({ radius: r, mu: m, k: 0 })), Math.sqrt(m * G * r)); }), opts));
  it('r이 커지면 v_max가 커짐', () => fc.assert(fc.property(mu, radius, fc.double({ min: 0.1, max: 3.2, noNaN: true }), fc.double({ min: 1.01, max: 2, noNaN: true }), (m, r, k, f) => {
    const a = gripLimit({ radius: r, mu: m, k }), b = gripLimit({ radius: r * f, mu: m, k });
    if (a.kind !== 'none' && b.kind !== 'none') expect(b.speed).toBeGreaterThan(a.speed);
  }), opts));
  it('μ가 커지면 v_max가 커짐', () => fc.assert(fc.property(mu, radius, fc.double({ min: 1.01, max: 2, noNaN: true }), (m, r, f) => {
    expect(speed(gripLimit({ radius: r, mu: m * f, k: 0 }))).toBeGreaterThan(speed(gripLimit({ radius: r, mu: m, k: 0 })));
  }), opts));
  it('한계가 없으면 어떤 속도에서도 F_req ≤ F_avail', () => fc.assert(fc.property(mu, fc.double({ min: 0.1, max: 3.2, noNaN: true }), fc.double({ min: 1.001, max: 3, noNaN: true }), v, (m, k, f, s) => {
    const r = MASS / (m * k) * f;
    expect(gripLimit({ radius: r, mu: m, k }).kind).toBe('none');
    expect(requiredForce(s, r)).toBeLessThanOrEqual(availableForce(s, m, k));
  }), opts));
});
