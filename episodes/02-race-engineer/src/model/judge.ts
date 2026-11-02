// 판정. 숫자는 입력 원값을 그대로 비교 (단위를 왕복 변환한 값으로 판정하지 않음, spec Edge Cases)
export type Reason = 'pass' | 'slid' | 'tooSlow' | 'tooHigh' | 'tooLow' | 'wantedNoLimit' | 'invalid';
export interface Verdict { ok: boolean; reason: Reason }
export type RadioAnswer = { kind: 'number'; raw: string } | { kind: 'noLimit' };

const verdict = (reason: Reason): Verdict => ({ ok: reason === 'pass', reason });

// 빈 값·숫자 아님·0 이하는 null (시도로 치지 않음)
export function parsePositive(raw: string): number | null {
  const t = raw.trim(); if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// M1: 한계 − window ≤ 속도 ≤ 한계. 한계와 같으면 미끄러지지 않음
export function judgeDrive(kmh: number, limitKmh: number, window = 5): Verdict {
  return verdict(kmh > limitKmh ? 'slid' : kmh < limitKmh - window ? 'tooSlow' : 'pass');
}

// 무전 숫자 답: 정답 ± tol (경계 포함)
export function judgeNumber(raw: string, answer: number, tol: number): Verdict {
  const n = parsePositive(raw);
  if (n === null) return verdict('invalid');
  return verdict(n > answer + tol ? 'tooHigh' : n < answer - tol ? 'tooLow' : 'pass');
}
