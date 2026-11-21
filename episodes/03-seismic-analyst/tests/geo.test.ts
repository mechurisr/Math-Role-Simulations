// 기대값: answers.md M7 (환산식, USGS 진앙 km, 관측소 거리, 민감도). 독립 기준: 2πR/360, 하버사인 거리
import { describe, expect, it } from 'vitest';
import { GYEONGJU_EPICENTER, M7_STATIONS } from '../src/model/constants';
import { EARTH_R, PHI_REF, toGeo, toKm } from '../src/model/geo';
import { spTime } from '../src/model/waves';

const RAD = Math.PI / 180;
function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const h = Math.sin((b.lat - a.lat) * RAD / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin((b.lon - a.lon) * RAD / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}
const E = toKm(GYEONGJU_EPICENTER);

describe('geo (C-010)', () => {
  it('원점 → (0, 0), 위도 1° → 111.195 km', () => {
    expect(toKm({ lat: 35, lon: 128 })).toEqual({ x: 0, y: 0 });
    expect(toKm({ lat: 36, lon: 128 }).y).toBeCloseTo(2 * Math.PI * 6371 / 360, 9);
    expect(toKm({ lat: 36, lon: 128 }).y).toBeCloseTo(111.195, 3);
  });
  it('USGS 진앙 → (109.408, 86.821)', () => { expect(E.x).toBeCloseTo(109.408, 3); expect(E.y).toBeCloseTo(86.821, 3); });
  it('관측소 참 거리 92.183 / 56.824 / 88.224, S-P 반올림 11.0 / 6.8 / 10.5', () => {
    const d = M7_STATIONS.map(s => Math.hypot(s.x - E.x, s.y - E.y));
    [92.183, 56.824, 88.224].forEach((v, i) => expect(d[i]).toBeCloseTo(v, 3));
    expect(d.map(v => Math.round(spTime(v) * 10) / 10)).toEqual([11.0, 6.8, 10.5]);
  });
  it('하버사인 거리와 0.4 km 이내', () => {
    for (const s of M7_STATIONS) {
      const flat = Math.hypot(s.x - E.x, s.y - E.y), sphere = haversine(toGeo(s), GYEONGJU_EPICENTER);
      expect(Math.abs(flat - sphere)).toBeLessThan(0.4);
    }
  });
  it('민감도: 기준 위도는 36.0° 고정. 관측소 1의 참 S-P 10.974 s는 반올림 경계 10.95 s 위 (C-010이 깨지면 여기서 잡힘)', () => {
    expect(PHI_REF).toBe(36.0);
    const sp1 = spTime(Math.hypot(M7_STATIONS[0].x - E.x, M7_STATIONS[0].y - E.y));
    expect(sp1).toBeCloseTo(10.974, 3); expect(sp1).toBeGreaterThan(10.95);
  });
  it('toGeo(toKm(g)) 왕복', () => {
    const g = toGeo(toKm({ lat: 36.53, lon: 128.89 }));
    expect(g.lat).toBeCloseTo(36.53, 9); expect(g.lon).toBeCloseTo(128.89, 9);
  });
});
