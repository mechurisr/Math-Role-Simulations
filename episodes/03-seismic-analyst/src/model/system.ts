// 연립일차방정식: 두 직선의 교점 (크라메르 공식), 세 원이 함께 지나는 점 (answers.md M6)
import type { Circle } from './circles';
import type { Point } from './constants';
import { sameLine, type Line } from './line';

export function intersectLines(l1: Line, l2: Line): Point | 'parallel' | 'same' {
  const det = l1.a * l2.b - l2.a * l1.b;
  if (det === 0) return sameLine(l1, l2) ? 'same' : 'parallel';
  return { x: (l1.c * l2.b - l2.c * l1.b) / det, y: (l1.a * l2.c - l2.a * l1.c) / det };
}

// 후보 가운데 모든 원 위에 있는 점 (상대 오차 tol)
export function commonPoints(circles: Circle[], candidates: Point[], tol = 1e-9): Point[] {
  return candidates.filter(p => circles.every(c => Math.abs(Math.hypot(p.x - c.center.x, p.y - c.center.y) - c.r) <= tol * Math.max(1, c.r)));
}
