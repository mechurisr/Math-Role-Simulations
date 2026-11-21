// 독립 기준: 손계산(21/2.5 = 8.4), d/Vs − d/Vp 직접 계산, 비례 성질. 기대값은 answers.md M1·M2
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { distanceFromSp, kmPerSecond, pArrival, sArrival, spTime } from '../src/model/waves';

const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(b)));

describe('waves', () => {
  it('거리 계수 = 6.0 × 3.5 / 2.5 = 8.4 km/s', () => close(kmPerSecond(), 8.4));
  it('84 km: P 14 s, S 24 s, S-P 10 s', () => { close(pArrival(84), 14); close(sArrival(84), 24); close(spTime(84), 10); });
  it('M1: 210 km → S-P 25 s (210/3.5 − 210/6 = 60 − 35)', () => close(spTime(210), 25));
  it('M2: 15 s → 126 km, 126 km → P 21 s, S 36 s', () => { close(distanceFromSp(15), 126); close(pArrival(126), 21); close(sArrival(126), 36); });
  it('0 km → 0 s', () => expect(spTime(0)).toBe(0));
  it('S-P 시간은 거리에 비례하고 거리 식은 그 역', () => {
    fc.assert(fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), fc.double({ min: 0, max: 10, noNaN: true }), (d, k) => {
      close(spTime(k * d), k * spTime(d));
      close(distanceFromSp(spTime(d)), d);
    }), { seed: 3, numRuns: 200 });
  });
});
