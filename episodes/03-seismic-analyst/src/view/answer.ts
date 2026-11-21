// 답 보내기 상자 (재난 문자 발송팀에 보냄). 튜토리얼 카드에 붙어 있어 카드를 다시 그려도(언어 전환 포함) 입력값이 유지됨.
// 칸 수는 미션이 정한다 (값 하나, 좌표 두 칸, 직선 계수 세 칸 등)
import { onLangChange, tr, tx, type Text } from '@series/engine/i18n';
import { byId as $ } from '@series/engine/ui';

export interface AnswerField { label: Text; unit?: Text }
export interface AnswerSpec { fields: AnswerField[]; title?: Text }

export function createAnswer(onSend: (raw: string[]) => void) {
  const box = $('answerFields'), go = $('answerGo');
  let owner: AnswerSpec | null = null, inputs: HTMLInputElement[] = [];
  const send = () => onSend(inputs.map(i => i.value));
  go.onclick = send;
  // 계산기 결과를 입력란 위에 크게 한 번 더 (kitty-specs/floating-calculator-01M755VB FR-013). 값을 입력란에 넣지는 않음
  const calcLine = $('answerCalc');
  let calcValue: string | null = null;
  const drawCalc = () => {
    calcLine.hidden = calcValue == null;
    calcLine.innerHTML = calcValue == null ? '' : `<span>${tr('계산기 결과', 'Calculator result')}</span><b>${calcValue}</b>`;
  };
  function build(spec: AnswerSpec) {
    box.innerHTML = '';
    inputs = spec.fields.map((f, i) => {
      const row = document.createElement('div'); row.className = 'answer-row';
      const label = document.createElement('label'); label.htmlFor = 'answerIn' + i; label.dataset.k = String(i);
      const input = document.createElement('input'); input.id = 'answerIn' + i; input.inputMode = 'decimal'; input.autocomplete = 'off';
      input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
      const unit = document.createElement('span'); unit.className = 'unit'; unit.dataset.k = String(i);
      row.append(label, input, unit); box.append(row); return input;
    });
  }
  function labels() {
    if (!owner) return;
    owner.fields.forEach((f, i) => {
      box.querySelector<HTMLElement>(`label[data-k="${i}"]`)!.textContent = tx(f.label);
      box.querySelector<HTMLElement>(`.unit[data-k="${i}"]`)!.textContent = tx(f.unit);
    });
    $('answerTitle').textContent = tx(owner.title);
    go.textContent = tr('발송팀에 보내기', 'Send to the alert team');
  }
  onLangChange(() => { drawCalc(); labels(); });
  return {
    clear() { inputs.forEach(i => { i.value = ''; }); calcValue = null; drawCalc(); },
    setCalcResult(v: string | null) { calcValue = v; drawCalc(); },
    // 단계가 바뀔 때만 칸을 새로 만들고 입력을 비움
    show(spec: AnswerSpec | undefined) {
      if (spec !== owner) { owner = spec ?? null; calcValue = null; drawCalc(); if (spec) build(spec); }
      labels();
    },
  };
}
