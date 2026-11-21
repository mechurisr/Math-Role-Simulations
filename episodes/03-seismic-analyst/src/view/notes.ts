// M7 결과(USGS 비교, 진원·진앙)와 단순화 고지 (FR-016, FR-017). 모든 문구 한/영
import { tr } from '@series/engine/i18n';
import { GYEONGJU_DEPTH_KM, GYEONGJU_EPICENTER, GYEONGJU_MW, M7_STATIONS, VP, VS, type Point } from '../model/constants';
import { epicentreKm } from '../model/m7-flow';
import { distanceFromSp } from '../model/waves';

const MTU = 'https://www.mtu.edu/geo/community/seismology/learn/earthquake-epicenter/index.html';
const USGS = 'https://earthquake.usgs.gov/earthquakes/eventpage/us10006p1f';

export function gyeongjuResult(sent: Point) {
  const e = epicentreKm(), off = Math.hypot(sent.x - e.x, sent.y - e.y);
  // 진원 거리: 평면 거리와 깊이로 피타고라스 (answers.md M7)
  const extra = M7_STATIONS.map(s => { const d = Math.hypot(s.x - e.x, s.y - e.y); return Math.hypot(d, GYEONGJU_DEPTH_KM) - d; });
  return '<p>' + tr(`USGS가 발표한 진앙은 <b>북위 ${GYEONGJU_EPICENTER.lat}°, 동경 ${GYEONGJU_EPICENTER.lon}°</b>, 지도에서 (${e.x.toFixed(1)}, ${e.y.toFixed(1)}) km입니다. 당신이 보낸 점과 <b>${off.toFixed(1)} km</b> 떨어져 있습니다. 규모는 Mw ${GYEONGJU_MW}였습니다.`, `USGS put the epicentre at <b>${GYEONGJU_EPICENTER.lat}°N, ${GYEONGJU_EPICENTER.lon}°E</b>, which is (${e.x.toFixed(1)}, ${e.y.toFixed(1)}) km on the map, <b>${off.toFixed(1)} km</b> from your point. The magnitude was Mw ${GYEONGJU_MW}.`) + ` <a href="${USGS}" target="_blank" rel="noopener">USGS</a></p>`
    + '<p>' + tr(`지진은 땅속 약 <b>${GYEONGJU_DEPTH_KM} km</b> 깊이에서 시작됐습니다. 땅속 시작점을 <b>진원</b>, 그 바로 위 지표면의 점을 <b>진앙</b>이라고 합니다. 지도에 찍는 점은 진앙입니다.`, `The quake started about <b>${GYEONGJU_DEPTH_KM} km</b> underground. The underground starting point is the <b>hypocentre</b>; the point on the surface directly above it is the <b>epicentre</b>. The dot on the map is the epicentre.`) + '</p>'
    + '<p>' + tr(`실제로 지진파는 진원에서 출발하니, 관측소까지의 거리는 평면 거리보다 ${Math.min(...extra).toFixed(1)} ~ ${Math.max(...extra).toFixed(1)} km 깁니다. 이 게임은 깊이를 무시하고 평면 거리만 썼습니다.`, `In reality the waves leave the hypocentre, so the distance to each station is ${Math.min(...extra).toFixed(1)} to ${Math.max(...extra).toFixed(1)} km longer than the flat distance. This game ignores depth and uses flat distances only.`) + '</p>';
}

export function notesHtml() {
  const items = [
    tr(`파 속도 Vp = ${VP} km/s, Vs = ${VS} km/s는 게임용 고정값입니다. 실제 속도는 깊이와 암석에 따라 다릅니다. 예를 들어 미시간 공대 교육 자료의 실제 곡선에서는 S-P 24 s가 215 km인데, 이 게임 식으로는 ${distanceFromSp(24).toFixed(1)} km입니다.`, `The wave speeds Vp = ${VP} km/s and Vs = ${VS} km/s are fixed game values. Real speeds change with depth and rock. On the real curve in a Michigan Tech teaching page, an S-P time of 24 s means 215 km; this game's formula gives ${distanceFromSp(24).toFixed(1)} km.`) + ` <a href="${MTU}" target="_blank" rel="noopener">MTU</a>`,
    tr('진원의 깊이를 무시하고 진앙과 관측소가 같은 평면에 있다고 봅니다.', 'Depth is ignored: the epicentre and the stations are treated as lying on one flat plane.'),
    tr('지도는 둥근 지구를 평면으로 펼친 근사입니다(200 km 범위에서 0.4 km 이내의 차이).', 'The map flattens the round Earth (within 0.4 km over this 200 km area).'),
    tr('M7의 관측소 세 곳은 게임용 가상 위치이며 실제 기상청 관측소가 아닙니다.', 'The three M7 stations are made-up game locations, not real weather-agency stations.'),
    tr('실제 진앙 결정에는 수십 곳의 관측소 기록과 컴퓨터 계산을 씁니다. 지진 기록 그림도 실제 기록이 아닌 합성 그림입니다.', 'Real epicentre finding uses records from dozens of stations and computer calculation. The seismograms here are drawn for the game, not real records.'),
  ];
  return '<ul class="note-list">' + items.map(t => `<li>${t}</li>`).join('') + '</ul>';
}
