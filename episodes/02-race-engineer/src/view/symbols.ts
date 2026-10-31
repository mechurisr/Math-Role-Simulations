// 무전 단계의 식 상자: 식, 지금 조건, (i)를 올리거나 탭하면 펼쳐지는 기호 뜻
import { tr } from '@series/engine/i18n';
import { infoTip } from '@series/engine/ui';
import { G, MASS } from '../model/constants';

export type Sym = 'm' | 'g' | 'mu' | 'k' | 'r' | 'v' | 'ax' | 'ay' | 'R';
export interface SymValues { mu: number; k: number; radius: number }

const MEANING: Record<Sym, (c: SymValues) => [string, string]> = {
  m: () => ['m', tr(`차의 질량. 이 게임에서는 ${MASS} kg`, `Mass of the car, ${MASS} kg in this game`)],
  g: () => ['g', tr(`중력가속도. 지구가 물체를 끌어당기는 세기로 ${G} m/s². mg가 차의 무게`, `Gravity, ${G} m/s². mg is the weight of the car`)],
  mu: c => ['μ', tr(`마찰계수. 타이어가 노면에 얼마나 잘 붙는지 나타내는 숫자. 건조 1.6, 젖음 1.0. 지금 ${c.mu}`, `Friction coefficient: how well the tyres stick. Dry 1.6, wet 1.0. Now ${c.mu}`)],
  k: c => ['k', tr(`다운포스 계수. 윙이 차를 누르는 세기로, 다운포스는 kv². 없음 0, 중간 1.6, 높음 3.2. 지금 ${c.k}`, `Downforce coefficient: how hard the wing presses. Downforce is kv². None 0, medium 1.6, high 3.2. Now ${c.k}`)],
  r: c => ['r', tr(`코너 반지름. 코너를 원의 일부로 볼 때 그 원의 반지름이며 도로 폭이 아님. 지금 ${c.radius} m`, `Corner radius: the radius of the circle the corner is part of, not the road width. Now ${c.radius} m`)],
  v: () => ['v', tr('속도. 식에서는 m/s. 3.6을 곱하면 km/h', 'Speed, in m/s in the formula. Multiply by 3.6 for km/h')],
  ax: () => ['a_x', tr('제동 가속도', 'Braking acceleration')],
  ay: () => ['a_y', tr('옆으로 받는 가속도. v²/r', 'Sideways acceleration, v²/r')],
  R: () => ['R', tr('원의 반지름. 타이어가 낼 수 있는 가속도의 한계', 'Circle radius: the most acceleration the tyres can give')],
};

export function formulaBox(formula: string, syms: Sym[], c: SymValues) {
  const rows = syms.map(s => { const [name, text] = MEANING[s](c); return `<span class="tp"><b class="sym">${name}</b> ${text}</span>`; }).join('');
  return `<div class="formula">${formula}${infoTip(tr('기호 뜻 보기', 'Show what the symbols mean'), rows)}</div>`;
}
