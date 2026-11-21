// 기대값: answers.md M7 (기록 S-P, 확정 반지름, 진앙 쪽 교점, ±5 km)
import { describe, expect, it } from 'vitest';
import { intersect } from '../src/model/circles';
import { M7_STATIONS } from '../src/model/constants';
import { canSendEpicentre, confirmedRadius, epicentreKm, initialFlow, readStation, recordedSp, sendDistance, sendEpicentre } from '../src/model/m7-flow';

describe('M7 flow', () => {
  it('기록 S-P 11.0 / 6.8 / 10.5, 확정 반지름 92.40 / 57.12 / 88.20', () => {
    expect([0, 1, 2].map(recordedSp)).toEqual([11.0, 6.8, 10.5]);
    [92.4, 57.12, 88.2].forEach((r, i) => expect(confirmedRadius(i)).toBeCloseTo(r, 9));
  });
  it('판독을 통과하기 전에는 거리를 받지 않음', () => {
    let f = initialFlow();
    expect(sendDistance(f, 0, 92.4)).toEqual({ flow: f });
    const r = readStation(f, 0, 11.2); expect(r.v).toEqual({ ok: true, confirmed: 11 }); f = r.flow;
    expect(f).toEqual(['distance', 'reading', 'reading']);
    expect(readStation(f, 0, 11).v).toBeUndefined();   // 이미 지난 단계
    const d = sendDistance(f, 0, 94.3); expect(d.v?.ok).toBe(true); expect(d.flow[0]).toBe('drawn');
  });
  it('판독 ±0.3, 거리 ±2 경계', () => {
    expect(readStation(initialFlow(), 1, 7.1).v?.ok).toBe(true);
    expect(readStation(initialFlow(), 1, 7.2).v?.ok).toBe(false);
    const f = readStation(initialFlow(), 2, 10.5).flow;
    expect(sendDistance(f, 2, 90.2).v?.ok).toBe(true);
    expect(sendDistance(f, 2, 90.3).v?.ok).toBe(false);
  });
  it('세 원을 다 그리기 전에는 진앙을 받지 않음, 다 그리면 USGS 진앙 ±5 km', () => {
    expect(sendEpicentre(initialFlow(), { x: 109.4, y: 86.8 })).toBeUndefined();
    const done = ['drawn', 'drawn', 'drawn'] as const;
    expect(canSendEpicentre(done)).toBe(true);
    const e = epicentreKm();
    expect(sendEpicentre(done, { x: e.x + 5, y: e.y })?.ok).toBe(true);
    expect(sendEpicentre(done, { x: e.x + 5.01, y: e.y })?.ok).toBe(false);
  });
  it('반올림 반지름 세 원의 진앙 쪽 교점이 모두 통과 범위 (109.48, 87.12), (109.60, 86.92), (110.17, 87.12)', () => {
    const c = [0, 1, 2].map(i => ({ center: M7_STATIONS[i], r: confirmedRadius(i) })), e = epicentreKm();
    const expected = [[109.48, 87.12], [109.60, 86.92], [110.17, 87.12]];
    [[0, 1], [0, 2], [1, 2]].forEach(([i, j], k) => {
      const r = intersect(c[i], c[j]); if (r.count !== 2) throw new Error('need 2');
      const near = [...r.points].sort((p, q) => Math.hypot(p.x - e.x, p.y - e.y) - Math.hypot(q.x - e.x, q.y - e.y))[0];
      expect(near.x).toBeCloseTo(expected[k][0], 1); expect(near.y).toBeCloseTo(expected[k][1], 1);
      expect(sendEpicentre(['drawn', 'drawn', 'drawn'], near)?.ok).toBe(true);
    });
  });
});
