// 직선 ax + by = c. 같은 직선 판정은 0이 아닌 상수배를 허용한다 (spec M4, research R7)
export type Line = { a: number; b: number; c: number };

// 절댓값이 가장 큰 성분으로 나누고, 첫 0 아닌 성분이 양수가 되게 부호를 맞춤. (a, b) = (0, 0)은 직선이 아님
export function normalize(l: Line): Line | 'invalid' {
  if (l.a === 0 && l.b === 0) return 'invalid';
  const m = Math.max(Math.abs(l.a), Math.abs(l.b), Math.abs(l.c));
  let { a, b, c } = { a: l.a / m, b: l.b / m, c: l.c / m };
  const first = [a, b, c].find(v => v !== 0)!;
  if (first < 0) { a = -a; b = -b; c = -c; }
  return { a, b, c };
}

export function sameLine(input: Line, answer: Line, tol = 1e-6): boolean {
  const u = normalize(input), v = normalize(answer);
  if (u === 'invalid' || v === 'invalid') return false;
  return Math.abs(u.a - v.a) <= tol && Math.abs(u.b - v.b) <= tol && Math.abs(u.c - v.c) <= tol;
}
