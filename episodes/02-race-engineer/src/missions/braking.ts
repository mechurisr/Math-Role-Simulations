// M8 심화: 마찰원. 이 파일과 missions/index.ts의 한 줄을 빼도 M1~M7은 완결됨 (C-007). 풀이: answers.md M8
import { P, tr } from '@series/engine/i18n';
import { math, mi, mn, mo, root, sub, subsup, sup } from '@series/engine/ui';
import { kmhToMs } from '../model/corner';
import { maxBraking } from '../model/friction-circle';
import { judgeNumber } from '../model/judge';
import { feedback, radioOn, workBox } from './basic';
import type { Game, MissionStep } from './index';

const CH8 = P('심화 브레이크 밟으며 돌기', 'Extra Braking in the corner');
export const BRAKE_KMH = 200;
const CORNER = { radius: 106, mu: 1.6, k: 3.2 };
const SETUP = { speed: BRAKE_KMH, radius: 106, surface: 'dry', wing: 'high' } as const;
const sq = (s: string) => subsup(mi('a'), mi(s), mn(2));
const vectorLimit = () => math(root(sq('x'), mo('+'), sq('y')), mo('≤'), mi('μ'), mi('N'), mo('/'), mi('m'));

export const brakingSteps = (g: Game): MissionStep[] => [
  { ch: CH8, title: P('드라이버의 마지막 질문', "The driver's last question"), mission: 'M8',
    enter: () => g.configure({ ...SETUP, open: [] }),
    target: () => [g.target('stage')],
    body: () => '<p>' + tr('드라이버: <b>"코너를 200 km/h로 도는 중인데 앞차가 갑자기 느려졌어. 여기서 브레이크를 얼마나 밟아도 돼?"</b>', 'Driver: <b>"I am in the corner at 200 km/h and the car ahead just slowed down. How hard can I brake here?"</b>') + '</p>'
      + '<p>' + tr('직선이라면 타이어의 힘을 모두 제동에 쓸 수 있습니다. 하지만 코너에서는 차를 안쪽으로 돌리는 데 이미 타이어의 힘을 옆으로 쓰고 있습니다. 타이어의 힘은 하나의 주머니와 같아서, 코너를 도는 데 쓴 만큼 브레이크에 쓸 몫이 줄어듭니다.', 'On a straight the tyres could put all their force into braking. In a corner they are already pushing sideways to turn the car. Tyre force is like one purse: whatever goes on cornering is gone from braking.') + '</p>'
      + '<p>' + tr('너무 세게 밟으면 타이어가 미끄러져 코너 밖으로 밀려나고, 너무 약하게 밟으면 앞차에 부딪힙니다. 드라이버는 감으로 밟을 수밖에 없으니, 엔지니어가 <b>얼마까지 되는지 숫자로</b> 알려 줘야 합니다.', 'Brake too hard and the tyres slide off the track; too gently and you hit the car ahead. The driver can only go by feel, so the engineer has to give <b>a number for how much is safe</b>.') + '</p>'
      + '<p>' + tr('그러려면 옆으로 쓰는 힘과 앞뒤로 쓰는 힘을 어떻게 합치는지 알아야 합니다.', 'For that, we need to know how sideways and braking combine.') + '</p>' },
  { ch: CH8, title: P('왜 원일까요', 'Why a circle?'), mission: 'M8',
    enter: () => g.configure({ ...SETUP, open: [], circle: true }),
    target: () => [g.target('forces')],
    body: () => '<p>' + tr('이번에는 힘 대신 <b>가속도</b>로 봅니다. 3장의 필요한 힘 mv²/r을 차 질량 m으로 나누면 v²/r, 바로 옆으로 받는 가속도가 됩니다. 힘을 m으로 나누면 차의 무게와 상관없이 "속도가 얼마나 빨리 바뀌는지"만 남아서, 제동과 비교하기 쉽습니다.', 'This time we look at <b>acceleration</b> instead of force. Divide the force needed from chapter 3, mv²/r, by the car mass m and you get v²/r, the sideways acceleration. Dividing by m leaves only "how fast the velocity changes", which compares easily with braking.') + '</p>'
      + '<p>' + tr('<b>그림 읽는 법</b>: 가로축(옆 →)은 옆 가속도 a<sub>y</sub>, 세로축(제동 ↑)은 제동 가속도 a<sub>x</sub>입니다. 점 하나는 "지금 옆으로 얼마, 제동으로 얼마"를 뜻합니다.', '<b>Reading the picture</b>: the horizontal axis (Sideways →) is the sideways acceleration a<sub>y</sub>, the vertical axis (Braking ↑) is the braking acceleration a<sub>x</sub>. One dot means "this much sideways, this much braking right now".') + '</p>'
      + '<p>' + tr('두 가속도는 방향이 직각이라 그냥 더하지 않습니다. 직각인 두 화살표를 합치면 빗변이 되므로 피타고라스의 정리를 씁니다. 옆으로 4, 앞으로 3이면 합친 크기는 3 + 4 = 7이 아니라 5입니다.', 'The two are at right angles, so they do not simply add. Two arrows at right angles combine like the sides of a right triangle. Sideways 4 and forward 3 give 5, not 7.') + '</p>'
      + vectorLimit()
      + '<p>' + tr('오른쪽 μN은 4장의 <b>낼 수 있는 힘</b>(N은 무게와 다운포스가 타이어를 누르는 힘)이고, m으로 나누어 가속도로 바꿨습니다. 타이어는 어느 방향으로든 이 크기까지만 낼 수 있으니, 합친 크기가 같은 점을 모두 찍으면 파란 <b>원</b>이 됩니다. 이것이 <b>마찰원</b>입니다. 점이 원 안이면 안전하고, 원 밖이면 미끄러집니다.', 'On the right, μN is the <b>force available</b> from chapter 4 (N is weight plus downforce pressing on the tyres), divided by m to make it an acceleration. Tyres give this much in any direction, so every point with the same combined size forms the blue <b>circle</b>. This is the <b>friction circle</b>. Inside the circle is safe; outside, the car slides.') + '</p>' },
  { ch: CH8, title: P('풀이 예시: 원과 선의 값', 'Worked example: circle and line'), mission: 'M8',
    enter: () => g.configure({ ...SETUP, open: [], circle: true }),
    target: () => [g.target('forces')],
    body: () => '<p>' + tr('200 km/h ÷ 3.6 ≈ 55.6 m/s이고, v² = 55.6² ≈ 3086입니다. 이 순간의 값을 구해 봅시다.', '200 km/h ÷ 3.6 ≈ 55.6 m/s, so v² = 55.6² ≈ 3086. Work out this instant.') + '</p>'
      + '<p>' + tr('<b>원의 반지름</b>을 R이라고 부릅니다. N = mg + kv²(무게 + 다운포스)이므로 R = μN/m = μ(mg + kv²)/m = μ(g + kv²/m)입니다. m = 800 kg은 위 조건 표시의 차 질량입니다.', 'Call the <b>circle radius</b> R. N = mg + kv² (weight + downforce), so R = μN/m = μ(mg + kv²)/m = μ(g + kv²/m). m = 800 kg is the car mass shown in the conditions above.') + '</p>'
      + '<table>'
      + `<tr><td>${tr('다운포스 몫', 'Downforce part')}</td><td>kv²/m = 3.2 × 3086 ÷ 800 ≈ 12.35</td></tr>`
      + `<tr><td>${tr('원의 반지름 R', 'Circle radius R')}</td><td>1.6 × (9.8 + 12.35) ≈ 35.4</td></tr>`
      + `<tr><td>${tr('옆 가속도 a<sub>y</sub>', 'Sideways a<sub>y</sub>')}</td><td>v²/r = 3086 ÷ 106 ≈ 29.1</td></tr></table>`
      + '<p>' + tr('주황 점선은 a<sub>y</sub> = 29.1인 선입니다. 이 속도로 반지름 106 m 코너를 따라가려면 옆 가속도가 꼭 29.1이어야 하고, 이보다 작으면 차가 바깥으로 밀려납니다. 그래서 점은 이 선 위에서만 위아래로 움직입니다.', 'The orange dashed line is a<sub>y</sub> = 29.1. To follow a 106 m corner at this speed the sideways acceleration must be exactly 29.1; any less and the car runs wide. So the dot moves only up and down this line.') + '</p>'
      + '<p>' + tr('R에 다운포스가 들어 있어 속도가 바뀌면 원의 크기도 바뀝니다. 그래서 200 km/h인 <b>순간</b>만 봅니다.', 'R contains downforce, so the circle changes with speed. That is why we look only at the <b>instant</b> of 200 km/h.') + '</p>' },
  { ch: CH8, title: P('M8 남은 제동 찾기', 'M8 Find the braking left'), mission: 'M8', ctrl: true,
    enter: () => g.configure({ ...SETUP, open: [], circle: true }),
    target: () => [g.target('forces')],
    radio: { label: P('최대 제동 가속도', 'Maximum braking'), unit: 'm/s²' },
    gate: s => !!s.ok, waitLabel: P('제동 가속도를 무전으로 보내세요', 'Radio in the braking'),
    on: radioOn(raw => judgeNumber(raw, maxBraking(kmhToMs(BRAKE_KMH), CORNER)!, 1)),
    body: s => '<p>' + tr('점을 주황 선을 따라 위로 끌수록 제동이 세집니다. 원에 닿는 곳이 미끄러지지 않고 밟을 수 있는 <b>최대</b>이고, 그보다 위는 원 밖이라 미끄러집니다. 원에 닿는 곳을 찾아 그 제동 가속도를 보내세요.', 'Dragging the dot up the orange line brakes harder. Where it touches the circle is the <b>most</b> you can brake without sliding; above that is outside the circle. Find that point and send its braking.') + '</p>'
      + '<p>' + tr('계산으로도 구할 수 있습니다. 원 위의 점은 합친 크기가 R인 점이므로, 2단계 식에서 √(a<sub>x</sub>² + a<sub>y</sub>²) = R을 a<sub>x</sub>에 대해 풀면 됩니다.', 'You can also calculate it. A point on the circle has combined size R, so solve the step 2 formula √(a<sub>x</sub>² + a<sub>y</sub>²) = R for a<sub>x</sub>.') + '</p>'
      + workBox(g, math(sub(mi('a'), mi('x')), mo('='), root(sup(mi('R'), mn(2)), mo('−'), sq('y'))), ['ax', 'R', 'ay'])
      + feedback(s.v, tr('맞습니다. 약 20.2 m/s²입니다.', 'Right, about 20.2 m/s².'), tr('점 옆의 숫자를 읽어 보세요. 계산하려면 35.4² − 29.1²의 제곱근을 구합니다.', 'Read the number beside the dot. To calculate, take the square root of 35.4² − 29.1².')) },
  { ch: CH8, title: P('M8 이 숫자가 뜻하는 것', 'M8 What the number means'), mission: 'M8',
    enter: () => g.configure({ ...SETUP, open: [], circle: true }),
    target: () => [g.target('forces')],
    done: () => true,
    body: () => '<p>' + tr('같은 속도의 직선이라면 35.4까지 쓸 수 있는데, 코너 안에서는 20.2입니다. 약 57%만 남았습니다. 드라이버에게 "직선의 6할 정도로만 밟아"라고 말할 수 있습니다.', 'On a straight at this speed you could use 35.4. In the corner it is 20.2, about 57%. You can tell the driver, "About six-tenths of straight-line braking."') + '</p>'
      + '<p>' + tr('다만 이 숫자는 200 km/h인 <b>순간</b>의 값입니다. 실제로 밟으면 속도가 줄어 다운포스가 줄고 원이 작아지며, 필요한 옆 가속도도 줄어 주황 선도 함께 움직입니다. 그래서 엔지니어의 답은 "이 순간에는 이만큼"이라는 출발점입니다.', 'But this number is for the <b>instant</b> at 200 km/h. Once the driver brakes, speed drops, downforce falls and the circle shrinks, and the sideways acceleration needed drops so the orange line moves too. The engineer’s answer is a starting point: "this much, right now".') + '</p>'
      + '<p>' + tr('그래서 드라이버는 대개 코너에 들어가기 전에 브레이크를 밟습니다. 옆으로 쓰는 힘이 늘수록 제동에 쓸 몫이 줄기 때문입니다.', 'That is why drivers mostly brake before the corner. The more goes sideways, the less is left for braking.') + '</p>' },
];
