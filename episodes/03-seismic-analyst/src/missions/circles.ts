// M3 관측소 하나: 원, M4 관측소 둘: 두 원이 만나는 직선. 상황 → 직접 보기 → 의미 → 계산 → 왜 중요한가 (FR-010).
// 판정은 확정된 정답 반지름으로 한다 (spec "중간값 확정 규칙"). 정답·풀이: kitty-specs/seismic-analyst-01M7YB3D/answers.md
import { P, tr } from '@series/engine/i18n';
import type { StepState } from '@series/engine/tutorial';
import { math, mi, mn, mo, row, sup } from '@series/engine/ui';
import { intersect, onCircle, radicalLine, type Circle } from '../model/circles';
import { M3_CANDIDATES, PRACTICE_STATIONS, type Point } from '../model/constants';
import { judgeIntermediate, parseNumber, type Verdict } from '../model/judge';
import { normalize, sameLine, type Line } from '../model/line';
import { distanceFromSp } from '../model/waves';
import { circleEq, expandedEq } from '../view/formula-panel';
import { crossingNote, type MapLine, type MapScene } from '../view/map';
import { answerOn, feedback, type Game, type MissionStep } from './index';

const CH3 = P('3장 관측소 하나: 원', 'Ch.3 One station: a circle');
const CH4 = P('4장 관측소 둘: 두 원이 만나는 직선', 'Ch.4 Two stations: the line through the crossings');
const [A, B] = PRACTICE_STATIONS;
export const rOf = (i: number) => distanceFromSp(PRACTICE_STATIONS[i].spTime);   // 정답 반지름 (확정값)
export const circleOf = (i: number, r = rOf(i)): Circle => ({ center: PRACTICE_STATIONS[i].pos, r });
const stationA = { id: A.id, pos: A.pos, tone: 'a' as const }, stationB = { id: B.id, pos: B.pos, tone: 'b' as const };
const ptText = (p: Point) => `(${p.x}, ${p.y})`;

// 거리(반지름) 답: 숫자로 읽어 중간값 판정. 통과하면 정답 반지름으로 확정
export const radiusCheck = (i: number) => (raw: string[]): Verdict => judgeIntermediate(parseNumber(raw[0], { positive: true }) ?? 'invalid', rOf(i), 2);

// 직선 계수 답: (a, b) = (0, 0)이면 직선이 아니라 판정하지 않음
export function parseLine(raw: string[]): Line | null {
  const [a, b, c] = raw.map(v => parseNumber(v));
  if (a === null || b === null || c === null) return null;
  const l = { a, b, c };
  return normalize(l) === 'invalid' ? null : l;
}
export const lineCheck = (answer: Line) => (raw: string[]): Verdict => {
  const l = parseLine(raw);
  return l === null ? { ok: false, reason: 'invalid' } : sameLine(l, answer) ? { ok: true } : { ok: false, reason: 'notSameLine' };
};
const lineFields = [{ label: 'a' }, { label: 'b' }, { label: 'c' }];

// M3 후보 판정 표: 학습자가 고른 답, 확인 뒤에는 대입 값과 r²의 비교 (US2 시나리오 1)
function candidateRows(s: StepState) {
  const c = circleOf(0), r2 = c.r * c.r;
  return '<table class="cands">' + M3_CANDIDATES.map((p, i) => {
    const pick = s.pick?.[i], truth = onCircle(p, c) === 'on';
    const btn = (on: boolean) => `<button class="act${pick === on ? ' sel' : ''}" data-act="c${i}:${on ? 1 : 0}" aria-pressed="${pick === on}">${on ? tr('원 위', 'On') : tr('아님', 'Not on')}</button>`;
    const calc = s.checked ? `<tr class="cand-calc"><td colspan="2">(${p.x} − ${c.center.x})² + (${p.y} − ${c.center.y})² = ${(p.x - c.center.x) ** 2 + (p.y - c.center.y) ** 2} ${truth ? '=' : (p.x - c.center.x) ** 2 + (p.y - c.center.y) ** 2 < r2 ? '<' : '>'} ${r2} <span class="${pick === truth ? 'good' : 'bad'}">${pick === truth ? '✓' : '✗'}</span></td></tr>` : '';
    return `<tr><td>${'①②③④⑤'[i]} ${ptText(p)}</td><td class="pick">${btn(true)}${btn(false)}</td></tr>` + calc;
  }).join('') + '</table>';
}
const allPicked = (s: StepState) => M3_CANDIDATES.every((_, i) => s.pick?.[i] !== undefined);
const allRight = (s: StepState) => M3_CANDIDATES.every((p, i) => s.pick?.[i] === (onCircle(p, circleOf(0)) === 'on'));

const m3Scene = (withCircle: boolean, cands = false, s?: StepState): MapScene => ({
  stations: [stationA], circles: withCircle ? [{ circle: circleOf(0), tone: 'a' }] : [],
  points: cands ? M3_CANDIDATES.map((p, i) => ({ p, label: '①②③④⑤'[i], kind: 'candidate' as const, state: s?.checked ? (s.pick?.[i] === (onCircle(p, circleOf(0)) === 'on') ? 'good' as const : 'bad' as const) : undefined })) : [],
});
const m4Scene = (rB: number | null, lines: MapLine[] = []): MapScene => ({
  stations: [stationA, stationB],
  circles: [{ circle: circleOf(0), tone: 'a' }, ...(rB === null ? [] : [{ circle: circleOf(1, rB), tone: 'b' as const }])],
  crossings: rB === null ? undefined : [0, 1], lines,
});

export const circleSteps = (g: Game): MissionStep[] => [
  { ch: CH3, title: P('연습 지도', 'The practice map'), mission: 'M3',
    enter: () => g.configure({ panel: 'map', map: m3Scene(false), open: [] }),
    target: () => [g.target('map')],
    body: () => '<p>' + tr('이제 지도 위에서 생각합니다. 가로 200 km, 세로 200 km인 가상 지역의 지도입니다. 오른쪽으로 갈수록 동쪽(x), 위로 갈수록 북쪽(y)이고, 모든 위치를 (x, y) km 좌표로 씁니다.', 'Now think on a map: a made-up region 200 km wide and 200 km tall. Right is east (x), up is north (y), and every place is written as (x, y) in km.') + '</p>'
      + '<p>' + tr(`관측소 <b>A</b>는 ${ptText(A.pos)}에 있습니다. 방금 지진의 기록에서 A의 S-P 시간은 <b>${A.spTime} s</b>로 읽혔습니다.`, `Station <b>A</b> is at ${ptText(A.pos)}. In the record of the latest quake, A's S-P time reads <b>${A.spTime} s</b>.`) + '</p>' },
  { ch: CH3, title: P('M3 A까지의 거리', 'M3 Distance from A'), mission: 'M3', ctrl: true,
    enter: s => g.configure({ panel: 'map', map: m3Scene(!!s.ok), open: [] }),
    answer: { title: P(`관측소 A의 S-P 시간 ${A.spTime} s`, `Station A's S-P time ${A.spTime} s`), fields: [{ label: P('거리', 'Distance'), unit: 'km' }] },
    gate: s => !!s.ok, waitLabel: P('거리를 보내세요', 'Send the distance'),
    on: { answer: (s, a) => { answerOn(radiusCheck(0)).answer(s, a); if (s.ok) g.configure({ panel: 'map', map: m3Scene(true), open: [] }); } },
    body: s => '<p>' + tr('2장의 식으로 A에서 진앙까지의 거리를 구해 보내세요. 통과하면 지도에 그 거리만큼의 원이 그려집니다.', 'Use the formula from chapter 2 to find the distance from A to the epicentre and send it. If it passes, a circle of that radius appears on the map.') + '</p>'
      + feedback(s.v, tr(`확정된 거리 <b>${rOf(0)} km</b>로 원을 그렸습니다.`, `A circle with the confirmed distance, <b>${rOf(0)} km</b>, is on the map.`), tr('S-P 시간에 8.4를 곱합니다.', 'Multiply the S-P time by 8.4.')) },
  { ch: CH3, title: P('M3 원의 방정식', 'M3 The equation of a circle'), mission: 'M3',
    enter: () => g.configure({ panel: 'map', map: m3Scene(true), open: [] }),
    target: () => [g.target('map')],
    body: () => '<p>' + tr(`진앙은 A에서 정확히 ${rOf(0)} km 떨어진 곳입니다. 그런 점을 모두 모으면 A를 중심으로 하는 <b>원</b>이 됩니다. 진앙은 이 원 위 어딘가에 있습니다.`, `The epicentre is exactly ${rOf(0)} km from A. All such points together make a <b>circle</b> centred on A. The epicentre is somewhere on it.`) + '</p>'
      + '<p>' + tr('점 (x, y)가 원 위에 있는지는 피타고라스 정리로 확인합니다. A에서 동쪽으로 x − 16, 북쪽으로 y − 77만큼 떨어져 있으니, 거리의 제곱은 두 차이의 제곱의 합입니다. 이것이 반지름의 제곱과 같으면 원 위에 있습니다.', 'Check whether a point (x, y) is on the circle with Pythagoras. It is x − 16 east and y − 77 north of A, so the distance squared is the sum of those two squares. If that equals the radius squared, the point is on the circle.') + '</p>'
      + circleEq(circleOf(0))
      + '<p>' + tr('이것을 <b>원의 방정식</b>이라고 합니다. 왼쪽이 오른쪽보다 작으면 원 안, 크면 원 밖입니다.', 'This is the <b>equation of the circle</b>. If the left side is smaller than the right, the point is inside; if larger, outside.') + '</p>' },
  { ch: CH3, title: P('M3 진앙 후보 가려내기', 'M3 Sort the candidates'), mission: 'M3',
    enter: s => { s.pick = {}; g.configure({ panel: 'map', map: m3Scene(true, true), open: [] }); },
    target: () => [g.target('map')],
    on: { act: (s, a) => {
      const t = a as string;
      if (t === 'check') { s.checked = true; s.ok = s.ok || allRight(s); }
      else { const [i, v] = t.slice(1).split(':'); s.pick[+i] = v === '1'; s.checked = false; }
      g.configure({ panel: 'map', map: m3Scene(true, true, s), open: [] });
    } },
    gate: s => !!s.ok, waitLabel: P('다섯 곳을 모두 맞혀 보세요', 'Get all five right'),
    body: s => '<p>' + tr('발송팀이 주민 신고가 들어온 다섯 곳을 알려 왔습니다. 각 지점이 진앙일 수 있는지, 즉 원 위에 있는지 원의 방정식에 넣어 판정하세요. 지도에서는 원에 가까워 보여도 식으로 확인해야 합니다.', 'The alert team sends five places where people reported shaking. For each, decide whether it could be the epicentre, that is, whether it lies on the circle. Plug it into the equation; looking close on the map is not enough.') + '</p>'
      + candidateRows(s)
      + `<p class="pick-btns"><button class="act" data-act="check"${allPicked(s) ? '' : ' disabled'}>${tr('판정 확인', 'Check')}</button></p>`
      + (s.checked ? (allRight(s) ? `<p class="fb good">${tr('모두 맞습니다. ①②③은 원 위, ④는 원 안, ⑤는 원 밖입니다.', 'All right. ①②③ are on the circle, ④ is inside and ⑤ is outside.')}</p>` : `<p class="fb bad">${tr('✗ 표시가 있는 곳을 다시 보세요. 대입한 값이 정확히 같아야 원 위입니다.', 'Look again at the ✗ rows. Only an exact match is on the circle.')}</p>`) : '') },
  { ch: CH3, title: P('M3 왜 중요할까요', 'M3 Why it matters'), mission: 'M3', done: () => true,
    enter: () => g.configure({ panel: 'map', map: m3Scene(true, true), open: [] }),
    body: () => '<p>' + tr('관측소 하나로는 진앙 후보가 원 하나만큼이나 남습니다. 원 위의 ①②③ 중 어디인지, 아니면 원 위의 다른 어느 곳인지 알 수 없습니다. 이 상태로는 원 둘레의 모든 지역에 경보를 보내야 합니다.', 'With one station the candidates fill a whole circle. ①②③ or any other point on it is possible. You would have to alert every region round the circle.') + '</p>'
      + '<p>' + tr('후보를 줄이려면 관측소가 더 필요합니다.', 'To narrow it down you need more stations.') + '</p>' },
  { ch: CH4, title: P('M4 관측소 B 더하기', 'M4 Add station B'), mission: 'M4',
    enter: s => { s.seen = {}; g.configure({ panel: 'map', map: m4Scene(40), rB: 40, open: ['rB'] }); s.seen[intersect(circleOf(0), circleOf(1, 40)).count] = true; },
    target: () => [g.target('map'), g.target('rB')],
    on: { rB: (s, v) => { const r = v as number; g.configure({ panel: 'map', map: m4Scene(r), open: ['rB'] }); s.seen[intersect(circleOf(0), circleOf(1, r)).count] = true; } },
    gate: s => !!(s.seen?.[0] && s.seen?.[1] && s.seen?.[2]), waitLabel: P('교점 0·1·2개를 모두 찾아보세요', 'Find 0, 1 and 2 crossings'),
    body: s => '<p>' + tr(`관측소 <b>B</b>는 ${ptText(B.pos)}에 있습니다. B의 원은 반지름에 따라 A의 원과 만나는 점의 개수가 달라집니다. 슬라이더로 B의 반지름을 바꿔 가며 <b>교점</b>이 0개, 1개, 2개가 되는 경우를 모두 찾아보세요.`, `Station <b>B</b> is at ${ptText(B.pos)}. Depending on its radius, B's circle meets A's circle in a different number of points. Use the slider to find radii giving 0, 1 and 2 <b>crossings</b>.`) + '</p>'
      + `<p class="seen">${[0, 1, 2].map(n => `<span class="${s.seen?.[n] ? 'good' : ''}">${s.seen?.[n] ? '✓' : '○'} ${tr(`${n}개`, `${n}`)}</span>`).join(' ')}</p>`
      + '<p class="small">' + tr('1개는 두 원이 딱 한 점에서 스치는(접하는) 경우라 정확한 반지름에서만 나옵니다.', 'One crossing happens only at an exact radius, where the circles just touch.') + '</p>'
      + (s.seen?.[0] && s.seen?.[1] && s.seen?.[2] ? '<p class="fb good">' + tr('B의 반지름이 21 km보다 작거나 189 km보다 크면 한 원이 다른 원 안에 쏙 들어가 만나지 않습니다. 그 사이에서는 언제나 두 점에서 만납니다.', 'Below 21 km or above 189 km one circle sits inside the other and they never meet. In between they always meet at two points.') + '</p>' : '') },
  { ch: CH4, title: P('M4 B까지의 거리', 'M4 Distance from B'), mission: 'M4', ctrl: true,
    enter: s => g.configure({ panel: 'map', map: m4Scene(s.ok ? rOf(1) : null), open: [] }),
    answer: { title: P(`관측소 B의 S-P 시간 ${B.spTime} s`, `Station B's S-P time ${B.spTime} s`), fields: [{ label: P('거리', 'Distance'), unit: 'km' }] },
    gate: s => !!s.ok, waitLabel: P('거리를 보내세요', 'Send the distance'),
    on: { answer: (s, a) => { answerOn(radiusCheck(1)).answer(s, a); if (s.ok) g.configure({ panel: 'map', map: m4Scene(rOf(1)), open: [] }); } },
    body: s => '<p>' + tr('이번 지진에서 B의 S-P 시간으로 B의 실제 거리를 구해 보내세요.', 'Work out B\'s real distance from its S-P time for this quake and send it.') + '</p>'
      + feedback(s.v, tr(`확정된 거리 <b>${rOf(1)} km</b>로 원을 그렸습니다. 두 원이 두 점에서 만납니다. 진앙은 두 원 위에 모두 있어야 하니 이 두 점 중 하나입니다.`, `Circle drawn with the confirmed distance, <b>${rOf(1)} km</b>. The circles cross at two points. The epicentre must be on both circles, so it is one of these two.`), tr('S-P 시간에 8.4를 곱합니다.', 'Multiply the S-P time by 8.4.')) },
  { ch: CH4, title: P('M4 두 원의 식을 빼면', 'M4 Subtract the two equations'), mission: 'M4',
    enter: () => g.configure({ panel: 'map', map: m4Scene(rOf(1)), open: [] }),
    body: () => '<p>' + tr('두 교점을 식으로 구하려면 두 원의 방정식을 함께 풀어야 합니다. 괄호를 풀면 두 식 모두 x²과 y²로 시작합니다.', 'To find the crossings by calculation, solve both circle equations together. Expanded, both start with x² and y².') + '</p>'
      + '<p class="eq-name a">A</p>' + expandedEq(circleOf(0)) + '<p class="eq-name b">B</p>' + expandedEq(circleOf(1))
      + '<p>' + tr('<b>한 식에서 다른 식을 빼면 x²과 y²가 사라집니다.</b> 남는 것은 x와 y의 일차식, 즉 <b>직선</b>입니다. 두 교점은 두 식을 모두 만족하니 뺀 식도 만족합니다. 그래서 이 직선은 두 교점을 지납니다. 이 직선을 두 원의 <b>근축</b>이라고도 부릅니다.', '<b>Subtract one equation from the other and x² and y² vanish.</b> What remains is linear in x and y: a <b>straight line</b>. Both crossings satisfy both equations, so they satisfy the difference too, and the line passes through both crossings. It is also called the <b>radical axis</b> of the two circles.') + '</p>'
      + '<p><b>' + tr('풀이 예시', 'Worked example') + '</b> ' + tr('(다른 두 원)', '(two other circles)') + '</p>'
      + math(sup(mi('x'), mn(2)), mo('+'), sup(mi('y'), mn(2)), mo('−'), mn(25), mo('='), mn(0))
      + math(sup(mi('x'), mn(2)), mo('+'), sup(mi('y'), mn(2)), mo('−'), mn(8), mi('x'), mo('−'), mn(4), mi('y'), mo('+'), mn(11), mo('='), mn(0))
      + '<p>' + tr('위 식에서 아래 식을 빼면 8x + 4y − 36 = 0, 정리하면', 'Top minus bottom gives 8x + 4y − 36 = 0, that is') + '</p>'
      + math(row(mn(8), mi('x'), mo('+'), mn(4), mi('y'), mo('='), mn(36)))
      + '<p>' + tr('x² − x², y² − y²는 0이고, x의 계수는 0 − (−8) = 8, 상수는 −25 − 11 = −36입니다. 상수를 오른쪽으로 넘기면 ax + by = c 꼴이 됩니다.', 'x² − x² and y² − y² are 0, the x coefficient is 0 − (−8) = 8 and the constant is −25 − 11 = −36. Move the constant across to get ax + by = c.') + '</p>' },
  { ch: CH4, title: P('M4 직선 구하기', 'M4 Find the line'), mission: 'M4', ctrl: true,
    enter: s => g.configure({ panel: 'map', map: m4Scene(rOf(1), s.line ? [{ line: s.line, tone: 'ink', dashed: !s.ok }] : []), open: [] }),
    answer: { title: P('A의 식 − B의 식 → ax + by = c', 'A minus B → ax + by = c'), fields: lineFields },
    gate: s => !!s.ok, waitLabel: P('직선의 계수를 보내세요', 'Send the coefficients'),
    on: { answer: (s, a) => {
      answerOn(lineCheck(radicalLine(circleOf(0), circleOf(1)))).answer(s, a);
      s.line = parseLine(a as string[]);
      // 틀려도 그린 직선을 보여 줘 교점을 지나지 않는 것을 확인하게 함 (US2 시나리오 4)
      g.configure({ panel: 'map', map: m4Scene(rOf(1), s.line ? [{ line: s.line, tone: 'ink', dashed: !s.v.ok }] : []), open: [] });
    } },
    body: s => '<p>' + tr('A의 펼친 식에서 B의 펼친 식을 빼서 ax + by = c의 a, b, c를 보내세요. 보낸 직선이 지도에 그려집니다. 맞으면 깜빡이는 두 교점을 지납니다.', 'Subtract B\'s expanded equation from A\'s and send a, b and c of ax + by = c. Your line is drawn on the map; if it is right it goes through both flashing crossings.') + '</p>'
      + '<p class="eq-name a">A</p>' + expandedEq(circleOf(0)) + '<p class="eq-name b">B</p>' + expandedEq(circleOf(1))
      + feedback(s.v, tr('맞습니다. 168x = 16800, 즉 <b>x = 100</b>입니다. y가 사라져 세로 직선이 됐습니다. A와 B가 같은 높이(y = 77)에 있기 때문입니다.', 'Right: 168x = 16800, so <b>x = 100</b>. y dropped out, giving a vertical line, because A and B are at the same height (y = 77).'), tr('그려진 직선이 두 교점을 지나지 않습니다. x의 계수는 −32 − (−200), 상수는 −4840 − 11960입니다.', 'Your line misses the crossings. The x coefficient is −32 − (−200) and the constant is −4840 − 11960.')) },
  { ch: CH4, title: P('M4 왜 중요할까요', 'M4 Why it matters'), mission: 'M4', done: () => true,
    enter: () => g.configure({ panel: 'map', map: m4Scene(rOf(1), [{ line: radicalLine(circleOf(0), circleOf(1)), tone: 'ink' }]), open: [] }),
    body: () => '<p>' + tr('관측소 둘이면 후보가 원 하나에서 <b>두 점</b>으로 줄어듭니다. 그리고 이차식 두 개를 빼서 얻은 직선 덕분에 그 두 점을 계산할 수 있게 됐습니다.', 'With two stations the candidates shrink from a whole circle to <b>two points</b>, and the line you got by subtracting lets you calculate them.') + '</p>'
      + '<p>' + tr('다음 장에서는 이 직선을 원의 식에 넣어 두 점의 좌표를 구하고, 세 번째 관측소로 진짜 진앙을 고릅니다.', 'Next, put the line into a circle equation to get the two points, then use a third station to pick the real epicentre.') + '</p>' },
];
