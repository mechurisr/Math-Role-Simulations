// M2 판정. 기대값은 answers.md M2 (판독 15.0 s ±0.3 → 확정, 거리 126 km ±2)
import { describe, expect, it } from 'vitest';
import { M2_SP_TIME } from '../src/model/constants';
import { judgeIntermediate, judgeValue } from '../src/model/judge';
import { readSp, recordFor } from '../src/model/seismogram';
import { distanceFromSp } from '../src/model/waves';

describe('M2', () => {
  const rec = recordFor(M2_SP_TIME);
  it('기록에서 정확히 읽으면 15.0 s', () => expect(readSp(rec.pArrival, rec.sArrival)).toBe(15));
  it.each([14.7, 15, 15.3])('판독 %s s 통과, 확정값은 15', v => expect(judgeIntermediate(v, M2_SP_TIME, 0.3)).toEqual({ ok: true, confirmed: 15 }));
  it('판독 14.6은 작음, 15.4는 큼, S가 P보다 앞이면 invalid', () => {
    expect(judgeIntermediate(14.6, 15, 0.3)).toEqual({ ok: false, reason: 'tooLow' });
    expect(judgeIntermediate(15.4, 15, 0.3)).toEqual({ ok: false, reason: 'tooHigh' });
    expect(judgeIntermediate(readSp(18, 3), 15, 0.3)).toEqual({ ok: false, reason: 'invalid' });
  });
  it('마커를 0.4 s 어긋나게 놓으면 불통과', () => expect(judgeIntermediate(readSp(3.4, 18), 15, 0.3).ok).toBe(false));
  const d = distanceFromSp(15);
  it.each(['124', '126', '128'])('거리 %s km 통과', raw => expect(judgeValue(raw, d, 2, { positive: true }).ok).toBe(true));
  it('거리 123.9·128.1 불통과', () => {
    expect(judgeValue('123.9', d, 2, { positive: true }).ok).toBe(false);
    expect(judgeValue('128.1', d, 2, { positive: true }).ok).toBe(false);
  });
});
