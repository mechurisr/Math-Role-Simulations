// 판정. 학습자가 보내는 최종 답은 입력 원값 그대로 정답과 비교한다 (spec Edge Cases).
// 허용 오차는 미션 표(spec Staged Missions)와 answers.md를 따른다.
export type Reason = 'tooHigh' | 'tooLow' | 'invalid';
export type Verdict = { ok: true } | { ok: false; reason: Reason };

export interface ParseOptions { positive?: boolean }

// 빈 값·숫자 아님은 null (시도로 치지 않음). positive면 0 이하도 null (거리·반지름)
export function parseNumber(raw: string, o: ParseOptions = {}): number | null {
  const t = raw.trim().replace(/−/g, '-'); if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return o.positive && n <= 0 ? null : n;
}

// 정답 ± tol (경계 포함)
export function judgeValue(raw: string, answer: number, tol: number, o: ParseOptions = {}): Verdict {
  const n = parseNumber(raw, o);
  if (n === null) return { ok: false, reason: 'invalid' };
  return n > answer + tol ? { ok: false, reason: 'tooHigh' } : n < answer - tol ? { ok: false, reason: 'tooLow' } : { ok: true };
}
