// 코너 한계 계산. 등속 원운동의 구심력과 최대 정지마찰 비교 (OpenStax University Physics Vol.1 6.3)
//   필요한 힘 F_req = m v² / r
//   낼 수 있는 힘 F_avail = μ N = μ (m g + k v²), 다운포스 k v² (NASA Glenn, Lift Equation)
//   한계 F_req = F_avail → v² = μ g r / (1 − μ k r / m)
// 풀이: kitty-specs/race-engineer-01M68BAF/answers.md
import { DOWNFORCE, G, MASS, MU, TOP_SPEED_KMH, type Surface, type Wing } from './constants';

export interface CornerSetup { radius: number; surface: Surface; wing: Wing }
export interface CornerValues { radius: number; mu: number; k: number }
export type GripLimit =
  | { kind: 'finite'; speed: number }          // m/s, 최고 속도 이하
  | { kind: 'aboveTopSpeed'; speed: number }   // m/s, 화면에는 숫자를 보이지 않음
  | { kind: 'none' };

export const kmhToMs = (kmh: number) => kmh / 3.6;
export const msToKmh = (ms: number) => ms * 3.6;
export const cornerValues = (s: CornerSetup): CornerValues => ({ radius: s.radius, mu: MU[s.surface], k: DOWNFORCE[s.wing] });

export const requiredForce = (v: number, radius: number) => MASS * v * v / radius;
export const availableForce = (v: number, mu: number, k: number) => mu * (MASS * G + k * v * v);

// m − μkr ≤ 0이면 모든 속도에서 F_req ≤ F_avail이라 한계가 없음. 이 검사가 먼저: 지나치면 음수의 제곱근(NaN)이 됨.
// 판정 여유는 두지 않음 (경계 156.25 m에서 -1.14e-13 ≤ 0으로 올바름, spec-review.md 반영 결과)
export function gripLimit({ radius, mu, k }: CornerValues): GripLimit {
  if (MASS - mu * k * radius <= 0) return { kind: 'none' };
  const speed = Math.sqrt(mu * G * radius / (1 - mu * k * radius / MASS));
  return { kind: msToKmh(speed) > TOP_SPEED_KMH ? 'aboveTopSpeed' : 'finite', speed };
}

// 입력한 km/h를 그대로 한계와 비교 (왕복 변환한 값으로 판정하지 않음). 한계와 같으면 미끄러지지 않음
export function holdsGrip(limit: GripLimit, kmh: number): boolean {
  return limit.kind === 'none' || kmh <= msToKmh(limit.speed);
}
