// HTML에 고정된 문구 (data-i18n)
import { P } from '@series/engine/i18n';

export const STRINGS = {
  docTitle: P('지진 분석관', 'Seismic Analyst'),
  title: P('지진 <span>분석관</span>', 'Seismic <span>Analyst</span>'),
  lead: P('방금 지진이 났습니다. 관측소 기록으로 진앙을 찾아 재난 문자 발송팀에 좌표를 넘겨 주세요.', 'An earthquake has just struck. Find the epicentre from the station records and pass its coordinates to the alert team.'),
  tutOpen: P('미션 시작', 'Start missions'),
  aResume: P('이어서 할지 고르기', 'Choose whether to continue'),
  resumeQ: P('지난번에 하던 미션이 있습니다. 이어서 할까요?', 'You have a mission in progress. Continue?'),
  resumeNew: P('처음부터', 'Start over'),
  aRace: P('진앙에서 관측소까지 퍼지는 P파와 S파, 아래는 도착 시각', 'P and S waves spreading from the epicentre to the station, with arrival times below'),
  aPanel: P('조작 패널', 'Controls'),
  aRecord: P('지진 기록. 가로축은 기록 시작부터의 시간, 끌어서 P·S 마커를 옮김', 'Seismogram. The horizontal axis is time since recording started; drag to move the P and S markers'),
  aPMinus: P('P 마커 0.1초 앞으로', 'Move the P marker 0.1 s earlier'),
  aPPlus: P('P 마커 0.1초 뒤로', 'Move the P marker 0.1 s later'),
  aSMinus: P('S 마커 0.1초 앞으로', 'Move the S marker 0.1 s earlier'),
  aSPlus: P('S 마커 0.1초 뒤로', 'Move the S marker 0.1 s later'),
  recordAxis: P('가로축: 기록 시작부터의 시간 (s). 지진이 언제 났는지는 기록에 없습니다.', 'Horizontal axis: time since recording started (s). The record does not show when the quake happened.'),
  aEst: P('추정점의 잔차와 잔차 제곱합', 'Residuals and sum of squares at the estimate'),
  resFL: P('잔차 제곱합', 'Sum of squares'),
  aNotes: P('모델의 단순화', 'What the model simplifies'),
  aMap: P('가로세로 200 km 지도. 관측소와 원, 교점, 직선', 'A 200 km by 200 km map with stations, circles, crossings and lines'),
  rBL: P('관측소 B 원의 반지름', 'Radius of station B\'s circle'),
  distL: P('진앙에서 관측소까지 거리', 'Epicentre to station distance'),
  cond: P('P파 6.0 km/s · S파 3.5 km/s (게임용 값)', 'P wave 6.0 km/s · S wave 3.5 km/s (game values)'),
};
