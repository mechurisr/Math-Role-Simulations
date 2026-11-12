// 떠 있는 미니 계산기 (kitty-specs/floating-calculator-01M755VB)
// 접힌 상태: 원형 버튼. 펼친 상태: 식 줄(+닫기) · 결과줄 · 5열 23키 자체 키패드 (spec 4절)
// 아래 고정 카드(튜토리얼)가 있으면 버튼을 카드 위로 올리고, 계산기는 버튼 왼쪽에 펼침 (spec 4절, research R6)
// 계산은 순수 함수 evaluate/formatResult (engine/src/math/expression.ts)
import { onLangChange, tr, tx } from '../i18n';
import { CALC_ERROR_TEXT, evaluate, formatResult, type EvalResult } from '../math';

export interface CalculatorOptions {
  avoid?: () => HTMLElement | null;   // 피해야 할 아래 고정 카드 (02: 튜토리얼 카드)
  reveal?: () => HTMLElement | null;  // 펼칠 때 카드 안에서 보이게 스크롤할 요소 (분석 U1)
}
export interface Calculator {
  setAvailable(on: boolean): void;    // false: 접고 버튼 숨김, 식·결과 유지 (FR-009)
  onResult(cb: (shown: string | null) => void): void;  // 값 결과 문자열 또는 null (FR-013)
  readonly open: boolean;
}

// 배치 값: spec 4절, answers.md Physical values
const GAP = 8;          // 카드와 버튼, 버튼과 계산기, 화면 위 여백
const EDGE = 12;        // 카드가 없을 때 화면 가장자리 여백 (tutorial.css 카드 bottom 과 같음)
const PANEL_MAX_W = 284;

// 키 배치 (spec 4절 표). [표시 기호, 넣을 문자열, 접근성 이름, 열 수]
type Key = [string, string, () => string, number?];
const k = (s: string, ins = s, name?: () => string, span?: number): Key => [s, ins, name ?? (() => s), span];
const KEYS: Key[] = [
  k('C', 'C', () => tr('모두 지우기', 'Clear')), k('⌫', '⌫', () => tr('한 글자 지우기', 'Delete')),
  k('(', '(', () => tr('여는 괄호', 'Open bracket')), k(')', ')', () => tr('닫는 괄호', 'Close bracket')), k('÷', '÷', () => tr('나누기', 'Divide')),
  k('7'), k('8'), k('9'), k('√', '√(', () => tr('제곱근', 'Square root')), k('×', '×', () => tr('곱하기', 'Times')),
  k('4'), k('5'), k('6'), k('^', '^', () => tr('거듭제곱', 'Power')), k('−', '−', () => tr('빼기', 'Minus')),
  k('1'), k('2'), k('3'), k('π', 'π', () => tr('파이', 'Pi')), k('+', '+', () => tr('더하기', 'Plus')),
  k('0', '0', undefined, 2), k('.', '.', () => tr('소수점', 'Decimal point')), k('=', '=', () => tr('계산', 'Equals'), 2),
];

export function createCalculator(o: CalculatorOptions = {}): Calculator {
  const el = <T extends HTMLElement>(tag: string, cls?: string, id?: string) => {
    const e = document.createElement(tag) as T; if (cls) e.className = cls; if (id) e.id = id; return e;
  };
  const fab = el<HTMLButtonElement>('button', 'calc-fab', 'calcFab');
  fab.type = 'button'; fab.hidden = true; fab.setAttribute('aria-controls', 'calc'); fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = '<span aria-hidden="true">🧮</span>';
  const panel = el('div', 'calc', 'calc'); panel.hidden = true; panel.setAttribute('role', 'dialog');
  const top = el('div', 'calc-top');
  // output 은 포커스를 받지 않아 휴대폰 기본 키보드가 뜨지 않음 (research R7)
  const exprEl = el<HTMLOutputElement>('output', 'calc-expr', 'calcExpr');
  const close = el<HTMLButtonElement>('button', 'calc-close', 'calcClose'); close.type = 'button'; close.textContent = '×';
  top.append(exprEl, close);
  const resEl = el<HTMLOutputElement>('output', 'calc-res', 'calcRes'); resEl.setAttribute('aria-live', 'polite');
  const keys = el('div', 'calc-keys');
  const keyBtns = KEYS.map(([label, ins, , span]) => {
    const b = el<HTMLButtonElement>('button'); b.type = 'button'; b.textContent = label; b.dataset.key = label;
    if (span) b.style.gridColumn = `span ${span}`;
    if (label === '=') b.classList.add('eq');
    b.addEventListener('click', () => press(ins));
    keys.append(b); return b;
  });
  panel.append(top, resEl, keys);
  document.body.append(panel, fab);

  let expr = '', result: EvalResult | null = null, open = false;
  const subs: ((s: string | null) => void)[] = [];
  const shownValue = () => result?.ok ? formatResult(result.value) : null;
  const notify = () => { const v = shownValue(); subs.forEach(f => f(v)); };

  function press(ins: string) {
    if (ins === '=') result = evaluate(expr);
    else {
      if (ins === 'C') expr = '';
      else if (ins === '⌫') expr = expr.slice(0, -1);   // 마지막 한 글자 (√( 바로 뒤면 ( 만)
      else expr += ins;
      result = null;                                   // 식을 고치면 결과줄은 비움
    }
    draw(); notify();
    if (open) revealSoon();   // 입력란 위 결과 줄이 생기거나 사라지면 카드 내용 높이가 바뀜
  }

  function draw() {
    exprEl.textContent = expr;
    resEl.textContent = !result ? '' : result.ok ? formatResult(result.value) : tx(CALC_ERROR_TEXT[result.reason]);
    resEl.classList.toggle('err', !!result && !result.ok);
    fab.setAttribute('aria-label', open ? tr('계산기 닫기', 'Close calculator') : tr('계산기 열기', 'Open calculator'));
    panel.setAttribute('aria-label', tr('계산기', 'Calculator'));
    close.setAttribute('aria-label', tr('계산기 닫기', 'Close calculator'));
    keyBtns.forEach((b, i) => b.setAttribute('aria-label', KEYS[i][2]()));
  }

  function setOpen(v: boolean) {
    open = v; panel.hidden = !v; fab.setAttribute('aria-expanded', String(v));
    document.body.classList.toggle('calc-open', v);   // 카드 max-height 38vh (tutorial.css)
    draw(); schedule();
    if (v) revealSoon();
  }

  // 펼친 뒤 카드가 줄어들면 카드 안에서 무전 입력란·보내기가 보이게 (spec 4절, 분석 U1). 배치가 끝난 다음 프레임에
  function revealSoon() { requestAnimationFrame(() => requestAnimationFrame(revealInCard)); }

  // 카드(스크롤 영역) 안에서만 움직임: scrollIntoView 는 페이지까지 스크롤하므로 직접 계산
  function revealInCard() {
    const card = o.avoid?.(), t = o.reveal?.();
    if (!card || !t || card.hidden || t.hidden) return;
    const c = card.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (r.bottom > c.bottom) card.scrollTop += r.bottom - c.bottom + GAP;
    else if (r.top < c.top) card.scrollTop -= c.top - r.top + GAP;
  }

  // 배치: 버튼은 카드 위 8px (카드가 없으면 오른쪽 아래), 계산기는 버튼 왼쪽에 아래 끝을 맞춤.
  // 화면이 낮아 위 끝이 8px 안에 못 들어가면 그만큼 내려 카드 위쪽 문구를 덮음 (R8, spec 4절)
  function place() {
    const vh = window.innerHeight, vw = document.documentElement.clientWidth;
    const card = o.avoid?.();
    const cr = card && !card.hidden ? card.getBoundingClientRect() : null;
    const hasCard = !!cr && cr.height > 0;
    const fabBottom = hasCard ? vh - cr!.top + GAP : null;
    const fabRight = hasCard ? Math.max(0, vw - cr!.right) : EDGE;
    fab.style.bottom = fabBottom == null ? '' : fabBottom + 'px';
    fab.style.right = fabRight + 'px';
    if (!open) return;
    const fw = fab.offsetWidth || 44;
    const right = fabRight + fw + GAP;
    panel.style.right = right + 'px';
    panel.style.width = Math.min(PANEL_MAX_W, vw - right - (hasCard ? Math.max(0, cr!.left) : EDGE)) + 'px';
    const fb = fabBottom ?? (vh - fab.getBoundingClientRect().bottom);
    const h = panel.offsetHeight;
    panel.style.bottom = Math.min(fb, vh - GAP - h) + 'px';
  }
  let queued = false;
  function schedule() {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; place(); });
  }
  place();

  fab.addEventListener('click', () => setOpen(!open));
  close.addEventListener('click', () => setOpen(false));
  // Esc: 펼쳐져 있으면 계산기만 접고 튜토리얼(document 버블 리스너)에는 전달하지 않음 (spec 4절, research R5)
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); }
  }, { capture: true });
  // 펼친 채 화면 크기가 바뀌면(휴대폰 회전 등) 카드 높이(38vh)도 바뀌므로 입력란을 다시 보이게
  window.addEventListener('resize', () => { schedule(); if (open) revealSoon(); });
  const ro = new ResizeObserver(schedule);
  ro.observe(panel);
  const watchCard = () => { const c = o.avoid?.(); if (c) { ro.observe(c); mo.observe(c, { attributes: true, attributeFilter: ['hidden'] }); } };
  const mo = new MutationObserver(schedule);
  watchCard();
  onLangChange(() => { draw(); schedule(); });
  draw();

  return {
    setAvailable(on) {
      if (!on && open) setOpen(false);
      fab.hidden = !on;
      if (on) schedule();
    },
    onResult(cb) { subs.push(cb); cb(shownValue()); },
    get open() { return open; },
  };
}
