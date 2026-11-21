// M7 진행: 관측소마다 reading → distance → drawn. 앞 단계를 통과해야 다음이 열리고(확정값 사용),
// 세 관측소가 모두 drawn이면 진앙 좌표를 보낼 수 있다 (spec M7, 스펙 검토 R13, data-model)
import { GYEONGJU_EPICENTER, M7_STATIONS, type Point } from './constants';
import { toKm } from './geo';
import { judgeIntermediate, judgePoint, type Verdict } from './judge';
import { distanceFromSp, spTime } from './waves';

export type Stage = 'reading' | 'distance' | 'drawn';
export type Flow = readonly Stage[];

export const epicentreKm = (): Point => toKm(GYEONGJU_EPICENTER);
// 기록에 넣는 S-P 시간: 평면 참 거리로 계산해 0.1 s 반올림 (그래서 세 원이 1 km 안쪽으로 조금 어긋남)
export const recordedSp = (i: number) => {
  const s = M7_STATIONS[i], e = epicentreKm();
  return Math.round(spTime(Math.hypot(s.x - e.x, s.y - e.y)) * 10) / 10;
};
export const confirmedRadius = (i: number) => distanceFromSp(recordedSp(i));

export const initialFlow = (): Flow => M7_STATIONS.map(() => 'reading');
export const canSendEpicentre = (f: Flow) => f.every(s => s === 'drawn');

// 판독·거리 판정. 순서가 맞지 않는 이벤트는 무시하고 flow를 그대로 돌려줌
export function readStation(f: Flow, i: number, sp: number | 'invalid'): { flow: Flow; v?: Verdict } {
  if (f[i] !== 'reading') return { flow: f };
  const v = judgeIntermediate(sp, recordedSp(i), 0.3);
  return { flow: v.ok ? f.map((s, k) => k === i ? 'distance' : s) : f, v };
}
export function sendDistance(f: Flow, i: number, km: number | 'invalid'): { flow: Flow; v?: Verdict } {
  if (f[i] !== 'distance') return { flow: f };
  const v = judgeIntermediate(km, confirmedRadius(i), 2);
  return { flow: v.ok ? f.map((s, k) => k === i ? 'drawn' : s) : f, v };
}
export function sendEpicentre(f: Flow, p: Point | null): Verdict | undefined {
  if (!canSendEpicentre(f)) return undefined;
  return judgePoint(p, epicentreKm(), 5);
}
