// 03 지진 분석관의 입력값. 출처와 상태는 kitty-specs/seismic-analyst-01M7YB3D/answers.md "Physical values" 표.
// 정답(거리·교점·진앙 km 좌표)은 여기 두지 않는다. 계산 함수로 구하고 테스트가 answers.md 값과 비교한다.
// 값과 타입은 쓰는 미션이 생길 때 추가한다 (죽은 코드 방지).

export type Point = { x: number; y: number };   // km, 지도 평면 (x 동쪽, y 북쪽)
export type Station = { id: string; pos: Point; spTime: number };   // spTime: 정답용 S-P 시간 (s)
export type GeoPoint = { lat: number; lon: number };   // 도

// P파 속도 6.0 km/s [game value]: 지각 고체 암석 3.0~6.5 km/s 범위 안에서 고름.
// S파 속도 3.5 km/s [game value]: 고체 암석 1.5~3.8 km/s 범위 안에서 고름. Vp/Vs = 1.71
// 범위 출처: Physical Geology (오픈 교과서) https://pressbooks.ccconline.org/physicalgeology/?p=334
export const VP = 6.0;
export const VS = 3.5;

// M1: 거리 슬라이더 범위 (km) [game value]
export const RACE_MAX_KM = 300;

// M2: 관측소 하나의 기록 S-P 시간 (s) [game value]. 기록은 P 3.0 s, S 18.0 s, 구간 0 ~ 23.0 s (spec "M2 지진 기록")
export const M2_SP_TIME = 15;

// 연습 지도 (M3~M6, M8, 가상 지역 0 ~ 200 km) [game value]: 손 계산이 정수로 떨어지도록 고른 배치 (answers.md)
export const PRACTICE_STATIONS: readonly Station[] = [
  { id: 'A', pos: { x: 16, y: 77 }, spTime: 12.5 },
  { id: 'B', pos: { x: 100, y: 77 }, spTime: 7.5 },
  { id: 'C', pos: { x: 184, y: 140 }, spTime: 10.0 },
];
export const MAP_SIZE_KM = 200;
// M3 후보 지점 [game value]. (40, 183)은 원에서 약 3.68 km 떨어진 눈속임 후보 (스펙 검토 m2)
export const M3_CANDIDATES: readonly Point[] = [{ x: 121, y: 77 }, { x: 79, y: 161 }, { x: 16, y: 182 }, { x: 100, y: 100 }, { x: 40, y: 183 }];
// M4 탐색 슬라이더 범위 (km) [game value]. 접하는 경계 21·189가 들어가게
export const M4_SLIDER_MAX = 250;

// M7: 2016-09-12 경주 지진 진앙과 깊이. USGS 이벤트 us10006p1f (QuakeML preferred origin, 2016-09-12T11:32:55.770Z)
// https://earthquake.usgs.gov/earthquakes/eventpage/us10006p1f — 수평 오차 5 km, 깊이 13 ± 1.7 km, 규모 Mw 5.4 (mww)
export const GYEONGJU_EPICENTER: GeoPoint = { lat: 35.7808, lon: 129.2162 };
export const GYEONGJU_DEPTH_KM = 13;
export const GYEONGJU_MW = 5.4;
// M7 가상 관측소 (지도 km 좌표) [game value]: 실제 기상청 관측소가 아니다. 육지 위로 고름 (answers.md)
export const M7_STATIONS: readonly Point[] = [{ x: 30, y: 40 }, { x: 110, y: 30 }, { x: 80, y: 170 }];

// M8 (심화): 세 관측소가 각각 0.5 s씩 어긋나게 판독된 상황 [game value]. 참값은 12.5 / 7.5 / 10.0 s (answers.md M8)
export const M8_READINGS: readonly number[] = [12.0, 7.0, 10.5];
// 확대 지도 범위 (km)와 추정점 시작 위치 = M6의 진앙 [game value]. 최소점과 시작점이 모두 범위 안
export const M8_VIEW = { x0: 88, x1: 108, y0: 128, y1: 148, grid: 2 };
export const M8_START: Point = { x: 100, y: 140 };
