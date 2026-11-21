// M7 2016 경주 지진. 관측소를 하나씩: 판독 통과 → 거리 입력 → 거리 통과 → 원. 세 원 뒤에 진앙 좌표 (model/m7-flow.ts)
// 정답·풀이: kitty-specs/seismic-analyst-01M7YB3D/answers.md M7
import { P, tr } from '@series/engine/i18n';
import type { StepState } from '@series/engine/tutorial';
import { M7_STATIONS, type Point } from '../model/constants';
import { parseNumber } from '../model/judge';
import { canSendEpicentre, confirmedRadius, initialFlow, readStation, recordedSp, sendDistance, sendEpicentre, type Flow } from '../model/m7-flow';
import { readSp } from '../model/seismogram';
import type { MapPoint, MapScene, Tone } from '../view/map';
import { gyeongjuResult } from '../view/notes';
import { feedback, type Game, type MissionStep } from './index';

const CH6 = P('6장 2016 경주 지진', 'Ch.6 The 2016 Gyeongju earthquake');
const TONES: Tone[] = ['a', 'b', 'c'];
let flow: Flow = initialFlow();
let sent: Point | null = null;

const scene = (pick?: Point | null, good?: boolean): MapScene => ({
  coast: true,
  note: tr('원점 35.0°N 128.0°E · km', 'Origin 35.0°N 128.0°E · km'),
  stations: M7_STATIONS.map((p, i) => ({ id: String(i + 1), pos: p, tone: TONES[i] })),
  circles: M7_STATIONS.flatMap((p, i) => flow[i] === 'drawn' ? [{ circle: { center: p, r: confirmedRadius(i) }, tone: TONES[i] }] : []),
  points: pick ? [{ p: pick, kind: 'answer', state: good === undefined ? undefined : good ? 'good' : 'bad' } as MapPoint] : [],
});
const fmt = (p: Point) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`;

function stationSteps(g: Game, i: number): MissionStep[] {
  const n = i + 1;
  return [
    { ch: CH6, title: P(`M7 관측소 ${n} 기록 판독`, `M7 Read station ${n}`), mission: 'M7',
      enter: () => g.configure({ panel: 'record', record: recordedSp(i), confirmed: flow[i] !== 'reading', open: [] }),
      target: () => [g.target('record')],
      on: { act: (s, a) => {
        if (a !== 'read') return;
        const m = g.markers(), r = readStation(flow, i, readSp(m.p, m.s));
        flow = r.flow; s.v = r.v; if (flow[i] !== 'reading') g.confirmRecord();
      } },
      gate: () => flow[i] !== 'reading', waitLabel: P('판독을 통과해 보세요', 'Pass the reading'),
      body: s => '<p>' + tr(`관측소 ${n}의 지진 기록입니다. 2장처럼 P·S 마커를 놓고 판독 확인을 누르세요. 판독을 통과해야 거리를 입력할 수 있습니다.`, `This is station ${n}'s seismogram. Place the P and S markers as in chapter 2 and press Check reading. You can enter the distance only after the reading passes.`) + '</p>'
        + `<p class="pick-btns"><button class="act" data-act="read"${flow[i] !== 'reading' ? ' disabled' : ''}>${tr('판독 확인', 'Check reading')}</button></p>`
        + (flow[i] !== 'reading' ? `<p class="fb good">${tr(`판독 통과. 확정된 S-P 시간 <b>${recordedSp(i).toFixed(1)} s</b>`, `Reading passed. Confirmed S-P time <b>${recordedSp(i).toFixed(1)} s</b>`)}</p>`
          : feedback(s.v, '', tr('P는 처음 흔들리기 시작하는 곳, S는 흔들림이 갑자기 커지는 곳입니다.', 'P is where it first starts to wiggle; S is where the shaking suddenly grows.'))) },
    { ch: CH6, title: P(`M7 관측소 ${n}까지의 거리`, `M7 Distance from station ${n}`), mission: 'M7', ctrl: true,
      enter: () => g.configure({ panel: 'map', map: scene(), open: [] }),
      answer: { title: P(`관측소 ${n}: 확정된 S-P 시간 ${recordedSp(i).toFixed(1)} s`, `Station ${n}: confirmed S-P time ${recordedSp(i).toFixed(1)} s`), fields: [{ label: P('거리', 'Distance'), unit: 'km' }] },
      gate: () => flow[i] === 'drawn', waitLabel: P('거리를 보내세요', 'Send the distance'),
      on: { answer: (s, a) => {
        const r = sendDistance(flow, i, parseNumber((a as string[])[0], { positive: true }) ?? 'invalid');
        flow = r.flow; s.v = r.v; g.configure({ panel: 'map', map: scene(), open: [] });
      } },
      body: s => '<p>' + tr(`관측소 ${n}에서 진앙까지의 거리를 보내세요. 통과하면 지도에 원이 그려집니다.`, `Send the distance from station ${n} to the epicentre. If it passes, its circle appears on the map.`) + '</p>'
        + (flow[i] === 'drawn' ? `<p class="fb good">${tr(`확정된 거리 <b>${confirmedRadius(i).toFixed(2)} km</b>로 원을 그렸습니다.`, `Circle drawn with the confirmed distance, <b>${confirmedRadius(i).toFixed(2)} km</b>.`)}</p>`
          : feedback(s.v, '', tr('S-P 시간에 8.4를 곱합니다.', 'Multiply the S-P time by 8.4.'))) },
  ];
}

function onSend(s: StepState, p: Point | null) {
  s.p = p; s.v = sendEpicentre(flow, p); s.ok = s.ok || !!s.v?.ok; if (s.ok && !sent) sent = p;
}

export const gyeongjuSteps = (g: Game): MissionStep[] => [
  { ch: CH6, title: P('M7 실제 지진', 'M7 A real earthquake'), mission: 'M7',
    enter: () => { flow = initialFlow(); sent = null; g.configure({ panel: 'map', map: scene(), open: [] }); },
    target: () => [g.target('map')],
    body: () => '<p>' + tr('이번에는 실제로 있었던 지진입니다. <b>2016년 9월 12일 저녁 8시 32분</b>, 경상북도 경주 부근에서 땅이 크게 흔들렸습니다. 한반도에서 계기 관측을 시작한 뒤 가장 큰 지진 가운데 하나였습니다.', 'This time it is a real earthquake. At <b>8:32 pm on 12 September 2016</b> the ground shook hard near Gyeongju in south-east Korea. It was one of the strongest quakes recorded by instruments on the peninsula.') + '</p>'
      + '<p>' + tr('지도는 한반도 남동부입니다. 세 관측소(1, 2, 3)는 이 게임을 위해 정한 <b>가상 위치</b>입니다. 기록은 실제 진앙과 이 관측소들 사이의 거리로 만들었습니다. 관측소를 하나씩 판독해 원 세 개를 그리고 진앙을 찾으세요.', 'The map shows south-east Korea. The three stations (1, 2, 3) are <b>made-up locations</b> for this game, and their records were made from the real epicentre. Read each station, draw three circles and find the epicentre.') + '</p>' },
  ...[0, 1, 2].flatMap(i => stationSteps(g, i)),
  { ch: CH6, title: P('M7 진앙 보내기', 'M7 Send the epicentre'), mission: 'M7', ctrl: true,
    enter: s => g.configure({ panel: 'map', map: scene(s.p), open: [] }),
    target: () => [g.target('map')],
    answer: { title: P('진앙 좌표 (지도 km)', 'Epicentre coordinates (map km)'), fields: [{ label: 'x', unit: 'km' }, { label: 'y', unit: 'km' }] },
    gate: s => !!s.ok, waitLabel: P('진앙 좌표를 보내세요', 'Send the epicentre'),
    on: {
      pick: (s, p) => { s.pick = p as Point; g.configure({ panel: 'map', map: scene(s.pick), open: [] }); },
      act: (s, a) => { if (a === 'sendPick' && s.pick) { onSend(s, s.pick); g.configure({ panel: 'map', map: scene(s.pick, !!s.v?.ok), open: [] }); } },
      answer: (s, a) => {
        const [x, y] = (a as string[]).map(v => parseNumber(v));
        const p = x === null || y === null ? null : { x, y };
        onSend(s, p); g.configure({ panel: 'map', map: scene(p, s.v ? s.v.ok : undefined), open: [] });
      },
    },
    body: s => '<p>' + tr('세 원이 모두 그려졌습니다. 기록의 S-P 시간을 0.1 s로 반올림했기 때문에 세 원은 정확히 한 점에서 만나지 않고 아주 조금 어긋납니다. 세 원이 가장 가까이 모인 곳이 진앙입니다.', 'All three circles are drawn. Because the S-P times were rounded to 0.1 s, they do not meet at exactly one point; they miss by a hair. The epicentre is where they come closest together.') + '</p>'
      + '<p>' + tr('5장처럼 두 원의 식을 빼서 계산해도 되고, 지도에서 그곳을 탭해 고른 뒤 보내도 됩니다.', 'You can calculate it by subtracting circle equations as in chapter 5, or tap the spot on the map and send it.') + '</p>'
      + (s.pick ? `<p class="pick-btns"><button class="act" data-act="sendPick">${tr(`탭한 점 ${fmt(s.pick)} 보내기`, `Send tapped point ${fmt(s.pick)}`)}</button></p>` : `<p class="small">${tr('지도를 탭하면 그 점을 고를 수 있습니다.', 'Tap the map to choose a point.')}</p>`)
      + (canSendEpicentre(flow) ? feedback(s.v, tr('통과입니다. 다음에서 실제 발표와 비교해 봅시다.', 'Passed. Next, compare with the official result.'), tr('세 원이 가장 가까이 모인 곳에서 5 km 안이어야 합니다.', 'It must be within 5 km of where the three circles come closest.')) : '') },
  { ch: CH6, title: P('M7 USGS 발표와 비교', 'M7 Compare with USGS'), mission: 'M7', done: () => true,
    enter: () => g.configure({ panel: 'map', map: { ...scene(sent, true), points: [...(sent ? [{ p: sent, kind: 'answer' as const, label: tr('보낸 점', 'Yours') }] : [])] }, open: [] }),
    target: () => [g.target('map')],
    body: () => sent ? gyeongjuResult(sent) : '<p>' + tr('먼저 진앙을 보내세요.', 'Send the epicentre first.') + '</p>' },
];
