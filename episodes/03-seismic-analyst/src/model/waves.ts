// 지진파 도착 시각과 S-P 시간. 두 파는 같은 시각에 진앙에서 출발한다고 본다 (깊이 무시, spec Staged Missions).
// 식: t_P = d/Vp, t_S = d/Vs, Δt = d/Vs − d/Vp = d (Vp − Vs)/(Vp Vs) → d = Δt · Vp Vs/(Vp − Vs) (answers.md 공통 식)
import { VP, VS } from './constants';

export const pArrival = (d: number) => d / VP;   // s
export const sArrival = (d: number) => d / VS;   // s
export const spTime = (d: number) => sArrival(d) - pArrival(d);   // s
// Vp = 6.0, Vs = 3.5이면 VpVs/(Vp − Vs) = 21/2.5 = 8.4 km/s
export const kmPerSecond = () => VP * VS / (VP - VS);
export const distanceFromSp = (dt: number) => dt * kmPerSecond();   // km
