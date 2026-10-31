// M4~M6: 다운포스 식 → 반지름 관계의 반전 → 한계가 사라지는 경계. 정답·풀이: kitty-specs/race-engineer-01M68BAF/answers.md
import { P, tr } from '@series/engine/i18n';
import { quizStep } from '@series/engine/tutorial';
import { frac, math, mi, mn, mo, row, sup } from '@series/engine/ui';
import { MASS } from '../model/constants';
import { judgeNumber } from '../model/judge';
import { condLine, feedback, limitKmh, radioOn } from './basic';
import type { Game, MissionStep } from './index';

const CH3 = P('3장 빠를수록 붙는다', 'Ch.3 The faster, the stickier'), CH4 = P('4장 한계가 사라질 때', 'Ch.4 When the limit disappears');
const MU = 1.6, K = 3.2;   // M4~M6 조건: 건조, 윙 높음
const v2 = sup(mi('v'), mn(2));

export const downforceSteps = (g: Game): MissionStep[] => [
  { ch: CH3, title: P('다운포스', 'Downforce'),
    enter: () => g.configure({ radius: 106, surface: 'dry', wing: 'high', open: [] }),
    body: () => '<p>' + tr('리어 윙은 차를 노면으로 누릅니다. 이 힘은 속도의 제곱에 비례해, 빠를수록 타이어가 더 큰 힘을 냅니다.', 'The rear wing presses the car onto the track. That force grows with the square of the speed, so the faster you go, the more the tyres can give.') + '</p>'
      + math(mi('N'), mo('='), mi('m'), mi('g'), mo('+'), mi('k'), v2)
      + '<p>' + tr('한계의 식은 다음과 같고, v²이 양변에 있습니다. v²에 대한 일차방정식으로 풀어 보세요.', 'At the limit, v² appears on both sides. Treat it as a linear equation in v².') + '</p>'
      + math(frac(row(mi('m'), v2), mi('r')), mo('='), mi('μ'), mo('('), mi('m'), mi('g'), mo('+'), mi('k'), v2, mo(')')) },
  { ch: CH3, title: P('M4 빠를수록 붙는다', 'M4 The faster, the stickier'), mission: 'M4', ctrl: true,
    enter: () => g.configure({ radius: 106, surface: 'dry', wing: 'high', open: [] }),
    radio: { label: P('최대 속도', 'Top speed'), unit: 'km/h' },
    gate: s => !!s.ok, waitLabel: P('속도를 무전으로 보내세요', 'Radio in the speed'), done: s => !!s.ok,
    on: radioOn(raw => judgeNumber(raw, limitKmh(106, MU, K), 3)),
    body: s => condLine(g) + '<p>' + tr('반지름 106 m는 실제 코너의 값이 아니라 공개된 속도와 횡가속도로 역산한 값입니다. 식을 v²에 대해 풀어 km/h로 보내세요.', 'The 106 m radius is back-calculated from published speed and lateral g, not measured from a real corner. Solve for v² and send km/h.') + '</p>'
      + feedback(s.v, tr('맞습니다. 그래프로 확인해 봅시다.', 'Right. Let us check it on the graph.'), tr('v²을 왼쪽으로 모아 v²(m/r − μk) = μmg로 정리합니다.', 'Collect v² on the left: v²(m/r − μk) = μmg.')) },
  { ch: CH3, title: P('교점이 답입니다', 'The crossing is the answer'),
    enter: () => g.configure({ radius: 106, surface: 'dry', wing: 'high', open: [], limit: true, graph: true }),
    target: () => [g.target('forces')],
    body: () => '<p>' + tr('주황 곡선은 필요한 힘, 파랑 곡선은 낼 수 있는 힘입니다. 둘 다 v²의 일차식이라 교점은 많아야 하나입니다.', 'Orange is the force needed, blue the force available. Both are linear in v², so they cross at most once.') + '</p>' },
  { ch: CH3, title: P('M5 두 배의 반전', 'M5 The doubling twist'), mission: 'M5', ctrl: true,
    enter: () => g.configure({ radius: 50, surface: 'dry', wing: 'high', open: ['radius'], limit: true }),
    target: () => [g.target('radius')],
    radio: { label: 'v(100) / v(50)', unit: P('배', 'times') },
    gate: s => !!s.ok, waitLabel: P('비율을 무전으로 보내세요', 'Radio in the ratio'),
    on: radioOn(raw => judgeNumber(raw, limitKmh(100, MU, K) / limitKmh(50, MU, K), .02)),
    body: s => condLine(g) + '<p>' + tr('반지름을 50 m와 100 m로 바꿔 그립 한계를 읽고, 100 m의 한계를 50 m의 한계로 나눈 값을 소수로 보내세요.', 'Set the radius to 50 m and 100 m, read the grip limits, then send the 100 m limit divided by the 50 m limit as a decimal.') + '</p>'
      + feedback(s.v, tr('맞습니다.', 'Right.'), tr('v(100)을 v(50)으로 나눕니다.', 'Divide v(100) by v(50).')) },
  { ...quizStep({ ch: CH3, title: P('M5 M2와 비교', 'M5 Compare with M2'),
    quiz: { q: P('이 비율은 M2의 비율과 비교해 어떤가요?', 'How does this ratio compare with the one in M2?'),
      options: [P('M2의 비율보다 크다', 'Larger than in M2'), P('M2의 비율과 같다', 'The same as in M2'), P('M2의 비율보다 작다', 'Smaller than in M2')], answer: 0,
      explain: P('다운포스가 있으면 빠를수록 힘이 늘어, 반지름을 키운 효과가 √2배보다 커집니다.', 'With downforce, speed adds grip, so a bigger radius helps by more than √2.'), hint: P('M2의 비율은 약 1.41이었습니다.', 'The ratio in M2 was about 1.41.') } }),
    mission: 'M5', done: s => !!s.ok },
  { ch: CH4, title: P('M6 한계가 사라지는 코너', 'M6 The corner with no limit'), mission: 'M6',
    enter: () => g.configure({ radius: 100, surface: 'dry', wing: 'high', open: ['radius'], limit: true, graph: true }),
    target: () => [g.target('forces'), g.target('radius')],
    on: { setup: (s, kind) => { if (kind === 'aboveTopSpeed') s.above = true; if (kind === 'none') s.none = true; } },
    gate: s => !!(s.above && s.none), waitLabel: P('반지름을 끝까지 키워 보세요', 'Keep increasing the radius'),
    body: s => '<p>' + tr('반지름을 키우며 교점을 지켜보세요.', 'Increase the radius and watch the crossing.') + '</p>'
      + '<table><tr><td>' + tr('그립 한계 > 최고 속도', 'Grip limit > top speed') + (s.above ? ' ✓' : '') + '</td><td>' + tr('한계는 있지만 차가 그 속도까지 못 갑니다', 'A limit exists, but the car cannot reach it') + '</td></tr>'
      + '<tr><td>' + tr('한계 없음', 'No limit') + (s.none ? ' ✓' : '') + '</td><td>' + tr('어떤 속도에서도 미끄러지지 않습니다', 'It holds at any speed') + '</td></tr></table>' },
  { ch: CH4, title: P('M6 경계 반지름', 'M6 The boundary radius'), mission: 'M6', ctrl: true,
    enter: () => g.configure({ radius: 100, surface: 'dry', wing: 'high', open: [] }),
    radio: { label: P('경계 반지름', 'Boundary radius'), unit: 'm' },
    gate: s => !!s.ok, waitLabel: P('반지름을 무전으로 보내세요', 'Radio in the radius'), done: s => !!s.ok,
    on: radioOn(raw => judgeNumber(raw, MASS / (MU * K), 2)),
    body: s => condLine(g) + '<p>' + tr('v²(m/r − μk) = μmg에서 괄호가 0 이하가 되면 어떤 v도 한계가 되지 못합니다. 그 경계의 반지름을 구해 보내세요.', 'In v²(m/r − μk) = μmg, once the bracket reaches zero or below, no v can be the limit. Find the radius at that boundary.') + '</p>'
      + feedback(s.v, tr('맞습니다. 이보다 큰 코너는 이 조건에서 플랫아웃입니다.', 'Right. Any corner wider than this is flat out under these conditions.'), tr('m/r − μk = 0을 r에 대해 풉니다.', 'Solve m/r − μk = 0 for r.')) },
];
