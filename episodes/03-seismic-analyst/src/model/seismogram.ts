// 합성 지진 기록 (research R4). 가로축은 기록 시작부터의 시간이고 지진 발생 시각은 담지 않는다:
// P 도착 시각만으로 거리를 얻는 지름길을 막는다 (spec Edge Cases, 스펙 검토 R10).
// 파형은 실제 기록이 아니라 첫 도착이 눈으로 분명한 고정 모양 그림이다 [game value]. 난수 없음 (NFR-004)

export interface Seismogram { pArrival: number; sArrival: number; end: number }   // 기록 시작부터의 초

export const LEAD = 3;   // P 도착 전 기록 길이 (s)
export const TAIL = 5;   // S 도착 뒤 기록 길이 (s)

export const recordFor = (spTime: number): Seismogram => ({ pArrival: LEAD, sArrival: LEAD + spTime, end: LEAD + spTime + TAIL });

// 도착 뒤 진폭이 빠르게 커졌다가 천천히 줄어드는 모양
const envelope = (u: number) => u <= 0 ? 0 : (1 - Math.exp(-6 * u)) * Math.exp(-0.12 * u);
// 결정적 잡음: 서로 나누어떨어지지 않는 진동수의 사인 합 (|값| ≤ 1)
const wiggle = (t: number, k: number) => (Math.sin(17.3 * t + k) + Math.sin(29.1 * t + 2 * k) + Math.sin(41.7 * t + 3 * k)) / 3;

export function amplitude(r: Seismogram, t: number): number {
  return 0.06 * wiggle(t, 0.4)
    + 0.32 * envelope(t - r.pArrival) * wiggle(t, 1.3)
    + 0.9 * envelope(t - r.sArrival) * wiggle(t * 0.6, 2.1);
}

export const snapTenth = (t: number) => Math.round(t * 10) / 10;

// 마커 두 개로 읽은 S-P 시간. S가 P보다 앞이거나 같으면 판독하지 않음 (spec Edge Cases)
export function readSp(p: number, s: number): number | 'invalid' {
  return s <= p ? 'invalid' : snapTenth(s - p);
}
