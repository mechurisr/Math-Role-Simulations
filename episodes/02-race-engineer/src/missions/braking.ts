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
    body: () => '<p>' + tr('드라이버: <b>"코너를 200 km/h로 도는 중인데, 여기서 브레이크를 얼마나 밟아도 돼?"</b>', 'Driver: <b>"I am in the corner at 200 km/h. How hard can I brake here?"</b>') + '</p>'
      + '<p>' + tr('타이어의 힘은 하나의 주머니와 같습니다. 코너를 도는 데 쓴 만큼 브레이크에 쓸 몫이 줄어듭니다. 이미 옆으로 힘을 쓰고 있으니 직선에서처럼 세게 밟을 수는 없습니다.', 'Tyre force is like one purse. Whatever goes on cornering is gone from braking. The tyres are already working sideways, so you cannot brake as hard as on a straight.') + '</p>'
      + '<p>' + tr('얼마나 남았는지 계산하려면 옆으로 쓰는 힘과 앞뒤로 쓰는 힘을 어떻게 합치는지 알아야 합니다.', 'To work out what is left, we need to know how sideways and braking combine.') + '</p>' },
  { ch: CH8, title: P('왜 원일까요', 'Why a circle?'), mission: 'M8',
    enter: () => g.configure({ ...SETUP, open: [], circle: true }),
    target: () => [g.target('forces')],
    body: () => '<p>' + tr('두 힘은 방향이 달라서 그냥 더하지 않습니다. 직각인 두 화살표를 합치면 빗변이 되므로 피타고라스의 정리를 씁니다. 옆으로 4, 앞으로 3이면 합친 크기는 3 + 4 = 7이 아니라 5입니다.', 'The two point different ways, so they do not simply add. Two arrows at right angles combine like the sides of a right triangle. Sideways 4 and forward 3 give 5, not 7.') + '</p>'
      + vectorLimit()
      + '<p>' + tr('a는 가속도로, 힘을 질량으로 나눈 값입니다. a_x는 제동, a_y는 옆으로 받는 가속도입니다. 타이어는 어느 방향으로든 같은 크기까지만 낼 수 있으니, 가능한 조합을 모두 찍으면 <b>원</b>이 됩니다. 이것이 <b>마찰원</b>입니다.', 'a is acceleration, force divided by mass. a_x is braking and a_y is sideways. Tyres give the same maximum in any direction, so all possible combinations fill a <b>circle</b>. This is the <b>friction circle</b>.') + '</p>' },
  { ch: CH8, title: P('풀이 예시: 원과 선의 값', 'Worked example: circle and line'), mission: 'M8',
    enter: () => g.configure({ ...SETUP, open: [], circle: true }),
    target: () => [g.target('forces')],
    body: () => '<p>' + tr('200 km/h는 약 55.6 m/s입니다. 이 순간의 값을 구해 봅시다.', '200 km/h is about 55.6 m/s. Work out this instant.') + '</p>'
      + '<table>'
      + `<tr><td>${tr('원의 반지름', 'Circle radius')}</td><td>μ(g + kv²/m)<br>= 1.6 × (9.8 + 12.35) ≈ 35.4</td></tr>`
      + `<tr><td>${tr('옆 가속도', 'Sideways')}</td><td>v²/r = 3086 ÷ 106 ≈ 29.1</td></tr></table>`
      + '<p>' + tr('원의 반지름에 다운포스가 들어 있어 속도가 바뀌면 원의 크기도 바뀝니다. 그래서 200 km/h인 <b>순간</b>만 봅니다. 코너를 돌려면 옆 가속도는 29.1이어야 하므로 점은 주황 선 위에 있습니다.', 'Downforce is in the circle radius, so the circle changes with speed. That is why we look at the <b>instant</b> of 200 km/h. Cornering needs 29.1 sideways, so the dot stays on the orange line.') + '</p>' },
  { ch: CH8, title: P('M8 남은 제동 찾기', 'M8 Find the braking left'), mission: 'M8', ctrl: true,
    enter: () => g.configure({ ...SETUP, open: [], circle: true }),
    target: () => [g.target('forces')],
    radio: { label: P('최대 제동 가속도', 'Maximum braking'), unit: 'm/s²' },
    gate: s => !!s.ok, waitLabel: P('제동 가속도를 무전으로 보내세요', 'Radio in the braking'),
    on: radioOn(raw => judgeNumber(raw, maxBraking(kmhToMs(BRAKE_KMH), CORNER)!, 1)),
    body: s => '<p>' + tr('점을 위로 끌어 원에 닿는 곳을 찾고, 그 제동 가속도를 보내세요. 원 밖으로 나가면 미끄러집니다.', 'Drag the dot up to the circle and send that braking. Past the circle the car slides.') + '</p>'
      + workBox(g, math(sub(mi('a'), mi('x')), mo('='), root(sup(mi('R'), mn(2)), mo('−'), sq('y'))), ['ax', 'R', 'ay'])
      + feedback(s.v, tr('맞습니다. 약 20.2 m/s²입니다.', 'Right, about 20.2 m/s².'), tr('점 옆의 숫자를 읽어 보세요. 계산하려면 35.4² − 29.1²의 제곱근을 구합니다.', 'Read the number beside the dot. To calculate, take the square root of 35.4² − 29.1².')) },
  { ch: CH8, title: P('M8 이 숫자가 뜻하는 것', 'M8 What the number means'), mission: 'M8',
    enter: () => g.configure({ ...SETUP, open: [], circle: true }),
    target: () => [g.target('forces')],
    done: () => true,
    body: () => '<p>' + tr('같은 속도의 직선이라면 35.4까지 쓸 수 있는데, 코너 안에서는 20.2입니다. 약 57%만 남았습니다. 드라이버에게 "직선의 6할 정도로만 밟아"라고 말할 수 있습니다.', 'On a straight at this speed you could use 35.4. In the corner it is 20.2, about 57%. You can tell the driver, "About six-tenths of straight-line braking."') + '</p>'
      + '<p>' + tr('그래서 드라이버는 대개 코너에 들어가기 전에 브레이크를 밟습니다. 옆으로 쓰는 힘이 늘수록 제동에 쓸 몫이 줄기 때문입니다.', 'That is why drivers mostly brake before the corner. The more goes sideways, the less is left for braking.') + '</p>' },
];
