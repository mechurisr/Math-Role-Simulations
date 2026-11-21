// 잔차와 잔차 제곱합 (FR-018). 잔차 = 점에서 관측소까지의 거리 − S-P 시간으로 구한 반지름.
// 최소점은 닫힌 해가 없어 가우스–뉴턴으로 구한다 (research R6). 근심(두 원의 직선끼리의 교점)은 쓰지 않는다 (C-006)
import type { Circle } from './circles';
import type { Point } from './constants';

export const residuals = (p: Point, cs: readonly Circle[]) => cs.map(c => Math.hypot(p.x - c.center.x, p.y - c.center.y) - c.r);
export const sumSquares = (p: Point, cs: readonly Circle[]) => residuals(p, cs).reduce((s, e) => s + e * e, 0);

// 가우스–뉴턴: 잔차를 1차 근사해 정규방정식 2×2를 풂. 갱신량 < 1e-12 km 또는 100회에서 멈춤 (같은 시작점이면 결정적)
export function leastSquaresPoint(cs: readonly Circle[], start: Point): Point {
  let { x, y } = start;
  for (let it = 0; it < 100; it++) {
    let a = 0, b = 0, c = 0, g0 = 0, g1 = 0;
    for (const k of cs) {
      const dx = x - k.center.x, dy = y - k.center.y, d = Math.hypot(dx, dy);
      if (d < 1e-12) continue;   // 점이 관측소 위면 방향이 없음: 이 항은 건너뜀
      const e = d - k.r, jx = dx / d, jy = dy / d;
      a += jx * jx; b += jx * jy; c += jy * jy; g0 += jx * e; g1 += jy * e;
    }
    const det = a * c - b * b;
    if (Math.abs(det) < 1e-12) break;   // 관측소가 한 직선 위면 정규방정식이 풀리지 않음: 지금 점에서 멈춤 (NaN 방지)
    const sx = -(c * g0 - b * g1) / det, sy = -(-b * g0 + a * g1) / det;
    x += sx; y += sy;
    if (Math.hypot(sx, sy) < 1e-12) break;
  }
  return { x, y };
}

// 잔차 제곱합이 줄어드는 방향 (수치 경사의 반대). 힌트 화살표용
export function downhill(p: Point, cs: readonly Circle[], h = 1e-4): Point {
  const gx = (sumSquares({ x: p.x + h, y: p.y }, cs) - sumSquares({ x: p.x - h, y: p.y }, cs)) / (2 * h);
  const gy = (sumSquares({ x: p.x, y: p.y + h }, cs) - sumSquares({ x: p.x, y: p.y - h }, cs)) / (2 * h);
  return { x: -gx, y: -gy };
}

// 힌트용 8방향 (→ ↗ ↑ ↖ ← ↙ ↓ ↘): 잔차 제곱합이 줄어드는 방향에 가장 가까운 것
export const ARROWS = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'] as const;
export function downhillDir8(p: Point, cs: readonly Circle[]): { arrow: typeof ARROWS[number]; dx: number; dy: number } {
  const g = downhill(p, cs), k = ((Math.round(Math.atan2(g.y, g.x) / (Math.PI / 4)) % 8) + 8) % 8;
  return { arrow: ARROWS[k], dx: Math.round(Math.cos(k * Math.PI / 4)), dy: Math.round(Math.sin(k * Math.PI / 4)) };
}
