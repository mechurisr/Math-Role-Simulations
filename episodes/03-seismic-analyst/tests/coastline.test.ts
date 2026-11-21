// 생성 파일 점검: 크기, 범위, 육지·바다 확인점. 확인점 좌표는 테스트 전용이며 화면에 쓰지 않음
//   대구 35.87°N 128.60°E (위키백과 "대구광역시" 좌표, 내륙), 동해 35.8°N 129.8°E (바다)
import { describe, expect, it } from 'vitest';
import { COASTLINE } from '../src/model/coastline';
import { GYEONGJU_EPICENTER, M7_STATIONS, type Point } from '../src/model/constants';
import { toKm } from '../src/model/geo';

// evenodd 점-다각형 포함 (반직선 교차 수)
function onLand(p: Point) {
  let inside = false;
  for (const r of COASTLINE) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [r[i], r[i + 1], r[j], r[j + 1]];
    if ((yi > p.y) !== (yj > p.y) && p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

describe('coastline (생성 파일)', () => {
  // 에피소드 테스트는 node:fs를 쓸 수 없어(의존 규칙) 숫자 배열의 JSON 길이로 크기를 잼 (주석 머리 약 0.6 KB 제외)
  it('데이터 30 KB 이하', () => expect(JSON.stringify(COASTLINE).length).toBeLessThanOrEqual(30 * 1024));
  it('모든 좌표가 −20 ~ 220 km, 고리마다 점 3개 이상', () => {
    for (const r of COASTLINE) { expect(r.length % 2).toBe(0); expect(r.length).toBeGreaterThanOrEqual(6); for (const v of r) { expect(v).toBeGreaterThanOrEqual(-20); expect(v).toBeLessThanOrEqual(220); } }
  });
  it('경주 진앙·대구·M7 관측소는 육지, 동해 확인점은 바다', () => {
    expect(onLand(toKm(GYEONGJU_EPICENTER))).toBe(true);
    expect(onLand(toKm({ lat: 35.87, lon: 128.60 }))).toBe(true);
    for (const s of M7_STATIONS) expect(onLand(s)).toBe(true);
    expect(onLand(toKm({ lat: 35.8, lon: 129.8 }))).toBe(false);
  });
});
