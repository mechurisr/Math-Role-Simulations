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
  distL: P('진앙에서 관측소까지 거리', 'Epicentre to station distance'),
  cond: P('P파 6.0 km/s · S파 3.5 km/s (게임용 값)', 'P wave 6.0 km/s · S wave 3.5 km/s (game values)'),
};
