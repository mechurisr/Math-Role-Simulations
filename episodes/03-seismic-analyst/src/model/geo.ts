// 위도·경도 → 지도 km (C-010 고정값). 정방형 도법 근사: x = R·Δλ·cos φ_ref, y = R·Δφ (각은 라디안)
// 지구 평균 반지름 6371 km: NASA Earth Fact Sheet "Volumetric mean radius 6371.000 km"
//   https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
// 지도 원점 35.0°N·128.0°E, 기준 위도 36.0° [game value]. 기준 위도를 바꾸면 M7 S-P 시간 반올림이 달라진다 (answers.md M7 민감도).
// 같은 구의 하버사인 거리와의 차이는 M7 관측소에서 0.4 km 이내 (tests/geo.test.ts)
// scripts/build-coastline.mjs가 이 파일을 그대로 import해 해안선도 같은 환산을 쓴다 (스펙 검토 R5)
import type { GeoPoint, Point } from './constants';

export const ORIGIN: GeoPoint = { lat: 35.0, lon: 128.0 };
export const PHI_REF = 36.0;
export const EARTH_R = 6371;
const RAD = Math.PI / 180;

export const toKm = (g: GeoPoint): Point => ({ x: EARTH_R * (g.lon - ORIGIN.lon) * RAD * Math.cos(PHI_REF * RAD), y: EARTH_R * (g.lat - ORIGIN.lat) * RAD });
export const toGeo = (p: Point): GeoPoint => ({ lat: ORIGIN.lat + p.y / (EARTH_R * RAD), lon: ORIGIN.lon + p.x / (EARTH_R * RAD * Math.cos(PHI_REF * RAD)) });
