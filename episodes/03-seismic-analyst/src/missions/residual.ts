// M8 어긋난 세 원 (심화, 분리 가능 C-008). ① 잔차 제곱합 계산 → 왜 제곱인가 → ② 최소점 찾기 → ③ 진짜 진앙과 비교.
// 근심을 쓰지 않는다(C-006). 최소점은 "측정에 가장 잘 맞는 점"이지 "진짜 진앙"이 아니다(C-007). 정답: answers.md M8
import { P, tr } from '@series/engine/i18n';
import type { Circle } from '../model/circles';
import { M8_READINGS, M8_START, M8_VIEW, PRACTICE_STATIONS, type Point } from '../model/constants';
import { judgePoint, judgeValue } from '../model/judge';
import { downhill, leastSquaresPoint, sumSquares } from '../model/residual';
import { distanceFromSp } from '../model/waves';
import type { MapPoint, MapScene } from '../view/map';
import { answerOn, feedback, type Game, type MissionStep } from './index';

const CH7 = P('7장 어긋난 세 원 (심화)', 'Ch.7 Circles that disagree (advanced)');
export const m8Circles = (): Circle[] => PRACTICE_STATIONS.map((s, i) => ({ center: s.pos, r: distanceFromSp(M8_READINGS[i]) }));
const best = () => leastSquaresPoint(m8Circles(), M8_START);
const fmt = (n: number) => n.toFixed(2);
const pt = (p: Point) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`;

const scene = (points: MapPoint[] = [], zoom = false): MapScene => ({
  stations: PRACTICE_STATIONS.map((s, i) => ({ id: s.id, pos: s.pos, tone: (['a', 'b', 'c'] as const)[i] })),
  circles: m8Circles().map((circle, i) => ({ circle, tone: (['a', 'b', 'c'] as const)[i] })),
  points, view: zoom ? M8_VIEW : undefined,
  note: tr(`새 반지름: A ${fmt(m8Circles()[0].r)} · B ${fmt(m8Circles()[1].r)} · C ${fmt(m8Circles()[2].r)} km`, `New radii: A ${fmt(m8Circles()[0].r)} · B ${fmt(m8Circles()[1].r)} · C ${fmt(m8Circles()[2].r)} km`),
});
// 힌트: 잔차 제곱합이 줄어드는 쪽 (8방향)
function hintArrow(p: Point) {
  const g = downhill(p, m8Circles()), a = Math.atan2(g.y, g.x), k = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
  return ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'][k];
}

// 카드 안 조작판: 지금 잔차 제곱합과 0.1 km 화살표 (카드가 화면 아래를 가려도 늘 보이게, 스펙 검토 R3)
function estPad(g: Game) {
  const p = g.estimate(), b = (dx: number, dy: number, ch: string, label: string) => `<button class="act nudge-btn" data-act="e:${dx}:${dy}" aria-label="${label}">${ch}</button>`;
  return `<div class="est-card"><span class="small">${tr('추정점', 'Estimate')} ${pt(p)}</span><span><span class="small">${tr('잔차 제곱합', 'Sum of squares')}</span> <b class="est-f">${fmt(sumSquares(p, m8Circles()))}</b></span></div>`
    + `<div class="est-pad">${b(0, 1, '↑', tr('북쪽으로 0.1 km', '0.1 km north'))}${b(-1, 0, '←', tr('서쪽으로 0.1 km', '0.1 km west'))}${b(0, -1, '↓', tr('남쪽으로 0.1 km', '0.1 km south'))}${b(1, 0, '→', tr('동쪽으로 0.1 km', '0.1 km east'))}</div>`;
}

export const residualSteps = (g: Game): MissionStep[] => [
  { ch: CH7, title: P('M8 판독이 조금씩 어긋났다면', 'M8 If every reading is a little off'), mission: 'M8',
    enter: () => g.configure({ panel: 'map', map: scene(), open: [] }),
    target: () => [g.target('map')],
    body: () => '<p>' + tr(`실제 기록은 잡음 때문에 판독이 조금씩 틀립니다. 5장의 연습 지도에서 세 관측소를 각각 0.5 s씩 어긋나게 읽었다고 해 봅시다: A <b>${M8_READINGS[0].toFixed(1)} s</b>, B <b>${M8_READINGS[1].toFixed(1)} s</b>, C <b>${M8_READINGS[2].toFixed(1)} s</b>.`, `Real records are noisy, so readings are a little off. Suppose each station on the chapter 5 map was read 0.5 s off: A <b>${M8_READINGS[0].toFixed(1)} s</b>, B <b>${M8_READINGS[1].toFixed(1)} s</b>, C <b>${M8_READINGS[2].toFixed(1)} s</b>.`) + '</p>'
      + '<p>' + tr('이 판독값으로 다시 그린 세 원은 더 이상 한 점에서 만나지 않습니다. 어디를 진앙이라고 보내야 할까요? 먼저 "어긋남"을 숫자로 재는 방법이 필요합니다.', 'Circles redrawn from these readings no longer meet at one point. Where should you say the epicentre is? First you need a way to measure the mismatch as a number.') + '</p>' },
  { ch: CH7, title: P('M8 ① 잔차 재기', 'M8 ① Measure the residuals'), mission: 'M8', ctrl: true,
    enter: () => g.configure({ panel: 'map', map: scene([{ p: M8_START, kind: 'answer', label: tr('M6 진앙', 'M6 epicentre') }]), open: [] }),
    answer: { title: P('(100, 140)에서의 잔차 제곱합', 'Sum of squared residuals at (100, 140)'), fields: [{ label: P('잔차 제곱합', 'Sum of squares'), unit: 'km²' }] },
    gate: s => !!s.ok, waitLabel: P('잔차 제곱합을 보내세요', 'Send the sum of squares'),
    on: answerOn(raw => judgeValue(raw[0], sumSquares(M8_START, m8Circles()), 0.1)),
    body: s => '<p>' + tr('한 점이 원에서 얼마나 벗어났는지를 <b>잔차</b>라고 합니다: 잔차 = (그 점에서 관측소까지의 거리) − (원의 반지름). 원 위면 0, 원 밖이면 +, 원 안이면 −입니다.', 'How far a point misses a circle is its <b>residual</b>: residual = (distance from the point to the station) − (the circle\'s radius). On the circle it is 0; outside it is +; inside it is −.') + '</p>'
      + '<p>' + tr('5장에서 구한 진앙 (100, 140)에서 세 관측소까지의 거리는 A 105, B 63, C 84 km였습니다. 새 반지름과 비교해 관측소마다 잔차를 구하고, 각각 제곱해서 더한 <b>잔차 제곱합</b>을 보내세요.', 'From the chapter 5 epicentre (100, 140) the distances were A 105, B 63 and C 84 km. Compare each with the new radius to get its residual, square each one and add them up: send that <b>sum of squared residuals</b>.') + '</p>'
      + `<p class="small">${tr('새 반지름', 'New radii')}: A ${fmt(m8Circles()[0].r)} · B ${fmt(m8Circles()[1].r)} · C ${fmt(m8Circles()[2].r)} km</p>`
      + feedback(s.v, tr('맞습니다. 잔차는 +4.2, +4.2, −4.2이고 제곱합은 3 × 4.2² = <b>52.92 km²</b>입니다.', 'Right. The residuals are +4.2, +4.2 and −4.2, and the sum of squares is 3 × 4.2² = <b>52.92 km²</b>.'), tr('예: A는 105 − 100.8 = +4.2. 셋 모두 구해 제곱해서 더합니다.', 'For example A: 105 − 100.8 = +4.2. Do all three, square and add.')) },
  { ch: CH7, title: P('M8 왜 제곱해서 더할까요', 'M8 Why square them?'), mission: 'M8',
    enter: () => g.configure({ panel: 'map', map: scene([{ p: M8_START, kind: 'answer' }]), open: [] }),
    body: () => '<p>' + tr('잔차를 그냥 더하면 4.2 + 4.2 − 4.2 = 4.2입니다. −가 +를 지워서 어긋남이 실제보다 작아 보입니다. 잔차가 (+3, −3, 0)인 점은 그냥 더하면 0이지만, 두 원에서 3 km씩 벗어나 있습니다.', 'Add the residuals as they are and you get 4.2 + 4.2 − 4.2 = 4.2: the minus cancels a plus, so the mismatch looks smaller than it is. A point with residuals (+3, −3, 0) adds up to 0, yet it misses two circles by 3 km each.') + '</p>'
      + '<p>' + tr('제곱하면 모두 0 이상이 되어 서로 지워지지 않습니다. 그래서 <b>잔차 제곱합이 가장 작은 점</b>을 "측정에 가장 잘 맞는 점"으로 정합니다. 이런 방법을 <b>최소제곱법</b>이라고 합니다.', 'Squares are never negative, so nothing cancels. We therefore call the point with the <b>smallest sum of squared residuals</b> the point that best fits the measurements. This is the <b>method of least squares</b>.') + '</p>' },
  { ch: CH7, title: P('M8 ② 가장 잘 맞는 점 찾기', 'M8 ② Find the best-fitting point'), mission: 'M8',
    enter: () => g.configure({ panel: 'map', map: scene([], true), est: M8_START, open: ['est'] }),
    target: () => [g.target('map'), g.target('est')],
    on: {
      est: s => { s.v = undefined; },
      act: (s, a) => {
        const t = a as string;
        if (t.startsWith('e:')) { const [, dx, dy] = t.split(':'); g.nudgeEst(+dx, +dy); s.v = undefined; return; }
        if (t !== 'sendEst') return; s.p = g.estimate(); s.v = judgePoint(s.p, best(), 1); s.ok = s.ok || s.v.ok;
      },
    },
    gate: s => !!s.ok, waitLabel: P('가장 잘 맞는 점을 보내세요', 'Send the best-fitting point'),
    body: s => '<p>' + tr('확대한 지도에서 점을 끌거나 화살표 버튼으로 0.1 km씩 옮겨 보세요. 관측소별 잔차 막대와 잔차 제곱합 숫자가 바로 바뀝니다. 숫자가 가장 작아지는 곳을 찾아 보내세요.', 'On the zoomed map, drag the point or nudge it 0.1 km at a time with the arrow buttons. The residual bars and the sum of squares update at once. Find where the number is smallest and send it.') + '</p>'
      + estPad(g)
      + `<p class="pick-btns"><button class="act" data-act="sendEst">${tr('이 점 보내기', 'Send this point')}</button></p>`
      + (s.v ? (s.v.ok ? `<p class="fb good">${tr(`찾았습니다. 잔차 제곱합이 가장 작은 점은 약 <b>${pt(best())}</b>, 그때 값은 ${fmt(sumSquares(best(), m8Circles()))} km²입니다.`, `Found it. The smallest sum of squares is at about <b>${pt(best())}</b>, where it is ${fmt(sumSquares(best(), m8Circles()))} km².`)}</p>`
        : `<p class="fb bad">${tr(`아직 더 작아질 수 있습니다. <b>${hintArrow(s.p)}</b> 쪽으로 옮겨 보세요.`, `It can still get smaller. Try moving <b>${hintArrow(s.p)}</b>.`)}</p>`) : '') },
  { ch: CH7, title: P('M8 ③ 가장 잘 맞는 점과 진짜 진앙', 'M8 ③ Best fit versus the true epicentre'), mission: 'M8', done: () => true,
    enter: () => g.configure({ panel: 'map', map: scene([{ p: best(), kind: 'answer', label: tr('최소', 'Best fit') }, { p: M8_START, kind: 'answer', state: 'good', label: tr('M6 진앙', 'M6') }], true), open: [] }),
    target: () => [g.target('map')],
    body: () => '<p>' + tr(`잔차 제곱합이 가장 작은 점 ${pt(best())}은 5장의 진앙 (100, 140)에서 <b>${Math.hypot(best().x - 100, best().y - 140).toFixed(1)} km</b> 떨어져 있습니다. 진짜 진앙에서의 잔차 제곱합(52.92)이 이 점에서의 값(${fmt(sumSquares(best(), m8Circles()))})보다 훨씬 큽니다.`, `The point with the smallest sum, ${pt(best())}, is <b>${Math.hypot(best().x - 100, best().y - 140).toFixed(1)} km</b> from the chapter 5 epicentre (100, 140). The sum at the true epicentre (52.92) is far bigger than here (${fmt(sumSquares(best(), m8Circles()))}).`) + '</p>'
      + '<p>' + tr('판독이 틀렸으니 그 판독에 "가장 잘 맞는 점"도 진짜 진앙과 다를 수 있습니다. 최소제곱법은 측정이 주는 정보를 가장 공평하게 쓰는 방법이지, 진짜 진앙을 보장하지는 않습니다. 그래서 실제로는 관측소를 늘리고 판독을 정밀하게 해 오차 자체를 줄입니다.', 'Because the readings are wrong, the point that best fits them can differ from the true epicentre. Least squares uses the measurements as fairly as possible but does not guarantee the truth. In practice you add stations and read more carefully to shrink the errors themselves.') + '</p>' },
];
