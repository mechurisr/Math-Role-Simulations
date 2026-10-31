// 마찰원: 제동·가속과 코너링 가속도 벡터의 크기 제한 √(a_x² + a_y²) ≤ μ N / m. 풀이: answers.md M8
// 속도를 고정한 순간값. 제동하면 속도가 줄어 다운포스와 횡가속도도 달라지지만 M8은 그 순간만 봄
import { G, MASS } from './constants';
import type { CornerValues } from './corner';

// 원의 반지름: μ N / m = μ (g + k v² / m), 다운포스 포함 (m/s²)
export const circleRadius = (v: number, mu: number, k: number) => mu * (G + k * v * v / MASS);
// 코너링에 필요한 횡가속도 a_y = v² / r
export const lateralAccel = (v: number, radius: number) => v * v / radius;
// 코너를 돌면서 낼 수 있는 최대 제동. 횡가속도만으로 한계를 넘으면 null
export function maxBraking(v: number, c: CornerValues): number | null {
  const a = circleRadius(v, c.mu, c.k), ay = lateralAccel(v, c.radius);
  return ay > a ? null : Math.sqrt(a * a - ay * ay);
}
export const insideCircle = (ax: number, ay: number, radius: number) => Math.hypot(ax, ay) <= radius;
