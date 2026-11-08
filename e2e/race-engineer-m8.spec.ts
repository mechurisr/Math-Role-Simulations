// 레이스 엔지니어 M8 문구 보강과 마찰원 축 이름 (kitty-specs/race-engineer-m8-wording-01M6NPGF, Issue #32)
// 캔버스 글자는 DOM에 없으므로 fillText 호출을 기록해 위치와 겹침을 잼
import { expect, test, type Page } from '@playwright/test';

const URL = '/episodes/02-race-engineer/';
const DONE = 'series:race-engineer:done';
const BEFORE_M8 = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'];
test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });

type Label = { t: string; x: number; y: number; w: number; align: string; fill: string };
const start = async (page: Page) => {
  await page.addInitScript(([k, v]) => {
    localStorage.setItem(k, v);
    const w = window as unknown as { labels: Label[]; rings: number[] }; w.labels = []; w.rings = [];
    const arc = CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.arc = function (x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean) {
      if (this.canvas.id === 'circle' && r > 20) w.rings.push(r); // 점(반지름 9)이 아닌 마찰원
      return arc.call(this, x, y, r, a0, a1, ccw);
    };
    const orig = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t: string, x: number, y: number) {
      if (this.canvas.id === 'circle') w.labels.push({ t, x, y, w: this.measureText(t).width, align: this.textAlign, fill: String(this.fillStyle) });
      return orig.call(this, t, x, y);
    };
  }, [DONE, JSON.stringify(BEFORE_M8)]);
  await page.goto(URL);
  await page.locator('#resumeGo').tap();
  await expect(page.locator('#tut')).toBeVisible();
};
const next = (page: Page) => page.locator('#tutNext').tap();
const body = (page: Page) => page.locator('#tutBody');
const setRange = (page: Page, id: string, v: number) => page.locator('#' + id).evaluate((e, v) => { (e as HTMLInputElement).value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const radio = async (page: Page, v: string) => { await page.locator('#radioIn').fill(v); await page.locator('#radioGo').tap(); };

// 마지막으로 그린 한 장면의 글자들 (점 숫자 + 축 이름 둘)
async function lastFrame(page: Page) {
  const all = await page.evaluate(() => (window as unknown as { labels: Label[] }).labels);
  return all.slice(-3);
}
// 글자 상자 (12~13px 글꼴, 기준선 위 11px·아래 3px)
const box = (l: Label) => { const left = l.align === 'right' ? l.x - l.w : l.x; return { left, right: left + l.w, top: l.y - 11, bottom: l.y + 3 }; };
const overlap = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

async function checkAxes(page: Page, braking: string, sideways: string) {
  const { width: w, height: h } = (await page.locator('#circle').boundingBox())!;
  const ox = w / 2, oy = h / 2, rpx = await page.evaluate(() => (window as unknown as { rings: number[] }).rings.at(-1)!); // 실제로 그린 원
  const frame = await lastFrame(page);
  const v = frame.find(l => l.t === braking), s = frame.find(l => l.t === sideways), dot = frame.find(l => /^\d+\.\d$/.test(l.t));
  expect(v, braking).toBeDefined(); expect(s, sideways).toBeDefined(); expect(dot, '점 숫자').toBeDefined();
  for (const l of [v!, s!]) {
    const b = box(l);
    console.log(`${l.t}: ${b.left.toFixed(0)}~${b.right.toFixed(0)} × ${b.top.toFixed(0)}~${b.bottom.toFixed(0)} (canvas ${w.toFixed(0)}×${h.toFixed(0)}, 원 반지름 ${rpx.toFixed(0)}px)`);
    // 캔버스 안
    expect(b.left, l.t).toBeGreaterThanOrEqual(0); expect(b.right, l.t).toBeLessThanOrEqual(w); expect(b.top, l.t).toBeGreaterThanOrEqual(0); expect(b.bottom, l.t).toBeLessThanOrEqual(h);
    // 원 선과 떨어짐: 상자에서 중심에 가장 가까운 점이 원 밖
    const nx = Math.max(b.left, Math.min(ox, b.right)) - ox, ny = Math.max(b.top, Math.min(oy, b.bottom)) - oy;
    expect(Math.hypot(nx, ny), `${l.t} 원과 겹침`).toBeGreaterThan(rpx + 1);
    expect(overlap(b, box(dot!)), `${l.t} 점 숫자와 겹침`).toBe(false);
  }
}

test('M8 다섯 단계 설명과 축 이름 (한국어)', async ({ page }) => {
  await start(page);
  await expect(body(page)).toContainText('앞차가 갑자기 느려졌어');
  await expect(body(page)).toContainText('얼마까지 되는지 숫자로');
  await next(page);
  await expect(body(page)).toContainText('mv²/r을 차 질량 m으로 나누면 v²/r');
  await expect(body(page)).toContainText('가로축(옆 →)은 옆 가속도');
  await expect(body(page)).toContainText('세로축(제동 ↑)은 제동 가속도');
  await expect(body(page)).toContainText('4장의 낼 수 있는 힘');
  await expect(body(page)).toContainText('3 + 4 = 7이 아니라 5');
  await expect(page.locator('#circle')).toHaveAttribute('aria-label', '마찰원: 가로축은 옆 가속도, 세로축은 제동 가속도');
  await checkAxes(page, '제동 ↑', '옆 →');
  await next(page);
  await expect(body(page)).toContainText('v² = 55.6² ≈ 3086');
  await expect(body(page)).toContainText('원의 반지름을 R이라고 부릅니다');
  await expect(body(page)).toContainText('R = μN/m = μ(mg + kv²)/m = μ(g + kv²/m)');
  await expect(body(page)).toContainText('3.2 × 3086 ÷ 800 ≈ 12.35');
  await expect(body(page)).toContainText('1.6 × (9.8 + 12.35) ≈ 35.4');
  await expect(body(page)).toContainText('주황 점선은');
  await expect(body(page)).toContainText('바깥으로 밀려납니다');
  await next(page);
  await expect(body(page)).toContainText('원에 닿는 곳이 미끄러지지 않고 밟을 수 있는 최대');
  await expect(body(page)).toContainText('R을 ax에 대해 풀면');
  // 점을 원 끝까지 끌어도 축 이름과 점 숫자가 겹치지 않음
  await setRange(page, 'brake', 35.4); await expect(page.locator('#circleNote')).toContainText('제동 35.4');
  await checkAxes(page, '제동 ↑', '옆 →');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.locator('#circle').screenshot({ path: 'test-results/m8-circle-ko.png' });
  await radio(page, '20.2'); await expect(body(page).locator('.fb')).toContainText('맞습니다');
  await next(page);
  await expect(body(page)).toContainText('200 km/h인 순간의 값');
  await expect(body(page)).toContainText('주황 선도 함께 움직입니다');
});

test('M8 다섯 단계 설명과 축 이름 (영어)', async ({ page }) => {
  await start(page);
  await page.locator('#langBtn').tap();
  await expect(body(page)).toContainText('the car ahead just slowed down');
  await expect(body(page)).toContainText('a number for how much is safe');
  await next(page);
  await expect(body(page)).toContainText('mv²/r, by the car mass m and you get v²/r');
  await expect(body(page)).toContainText('horizontal axis (Sideways →) is the sideways acceleration');
  await expect(body(page)).toContainText('vertical axis (Braking ↑) is the braking acceleration');
  await expect(body(page)).toContainText('force available from chapter 4');
  await expect(page.locator('#circle')).toHaveAttribute('aria-label', 'Friction circle: horizontal axis is sideways acceleration, vertical axis is braking acceleration');
  await checkAxes(page, 'Braking ↑', 'Sideways →');
  await next(page);
  await expect(body(page)).toContainText('v² = 55.6² ≈ 3086');
  await expect(body(page)).toContainText('Call the circle radius R');
  await expect(body(page)).toContainText('R = μN/m = μ(mg + kv²)/m = μ(g + kv²/m)');
  await expect(body(page)).toContainText('3.2 × 3086 ÷ 800 ≈ 12.35');
  await expect(body(page)).toContainText('The orange dashed line');
  await next(page);
  await expect(body(page)).toContainText('the most you can brake without sliding');
  await setRange(page, 'brake', 35.4);
  await checkAxes(page, 'Braking ↑', 'Sideways →');
  await page.locator('#circle').screenshot({ path: 'test-results/m8-circle-en.png' });
  await radio(page, '20.2'); await expect(body(page).locator('.fb')).toContainText('Right');
  await next(page);
  await expect(body(page)).toContainText('for the instant at 200 km/h');
  await expect(body(page)).toContainText('the orange line moves too');
});

for (const scheme of ['light', 'dark'] as const) test(`${scheme} 테마: 축 이름 글자색이 배경과 대비 4.5:1 이상`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await start(page);
  await next(page);
  await expect(page.locator('#circleBox')).toBeVisible();
  // 축 이름을 실제로 그린 색(fillStyle)과 캔버스 둘레 배경(캔버스는 투명)을 비교
  const fill = (await lastFrame(page)).find(l => l.t === '제동 ↑')!.fill;
  const ratio = await page.locator('#circle').evaluate((el, fill) => {
    const rgb = (s: string) => s.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const lum = (c: number[]) => { const [r, g, b] = c.map(v => { const x = v / 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    let bg = el as HTMLElement | null, color = 'rgba(0, 0, 0, 0)';
    while (bg) { color = getComputedStyle(bg).backgroundColor; if (!/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(color)) break; bg = bg.parentElement; }
    const probe = document.createElement('span'); probe.style.color = fill; document.body.append(probe);
    const a = lum(rgb(getComputedStyle(probe).color)), b = lum(rgb(color)); probe.remove();
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  }, fill);
  console.log(`${scheme} 축 이름 ${fill} 대비 ${ratio.toFixed(1)}:1`);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
  await page.locator('#circle').screenshot({ path: `test-results/m8-circle-${scheme}.png` });
});
