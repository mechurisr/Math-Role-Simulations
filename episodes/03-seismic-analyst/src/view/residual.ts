// 잔차 막대(부호 포함)와 잔차 제곱합 큰 숫자 (FR-018). 끌거나 버튼을 누를 때마다 다시 그림.
// 문구는 "측정에 가장 잘 맞는 점" (C-007): "진짜 진앙"이라고 쓰지 않는다
import { tr } from '@series/engine/i18n';
import { byId as $ } from '@series/engine/ui';

const SCALE = 5;   // 막대 끝 = ±5 km
export function showResiduals(ids: string[], res: number[], f: number, at: { x: number; y: number }) {
  $('resBars').innerHTML = res.map((e, i) => {
    const w = Math.min(1, Math.abs(e) / SCALE) * 50;
    return `<div class="res-row"><span class="res-id">${ids[i]}</span><span class="res-track"><span class="res-fill ${e >= 0 ? 'pos' : 'neg'}" style="${e >= 0 ? 'left:50%' : `left:${50 - w}%`};width:${w}%"></span></span><span class="res-v">${e >= 0 ? '+' : '−'}${Math.abs(e).toFixed(2)}</span></div>`;
  }).join('');
  $('resF').textContent = f.toFixed(2);
  $('resAt').textContent = tr('추정점', 'Estimate') + ` (${at.x.toFixed(1)}, ${at.y.toFixed(1)}) km`;
}
