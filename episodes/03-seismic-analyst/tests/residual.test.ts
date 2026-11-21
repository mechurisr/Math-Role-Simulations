// 기대값: answers.md M8 (반지름 100.8 / 58.8 / 88.2). 독립 기준: 0.01 km 격자 최소, 수치 경사 ≈ 0
import { describe, expect, it } from 'vitest';
import type { Circle } from '../src/model/circles';
import { M8_READINGS, M8_START, PRACTICE_STATIONS } from '../src/model/constants';
import { judgePoint, judgeValue } from '../src/model/judge';
import { downhill, leastSquaresPoint, residuals, sumSquares } from '../src/model/residual';
import { distanceFromSp } from '../src/model/waves';

const cs: Circle[] = PRACTICE_STATIONS.map((s, i) => ({ center: s.pos, r: distanceFromSp(M8_READINGS[i]) }));
// 기준값: 이 가우스–뉴턴 결과를 소수 열째 자리까지 고정 (answers.md의 (96.5816, 136.1635), 1.3913과 4자리 일치)
const REF = { x: 96.5816283596, y: 136.1635479973 }, REF_F = 1.3913317446;

describe('residual (M8)', () => {
  it('반지름 100.8 / 58.8 / 88.2', () => cs.forEach((c, i) => expect(c.r).toBeCloseTo([100.8, 58.8, 88.2][i], 9)));
  it('① (100, 140)에서 잔차 (+4.2, +4.2, −4.2), F = 52.92', () => {
    residuals(M8_START, cs).forEach((e, i) => expect(e).toBeCloseTo([4.2, 4.2, -4.2][i], 9));
    expect(sumSquares(M8_START, cs)).toBeCloseTo(52.92, 9);
  });
  const p = leastSquaresPoint(cs, M8_START);
  it('② 최소점 (96.5816, 136.1635), F_min 1.3913 (1e-6)', () => {
    expect(Math.abs(p.x - REF.x)).toBeLessThan(1e-6); expect(Math.abs(p.y - REF.y)).toBeLessThan(1e-6);
    expect(Math.abs(sumSquares(p, cs) - REF_F)).toBeLessThan(1e-6);
  });
  it('독립 기준 1: 0.01 km 격자 최소가 0.01 km 이내', () => {
    let best = { f: Infinity, x: 0, y: 0 };
    for (let x = 95; x <= 98; x += 0.01) for (let y = 135; y <= 138; y += 0.01) { const f = sumSquares({ x, y }, cs); if (f < best.f) best = { f, x, y }; }
    expect(Math.hypot(best.x - p.x, best.y - p.y)).toBeLessThan(0.01);
  });
  it('독립 기준 2: 최소점에서 수치 경사 ≈ 0', () => { const g = downhill(p, cs); expect(Math.hypot(g.x, g.y)).toBeLessThan(1e-6); });
  it('최소점에서 1 km 떨어진 8방향 F는 모두 2.4 이상', () => {
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; expect(sumSquares({ x: p.x + Math.cos(a), y: p.y + Math.sin(a) }, cs)).toBeGreaterThan(2.4); }
  });
  it('최소점은 (100, 140)에서 5.14 km, 결정적', () => {
    expect(Math.hypot(p.x - 100, p.y - 140)).toBeCloseTo(5.138, 3);
    expect(leastSquaresPoint(cs, M8_START)).toEqual(p);
  });
  it('판정: ① 52.82 ~ 53.02, ② 최소점 ±1 km', () => {
    expect(judgeValue('52.82', 52.92, 0.1).ok).toBe(true); expect(judgeValue('53.02', 52.92, 0.1).ok).toBe(true);
    expect(judgeValue('52.81', 52.92, 0.1).ok).toBe(false); expect(judgeValue('53.03', 52.92, 0.1).ok).toBe(false);
    expect(judgePoint({ x: p.x + 0.99, y: p.y }, p, 1).ok).toBe(true); expect(judgePoint({ x: p.x + 1.01, y: p.y }, p, 1).ok).toBe(false);
  });
});

describe('residual 힌트·퇴화 입력 (PR #39 크로스체크)', () => {
  it('힌트 화살표 방향으로 0.1 km 옮기면 잔차 제곱합이 줄어듦 (최소점 밖 대표 좌표)', async () => {
    const { downhillDir8 } = await import('../src/model/residual');
    for (const p of [{ x: 100, y: 140 }, { x: 90, y: 130 }, { x: 105, y: 145 }, { x: 96.6, y: 145 }, { x: 105, y: 136.2 }]) {
      const d = downhillDir8(p, cs), step = 0.1 / Math.hypot(d.dx, d.dy);
      expect(sumSquares({ x: p.x + d.dx * step, y: p.y + d.dy * step }, cs), `${p.x},${p.y} ${d.arrow}`).toBeLessThan(sumSquares(p, cs));
    }
  });
  it('관측소가 한 직선 위여도 NaN이 나오지 않음', () => {
    const line: Circle[] = [0, 50, 100].map(x => ({ center: { x, y: 0 }, r: 60 }));
    const q = leastSquaresPoint(line, { x: 50, y: 0 });
    expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
  });
});
