// M1~M3: 한계 체험 → 반지름 → 식으로 계산. 정답·풀이: kitty-specs/race-engineer-01M68BAF/answers.md
import { P, tr } from '@series/engine/i18n';
import { quizStep, type StepState } from '@series/engine/tutorial';
import { frac, math, mi, mn, mo, root, row, sup } from '@series/engine/ui';
import { gripLimit, msToKmh } from '../model/corner';
import { judgeDrive, judgeNumber, type RadioAnswer, type Verdict } from '../model/judge';
import type { Drive, Game, MissionStep } from './index';

export const limitKmh = (radius: number, mu: number, k: number) => {
  const l = gripLimit({ radius, mu, k });
  return l.kind === 'none' ? Infinity : msToKmh(l.speed);
};
const CH1 = P('1장 코너의 한계', 'Ch.1 The limit of a corner'), CH2 = P('2장 식으로 계산하기', 'Ch.2 Working it out');

export function feedback(v: Verdict | undefined, good: string, hint: string) {
  if (!v) return '';
  if (v.ok) return `<p class="fb good">${good}</p>`;
  const why = { slid: tr('미끄러졌습니다.', 'The car slid.'), tooSlow: tr('통과했지만 시간을 잃었습니다.', 'Through, but you lost time.'), tooHigh: tr('너무 높습니다.', 'Too high.'), tooLow: tr('너무 낮습니다.', 'Too low.'), invalid: tr('양수를 입력해 주세요.', 'Enter a positive number.'), wantedNoLimit: tr('이 코너는 다릅니다.', 'This corner is different.'), pass: '' }[v.reason];
  return `<p class="fb bad">${why} ${v.reason === 'invalid' ? '' : hint}</p>`;
}

// 무전 숫자 답을 받는 단계의 공통 처리. 한 번 맞히면 다시 틀려도 통과 상태 유지
export function radioOn(check: (raw: string) => Verdict) {
  return { radio: (s: StepState, a?: unknown) => { const r = a as RadioAnswer; s.v = r.kind === 'number' ? check(r.raw) : { ok: false, reason: 'tooHigh' }; s.ok = s.ok || s.v.ok; } };
}
export const condLine = (g: Game) => `<p class="stats">${g.condition()}</p>`;

export const basicSteps = (g: Game): MissionStep[] => [
  { ch: CH1, title: P('드라이버의 질문', "The driver's question"),
    enter: () => g.configure({ speed: 120, radius: 80, surface: 'dry', wing: 'none', open: [] }),
    body: () => '<p>' + tr('타이어가 낼 수 있는 힘에는 한계가 있습니다. 코너를 돌려면 차를 안쪽으로 당기는 힘이 필요합니다. 필요한 힘이 낼 수 있는 힘을 넘으면 차는 바깥으로 밀려납니다.', 'Tyres can only give so much. Turning takes a force pulling the car inward. If it needs more than the tyres can give, the car slides wide.') + '</p>' },
  { ch: CH1, title: P('M1 어디까지 밟을까', 'M1 How fast is too fast'), mission: 'M1',
    enter: () => g.configure({ speed: 120, radius: 80, surface: 'dry', wing: 'none', open: ['speed', 'go'] }),
    target: () => [g.target('stage'), g.target('forces'), g.target('speed'), g.target('go')],
    gate: s => !!s.ok, waitLabel: P('코너를 통과해 보세요', 'Get through the corner'), done: s => !!s.ok,
    on: { drive: (s, d) => { s.v = judgeDrive((d as Drive).kmh, limitKmh(80, 1.6, 0)); s.ok = s.ok || s.v.ok; } },
    body: s => condLine(g) + '<p>' + tr('속도를 바꿔 가며 출발해 보세요. 한계의 5 km/h 안쪽으로 미끄러지지 않고 통과하면 성공입니다.', 'Try different speeds. Get through without sliding, within 5 km/h of the limit.') + '</p>'
      + feedback(s.v, tr('좋습니다. 막대 두 개가 거의 같아진 속도가 이 코너의 한계입니다.', 'Good. The limit is where the two bars nearly match.'), tr('막대 두 개를 비교해 보세요.', 'Compare the two bars.')) },
  { ch: CH1, title: P('M2 반지름이 두 배면', 'M2 Double the radius'), mission: 'M2', ctrl: true,
    enter: () => g.configure({ radius: 40, surface: 'dry', wing: 'none', open: ['radius'], limit: true }),
    target: () => [g.target('radius')],
    radio: { label: 'v(80) / v(40)', unit: P('배', 'times') },
    gate: s => !!s.ok, waitLabel: P('비율을 무전으로 보내세요', 'Radio in the ratio'),
    on: radioOn(raw => judgeNumber(raw, limitKmh(80, 1.6, 0) / limitKmh(40, 1.6, 0), .02)),
    body: s => condLine(g) + '<p>' + tr('반지름을 40 m와 80 m로 바꿔 그립 한계를 읽고, 80 m의 한계를 40 m의 한계로 나눈 값을 소수로 보내세요.', 'Set the radius to 40 m and 80 m, read the grip limits, then send the 80 m limit divided by the 40 m limit as a decimal.') + '</p>'
      + feedback(s.v, tr('맞습니다.', 'Right.'), tr('v(80)을 v(40)으로 나눕니다.', 'Divide v(80) by v(40).')) },
  { ...quizStep({ ch: CH1, title: P('M2 왜 두 배가 아닐까', 'M2 Why not double?'),
    quiz: { q: P('최대 속도 v와 반지름 r의 관계는?', 'How does the top speed v relate to the radius r?'),
      options: [P('v는 r에 비례', 'v is proportional to r'), P('v는 r의 제곱근에 비례', 'v is proportional to the square root of r'), P('v는 r의 제곱에 비례', 'v is proportional to r squared')], answer: 1,
      explain: P('반지름이 2배면 속도는 약 1.41배입니다.', 'Twice the radius gives about 1.41 times the speed.'), hint: P('2배가 약 1.41배가 되는 관계를 찾아보세요.', 'Which relation turns 2 into about 1.41?') } }),
    mission: 'M2', done: s => !!s.ok },
  { ch: CH2, title: P('힘의 균형에서 식 얻기', 'From balance to a formula'),
    enter: () => g.configure({ radius: 80, surface: 'wet', wing: 'none', open: [] }),
    body: () => '<p>' + tr('한계에서는 필요한 힘과 낼 수 있는 힘이 같습니다.', 'At the limit, the force needed equals the force available.') + '</p>'
      + math(frac(row(mi('m'), sup(mi('v'), mn(2))), mi('r')), mo('='), mi('μ'), mi('m'), mi('g'))
      + '<p>' + tr('양변을 m으로 나누면 질량이 사라지고, v에 대해 풀면 다음 식이 됩니다.', 'Divide both sides by m and the mass cancels. Solving for v gives:') + '</p>'
      + math(mi('v'), mo('='), root(mi('μ'), mi('g'), mi('r'))) + '<p>' + tr('v는 m/s입니다. 3.6을 곱하면 km/h가 됩니다.', 'That is v in m/s. Multiply by 3.6 for km/h.') + '</p>' },
  { ch: CH2, title: P('M3 비가 온다', 'M3 Rain'), mission: 'M3', ctrl: true,
    enter: () => g.configure({ radius: 80, surface: 'wet', wing: 'none', open: [] }),
    radio: { label: P('최대 속도', 'Top speed'), unit: 'km/h' },
    gate: s => !!s.ok, waitLabel: P('속도를 무전으로 보내세요', 'Radio in the speed'), done: s => !!s.ok,
    on: radioOn(raw => judgeNumber(raw, limitKmh(80, 1, 0), 2)),
    body: s => condLine(g) + '<p>' + tr('비가 와서 노면이 젖었습니다. 식으로 최대 속도를 계산해 km/h로 보내세요.', 'It is raining and the track is wet. Work out the top speed and send it in km/h.') + '</p>'
      + feedback(s.v, tr('맞습니다. 마찰계수가 줄면 한계도 내려갑니다.', 'Right. Less friction, lower limit.'), tr('v = √(μgr)에 조건을 넣고 3.6을 곱합니다.', 'Put the values into v = √(μgr), then multiply by 3.6.')) },
];
