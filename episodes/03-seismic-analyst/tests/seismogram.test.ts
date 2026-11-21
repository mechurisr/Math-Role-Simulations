// 기대값: spec "M2 지진 기록"(구간 0 ~ 23.0 s, P 3.0 s, S 18.0 s), answers.md M2
import { describe, expect, it } from 'vitest';
import { amplitude, readSp, recordFor, snapTenth } from '../src/model/seismogram';

const maxAbs = (r: ReturnType<typeof recordFor>, t0: number, t1: number) => {
  let m = 0; for (let t = t0; t < t1; t += 0.01) m = Math.max(m, Math.abs(amplitude(r, t))); return m;
};

describe('seismogram', () => {
  const r = recordFor(15);
  it('M2 기록: P 3, S 18, 끝 23 (기록 시작 기준, 발생 시각 없음)', () => {
    expect(r).toEqual({ pArrival: 3, sArrival: 18, end: 23 });
    expect(Object.keys(r).sort()).toEqual(['end', 'pArrival', 'sArrival']);
  });
  it('같은 입력에 같은 값 (난수 없음)', () => expect(amplitude(r, 7.31)).toBe(amplitude(recordFor(15), 7.31)));
  it('P 전 < P와 S 사이 < S 뒤 최대 진폭: 첫 도착이 눈에 보임', () => {
    const before = maxAbs(r, 0, 3), mid = maxAbs(r, 3, 18), after = maxAbs(r, 18, 23);
    expect(before).toBeLessThan(mid / 2);
    expect(mid).toBeLessThan(after / 1.5);
    // 출력: 실제로 비교한 값
    console.log('max amplitude before/mid/after', before.toFixed(3), mid.toFixed(3), after.toFixed(3));
  });
  it('0.1 s 단위로 맞춤', () => { expect(snapTenth(3.04)).toBe(3); expect(snapTenth(3.05)).toBe(3.1); expect(snapTenth(17.96)).toBe(18); });
  it('S-P 읽기: S가 P보다 앞이면 invalid', () => {
    expect(readSp(3, 18)).toBe(15);
    expect(readSp(18, 3)).toBe('invalid');
    expect(readSp(5, 5)).toBe('invalid');
    expect(readSp(3.1, 18.3)).toBe(15.2);
  });
});
