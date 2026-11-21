// 원과 두 원의 교점 (answers.md 공통 식).
// 원: (x − a)² + (y − b)² = r² ⇔ x² + y² + Dx + Ey + F = 0 (D = −2a, E = −2b, F = a² + b² − r²)
// 원 P − 원 Q: 2(a_Q − a_P)x + 2(b_Q − b_P)y = (a_Q² + b_Q² − r_Q²) − (a_P² + b_P² − r_P²)
import type { Point } from './constants';
import type { Line } from './line';

export type Circle = { center: Point; r: number };   // r > 0 (km)
export type Intersection =
  | { count: 0; reason: 'apart' | 'inside' }
  | { count: 1; point: Point }
  | { count: 2; points: [Point, Point] };

export const expand = ({ center: { x: a, y: b }, r }: Circle) => ({ D: -2 * a, E: -2 * b, F: a * a + b * b - r * r });

// 정수 입력이면 정확히 (x−a)² + (y−b)² 와 r² 비교. 실수는 상대 허용 1e-12
export function onCircle(p: Point, c: Circle): 'on' | 'inside' | 'outside' {
  const d2 = (p.x - c.center.x) ** 2 + (p.y - c.center.y) ** 2, r2 = c.r * c.r, eps = 1e-12 * Math.max(1, r2);
  return Math.abs(d2 - r2) <= eps ? 'on' : d2 < r2 ? 'inside' : 'outside';
}

// 개수를 먼저 판정하고, 0개면 교점을 계산하지 않는다 (spec Edge Cases, research R5)
export function intersect(c1: Circle, c2: Circle): Intersection {
  const dx = c2.center.x - c1.center.x, dy = c2.center.y - c1.center.y, D2 = dx * dx + dy * dy;
  const sum = (c1.r + c2.r) ** 2, diff = (c1.r - c2.r) ** 2, eps = 1e-12 * Math.max(1, sum);
  if (D2 > sum + eps) return { count: 0, reason: 'apart' };
  if (D2 < diff - eps || D2 === 0) return { count: 0, reason: 'inside' };
  const D = Math.sqrt(D2), a = (c1.r * c1.r - c2.r * c2.r + D2) / (2 * D);
  const mx = c1.center.x + a * dx / D, my = c1.center.y + a * dy / D;
  if (Math.abs(D2 - sum) <= eps || Math.abs(D2 - diff) <= eps) return { count: 1, point: { x: mx, y: my } };
  const h = Math.sqrt(Math.max(0, c1.r * c1.r - a * a)), ux = -dy / D * h, uy = dx / D * h;
  return { count: 2, points: [{ x: mx + ux, y: my + uy }, { x: mx - ux, y: my - uy }] };
}

export function radicalLine(p: Circle, q: Circle): Line {
  const P = expand(p), Q = expand(q);
  // P − Q: (D_P − D_Q)x + (E_P − E_Q)y + (F_P − F_Q) = 0 → ax + by = c
  return { a: P.D - Q.D, b: P.E - Q.E, c: Q.F - P.F };
}
