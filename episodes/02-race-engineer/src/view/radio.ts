// 무전 입력 상자. 튜토리얼 카드에 붙어 있어 카드를 다시 그려도(언어 전환 포함) 입력값이 유지됨
import { tr, tx, type Text } from '@series/engine/i18n';
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
  return {
    clear() { input.value = ''; },
    // 단계가 바뀔 때만 입력을 비움
    show(spec: RadioSpec | undefined) {
      if (spec !== owner) { input.value = ''; owner = spec ?? null; }
      if (!spec) return;
      $('radioL').textContent = tx(spec.label); $('radioU').textContent = tx(spec.unit);
      $('radioGo').textContent = tr('무전 보내기', 'Radio it in'); none.textContent = tr('한계 없음', 'No limit');
      none.hidden = !spec.noLimit;
    },
  };
}
