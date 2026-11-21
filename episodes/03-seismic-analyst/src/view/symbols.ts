// 식 상자: 식과, (i)를 올리거나 탭하면 펼쳐지는 기호 뜻 (FR-015)
import { tr } from '@series/engine/i18n';
import { infoTip } from '@series/engine/ui';
import { VP, VS } from '../model/constants';

export type Sym = 'd' | 'dt' | 'vp' | 'vs';

const MEANING: Record<Sym, () => [string, string]> = {
  d: () => ['d', tr('진앙에서 관측소까지의 거리 (km)', 'Distance from the epicentre to the station (km)')],
  dt: () => ['Δt', tr('S-P 시간. S파 첫 도착 시각 − P파 첫 도착 시각 (s)', 'S-P time: S wave first arrival minus P wave first arrival (s)')],
  vp: () => ['Vp', tr(`P파 속도. 이 게임에서는 ${VP} km/s`, `P wave speed, ${VP} km/s in this game`)],
  vs: () => ['Vs', tr(`S파 속도. 이 게임에서는 ${VS} km/s`, `S wave speed, ${VS} km/s in this game`)],
};

export function formulaBox(formula: string, syms: Sym[]) {
  const rows = syms.map(s => { const [name, text] = MEANING[s](); return `<span class="tp"><b class="sym">${name}</b> ${text}</span>`; }).join('');
  return `<div class="formula">${formula}${infoTip(tr('기호 뜻 보기', 'Show what the symbols mean'), rows)}</div>`;
}
