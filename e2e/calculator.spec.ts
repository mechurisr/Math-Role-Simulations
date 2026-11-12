// 떠 있는 미니 계산기 (kitty-specs/floating-calculator-01M755VB): 단계별 표시(US3), 접기·식 유지·Esc(US4),
// 360×640·360×568 배치와 가림(NFR-002, SC-003), M3 계산 후 통과와 입력란 위 결과 줄(US1, FR-013, SC-001)
// 계산 규칙 자체는 engine/tests/expression.test.ts 가 검사. CI 에서는 세 엔진으로 실행
import { expect, test, type Page } from '@playwright/test';

const URL = '/episodes/02-race-engineer/';
const TUT_DONE = 'series:race-engineer:tutDone';
test.use({ hasTouch: true, isMobile: true, viewport: { width: 360, height: 640 } });

const fab = (p: Page) => p.locator('#calcFab');
const panel = (p: Page) => p.locator('#calc');
const stepText = (p: Page) => p.locator('#tutStep').textContent();
async function openAt(page: Page, mission: string) {
  await page.goto(URL + '?from=' + mission);
  await expect(page.locator('#tut')).toBeVisible();
}
// 무전 입력란이 보일 때까지 "다음" (M3: 설명 3단계 → 무전)
async function toRadio(page: Page) {
  for (let i = 0; i < 12 && !(await page.locator('#radioIn').isVisible()); i++) await page.locator('#tutNext').tap();
  await expect(page.locator('#radioIn')).toBeVisible();
}
async function keys(page: Page, seq: string) {
  for (const k of seq) await page.locator(`.calc-keys [data-key="${k}"]`).tap();
}
type Box = { top: number; bottom: number; left: number; right: number; width: number; height: number };
const box = (page: Page, sel: string) => page.locator(sel).evaluate(e => e.getBoundingClientRect().toJSON() as Box);
// 가운데 점을 누르면 그 요소(또는 자손)가 받는지 = 다른 요소에 가리지 않음
const onTop = (page: Page, sel: string) => page.locator(sel).evaluate(e => {
  const r = e.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!t && (t === e || e.contains(t));
});
const overlapArea = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const note = (name: string, v: unknown) => test.info().annotations.push({ type: name, description: JSON.stringify(v) });

test.describe('단계별 표시 (US3)', () => {
  test('설명 단계엔 없고, 무전 단계에 나타나고, 다음 설명 단계에서 접히며 사라짐. 돌아오면 식이 남아 있음', async ({ page }) => {
    await openAt(page, 'M3');
    await expect(fab(page)).toBeHidden();                       // M3 "재지 않고 계산하기" 설명 단계
    await toRadio(page);
    await expect(fab(page)).toBeVisible();
    await fab(page).tap(); await expect(panel(page)).toBeVisible();
    await keys(page, '√1.0×9.8×80)×3.6=');
    await expect(page.locator('#calcRes')).toHaveText('100.8');
    await page.locator('#radioIn').fill('100.8'); await page.locator('#radioGo').tap();
    await page.locator('#tutNext').tap();                         // "M3 이 숫자가 뜻하는 것" (무전 없음)
    await expect(fab(page)).toBeHidden(); await expect(panel(page)).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/calc-open/);
    await page.locator('#tutPrev').tap();                         // 다시 무전 단계
    await expect(fab(page)).toBeVisible();
    await fab(page).tap();
    await expect(page.locator('#calcExpr')).toHaveText('√(1.0×9.8×80)×3.6');
    await expect(page.locator('#calcRes')).toHaveText('100.8');
  });

  test('튜토리얼을 끝낸 자유 조작에서 보임', async ({ page }) => {
    await openAt(page, 'M3');
    await page.locator('#tutSkip').tap();
    await expect(page.locator('#tut')).toBeHidden();
    await expect(fab(page)).toBeVisible();
    const b = await box(page, '#calcFab');
    expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44);
  });

  test('자주포 에피소드에는 계산기 버튼이 없음', async ({ page }) => {
    await page.goto('/episodes/01-calculus-howitzer/');
    await expect(page.locator('#calcFab')).toHaveCount(0);
  });
});

test.describe('접기·식 유지·Esc (US4)', () => {
  test('버튼·닫기·Esc로 접힘, 바깥을 눌러도 안 접힘, C와 ⌫', async ({ page }) => {
    await openAt(page, 'M3'); await toRadio(page);
    await fab(page).tap(); await expect(panel(page)).toBeVisible();
    await page.locator('#radioIn').tap();                          // 바깥(무전 입력란)
    await expect(panel(page)).toBeVisible();
    await fab(page).tap(); await expect(panel(page)).toBeHidden();
    await fab(page).tap(); await page.locator('#calcClose').tap(); await expect(panel(page)).toBeHidden();
    await fab(page).tap();
    await keys(page, '12√');
    await expect(page.locator('#calcExpr')).toHaveText('12√(');
    await keys(page, '⌫');                                          // √( 바로 뒤의 ⌫ 는 ( 만
    await expect(page.locator('#calcExpr')).toHaveText('12√');
    await keys(page, 'C');
    await expect(page.locator('#calcExpr')).toHaveText('');
  });

  test('튜토리얼 중 펼친 계산기에서 Esc는 계산기만 접고, 접힌 뒤 Esc는 튜토리얼을 끝냄 (R3)', async ({ page }) => {
    await openAt(page, 'M3'); await toRadio(page);
    const before = await stepText(page);
    await fab(page).tap(); await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(page.locator('#tut')).toBeVisible();
    expect(await stepText(page)).toBe(before);
    expect(await page.evaluate(k => localStorage.getItem(k), TUT_DONE)).toBeNull();
    await page.keyboard.press('Escape');                           // 계산기가 접힌 상태 → 기존 동작
    await expect(page.locator('#tut')).toBeHidden();
  });
});

test.describe('배치와 가림 (NFR-002, SC-003)', () => {
  for (const h of [640, 568]) test(`360×${h}: 버튼은 카드 위, 펼치면 입력란·보내기·버튼이 가리지 않음, 44px, 가로 스크롤 0`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: h });
    await openAt(page, 'M3'); await toRadio(page);
    const card0 = await box(page, '#tut'), fab0 = await box(page, '#calcFab');
    note('closed', { card0, fab0 });
    expect(Math.abs(card0.top - 8 - fab0.bottom)).toBeLessThanOrEqual(1);   // 카드 위 8px
    expect(await onTop(page, '#calcFab')).toBe(true);

    await fab(page).tap(); await expect(panel(page)).toBeVisible();
    await keys(page, '√1.0×9.8×80)×3.6=');                                 // 결과 줄이 생겨 카드 내용이 길어진 상태에서 잼
    await expect(page.locator('#radioCalc')).toBeVisible();
    // 배치는 ResizeObserver·다음 프레임에 끝나므로 안정될 때까지 기다림
    await expect.poll(() => onTop(page, '#radioGo'), { message: '보내기 버튼이 보이고 눌림' }).toBe(true);
    const card = await box(page, '#tut'), calc = await box(page, '#calc'), f = await box(page, '#calcFab');
    note('open', { card, calc, f });
    expect(card.height).toBeLessThanOrEqual(0.38 * h + 1);                 // 38vh
    expect(calc.top).toBeGreaterThanOrEqual(8 - 0.5);
    expect(calc.right).toBeLessThanOrEqual(f.left - 8 + 0.5);              // 버튼 왼쪽
    if (h === 640) expect(overlapArea(card, calc)).toBe(0);                // 360×640: 겹침 0
    for (const s of ['#radioIn', '#radioGo', '#calcFab']) expect(await onTop(page, s), s).toBe(true);
    for (const s of ['#radioIn', '#radioGo']) { const g = await box(page, s); expect(g.bottom, s + ' 아래가 카드 밖').toBeLessThanOrEqual(card.bottom + 0.5); }
    // 다음 버튼은 카드 안에서 스크롤하면 보이고 계산기에 가리지 않음
    await page.locator('#tutNext').evaluate(e => e.scrollIntoView({ block: 'nearest' }));
    await expect.poll(() => onTop(page, '#tutNext'), { message: '다음 버튼' }).toBe(true);

    const sizes = await page.locator('#calc button, #calcFab').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { k: (e as HTMLElement).dataset.key ?? e.id, w: r.width, h: r.height }; }));
    expect(sizes.length).toBe(25);                                         // 키 23 + 닫기 + 원형 버튼
    for (const s of sizes) { expect(s.w, s.k).toBeGreaterThanOrEqual(44); expect(s.h, s.k).toBeGreaterThanOrEqual(44); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test('펼친 채 화면이 360×640 → 360×568로 낮아져도 보내기 버튼이 보임', async ({ page }) => {
    await openAt(page, 'M3'); await toRadio(page);
    await fab(page).tap();
    await keys(page, '√1.0×9.8×80)×3.6=');
    await expect.poll(() => onTop(page, '#radioGo')).toBe(true);
    await page.setViewportSize({ width: 360, height: 568 });
    // 가운데 점만이 아니라 버튼 전체가 카드의 보이는 영역 안에 있어야 함 (아래가 잘리면 실패)
    await expect.poll(async () => { const c = await box(page, '#tut'), g = await box(page, '#radioGo'); return g.bottom <= c.bottom + 0.5 && g.top >= c.top; },
      { message: '크기를 바꾼 뒤 보내기 버튼 전체가 카드 안에 보임' }).toBe(true);
    expect(await onTop(page, '#radioGo')).toBe(true);
  });

  test('English로 바꿔 카드 높이가 바뀌어도 버튼은 카드 위', async ({ page }) => {
    await openAt(page, 'M3'); await toRadio(page);
    await page.locator('.lang-btn').tap();
    await expect(page.locator('#tutTitle')).toHaveText('M3 Rain');
    await expect.poll(async () => { const c = await box(page, '#tut'), b = await box(page, '#calcFab'); return Math.abs(c.top - 8 - b.bottom) <= 1; }).toBe(true);
    await expect(fab(page)).toHaveAttribute('aria-label', 'Open calculator');
  });
});

test.describe('M3를 계산기로 풀기 (US1, FR-011, FR-013)', () => {
  test('√ 키는 √(, 결과는 입력란 위에도, 옮겨 적어 보내면 통과', async ({ page }) => {
    await openAt(page, 'M3'); await toRadio(page);
    await expect(page.locator('#radioCalc')).toBeHidden();
    await fab(page).tap();
    await keys(page, '√');
    await expect(page.locator('#calcExpr')).toHaveText('√(');
    await keys(page, '1.0×9.8×80)×3.6=');
    await expect(page.locator('#calcRes')).toHaveText('100.8');
    await page.locator('#radioIn').tap();
    await expect(panel(page)).toBeVisible();                                // 입력란을 눌러도 안 접힘
    await expect(page.locator('#radioCalc')).toContainText('계산기 결과');
    await expect(page.locator('#radioCalc b')).toHaveText('100.8');
    await expect(page.locator('#radioIn')).toHaveValue('');                // 자동으로 넣지 않음
    await page.locator('#radioIn').fill('100.8'); await page.locator('#radioGo').tap();
    await expect(page.locator('#tutBody .fb')).toHaveClass(/good/);
    await expect(page.locator('#tutNext')).toBeEnabled();
  });

  test('오류 식은 새 문구, 입력란 위 결과 줄은 숨김. 식을 고치면 결과가 비워짐', async ({ page }) => {
    await openAt(page, 'M3'); await toRadio(page);
    await fab(page).tap();
    await keys(page, '(−8)^(1÷3)=');
    await expect(page.locator('#calcRes')).toHaveText('밑이 음수이고 지수가 정수가 아니면 여기서는 계산하지 않습니다');
    await expect(page.locator('#radioCalc')).toBeHidden();
    await keys(page, 'C2+2=');
    await expect(page.locator('#radioCalc b')).toHaveText('4');
    await keys(page, '1');                                                   // 식을 고침
    await expect(page.locator('#calcRes')).toHaveText('');
    await expect(page.locator('#radioCalc')).toBeHidden();
  });
});
