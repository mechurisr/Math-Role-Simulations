// 무전 입력 상자. 튜토리얼 카드에 붙어 있어 카드를 다시 그려도(언어 전환 포함) 입력값이 유지됨
import { onLangChange, tr, tx, type Text } from '@series/engine/i18n';
import { byId as $ } from '@series/engine/ui';
import type { RadioAnswer } from '../model/judge';

export interface RadioSpec { label: Text; unit: Text; noLimit?: boolean }

export function createRadio(onSend: (a: RadioAnswer) => void) {
  const input = $<HTMLInputElement>('radioIn'), none = $('radioNone');
  let owner: RadioSpec | null = null;
  const send = () => onSend({ kind: 'number', raw: input.value });
  $('radioGo').onclick = send;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  none.onclick = () => onSend({ kind: 'noLimit' });
  // 계산기 결과를 입력란 바로 위에 크게 한 번 더 (kitty-specs/floating-calculator-01M755VB FR-013, 스펙 검토 R5 선택지 c).
  // 휴대폰 키보드가 올라와 계산기가 밀려나도 보이게. 값을 입력란에 넣지는 않음 (학습 목표 2)
  const calcLine = document.createElement('div'); calcLine.id = 'radioCalc'; calcLine.className = 'radio-calc'; calcLine.hidden = true;
  input.closest('.radio-row')!.before(calcLine);
  let calcValue: string | null = null;
  const drawCalc = () => {
    calcLine.hidden = calcValue == null;
    calcLine.innerHTML = calcValue == null ? '' : `<span>${tr('계산기 결과', 'Calculator result')}</span><b>${calcValue}</b>`;
  };
  onLangChange(drawCalc);
  return {
    // 새 문제(단계·M7 코너)로 바뀌면 이전 계산 결과 줄도 숨김. 다음 '=' 때 다시 보임 (크로스체크 PR #38)
    clear() { input.value = ''; calcValue = null; drawCalc(); },
    setCalcResult(v: string | null) { calcValue = v; drawCalc(); },
    // 단계가 바뀔 때만 입력을 비움
    show(spec: RadioSpec | undefined) {
      if (spec !== owner) { input.value = ''; owner = spec ?? null; calcValue = null; drawCalc(); }
      if (!spec) return;
      $('radioL').textContent = tx(spec.label); $('radioU').textContent = tx(spec.unit);
      $('radioGo').textContent = tr('무전 보내기', 'Radio it in'); none.textContent = tr('한계 없음', 'No limit');
      none.hidden = !spec.noLimit;
    },
  };
}
