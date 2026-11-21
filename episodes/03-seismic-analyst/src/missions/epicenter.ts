// M5 교점 구하기, M6 관측소 셋: 진앙 확정. 상황 → 직접 보기 → 의미 → 계산 → 왜 중요한가 (FR-010).
// M6는 고르기가 아니라 두 직선의 교점을 계산해 보내는 방식 (스펙 검토 R2). 정답은 상수로 두지 않고 계산한다
import { P, tr } from '@series/engine/i18n';
import type { StepState } from '@series/engine/tutorial';
import { intersect, radicalLine } from '../model/circles';
import { PRACTICE_STATIONS, type Point } from '../model/constants';
import { judgePoint, parseNumber, type Verdict } from '../model/judge';
import { commonPoints, intersectLines } from '../model/system';
import { expandedEq } from '../view/formula-panel';
import type { MapLine, MapPoint, MapScene } from '../view/map';
import { circleOf, lineCheck, parseLine, rOf } from './circles';
import { answerOn, feedback, type Game, type MissionStep } from './index';

const CH5 = P('5장 진앙 확정', 'Ch.5 Pinning the epicentre');
const [, B, C] = PRACTICE_STATIONS;
const stations = (n: number) => PRACTICE_STATIONS.slice(0, n).map((s, i) => ({ id: s.id, pos: s.pos, tone: (['a', 'b', 'c'] as const)[i] }));
const circles = (n: number) => [0, 1, 2].slice(0, n).map(i => ({ circle: circleOf(i), tone: (['a', 'b', 'c'] as const)[i] }));
const lineAB = () => radicalLine(circleOf(0), circleOf(1)), lineAC = () => radicalLine(circleOf(0), circleOf(2));
// A·B 원의 두 교점 (위쪽 먼저)
export function crossingsAB(): [Point, Point] {
  const r = intersect(circleOf(0), circleOf(1));
  if (r.count !== 2) throw new Error('A and B must cross twice');
  return [...r.points].sort((p, q) => q.y - p.y) as [Point, Point];
}
export function epicentre(): Point {
  const p = intersectLines(lineAB(), lineAC());
  if (typeof p !== 'object') throw new Error('lines must cross');
  return p;
}
const fmt = (n: number) => String(Math.round(n * 100) / 100);
const pt = (p: Point) => `(${fmt(p.x)}, ${fmt(p.y)})`;

const readPoint = (raw: string[], i = 0): Point | null => {
  const x = parseNumber(raw[i]), y = parseNumber(raw[i + 1]);
  return x === null || y === null ? null : { x, y };
};
// M5: 두 점 순서 무관, 각 ±1 km
function twoPointCheck(raw: string[]): Verdict {
  const p = readPoint(raw, 0), q = readPoint(raw, 2), [u, v] = crossingsAB();
  if (!p || !q) return { ok: false, reason: 'invalid' };
  const ok = (a: Point, b: Point) => judgePoint(p, a, 1).ok && judgePoint(q, b, 1).ok;
  return ok(u, v) || ok(v, u) ? { ok: true } : { ok: false, reason: 'far' };
}

const crossPoints = (show: boolean): MapPoint[] => show ? crossingsAB().map((p, i) => ({ p, label: ['P₁', 'P₂'][i], kind: 'cross' as const })) : [];
const scene = (n: number, lines: MapLine[], pts: MapPoint[] = []): MapScene => ({ stations: stations(n), circles: circles(n), lines, points: pts });

// 틀린 좌표: 그 점에서 세 관측소까지의 거리와 세 반지름 (US2 시나리오 6)
function compareTable(p: Point | null) {
  if (!p) return '';
  return `<table><tr><td></td><td>${tr('보낸 점까지 거리', 'Distance to your point')}</td><td>${tr('반지름', 'Radius')}</td></tr>`
    + [0, 1, 2].map(i => { const s = PRACTICE_STATIONS[i], d = Math.hypot(p.x - s.pos.x, p.y - s.pos.y); return `<tr><td>${s.id}</td><td>${fmt(d)} km</td><td>${rOf(i)} km</td></tr>`; }).join('') + '</table>';
}

export const epicentreSteps = (g: Game): MissionStep[] => [
  { ch: CH5, title: P('M5 두 교점 구하기', 'M5 Find the two crossings'), mission: 'M5', ctrl: true,
    enter: s => g.configure({ panel: 'map', map: scene(2, [{ line: lineAB(), tone: 'ink' }], crossPoints(!!s.ok)), open: [] }),
    answer: { title: P('A와 B의 두 교점 (순서 상관없음)', 'The two crossings of A and B (any order)'), fields: [{ label: 'x₁', unit: 'km' }, { label: 'y₁', unit: 'km' }, { label: 'x₂', unit: 'km' }, { label: 'y₂', unit: 'km' }] },
    gate: s => !!s.ok, waitLabel: P('두 점을 보내세요', 'Send both points'),
    on: { answer: (s, a) => { answerOn(twoPointCheck).answer(s, a); if (s.ok) g.configure({ panel: 'map', map: scene(2, [{ line: lineAB(), tone: 'ink' }], crossPoints(true)), open: [] }); } },
    body: s => '<p>' + tr('두 교점은 직선 x = 100 위에 있습니다. 그러니 원 B의 방정식에 x = 100을 넣으면 y만 남습니다.', 'Both crossings lie on the line x = 100, so putting x = 100 into circle B\'s equation leaves only y.') + '</p>'
      + '<p>' + tr(`원 B: (x − ${B.pos.x})² + (y − ${B.pos.y})² = ${rOf(1)}²`, `Circle B: (x − ${B.pos.x})² + (y − ${B.pos.y})² = ${rOf(1)}²`) + '</p>'
      + '<p class="small">' + tr('풀이 예시(다른 원): (x − 3)² + (y − 2)² = 5²에 x = 3을 넣으면 (y − 2)² = 25, y − 2 = 5 또는 −5, 그래서 y = 7 또는 −3. 두 점은 (3, 7), (3, −3)입니다.', 'Worked example (another circle): put x = 3 into (x − 3)² + (y − 2)² = 5² to get (y − 2)² = 25, so y − 2 = 5 or −5, giving y = 7 or −3. The points are (3, 7) and (3, −3).') + '</p>'
      + feedback(s.v, tr(`맞습니다. (y − 77)² = 63²이니 y = 77 ± 63, 두 점은 <b>${pt(crossingsAB()[0])}</b>과 <b>${pt(crossingsAB()[1])}</b>입니다. 지도에 P₁, P₂로 표시했습니다.`, `Right. (y − 77)² = 63², so y = 77 ± 63: <b>${pt(crossingsAB()[0])}</b> and <b>${pt(crossingsAB()[1])}</b>. They are marked P₁ and P₂.`), tr('제곱해서 63²이 되는 수는 +63과 −63 두 개입니다. 77에 각각 더해 보세요.', 'Two numbers square to 63²: +63 and −63. Add each to 77.')) },
  { ch: CH5, title: P('M5 아직 둘 중 어디인지 모릅니다', 'M5 Still one of two'), mission: 'M5', done: () => true,
    enter: () => g.configure({ panel: 'map', map: scene(2, [{ line: lineAB(), tone: 'ink' }], crossPoints(true)), open: [] }),
    target: () => [g.target('map')],
    body: () => '<p>' + tr(`발송팀: <b>"P₁ ${pt(crossingsAB()[0])}과 P₂ ${pt(crossingsAB()[1])} 중 어디예요? 둘 다 보내면 경보의 절반은 헛걸음이에요."</b>`, `Alert team: <b>"P₁ ${pt(crossingsAB()[0])} or P₂ ${pt(crossingsAB()[1])}? If we alert both, half the alerts are wasted."</b>`) + '</p>'
      + '<p>' + tr('관측소 둘로는 여기까지입니다. 두 점 모두 A와 B에서 잰 거리를 똑같이 만족합니다. 셋째 관측소가 필요합니다.', 'Two stations can only get this far: both points match the distances from A and B equally well. You need a third station.') + '</p>' },
  { ch: CH5, title: P('M6 관측소 C 더하기', 'M6 Add station C'), mission: 'M6',
    enter: () => g.configure({ panel: 'map', map: scene(3, [{ line: lineAB(), tone: 'ink' }], crossPoints(true)), open: [] }),
    target: () => [g.target('map')],
    body: () => '<p>' + tr(`관측소 <b>C</b>는 (${C.pos.x}, ${C.pos.y})에 있고, S-P 시간은 ${C.spTime.toFixed(1)} s입니다. 거리는 8.4 × ${C.spTime} = <b>${rOf(2)} km</b>로 확정해 원을 그렸습니다.`, `Station <b>C</b> is at (${C.pos.x}, ${C.pos.y}) with an S-P time of ${C.spTime.toFixed(1)} s. Its distance is confirmed as 8.4 × ${C.spTime} = <b>${rOf(2)} km</b>, and its circle is drawn.`) + '</p>'
      + '<p>' + tr('이번에도 식으로 확인합니다. 원 A와 원 C의 식을 빼면 A와 C의 두 교점을 지나는 직선이 생깁니다. 진앙은 그 직선 위에도, 앞의 직선 x = 100 위에도 있어야 합니다.', 'Check it with equations again. Subtracting circle C from circle A gives a line through A and C\'s crossings. The epicentre must lie on that line and on x = 100 as well.') + '</p>' },
  { ch: CH5, title: P('M6 원 A − 원 C', 'M6 Circle A minus circle C'), mission: 'M6', ctrl: true,
    enter: s => g.configure({ panel: 'map', map: scene(3, [{ line: lineAB(), tone: 'ink' }, ...(s.line ? [{ line: s.line, tone: 'c' as const, dashed: !s.ok }] : [])], crossPoints(true)), open: [] }),
    answer: { title: P('A의 식 − C의 식 → ax + by = c', 'A minus C → ax + by = c'), fields: [{ label: 'a' }, { label: 'b' }, { label: 'c' }] },
    gate: s => !!s.ok, waitLabel: P('직선의 계수를 보내세요', 'Send the coefficients'),
    on: { answer: (s: StepState, a) => {
      answerOn(lineCheck(lineAC())).answer(s, a); s.line = parseLine(a as string[]);
      g.configure({ panel: 'map', map: scene(3, [{ line: lineAB(), tone: 'ink' }, ...(s.line ? [{ line: s.line, tone: 'c' as const, dashed: !s.v.ok }] : [])], crossPoints(true)), open: [] });
    } },
    body: s => '<p>' + tr('이번에는 x와 y가 모두 남습니다. A의 펼친 식에서 C의 펼친 식을 빼서 a, b, c를 보내세요. 계수가 커도 괜찮고, 모두 같은 수로 나눈 식도 같은 직선입니다.', 'This time both x and y remain. Subtract C\'s expanded equation from A\'s and send a, b and c. Big numbers are fine, and dividing them all by the same number gives the same line.') + '</p>'
      + '<p class="eq-name a">A</p>' + expandedEq(circleOf(0)) + '<p class="eq-name c">C</p>' + expandedEq(circleOf(2))
      + feedback(s.v, tr('맞습니다. 336x + 126y = 51240, 42로 나누면 <b>8x + 3y = 1220</b>입니다. 지도의 초록 직선이 P₁과 P₂ 중 <b>한 점만</b> 지나는 것을 보세요.', 'Right: 336x + 126y = 51240, or dividing by 42, <b>8x + 3y = 1220</b>. See how the green line passes through <b>only one</b> of P₁ and P₂.'), tr('x의 계수는 −32 − (−368), y의 계수는 −154 − (−280), 상수는 −4840 − 46400을 오른쪽으로 넘긴 값입니다.', 'The x coefficient is −32 − (−368), the y coefficient −154 − (−280), and the constant is −4840 − 46400 moved to the right.')) },
  { ch: CH5, title: P('M6 두 직선이 만나는 점', 'M6 Where the two lines meet'), mission: 'M6', ctrl: true,
    enter: s => g.configure({ panel: 'map', map: scene(3, [{ line: lineAB(), tone: 'ink' }, { line: lineAC(), tone: 'c' }], [...crossPoints(true), ...(s.p ? [{ p: s.p, kind: 'answer' as const }] : [])]), open: [] }),
    answer: { title: P('진앙 좌표', 'Epicentre coordinates'), fields: [{ label: 'x', unit: 'km' }, { label: 'y', unit: 'km' }] },
    gate: s => !!s.ok, waitLabel: P('진앙 좌표를 보내세요', 'Send the epicentre'),
    on: { answer: (s, a) => {
      s.p = readPoint(a as string[]); s.v = judgePoint(s.p, epicentre(), 1); s.ok = s.ok || s.v.ok;
      g.configure({ panel: 'map', map: scene(3, [{ line: lineAB(), tone: 'ink' }, { line: lineAC(), tone: 'c' }], [...crossPoints(true), ...(s.p ? [{ p: s.p, kind: 'answer' as const, state: s.v.ok ? 'good' as const : 'bad' as const }] : [])]), open: [] });
    } },
    body: s => '<p>' + tr('진앙은 두 직선 위에 모두 있습니다. 두 식을 함께 만족하는 (x, y), 즉 <b>연립일차방정식</b>의 해를 구해 발송팀에 보내세요.', 'The epicentre is on both lines. Find the (x, y) that satisfies both equations, the solution of the <b>simultaneous linear equations</b>, and send it to the alert team.') + '</p>'
      + '<p class="sys">x = 100<br>8x + 3y = 1220</p>'
      + '<p class="small">' + tr('첫 식의 x를 둘째 식에 넣으면 y만 남습니다.', 'Put the first equation\'s x into the second and only y remains.') + '</p>'
      + (s.v && !s.v.ok && s.v.reason === 'far' ? `<p class="fb bad">${tr('그 점은 세 원 위에 있지 않습니다.', 'That point is not on all three circles.')}</p>` + compareTable(s.p) : feedback(s.v, tr(`맞습니다. 8 × 100 + 3y = 1220이니 3y = 420, y = 140. 진앙은 <b>${pt(epicentre())}</b>입니다.`, `Right. 8 × 100 + 3y = 1220, so 3y = 420 and y = 140. The epicentre is <b>${pt(epicentre())}</b>.`), '')) },
  { ch: CH5, title: P('M6 세 원이 만나는 단 한 점', 'M6 The one point on all three circles'), mission: 'M6', done: () => true,
    enter: () => g.configure({ panel: 'map', map: scene(3, [], [...crossPoints(true), { p: epicentre(), kind: 'answer', state: 'good' }]), open: [] }),
    target: () => [g.target('map')],
    body: () => {
      const common = commonPoints([0, 1, 2].map(i => circleOf(i)), crossingsAB());
      return '<p>' + tr(`지도를 보세요. 세 원이 모두 지나는 점은 <b>${pt(common[0])} 하나뿐</b>입니다 (세 원이 함께 지나는 점: ${common.length}개). P₂ ${pt(crossingsAB()[1])}는 A와 B의 원 위에는 있지만 C에서 ${fmt(Math.hypot(crossingsAB()[1].x - C.pos.x, crossingsAB()[1].y - C.pos.y))} km나 떨어져 있어 C의 원(${rOf(2)} km) 위에 없습니다.`, `Look at the map. Only <b>${pt(common[0])}</b> lies on all three circles (points on all three: ${common.length}). P₂ ${pt(crossingsAB()[1])} is on A's and B's circles but ${fmt(Math.hypot(crossingsAB()[1].x - C.pos.x, crossingsAB()[1].y - C.pos.y))} km from C, so not on C's circle (${rOf(2)} km).`) + '</p>'
        + '<p>' + tr('발송팀이 좌표를 받아 그 둘레 지역에 재난 문자를 보냈습니다. <b>관측소 하나면 원, 둘이면 두 점, 셋이면 한 점.</b> 이것이 지진 관측소가 여러 곳에 있는 이유입니다.', 'The alert team took the coordinates and sent alerts to the surrounding region. <b>One station gives a circle, two give two points, three give one point.</b> That is why there are seismic stations in many places.') + '</p>';
    } },
];
