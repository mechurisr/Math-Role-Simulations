// M8 심화: 마찰원. 이 파일과 missions/index.ts의 한 줄을 빼도 M1~M7은 완결됨 (C-007). 풀이: answers.md M8
import { P, tr } from '@series/engine/i18n';
import { math, mi, mn, mo, root, subsup } from '@series/engine/ui';
import { kmhToMs } from '../model/corner';
import { maxBraking } from '../model/friction-circle';
import { judgeNumber } from '../model/judge';
import { condLine, feedback, radioOn } from './basic';
import type { Game, MissionStep } from './index';

const CH6 = P('심화 브레이크 밟으며 돌기', 'Extra Braking in the corner');
export const BRAKE_KMH = 200;
const CORNER = { radius: 106, mu: 1.6, k: 3.2 };
const sq = (s: string) => subsup(mi('a'), mi(s), mn(2));

export const brakingSteps = (g: Game): MissionStep[] => [
  { ch: CH6, title: P('M8 마찰원', 'M8 The friction circle'), mission: 'M8', ctrl: true,
    enter: () => g.configure({ speed: BRAKE_KMH, radius: 106, surface: 'dry', wing: 'high', open: [], circle: true }),
    target: () => [g.target('forces')],
    radio: { label: P('최대 제동 가속도', 'Maximum braking'), unit: 'm/s²' },
    gate: s => !!s.ok, waitLabel: P('제동 가속도를 무전으로 보내세요', 'Radio in the braking'), done: s => !!s.ok,
    on: radioOn(raw => judgeNumber(raw, maxBraking(kmhToMs(BRAKE_KMH), CORNER)!, 1)),
    body: s => condLine(g) + '<p>' + tr('속도가 200 km/h인 순간만 봅니다. 원의 반지름이 타이어의 한계이고, N = mg + kv²이라 다운포스도 포함됩니다.', 'Look only at the instant the car is at 200 km/h. The circle radius is the tyre limit, and N = mg + kv² includes downforce.') + '</p>'
      + math(root(sq('x'), mo('+'), sq('y')), mo('≤'), mi('μ'), mi('N'), mo('/'), mi('m'))
      + '<p>' + tr('횡가속도는 주황 선에 고정됩니다. 점을 위로 끌어 원에 닿는 제동 가속도를 보내세요.', 'Lateral acceleration stays on the orange line. Drag the dot up to the circle and send the braking.') + '</p>'
      + feedback(s.v, tr('맞습니다. 코너링에 쓰는 만큼 제동에 쓸 수 있는 몫이 줄어듭니다.', 'Right. Whatever cornering uses, braking cannot.'), tr('점 옆의 숫자를 읽어 보세요.', 'Read the number beside the dot.')) },
];
