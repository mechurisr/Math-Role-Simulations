// M4~M6: 다운포스가 하는 일 → 식 풀기 → 반지름 규칙이 깨지는 이유 → 한계가 사라지는 경계. 각 미션은 상황 → 직접 보기 → 의미 → 계산 → 왜 중요한가 순서.
// 정답·풀이: kitty-specs/race-engineer-01M68BAF/answers.md
import { P, tr } from '@series/engine/i18n';
import { quizStep } from '@series/engine/tutorial';
import { frac, math, mi, mn, mo, row, sup } from '@series/engine/ui';
import { MASS } from '../model/constants';
import { judgeNumber } from '../model/judge';
import { feedback, limitKmh, radioOn, workBox } from './basic';
import type { Game, MissionStep } from './index';

const CH4 = P('4장 빠를수록 붙는다', 'Ch.4 The faster, the stickier');
const CH5 = P('5장 √2 규칙이 깨진다', 'Ch.5 The √2 rule breaks');
const CH6 = P('6장 한계가 사라질 때', 'Ch.6 When the limit disappears');
const MU = 1.6, K = 3.2;   // M4~M6 조건: 건조, 윙 높음
const SMALL = 50, BIG = 100;
const v2 = sup(mi('v'), mn(2));
const kmh1 = (r: number) => limitKmh(r, MU, K).toFixed(1);
// v²에 대해 푼 한계의 식 (answers.md 공통 식과 같은 값: μmg ÷ (m/r − μk))
export const limitFormula = () => math(v2, mo('='), frac(row(mi('μ'), mi('m'), mi('g')), row(frac(mi('m'), mi('r')), mo('−'), mi('μ'), mi('k'))));
const balance = () => math(frac(row(mi('m'), v2), mi('r')), mo('='), mi('μ'), mo('('), mi('m'), mi('g'), mo('+'), mi('k'), v2, mo(')'));

export const downforceSteps = (g: Game): MissionStep[] => [
  { ch: CH4, title: P('리어 윙이 하는 일', 'What the rear wing does'), mission: 'M4',
    enter: () => g.configure({ speed: 120, radius: 80, surface: 'dry', wing: 'none', open: [] }),
    body: () => '<p>' + tr('비행기 날개는 공기를 이용해 기체를 <b>위로</b> 들어 올립니다. 레이스카의 리어 윙은 그 날개를 뒤집은 것으로, 차를 노면 쪽 <b>아래로</b> 누릅니다. 이 힘을 <b>다운포스</b>라고 합니다.', 'An aeroplane wing uses the air to lift upward. A rear wing is that wing turned over, so it presses the car <b>down</b> onto the track. That force is called <b>downforce</b>.') + '</p>'
      + '<p>' + tr('타이어는 노면에 세게 눌릴수록 더 큰 마찰력을 냅니다. 지금까지 누르는 힘은 차의 무게 mg뿐이었는데, 여기에 다운포스가 더해집니다. 노면을 누르는 힘 전체를 <b>N</b>이라고 씁니다.', 'Tyres grip harder the harder they are pressed. So far only the weight mg pressed them down. Now downforce adds to it. The total pressing force is written <b>N</b>.') + '</p>'
      + math(mi('N'), mo('='), mi('m'), mi('g'), mo('+'), mi('k'), v2)
      + '<p>' + tr('k는 윙이 얼마나 세게 누르는지 나타내는 숫자이고, 다운포스는 속도의 제곱에 비례합니다. 윙 높음(k = 3.2)이면 100 km/h에서 약 2.5 kN이고, 200 km/h에서는 약 9.9 kN으로 차 무게 7.8 kN보다 커집니다.', 'k says how hard the wing presses, and downforce grows with the square of the speed. On high wing (k = 3.2) it is about 2.5 kN at 100 km/h and about 9.9 kN at 200 km/h, more than the 7.8 kN weight of the car.') + '</p>' },
  { ch: CH4, title: P('윙을 세워 보기', 'Raise the wing'), mission: 'M4',
    enter: () => g.configure({ speed: 120, radius: 80, surface: 'dry', wing: 'none', open: ['speed', 'wing'] }),
    target: () => [g.target('forces'), g.target('speed'), g.target('wing')],
    on: { wing: (s, w) => { if (w === 'high') s.high = true; }, speed: s => { s.moved = true; } },
    gate: s => !!(s.high && s.moved), waitLabel: P('윙을 높음으로 하고 속도를 바꿔 보세요', 'Set high wing, then change the speed'),
    body: s => '<p>' + tr('지금은 윙이 없어 파랑 막대가 12.5 kN입니다. 리어 윙을 <b>높음</b>으로 바꾼 뒤 속도를 움직이면서 파랑 막대를 보세요.', 'With no wing the blue bar is 12.5 kN. Set the rear wing to <b>High</b>, then move the speed and watch the blue bar.') + '</p>'
      + (s.high && s.moved ? '<p class="fb good">' + tr('윙이 없을 때 파랑 막대는 속도와 상관없이 그대로였습니다. 윙이 있으면 <b>빠를수록 파랑 막대가 커집니다.</b> 빠를수록 타이어가 더 세게 눌리기 때문입니다.', 'With no wing, the blue bar did not depend on speed. With a wing, <b>the faster you go, the bigger it gets</b>, because the tyres are pressed harder.') + '</p>' : '') },
  { ch: CH4, title: P('드라이버의 세 번째 질문', "The driver's third question"), mission: 'M4',
    enter: () => g.configure({ speed: 200, radius: 106, surface: 'dry', wing: 'high', open: [] }),
    target: () => [g.target('stage')],
    body: () => '<p>' + tr('드라이버: <b>"다음은 반지름 106 m 고속 코너야. 윙은 높음이고. 얼마까지 돼?"</b>', 'Driver: <b>"Next is a fast corner, 106 m radius, high wing. How fast?"</b>') + '</p>'
      + '<p>' + tr('3장의 식은 쓸 수 없습니다. 그 식은 낼 수 있는 힘이 속도와 상관없을 때의 식이기 때문입니다. 이제는 낼 수 있는 힘에도 v가 들어 있어서, 한계의 식 양쪽에 v²이 생깁니다.', 'The Ch.3 formula will not work. It assumes the available force does not depend on speed. Now it does, so v² appears on both sides.') + '</p>'
      + balance()
      + '<p>' + tr('어렵게 보이지만 v²을 x 같은 한 덩어리로 보면 일차방정식입니다. 숫자로 먼저 풀어 보겠습니다.', 'It looks hard, but treat v² as one block, like x, and it is a linear equation. Let us do one with numbers first.') + '</p>' },
  { ch: CH4, title: P('풀이 예시: 반지름 80 m', 'Worked example: 80 m radius'), mission: 'M4',
    enter: () => g.configure({ speed: 180, radius: 80, surface: 'dry', wing: 'high', open: [] }),
    body: () => '<p>' + tr('건조(μ = 1.6), 윙 높음(k = 3.2), r = 80 m입니다.', 'Dry (μ = 1.6), high wing (k = 3.2), r = 80 m.') + '</p>'
      + '<table>'
      + `<tr><td>1</td><td>${tr('양쪽을 v²의 덩어리로 정리합니다', 'Sort it into v² terms')}<br>v²(m/r − μk) = μmg</td></tr>`
      + `<tr><td>2</td><td>m/r = 800 ÷ 80 = 10<br>μk = 1.6 × 3.2 = 5.12</td></tr>`
      + `<tr><td>3</td><td>μmg = 1.6 × 800 × 9.8 = 12544</td></tr>`
      + `<tr><td>4</td><td>v²(10 − 5.12) = 12544<br>v² = 12544 ÷ 4.88 ≈ 2570.5</td></tr>`
      + `<tr><td>5</td><td>v = √2570.5 ≈ 50.7 m/s<br>50.7 × 3.6 ≈ 182.5 km/h</td></tr></table>`
      + '<p>' + tr('윙이 없을 때 이 코너의 한계는 127.5 km/h였습니다. 같은 코너가 약 55 km/h나 빨라졌습니다.', 'With no wing this corner was 127.5 km/h. The same corner is now about 55 km/h faster.') + '</p>' },
  { ch: CH4, title: P('M4 빠를수록 붙는다', 'M4 The faster, the stickier'), mission: 'M4', ctrl: true,
    enter: () => g.configure({ radius: 106, surface: 'dry', wing: 'high', open: [] }),
    radio: { label: P('반지름 106 m의 그립 한계', 'Grip limit at 106 m'), unit: 'km/h' },
    gate: s => !!s.ok, waitLabel: P('속도를 무전으로 보내세요', 'Radio in the speed'),
    on: radioOn(raw => judgeNumber(raw, limitKmh(106, MU, K), 3)),
    body: s => '<p>' + tr('풀이 예시와 같은 순서로 r = 106 m를 풀어 드라이버에게 보내세요. 달라지는 것은 m/r뿐입니다.', 'Follow the same steps for r = 106 m and send it to the driver. Only m/r changes.') + '</p>' + workBox(g, limitFormula(), ['v', 'mu', 'm', 'g', 'k', 'r'])
      + feedback(s.v, tr('맞습니다. 약 258.8 km/h입니다.', 'Right, about 258.8 km/h.'), tr('m/r = 800 ÷ 106 ≈ 7.55입니다. 여기서 5.12를 뺀 값으로 12544를 나눕니다.', 'm/r = 800 ÷ 106 ≈ 7.55. Subtract 5.12, then divide 12544 by that.')) },
  { ch: CH4, title: P('M4 그래프로 보기', 'M4 See it on a graph'), mission: 'M4',
    enter: () => g.configure({ radius: 106, surface: 'dry', wing: 'high', open: [], limit: true, graph: true }),
    target: () => [g.target('forces')],
    body: () => '<p>' + tr('가로축은 속도, 세로축은 힘입니다. <span class="o">주황</span>은 필요한 힘, <span class="bl">파랑</span>은 낼 수 있는 힘입니다. 두 곡선이 만나는 점이 방금 구한 답입니다. 그 왼쪽은 파랑이 위라서 안전하고, 오른쪽은 주황이 위라서 미끄러집니다.', 'Across is speed, up is force. <span class="o">Orange</span> is the force needed, <span class="bl">blue</span> the force available. They cross at the answer you just found. To the left, blue is on top and the car holds. To the right, orange is on top and it slides.') + '</p>'
      + '<p>' + tr('두 힘이 모두 v²의 일차식이라 만나는 점은 많아야 하나입니다.', 'Both forces are linear in v², so they cross at most once.') + '</p>' },
  { ch: CH4, title: P('M4 이 숫자가 뜻하는 것', 'M4 What the number means'), mission: 'M4',
    enter: () => g.configure({ radius: 106, surface: 'dry', wing: 'high', open: [] }),
    done: () => true,
    body: () => '<p>' + tr('같은 코너가 윙 없이는 146.8 km/h, 윙을 세우면 258.8 km/h입니다. 약 1.76배입니다. 레이스카에 큰 윙을 다는 이유입니다.', 'The same corner is 146.8 km/h with no wing and 258.8 km/h with high wing, about 1.76 times. That is why race cars carry big wings.') + '</p>'
      + '<p>' + tr('258.8 km/h로 돌면 옆으로 받는 가속도는 약 5 g입니다. 1 g는 중력가속도 9.8 m/s²이니, 몸무게의 약 5배로 옆으로 눌리는 셈입니다. 스즈카 1번 코너의 공개 자료(260 km/h 초과, 5 g 초과)와 비슷한데, 반지름을 그 자료에서 거꾸로 계산하고 값을 맞춘 게임 모델이기 때문입니다.', 'At 258.8 km/h the sideways acceleration is about 5 g. 1 g is gravity, 9.8 m/s², so the driver is pushed sideways with about five times their body weight. It is close to published Suzuka Turn 1 figures (over 260 km/h, over 5 g) because the radius was back-calculated from them and the game values were tuned to fit.') + '</p>' },
  { ch: CH5, title: P('드라이버의 네 번째 질문', "The driver's fourth question"), mission: 'M5',
    enter: () => g.configure({ radius: SMALL, surface: 'dry', wing: 'high', open: [] }),
    on: { quiz: (s, i) => { s.picked = i; } },
    gate: s => s.picked != null, waitLabel: P('예상을 골라 보세요', 'Pick your guess'),
    body: s => '<p>' + tr('드라이버: <b>"반지름이 두 배면 속도는 1.41배라고 했지? 윙을 세워도 똑같겠네?"</b>', 'Driver: <b>"You said twice the radius means 1.41 times the speed. Same with the wing up, right?"</b>') + '</p>'
      + '<p>' + tr('2장의 규칙이 윙을 세워도 맞을까요? 먼저 예상해 보세요.', 'Does the Ch.2 rule still hold with the wing up? Guess first.') + '</p>'
      + '<div class="quiz">' + [tr('똑같이 약 1.41배', 'Still about 1.41 times'), tr('1.41배보다 크다', 'More than 1.41 times'), tr('1.41배보다 작다', 'Less than 1.41 times')].map((t, i) => `<button data-q="${i}" class="${s.picked === i ? 'right' : ''}">${t}</button>`).join('') + '</div>'
      + (s.picked != null ? '<p>' + tr('좋습니다. 재 봅시다.', 'Good. Let us measure.') + '</p>' : '') },
  { ch: CH5, title: P('두 코너 재기', 'Measure both corners'), mission: 'M5',
    enter: s => { s.seen = { [SMALL]: true }; g.configure({ radius: SMALL, surface: 'dry', wing: 'high', open: [], limit: true }); },
    target: () => [g.target('stage')],
    on: { act: (s, a) => { const r = a === 'big' ? BIG : SMALL; g.configure({ radius: r, surface: 'dry', wing: 'high', open: [], limit: true }); s.seen[r] = true; } },
    gate: s => !!(s.seen?.[SMALL] && s.seen?.[BIG]), waitLabel: P('두 코너를 모두 눌러 보세요', 'Try both corners'),
    body: s => '<p>' + tr('윙 높음입니다. 버튼으로 코너를 바꿔 가며 한계를 비교하세요.', 'High wing. Switch corners and compare the limits.') + '</p>'
      + `<p class="corner-btns"><button class="act" data-act="small">${tr('급한 코너', 'Tight corner')} ${SMALL} m</button><button class="act" data-act="big">${tr('완만한 코너', 'Gentle corner')} ${BIG} m</button></p>`
      + `<table><tr><td>${tr('반지름', 'Radius')}</td><td>${tr('그립 한계', 'Grip limit')}</td></tr>`
      + [SMALL, BIG].map(r => `<tr><td>${r} m</td><td>${s.seen?.[r] ? kmh1(r) + ' km/h' : '?'}</td></tr>`).join('') + '</table>' },
  { ch: CH5, title: P('M5 몇 배 빨라졌나요?', 'M5 How many times faster?'), mission: 'M5', ctrl: true,
    enter: () => g.configure({ radius: BIG, surface: 'dry', wing: 'high', open: [] }),
    radio: { label: P('완만한 코너 한계 ÷ 급한 코너 한계', 'Gentle limit ÷ tight limit'), unit: P('배', 'times') },
    gate: s => !!s.ok, waitLabel: P('몇 배인지 무전으로 보내세요', 'Radio in how many times'),
    on: radioOn(raw => judgeNumber(raw, limitKmh(BIG, MU, K) / limitKmh(SMALL, MU, K), .02)),
    body: s => `<p>${tr('2장에서는 1.41배였습니다.', 'In Ch.2 it was 1.41 times.')}</p><p>${kmh1(BIG)} ÷ ${kmh1(SMALL)} = ?</p><p class="small">` + tr('소수 둘째 자리까지 보내세요.', 'Send two decimal places.') + '</p>'
      + feedback(s.v, tr('약 <b>1.94배</b>입니다. 1.41배가 아닙니다.', 'About <b>1.94 times</b>, not 1.41.'), tr('완만한 코너의 한계를 급한 코너의 한계로 나눕니다.', 'Divide the gentle limit by the tight limit.')) },
  { ...quizStep({ ch: CH5, title: P('M5 왜 규칙이 달라졌나요', 'M5 Why did the rule change?'),
    intro: () => '<p>' + tr('완만한 코너에서는 더 빨리 달립니다. 더 빨리 달리면 다운포스가 커지고, 타이어가 더 세게 눌려 또 더 빨리 달릴 수 있습니다. 반지름을 키운 효과에 이 덤이 붙습니다.', 'A gentler corner is taken faster. Faster means more downforce, which presses the tyres harder and allows more speed still. That bonus adds to the effect of the bigger radius.') + '</p>',
    quiz: { q: P('그래서 이 비율은 M2의 비율과 비교해 어떤가요?', 'So how does this ratio compare with the one in M2?'),
      options: [P('M2의 비율보다 크다', 'Larger than in M2'), P('M2의 비율과 같다', 'The same as in M2'), P('M2의 비율보다 작다', 'Smaller than in M2')], answer: 0,
      explain: P('√2 규칙은 다운포스가 없을 때만 맞습니다. 윙을 세우면 코너마다 4장의 식으로 다시 계산해야 합니다. 규칙을 쓸 때는 어떤 조건에서 나온 규칙인지 확인해야 합니다.', 'The √2 rule only holds with no downforce. With the wing up, each corner needs the Ch.4 equation. Always check what a rule assumed before using it.'), hint: P('M2의 비율은 약 1.41이었습니다.', 'The ratio in M2 was about 1.41.') } }),
    mission: 'M5', done: s => !!s.ok },
  { ch: CH6, title: P('이상한 계산 결과', 'A strange result'), mission: 'M6',
    enter: () => g.configure({ radius: 200, surface: 'dry', wing: 'high', open: [] }),
    target: () => [g.target('stage')],
    body: () => '<p>' + tr('다음은 아주 완만한 반지름 200 m 코너입니다. 4장의 방법대로 계산하면 m/r = 800 ÷ 200 = 4이고, μk는 5.12입니다.', 'Next is a very gentle corner, 200 m radius. By the Ch.4 method, m/r = 800 ÷ 200 = 4, and μk is 5.12.') + '</p>'
      + '<p>' + tr('v²(4 − 5.12) = 12544, 즉 <b>v²이 음수</b>가 됩니다. 제곱해서 음수가 되는 속도는 없습니다. 계산이 틀린 걸까요?', 'v²(4 − 5.12) = 12544, so <b>v² comes out negative</b>. No speed squares to a negative number. Did the sum go wrong?') + '</p>'
      + '<p>' + tr('틀린 것이 아닙니다. 다음 단계에서 이유를 봅시다.', 'It did not. Let us see why.') + '</p>' },
  { ch: CH6, title: P('두 힘의 달리기', 'A race between two forces'), mission: 'M6',
    enter: () => g.configure({ radius: 200, surface: 'dry', wing: 'high', open: [] }),
    body: () => '<p>' + tr('속도가 오를 때 두 힘이 얼마나 빨리 늘어나는지 비교해 봅시다.', 'Compare how quickly each force grows as speed rises.') + '</p>'
      + '<table>'
      + `<tr><td></td><td>${tr('v²이 1 늘 때 늘어나는 힘', 'Growth per unit of v²')}</td></tr>`
      + `<tr><td><span class="o">${tr('필요한 힘', 'Needed')}</span></td><td>m/r</td></tr>`
      + `<tr><td><span class="bl">${tr('낼 수 있는 힘', 'Available')}</span></td><td>μk</td></tr></table>`
      + '<p>' + tr('낼 수 있는 힘은 처음에 μmg만큼 앞서 있습니다. 필요한 힘이 더 빨리 늘어야 언젠가 따라잡습니다. r = 100 m면 8 대 5.12라 따라잡지만, r = 200 m면 4 대 5.12라 <b>영원히 따라잡지 못합니다.</b>', 'Available force starts ahead by μmg. Needed force must grow faster to ever catch up. At r = 100 m it is 8 against 5.12, so it catches up. At r = 200 m it is 4 against 5.12, so it <b>never catches up.</b>') + '</p>' },
  { ch: CH6, title: P('M6 교점이 사라지는 것 보기', 'M6 Watch the crossing disappear'), mission: 'M6',
    enter: () => g.configure({ radius: 100, surface: 'dry', wing: 'high', open: ['radius'], limit: true, graph: true }),
    target: () => [g.target('forces'), g.target('radius')],
    on: { setup: (s, kind) => { if (kind === 'aboveTopSpeed') s.above = true; if (kind === 'none') s.none = true; } },
    gate: s => !!(s.above && s.none), waitLabel: P('반지름을 끝까지 키워 보세요', 'Keep increasing the radius'),
    body: s => '<p>' + tr('반지름을 키우며 교점이 오른쪽으로 달아나는 것을 보세요. 그리고 아래 두 상태가 어떻게 다른지 보세요.', 'Increase the radius and watch the crossing run away to the right. See how these two states differ.') + '</p>'
      + '<table><tr><td>' + tr('그립 한계 > 최고 속도', 'Grip limit > top speed') + (s.above ? ' ✓' : '') + '</td><td>' + tr('한계는 있지만 차가 그 속도까지 못 갑니다', 'A limit exists, but the car cannot reach it') + '</td></tr>'
      + '<tr><td>' + tr('한계 없음', 'No limit') + (s.none ? ' ✓' : '') + '</td><td>' + tr('아무리 빨라도 필요한 힘이 낼 수 있는 힘을 넘지 못합니다', 'However fast, the force needed never passes the force available') + '</td></tr></table>' },
  { ch: CH6, title: P('풀이 예시: 경계 찾기', 'Worked example: finding the boundary'), mission: 'M6',
    enter: () => g.configure({ radius: 200, surface: 'dry', wing: 'mid', open: [] }),
    body: () => '<p>' + tr('경계는 두 힘이 똑같은 빠르기로 늘어나는 곳, 즉 m/r = μk인 곳입니다. r에 대해 풀면 r = m ÷ (μk)입니다.', 'The boundary is where both forces grow at the same rate, m/r = μk. Solving for r gives r = m ÷ (μk).') + '</p>'
      + '<p>' + tr('윙 중간(k = 1.6)이면 μk = 1.6 × 1.6 = 2.56이고, r = 800 ÷ 2.56 = 312.5 m입니다. 반지름이 이보다 크면 한계가 없습니다.', 'With medium wing (k = 1.6), μk = 1.6 × 1.6 = 2.56, and r = 800 ÷ 2.56 = 312.5 m. Any radius above that has no limit.') + '</p>' },
  { ch: CH6, title: P('M6 경계 반지름', 'M6 The boundary radius'), mission: 'M6', ctrl: true,
    enter: () => g.configure({ radius: 100, surface: 'dry', wing: 'high', open: [] }),
    radio: { label: P('윙 높음의 경계 반지름', 'Boundary radius on high wing'), unit: 'm' },
    gate: s => !!s.ok, waitLabel: P('반지름을 무전으로 보내세요', 'Radio in the radius'),
    on: radioOn(raw => judgeNumber(raw, MASS / (MU * K), 2)),
    body: s => '<p>' + tr('이번에는 윙 높음입니다. 경계 반지름을 구해 보내세요.', 'Now high wing. Find the boundary radius and send it.') + '</p>' + workBox(g, math(mi('r'), mo('='), frac(mi('m'), row(mi('μ'), mi('k')))), ['r', 'm', 'mu', 'k'])
      + feedback(s.v, tr('맞습니다. 156.25 m입니다.', 'Right, 156.25 m.'), tr('r = m ÷ (μk)입니다. 여기서 μk = 5.12입니다.', 'r = m ÷ (μk). Here μk = 5.12.')) },
  { ch: CH6, title: P('M6 이 숫자가 뜻하는 것', 'M6 What the number means'), mission: 'M6',
    enter: () => g.configure({ radius: 200, surface: 'dry', wing: 'high', open: [] }),
    done: () => true,
    body: () => '<p>' + tr('이 조건에서 반지름이 156.25 m 이상인 코너는 그립이 속도를 제한하지 않습니다. 드라이버에게 <b>"플랫아웃"</b>, 곧 가속 페달을 끝까지 밟고 지나가도 된다고 말할 수 있습니다.', 'Under these conditions, any corner of 156.25 m or more is not limited by grip. You can tell the driver <b>"flat out"</b>, meaning full throttle all the way through.') + '</p>'
      + '<p>' + tr('고다운포스 차가 고속 코너를 풀 스로틀로 지나는 것도 이런 원리입니다. 다만 이 모델은 타이어의 하중 민감도를 뺐기 때문에 실제보다 한계가 쉽게 사라집니다.', 'High-downforce cars take fast corners at full throttle for this reason. This model leaves out tyre load sensitivity, though, so the limit disappears more easily than in reality.') + '</p>' },
];
