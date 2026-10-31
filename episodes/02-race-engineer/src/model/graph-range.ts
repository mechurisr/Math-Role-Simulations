// v–힘 그래프 가로축: 교점이 보이도록 340 km/h에서 1000 km/h까지 넓힘 (research R3).
// 경계 근처에서는 교점이 수천 km/h가 되므로 "교점 없음"과 "교점이 축 밖"을 구분해 표시
import { TOP_SPEED_KMH } from './constants';
import { msToKmh, type GripLimit } from './corner';

export const AXIS_MAX_KMH = 1000;
export type GraphState = 'shown' | 'offAxis' | 'noCrossing';
export interface GraphRange { state: GraphState; xMaxKmh: number; crossingKmh: number | null }

export function graphRange(limit: GripLimit): GraphRange {
  if (limit.kind === 'none') return { state: 'noCrossing', xMaxKmh: AXIS_MAX_KMH, crossingKmh: null };
  const kmh = msToKmh(limit.speed);
  if (kmh > AXIS_MAX_KMH) return { state: 'offAxis', xMaxKmh: AXIS_MAX_KMH, crossingKmh: null };
  return { state: 'shown', xMaxKmh: Math.min(AXIS_MAX_KMH, Math.max(TOP_SPEED_KMH, kmh * 1.1)), crossingKmh: kmh };
}
