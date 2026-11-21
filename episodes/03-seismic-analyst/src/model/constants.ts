// 03 지진 분석관의 입력값. 출처와 상태는 kitty-specs/seismic-analyst-01M7YB3D/answers.md "Physical values" 표.
// 정답(거리·교점·진앙 km 좌표)은 여기 두지 않는다. 계산 함수로 구하고 테스트가 answers.md 값과 비교한다.
// 값과 타입은 쓰는 미션이 생길 때 추가한다 (죽은 코드 방지).

// P파 속도 6.0 km/s [game value]: 지각 고체 암석 3.0~6.5 km/s 범위 안에서 고름.
// S파 속도 3.5 km/s [game value]: 고체 암석 1.5~3.8 km/s 범위 안에서 고름. Vp/Vs = 1.71
// 범위 출처: Physical Geology (오픈 교과서) https://pressbooks.ccconline.org/physicalgeology/?p=334
export const VP = 6.0;
export const VS = 3.5;

// M1: 거리 슬라이더 범위 (km) [game value]
export const RACE_MAX_KM = 300;

// M2: 관측소 하나의 기록 S-P 시간 (s) [game value]. 기록은 P 3.0 s, S 18.0 s, 구간 0 ~ 23.0 s (spec "M2 지진 기록")
export const M2_SP_TIME = 15;
