// 03 지진 분석관의 입력값. 출처와 상태는 kitty-specs/seismic-analyst-01M7YB3D/answers.md "Physical values" 표.
// 정답(거리·교점·진앙 km 좌표)은 여기 두지 않는다. 계산 함수로 구하고 테스트가 answers.md 값과 비교한다.
// 값과 타입은 쓰는 미션이 생길 때 추가한다 (죽은 코드 방지).

export type Point = { x: number; y: number };   // km, 지도 평면 (x 동쪽, y 북쪽)
export type Station = { id: string; pos: Point; spTime: number };   // spTime: 정답용 S-P 시간 (s)

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
