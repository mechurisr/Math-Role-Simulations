// M7 레이스 무전 판정. 코너와 규칙: spec.md M7, 정답: answers.md
import type { Surface, Wing } from './constants';
import { cornerValues, gripLimit, msToKmh, type CornerSetup } from './corner';
import { parsePositive, type RadioAnswer, type Verdict } from './judge';

const corner = (radius: number, surface: Surface, wing: Wing): CornerSetup => ({ radius, surface, wing });
// 항력이 없어 윙은 높을수록 항상 유리하므로 학습자가 고르지 않음 (C-006)
export const CORNERS: CornerSetup[] = [corner(60, 'dry', 'mid'), corner(120, 'dry', 'high'), corner(90, 'wet', 'mid'), corner(200, 'dry', 'high'), corner(70, 'wet', 'high')];
export const NO_LIMIT_CORNER = 3;   // 코너 4 (0부터 셈). 반드시 맞혀야 함
export const PASS_COUNT = 4;
const LOWER = .97;   // 한계의 97% 미만은 시간 손실
// 소수 둘째 자리로 반올림한 답이 한계보다 약간 높을 수 있음 (코너 2: 324.2068 → 324.21). M7 상한에만 씀
const ROUNDING_KMH = .01;

export function judgeCorner(setup: CornerSetup, a: RadioAnswer): Verdict {
  const limit = gripLimit(cornerValues(setup));
  if (a.kind === 'noLimit') return limit.kind === 'none' ? { ok: true, reason: 'pass' } : { ok: false, reason: 'tooHigh' };
  const n = parsePositive(a.raw);
  if (n === null) return { ok: false, reason: 'invalid' };
  if (limit.kind === 'none') return { ok: false, reason: 'wantedNoLimit' };
  const kmh = msToKmh(limit.speed);
  if (n > kmh + ROUNDING_KMH) return { ok: false, reason: 'slid' };
  return n < kmh * LOWER ? { ok: false, reason: 'tooSlow' } : { ok: true, reason: 'pass' };
}

export const racePassed = (results: boolean[]) => results.length === CORNERS.length && results[NO_LIMIT_CORNER] && results.filter(Boolean).length >= PASS_COUNT;
