// M1~M3: 왜 힘이 필요한가 → 한계 체험 → 반지름의 의미 → 식으로 계산. 각 미션은 상황 → 직접 보기 → 의미 → 계산 → 왜 중요한가 순서.
// 정답·풀이: kitty-specs/race-engineer-01M68BAF/answers.md
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
const CH1 = P('1장 코너에서 벌어지는 일', 'Ch.1 What happens in a corner');
const CH2 = P('2장 반지름이 두 배인 코너', 'Ch.2 Twice the radius');
const CH3 = P('3장 식으로 계산하기', 'Ch.3 Working it out');

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
const v2 = sup(mi('v'), mn(2));
const NARROW = 40, WIDE = 80;
const kmh1 = (r: number) => limitKmh(r, 1.6, 0).toFixed(1);

export const basicSteps = (g: Game): MissionStep[] => [
  { ch: CH1, title: P('드라이버의 질문', "The driver's question"),
    enter: () => g.configure({ speed: 120, radius: 80, surface: 'dry', wing: 'none', open: [] }),
    target: () => [g.target('stage')],
    body: () => '<p>' + tr('당신은 레이스 엔지니어입니다. 코너를 앞두고 드라이버가 무전으로 묻습니다. <b>"얼마까지 밟아도 돼?"</b>', 'You are the race engineer. Before a corner your driver asks over the radio, <b>"How fast can I take it?"</b>') + '</p>'
      + '<p>' + tr('너무 빠르면 차가 코너 밖으로 밀려나고, 너무 느리면 시간을 잃습니다. 당신의 일은 이 코너에서 가장 빠른 안전한 속도를 <b>숫자 하나</b>로 알려 주는 것입니다.', 'Too fast and the car slides off. Too slow and you lose time. Your job is to give the fastest safe speed for this corner as <b>one number</b>.') + '</p>'
      + '<p>' + tr('그 숫자를 찾으려면 먼저 코너에서 무슨 일이 벌어지는지 알아야 합니다.', 'To find that number, first look at what happens in a corner.') + '</p>' },
  { ...quizStep({ ch: CH1, title: P('코너를 돌려면 힘이 필요합니다', 'Turning takes a force'),
    intro: () => '<p>' + tr('끈에 공을 묶어 빙빙 돌린다고 생각해 보세요. 손이 끈을 <b>안쪽으로</b> 계속 당기고 있어서 공이 원을 그립니다. 이렇게 원의 중심 쪽으로 당기는 힘을 <b>구심력</b>이라고 합니다.', 'Imagine swinging a ball on a string. Your hand keeps pulling the string <b>inward</b>, so the ball travels in a circle. A force pulling toward the centre of the circle is called <b>centripetal force</b>.') + '</p>',
    quiz: { q: P('돌리던 중에 끈을 놓으면 공은 어떻게 될까요?', 'What happens to the ball if you let go of the string?'),
      options: [P('계속 원을 그린다', 'It keeps circling'), P('그 순간 가던 방향으로 곧장 날아간다', 'It flies straight on the way it was going'), P('손 쪽으로 돌아온다', 'It comes back to your hand')], answer: 1,
      explain: P('당기는 힘이 없으면 곧장 갑니다. 차도 똑같습니다.', 'With nothing pulling it, it goes straight. A car is the same.'), hint: P('당겨 주는 것이 없어지면 방향을 바꿀 이유도 없어집니다.', 'With nothing pulling, there is nothing to change its direction.') } }),
    enter: () => g.configure({ speed: 120, radius: 80, surface: 'dry', wing: 'none', open: [] }) },
  { ch: CH1, title: P('차의 끈은 타이어입니다', 'The tyres are the string'),
    enter: () => g.configure({ speed: 120, radius: 80, surface: 'dry', wing: 'none', open: [] }),
    target: () => [g.target('stage'), g.target('forces')],
    body: () => '<p>' + tr('차에는 끈이 없습니다. 차를 안쪽으로 당겨 주는 것은 <b>타이어와 노면 사이의 마찰력</b>뿐입니다. 장면의 주황 화살표가 그 힘입니다.', 'A car has no string. The only thing pulling it inward is the <b>friction between tyres and track</b>. The orange arrow in the scene is that force.') + '</p>'
      + '<p>' + tr('막대 두 개를 보세요.', 'Look at the two bars.') + '</p>'
      + '<p><span class="o">' + tr('필요한 힘', 'Force needed') + '</span>: ' + tr('이 속도로 이 코너를 돌기 위해 있어야 하는 힘', 'what it takes to get round this corner at this speed') + '<br><span class="bl">' + tr('낼 수 있는 힘', 'Force available') + '</span>: ' + tr('타이어가 낼 수 있는 가장 큰 힘', 'the most the tyres can give') + '</p>'
      + '<p>' + tr('주황이 파랑을 넘으면 끈이 끊긴 것과 같습니다. 차는 곧장 바깥으로 나갑니다.', 'If orange passes blue, the string has snapped. The car goes straight off.') + '</p>' },
  { ch: CH1, title: P('속도를 두 배로 하면', 'Double the speed'),
    enter: () => g.configure({ speed: 60, radius: 80, surface: 'dry', wing: 'none', open: ['speed'] }),
    target: () => [g.target('forces'), g.target('speed')],
    on: { speed: (s, v) => { if ((v as number) >= 115 && (v as number) <= 125) s.ok = true; } },
    gate: s => !!s.ok, waitLabel: P('속도를 120 근처로 올려 보세요', 'Raise the speed to about 120'),
    body: s => '<p>' + tr('지금 60 km/h에서 필요한 힘은 약 2.8 kN입니다. 속도를 두 배인 120 km/h 근처로 올리면서 주황 막대를 보세요.', 'At 60 km/h the force needed is about 2.8 kN. Raise the speed to about double, 120 km/h, and watch the orange bar.') + '</p>'
      + (s.ok ? '<p class="fb good">' + tr('두 배가 아니라 약 <b>4배</b>인 11.1 kN 근처가 됩니다. 필요한 힘은 속도의 <b>제곱</b>으로 늘어납니다. 그래서 코너에서는 속도가 조금만 높아도 위험합니다.', 'Not double but about <b>four times</b>, near 11.1 kN. The force needed grows with the <b>square</b> of the speed, which is why a little extra speed is dangerous in a corner.') + '</p>' : '') },
  { ch: CH1, title: P('M1 어디까지 밟을까', 'M1 How fast is too fast'), mission: 'M1',
    enter: () => g.configure({ speed: 120, radius: 80, surface: 'dry', wing: 'none', open: ['speed', 'go'] }),
    target: () => [g.target('stage'), g.target('forces'), g.target('speed'), g.target('go')],
    gate: s => !!s.ok, waitLabel: P('코너를 통과해 보세요', 'Get through the corner'), done: s => !!s.ok,
    on: { drive: (s, d) => { s.v = judgeDrive((d as Drive).kmh, limitKmh(80, 1.6, 0)); s.ok = s.ok || s.v.ok; } },
    body: s => '<p>' + tr('이제 드라이버의 질문에 답을 찾아봅시다. 속도를 바꿔 가며 <b>출발</b>을 눌러 보세요. 주황 막대가 파랑을 넘으면 밀려납니다. 한계에서 5 km/h 이내로, 미끄러지지 않고 통과하면 성공입니다.', 'Now look for the answer. Change the speed and press <b>Go</b>. If orange passes blue, the car slides. Get through without sliding, within 5 km/h of the limit.') + '</p>'
      + feedback(s.v, tr('성공입니다.', 'Well done.'), tr('막대 두 개가 거의 같아지는 속도를 찾아보세요.', 'Look for the speed where the two bars almost match.')) },
  { ch: CH1, title: P('이 숫자가 뜻하는 것', 'What the number means'),
    enter: () => g.configure({ speed: 127, radius: 80, surface: 'dry', wing: 'none', open: [], limit: true }),
    target: () => [g.target('forces')],
    body: () => '<p>' + tr('두 막대가 똑같아지는 약 <b>127.5 km/h</b>가 이 코너의 <b>그립 한계</b>입니다. 그립은 타이어가 노면을 붙잡는 힘을 말합니다.', 'The speed where the bars match, about <b>127.5 km/h</b>, is the <b>grip limit</b> of this corner. Grip means how hard the tyres can hold the track.') + '</p>'
      + '<p>' + tr('드라이버에게 "127까지 밟아도 돼"라고 말할 수 있습니다. 128이면 코너 밖으로 나가고, 110이면 안전하지만 매 코너 시간을 잃습니다.', 'You can tell your driver, "Up to 127." At 128 the car goes off, and at 110 it is safe but loses time in every corner.') + '</p>' },
  { ch: CH2, title: P('드라이버의 두 번째 질문', "The driver's second question"), mission: 'M2',
    enter: () => g.configure({ radius: NARROW, surface: 'dry', wing: 'none', open: [] }),
    on: { quiz: (s, i) => { s.picked = i; } },
    gate: s => s.picked != null, waitLabel: P('예상을 골라 보세요', 'Pick your guess'),
    body: s => '<p>' + tr('드라이버: <b>"다음 코너는 아까 그 급한 코너보다 반지름이 두 배래. 훨씬 완만하네. 그럼 두 배 빠르게 가도 되지?"</b>', 'Driver: <b>"The next corner has twice the radius of that tight one, so it is much gentler. I can go twice as fast, right?"</b>') + '</p>'
      + '<p>' + tr('틀린다면 차가 코너 밖으로 나갑니다. 계산하기 전에 먼저 예상해 보세요. 틀려도 괜찮습니다.', 'If that is wrong, the car goes off. Guess before you calculate. It is fine to be wrong.') + '</p>'
      + '<div class="quiz">' + [tr('네, 두 배 빨라도 된다', 'Yes, twice as fast'), tr('두 배보다 덜 빨라야 한다', 'Less than twice as fast'), tr('두 배보다 더 빨라도 된다', 'More than twice as fast')].map((t, i) => `<button data-q="${i}" class="${s.picked === i ? 'right' : ''}">${t}</button>`).join('') + '</div>'
      + (s.picked != null ? '<p>' + tr('좋습니다. 이제 직접 재서 확인해 봅시다.', 'Good. Now measure it.') + '</p>' : '') },
  { ch: CH2, title: P('두 코너의 한계 재기', 'Measure both corners'), mission: 'M2',
    enter: s => { s.seen = {}; g.configure({ radius: NARROW, surface: 'dry', wing: 'none', open: [], limit: true }); s.seen[NARROW] = true; },
    target: () => [g.target('stage')],
    on: { act: (s, a) => { const r = a === 'wide' ? WIDE : NARROW; g.configure({ radius: r, surface: 'dry', wing: 'none', open: [], limit: true }); s.seen[r] = true; } },
    gate: s => !!(s.seen?.[NARROW] && s.seen?.[WIDE]), waitLabel: P('두 코너를 모두 눌러 보세요', 'Try both corners'),
    body: s => '<p>' + tr('버튼으로 코너를 바꿔 가며 장면의 곡선과 한계 속도를 비교하세요.', 'Switch corners with the buttons and compare the curve and the limit.') + '</p>'
      + `<p class="corner-btns"><button class="act" data-act="narrow">${tr('급한 코너', 'Tight corner')} ${NARROW} m</button><button class="act" data-act="wide">${tr('완만한 코너', 'Gentle corner')} ${WIDE} m</button></p>`
      + `<table><tr><td>${tr('반지름', 'Radius')}</td><td>${tr('그립 한계', 'Grip limit')}</td></tr>`
      + [NARROW, WIDE].map(r => `<tr><td>${r} m</td><td>${s.seen?.[r] ? kmh1(r) + ' km/h' : '?'}</td></tr>`).join('') + '</table>'
      + '<p class="small">' + tr('반지름은 코너를 원의 일부로 봤을 때 그 원의 반지름입니다. 도로 폭과는 상관없습니다. 클수록 완만하고, 작을수록 급한 코너입니다.', 'The radius is that of the circle the corner is part of. It has nothing to do with how wide the road is. Bigger is gentler, smaller is tighter.') + '</p>' },
  { ch: CH2, title: P('M2 몇 배 빨라졌나요?', 'M2 How many times faster?'), mission: 'M2', ctrl: true,
    enter: () => g.configure({ radius: WIDE, surface: 'dry', wing: 'none', open: [] }),
    radio: { label: P('완만한 코너 한계 ÷ 급한 코너 한계', 'Gentle limit ÷ tight limit'), unit: P('배', 'times') },
    gate: s => !!s.ok, waitLabel: P('몇 배인지 무전으로 보내세요', 'Radio in how many times'),
    on: radioOn(raw => judgeNumber(raw, limitKmh(WIDE, 1.6, 0) / limitKmh(NARROW, 1.6, 0), .02)),
    body: s => '<p>' + tr(`반지름은 ${NARROW} m에서 ${WIDE} m로 정확히 2배가 됐습니다. 속도 한계는 몇 배가 됐을까요? 이 값이 2면 드라이버 말이 맞습니다.`, `The radius went from ${NARROW} m to ${WIDE} m, exactly 2 times. How many times did the speed limit grow? If the answer is 2, the driver is right.`) + '</p>'
      + `<p>${kmh1(WIDE)} ÷ ${kmh1(NARROW)} = ?</p><p class="small">` + tr('계산기를 써도 됩니다. 소수 둘째 자리까지 보내세요.', 'Use a calculator if you like. Send two decimal places.') + '</p>'
      + feedback(s.v, tr('약 <b>1.41배</b>입니다. 2배가 아닙니다.', 'About <b>1.41 times</b>, not 2.'), tr('완만한 코너의 한계를 급한 코너의 한계로 나눕니다.', 'Divide the gentle limit by the tight limit.')) },
  { ch: CH2, title: P('M2 드라이버에게 뭐라고 할까요', 'M2 What do you tell the driver?'), mission: 'M2',
    enter: () => g.configure({ radius: WIDE, surface: 'dry', wing: 'none', open: [] }),
    body: () => '<p>' + tr(`드라이버 말대로 두 배면 ${(limitKmh(NARROW, 1.6, 0) * 2).toFixed(0)} km/h입니다. 실제 한계는 ${kmh1(WIDE)} km/h입니다. 믿고 달렸다면 차는 코너 밖으로 나갑니다.`, `Twice the speed would be ${(limitKmh(NARROW, 1.6, 0) * 2).toFixed(0)} km/h. The real limit is ${kmh1(WIDE)} km/h. Had the driver believed it, the car would be off the track.`) + '</p>'
      + '<p>' + tr('<b>왜 그럴까요?</b> 앞에서 필요한 힘은 속도의 <b>제곱</b>으로 늘어난다고 했습니다. 반지름이 2배면 필요한 힘은 절반이라, 낼 수 있는 힘은 그대로이니 <b>속도의 제곱</b>을 2배로 늘릴 여유가 생깁니다.', '<b>Why?</b> The force needed grows with the <b>square</b> of the speed. Double the radius halves that force, so with the same tyres you can double the <b>speed squared</b>.') + '</p>'
      + '<p>' + tr('제곱해서 2가 되는 수가 약 1.41입니다. 1.41 × 1.41 ≈ 2. 이 수를 √2라고 씁니다. 그래서 속도는 1.41배만 빨라집니다.', 'The number that squares to 2 is about 1.41: 1.41 × 1.41 ≈ 2. It is written √2. So the speed only grows 1.41 times.') + '</p>' },
  { ...quizStep({ ch: CH2, title: P('M2 다른 코너에 써먹기', 'M2 Use it on another corner'),
    intro: () => '<p>' + tr(`다음 코너는 반지름이 다시 두 배인 160 m입니다. ${WIDE} m의 한계는 ${kmh1(WIDE)} km/h였습니다.`, `The next corner doubles the radius again, to 160 m. The ${WIDE} m limit was ${kmh1(WIDE)} km/h.`) + '</p>',
    quiz: { q: P('160 m 코너의 한계는 약 얼마일까요?', 'About what is the limit of the 160 m corner?'),
      options: [P('약 128 km/h', 'About 128 km/h'), P('약 180 km/h', 'About 180 km/h'), P('약 255 km/h', 'About 255 km/h')], answer: 1,
      explain: P('127.5 × 1.41 ≈ 180입니다. 반지름이 2배면 속도는 언제나 약 1.41배입니다. 이것을 "속도는 반지름의 제곱근에 비례한다"고 말합니다.', '127.5 × 1.41 ≈ 180. Double the radius always gives about 1.41 times the speed. We say the speed is proportional to the square root of the radius.'), hint: P('2배가 아니라 1.41배를 곱해 보세요.', 'Multiply by 1.41, not by 2.') } }),
    mission: 'M2', done: s => !!s.ok },
  { ch: CH3, title: P('재지 않고 계산하기', 'Calculating instead of measuring'), mission: 'M3',
    enter: () => g.configure({ radius: 80, surface: 'dry', wing: 'none', open: [] }),
    body: () => '<p>' + tr('실제 경주에서는 미끄러질 때까지 달려 볼 수 없습니다. 달려 보기 전에 계산해야 합니다. 한계는 두 힘이 같아지는 곳이었으니, 두 힘을 식으로 쓰겠습니다.', 'In a real race you cannot test until the car slides. You have to work it out first. The limit is where the two forces match, so write both as formulas.') + '</p>'
      + '<p><span class="o">' + tr('필요한 힘', 'Force needed') + '</span>: ' + tr('무거울수록(m), 빠를수록(v²), 급한 코너일수록(r이 작을수록) 큽니다.', 'bigger with more mass (m), more speed (v²) and a tighter corner (smaller r).') + '</p>'
      + math(frac(row(mi('m'), v2), mi('r')))
      + '<p><span class="bl">' + tr('낼 수 있는 힘', 'Force available') + '</span>: ' + tr('차의 무게 mg에 마찰계수 μ를 곱합니다. μ는 타이어가 얼마나 잘 붙는지 나타내는 숫자로, 건조한 노면 1.6, 젖은 노면 1.0입니다 (게임용 값).', 'the weight mg times the friction coefficient μ. μ says how well the tyres stick: 1.6 on a dry track and 1.0 on a wet one (game values).') + '</p>'
      + math(mi('μ'), mi('m'), mi('g')) },
  { ch: CH3, title: P('두 힘을 같다고 놓기', 'Set the forces equal'), mission: 'M3',
    enter: () => g.configure({ radius: 80, surface: 'dry', wing: 'none', open: [] }),
    body: () => '<p>' + tr('한계에서는 두 힘이 같습니다.', 'At the limit the two forces match.') + '</p>'
      + math(frac(row(mi('m'), v2), mi('r')), mo('='), mi('μ'), mi('m'), mi('g'))
      + '<p>' + tr('양쪽의 m이 지워집니다. 그래서 <b>무거운 차도 가벼운 차도 한계 속도가 같습니다.</b> 양쪽에 r을 곱하고 제곱근을 씌우면 됩니다.', 'The m cancels on both sides, so <b>heavy and light cars have the same limit.</b> Multiply by r and take the square root.') + '</p>'
      + math(mi('v'), mo('='), root(mi('μ'), mi('g'), mi('r')))
      + '<p>' + tr('r에 제곱근이 씌워져 있습니다. 앞에서 반지름이 2배일 때 속도가 √2배가 된 이유가 바로 이것입니다.', 'r sits under the square root. That is exactly why doubling the radius gave √2 times the speed.') + '</p>' },
  { ch: CH3, title: P('풀이 예시: 재 본 값과 맞을까요', 'Worked example: does it match?'), mission: 'M3',
    enter: () => g.configure({ radius: 80, surface: 'dry', wing: 'none', open: [] }),
    body: () => '<p>' + tr('M1의 코너(건조, r = 80 m)로 계산해 봅시다. g는 중력가속도 9.8 m/s²입니다.', 'Try the M1 corner (dry, r = 80 m). g is gravity, 9.8 m/s².') + '</p>'
      + '<table><tr><td>1</td><td>μ × g × r = 1.6 × 9.8 × 80 = 1254.4</td></tr><tr><td>2</td><td>√1254.4 ≈ 35.4 m/s</td></tr><tr><td>3</td><td>35.4 × 3.6 ≈ 127.5 km/h</td></tr></table>'
      + '<p>' + tr('M1에서 찾은 값과 같습니다. 3.6을 곱하는 이유는 1초에 1 m를 가면 1시간(3600초)에 3.6 km를 가기 때문입니다.', 'It matches M1. We multiply by 3.6 because 1 m each second is 3.6 km each hour (3600 seconds).') + '</p>' },
  { ch: CH3, title: P('M3 비가 온다', 'M3 Rain'), mission: 'M3', ctrl: true,
    enter: () => g.configure({ radius: 80, surface: 'wet', wing: 'none', open: [] }),
    radio: { label: P('젖은 노면의 그립 한계', 'Grip limit on a wet track'), unit: 'km/h' },
    gate: s => !!s.ok, waitLabel: P('속도를 무전으로 보내세요', 'Radio in the speed'),
    on: radioOn(raw => judgeNumber(raw, limitKmh(80, 1, 0), 2)),
    body: s => '<p>' + tr('비가 내려 노면이 젖었습니다. 같은 코너지만 μ가 1.0으로 내려갔습니다. 드라이버가 다시 묻습니다. 풀이 예시와 같은 순서로 계산해 보내세요.', 'It has started to rain. Same corner, but μ is now 1.0. The driver asks again. Work it out the same way and send it.') + '</p>' + condLine(g)
      + feedback(s.v, tr('맞습니다. 약 100.8 km/h입니다.', 'Right, about 100.8 km/h.'), tr('μ × g × r의 제곱근을 구하고 3.6을 곱합니다.', 'Take the square root of μ × g × r, then multiply by 3.6.')) },
  { ch: CH3, title: P('M3 이 숫자가 뜻하는 것', 'M3 What the number means'), mission: 'M3',
    enter: () => g.configure({ radius: 80, surface: 'wet', wing: 'none', open: [] }),
    done: () => true,
    body: () => '<p>' + tr('마른 노면 한계 127.5 km/h를 그대로 믿고 달렸다면, 비 오는 날 약 27 km/h나 넘겨 코너 밖으로 나갔을 겁니다.', 'Had the driver kept to the dry limit of 127.5 km/h, the car would be about 27 km/h over in the rain and off the track.') + '</p>'
      + '<p>' + tr('엔지니어가 날씨가 바뀔 때마다 숫자를 다시 계산하는 이유입니다. 다음 장에서는 차를 노면에 눌러 주는 리어 윙을 다룹니다.', 'That is why engineers redo the numbers whenever the weather changes. Next, the rear wing that presses the car onto the track.') + '</p>' },
];
