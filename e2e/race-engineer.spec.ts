// 레이스 엔지니어: 360px 터치로 전 미션 완주 (kitty-specs/race-engineer-01M68BAF, 헌장 PRJ-004)
// 코너 주행 애니메이션을 실제 시간으로 기다려 수십 초. CI 에서는 세 엔진으로 실행
import { expect, test, type Page } from '@playwright/test';

const URL = '/episodes/02-race-engineer/';
const DONE = 'series:race-engineer:done';
test.describe.configure({ timeout: 300_000 });
test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });

const start = async (page: Page, done: string[] = []) => {
  if (done.length) await page.addInitScript(([k, v]) => { localStorage.setItem(k, v); }, [DONE, JSON.stringify(done)]);
  await page.goto(URL);
  if (done.length && done.length < 8) await page.locator('#resumeGo').tap();
  await expect(page.locator('#tut')).toBeVisible();
};
const setRange = (page: Page, id: string, v: number) => page.locator('#' + id).evaluate((e, v) => { (e as HTMLInputElement).value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const next = (page: Page) => page.locator('#tutNext').tap();
const radio = async (page: Page, v: string) => { await page.locator('#radioIn').fill(v); await page.locator('#radioGo').tap(); };
const feedback = (page: Page) => page.locator('#tutBody .fb');
const drive = async (page: Page, kmh: number, outcome: string) => {
  await setRange(page, 'speed', kmh); await page.locator('#go').tap();
  await expect(page.locator('#stage')).toHaveAttribute('data-outcome', outcome, { timeout: 15_000 });
};
const noHScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
// 지금 보이는 모든 조작 요소가 44×44 이상인지. 재는 요소가 없으면 실패
async function touchSizes(page: Page, where: string) {
  const sizes = await page.locator('button:visible, input:visible').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { id: e.id || e.textContent, w: r.width, h: r.height }; }));
  expect(sizes.length, where).toBeGreaterThan(0);
  for (const s of sizes) { expect(s.w, `${where} ${s.id} 폭`).toBeGreaterThanOrEqual(44); expect(s.h, `${where} ${s.id} 높이`).toBeGreaterThanOrEqual(44); }
  await noHScroll(page);
}
const corner = async (page: Page, v: string | null, result: string) => {
  if (v === null) await page.locator('#radioNone').tap(); else await radio(page, v);
  await expect(feedback(page)).toContainText(result);
  await expect(page.locator('#stage')).not.toHaveAttribute('data-outcome', '', { timeout: 15_000 });
  await page.locator('[data-act=next]').tap();
};

test('M1~M8을 터치로 완주', async ({ page }) => {
  await start(page); await touchSizes(page, '소개'); await next(page);
  // 1장: 왜 힘이 필요한가
  await page.locator('[data-q="1"]').tap(); await next(page); await next(page);
  await expect(page.locator('#tutNext')).toBeDisabled();
  await setRange(page, 'speed', 120); await expect(feedback(page)).toContainText('4배'); await next(page);
  // M1: 한계를 넘으면 미끄러지고, 한계 안쪽이면 통과
  await expect(page.locator('#tutNext')).toBeDisabled();
  await drive(page, 128, 'slid'); await expect(feedback(page)).toContainText('미끄러졌습니다'); await expect(page.locator('#tutNext')).toBeDisabled();
  await drive(page, 120, 'pass'); await expect(feedback(page)).toContainText('시간을 잃었습니다');
  await drive(page, 127, 'pass'); await touchSizes(page, 'M1'); await next(page); await next(page);
  // M2: 예상 → 재기 → 비율 → 이유 → 적용
  await expect(page.locator('#tutNext')).toBeDisabled();
  await page.locator('[data-q="0"]').tap(); await next(page);
  await expect(page.locator('#limit')).toHaveText('그립 한계: 90.2 km/h');
  await expect(page.locator('#tutNext')).toBeDisabled();
  await page.locator('[data-act=wide]').tap(); await expect(page.locator('#limit')).toHaveText('그립 한계: 127.5 km/h');
  await expect(page.locator('#tutBody table')).toContainText('127.5 km/h'); await touchSizes(page, 'M2 재기'); await next(page);
  await radio(page, '0.71'); await expect(feedback(page)).toContainText('너무 낮습니다');
  await radio(page, 'abc'); await expect(feedback(page)).toContainText('양수를');
  await radio(page, '1.41'); await touchSizes(page, 'M2'); await next(page);
  await expect(page.locator('#tutBody')).toContainText('180 km/h'); await next(page);
  await page.locator('[data-q="0"]').tap(); await expect(page.locator('#tutNext')).toBeDisabled();
  await page.locator('[data-q="1"]').tap(); await next(page);
  // M3: 식과 풀이 예시 뒤 계산
  await next(page); await expect(page.locator('#tutBody math')).toHaveCount(2); await next(page); await next(page);
  await radio(page, '100.8'); await next(page); await next(page);
  // M4: 윙 관찰 → 풀이 예시 → 계산 → 그래프
  await next(page); await expect(page.locator('#tutNext')).toBeDisabled();
  await page.locator('#wing button[data-v=high]').tap(); await setRange(page, 'speed', 200);
  await expect(feedback(page)).toContainText('빠를수록'); await next(page); await next(page); await next(page);
  await radio(page, '258.8'); await next(page);
  await expect(page.locator('#graphNote')).toHaveText('교점 258.8 km/h'); await noHScroll(page); await next(page); await next(page);
  // M5
  await page.locator('[data-q="0"]').tap(); await next(page); await page.locator('[data-act=big]').tap(); await next(page);
  await radio(page, '1.94'); await next(page); await page.locator('[data-q="0"]').tap(); await next(page);
  // M6: v²이 음수가 되는 이유 → 세 상태 → 경계
  await expect(page.locator('#tutBody')).toContainText('음수'); await next(page); await next(page);
  await setRange(page, 'radius', 122); await expect(page.locator('#limit')).toContainText('336.3');
  await setRange(page, 'radius', 123); await expect(page.locator('#limit')).toContainText('그립 한계 > 최고 속도'); await expect(page.locator('#limit')).not.toContainText('342');
  await setRange(page, 'radius', 152); await expect(page.locator('#graphNote')).toContainText('축 밖');
  await expect(page.locator('#tutNext')).toBeDisabled();
  await setRange(page, 'radius', 157); await expect(page.locator('#graphNote')).toContainText('교점 없음'); await expect(page.locator('#limit')).toContainText('한계 없음');
  await touchSizes(page, 'M6'); await next(page); await next(page);
  await radio(page, '156'); await next(page); await next(page);
  // M7: 코너 4를 틀리면 불통과, 다시 해서 통과
  await next(page);
  await corner(page, '122.8', '성공'); await corner(page, '324.21', '성공'); await corner(page, '118', '성공');
  await corner(page, '340', '한계 없는 코너'); await corner(page, '111', '성공');
  await expect(feedback(page)).toContainText('코너 4의 판단'); await expect(page.locator('#tutNext')).toBeDisabled();
  await page.locator('[data-act=retry]').tap();
  await corner(page, '122.8', '성공'); await corner(page, '400', '미끄러짐'); await corner(page, '118', '성공');
  await touchSizes(page, 'M7'); await corner(page, null, '성공'); await corner(page, '111', '성공');
  await expect(feedback(page)).toContainText('완주'); await next(page);
  // M8: 끌기는 페이지를 스크롤하지 않음
  await next(page); await next(page); await next(page);
  await expect(page.locator('#circle')).toHaveCSS('touch-action', 'none');
  await setRange(page, 'brake', 20); await expect(page.locator('#circleNote')).toContainText('원 안');
  await setRange(page, 'brake', 22); await expect(page.locator('#circleNote')).toContainText('원 밖');
  await touchSizes(page, 'M8'); await radio(page, '20.2'); await next(page); await next(page);
  await expect(page.locator('#tutTitle')).toHaveText('이 모델이 뺀 것'); await next(page);
  await expect(page.locator('#tut')).toBeHidden();
  expect(JSON.parse(await page.evaluate(k => localStorage.getItem(k)!, DONE))).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8']);
  await touchSizes(page, '자유 조작');
});

test('랜딩 목록에 공개됨 (FR-014)', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href*="02-race-engineer"]').first().tap();
  await expect(page).toHaveURL(/02-race-engineer/);
  await expect(page.locator('h1')).toContainText('엔지니어');
});

test('윙이 있으면 속도를 올릴 때 파랑 막대가 실제로 길어지고, 윙이 없으면 그대로 (18단계)', async ({ page }) => {
  await start(page, ['M1', 'M2', 'M3']); await next(page);
  const blue = () => page.locator('#barAvail').evaluate(e => e.getBoundingClientRect().width);
  await setRange(page, 'speed', 100); const none100 = await blue();
  await setRange(page, 'speed', 200); expect(await blue()).toBeCloseTo(none100, 1);
  await page.locator('#wing button[data-v=high]').tap();
  await setRange(page, 'speed', 200); expect(await blue()).toBeGreaterThan(none100);
  const widths: number[] = [];
  for (const v of [100, 150, 200, 300]) { await setRange(page, 'speed', v); widths.push(await blue()); }
  console.log('파랑 막대 폭', none100, widths);
  for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThan(widths[i - 1]);
});

test('진행이 저장되어 끝낸 다음 미션부터 이어 감', async ({ page }) => {
  await start(page, ['M1', 'M2', 'M3']);
  await expect(page.locator('#tutTitle')).toHaveText('리어 윙이 하는 일');
});

test('진행 기록이 있으면 먼저 묻고, 처음부터를 고르면 기록을 지움', async ({ page }) => {
  await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('set')) { localStorage.setItem(k, v); sessionStorage.setItem('set', '1'); } }, [DONE, '["M1","M2","M3"]']);
  await page.goto(URL);
  await expect(page.locator('#tut')).toBeHidden();
  await expect(page.locator('#resumeGo')).toHaveText('이어서 하기 (M4부터)');
  await touchSizes(page, '이어서 묻기');
  await page.locator('#resumeNew').tap();
  await expect(page.locator('#resumeBox')).toBeHidden();
  await expect(page.locator('#tutTitle')).toHaveText('드라이버의 질문');
  expect(await page.evaluate(k => localStorage.getItem(k), DONE)).toBe('[]');
  await page.reload();
  await expect(page.locator('#resumeBox')).toBeHidden();
  await expect(page.locator('#tutTitle')).toHaveText('드라이버의 질문');
});

test('미션을 끝까지 하지 않고 나가도 미션 시작 버튼이 다시 물음', async ({ page }) => {
  await start(page, ['M1']);
  await page.locator('#tutSkip').tap();
  await page.locator('#tutOpen').tap();
  await expect(page.locator('#resumeGo')).toHaveText('이어서 하기 (M2부터)');
  await page.locator('#resumeGo').tap();
  await expect(page.locator('#tutTitle')).toHaveText('드라이버의 두 번째 질문');
});

test('깨진 저장값은 처음부터', async ({ page }) => {
  await page.addInitScript(k => localStorage.setItem(k, '{'), DONE);
  await page.goto(URL);
  await expect(page.locator('#tutTitle')).toHaveText('드라이버의 질문');
});

test('영어: 한글이 남지 않고 입력값이 유지됨', async ({ page }) => {
  await start(page, ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']);
  await next(page); await next(page); await next(page);
  await page.locator('#radioIn').fill('20');
  await page.locator('#langBtn').tap();
  await expect(page.locator('#radioIn')).toHaveValue('20');
  await expect(page.locator('#radioGo')).toHaveText('Radio it in');
  const text = await page.locator('body').evaluate(b => [...b.querySelectorAll<HTMLElement>('*')].filter(e => e.offsetParent && !['SCRIPT', 'STYLE', 'BUTTON'].includes(e.tagName) && e.id !== 'langBtn').map(e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('')).join(' '));
  expect(text).not.toMatch(/[가-힣]/);
  await page.locator('#tutSkip').tap();
  await expect(page.locator('#notes')).toContainText('Rear wing drag');
});

// WCAG 상대 휘도 대비 (NFR-006)
const contrast = (page: Page, sel: string) => page.locator(sel).evaluate(el => {
  const rgb = (s: string) => s.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  const lum = (c: number[]) => { const [r, g, b] = c.map(v => { const x = v / 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
  let bg = el as HTMLElement | null, color = 'rgba(0, 0, 0, 0)';
  while (bg) { color = getComputedStyle(bg).backgroundColor; if (!/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(color)) break; bg = bg.parentElement; }
  const a = lum(rgb(getComputedStyle(el).color)), b = lum(rgb(color));
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
});

for (const scheme of ['light', 'dark'] as const) test(`${scheme} 테마 대비 4.5:1 이상`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await start(page, ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8']);
  await page.locator('#tutSkip').tap();
  await expect(page.locator('#graphNote')).not.toBeEmpty();
  for (const sel of ['#cond', '#limit', '#graphNote', '#reqV', '.note-list', 'label[for=speed]']) expect(await contrast(page, sel), sel).toBeGreaterThanOrEqual(4.5);
});
