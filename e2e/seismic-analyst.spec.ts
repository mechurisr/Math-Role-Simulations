// 지진 분석관: 360px 터치로 M1~M7 완주, 미션마다 터치 크기·가로 스크롤, M7 순서 강제, 교점 개수 경계, 테마 대비·언어
// (kitty-specs/seismic-analyst-01M7YB3D, 헌장 PRJ-004). 정답 숫자는 answers.md에서 가져옴. CI 에서는 세 엔진으로 실행
import { expect, test, type Page } from '@playwright/test';

const URL = '/episodes/03-seismic-analyst/';
const DONE = 'series:seismic-analyst:done';
test.describe.configure({ timeout: 300_000 });
test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });

const start = async (page: Page, done: string[] = []) => {
  if (done.length) await page.addInitScript(([k, v]) => { localStorage.setItem(k, v); }, [DONE, JSON.stringify(done)]);
  await page.goto(URL);
  if (done.length && done.length < 8) await page.locator('#resumeGo').tap();
  await expect(page.locator('#tut')).toBeVisible();
};
const next = (page: Page) => page.locator('#tutNext').tap();
const title = (page: Page) => page.locator('#tutTitle');
const feedback = (page: Page) => page.locator('#tutBody .fb');
const send = async (page: Page, ...vals: string[]) => {
  for (const [i, v] of vals.entries()) await page.locator('#answerIn' + i).fill(v);
  await page.locator('#answerGo').tap();
};
const setRange = (page: Page, id: string, v: number) => page.locator('#' + id).evaluate((e, v) => { (e as HTMLInputElement).value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const noHScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
// 지금 보이는 모든 조작 요소가 44×44 이상인지. 재는 요소가 없으면 실패
async function touchSizes(page: Page, where: string) {
  const sizes = await page.locator('button:not(.info):visible, input:visible').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { id: e.id || e.textContent, w: r.width, h: r.height }; }));
  expect(sizes.length, where).toBeGreaterThan(0);
  for (const s of sizes) { expect(s.w, `${where} ${s.id} 폭`).toBeGreaterThanOrEqual(44); expect(s.h, `${where} ${s.id} 높이`).toBeGreaterThanOrEqual(44); }
  await noHScroll(page);
}
// 지진 기록 마커를 ◀ ▶ 버튼으로 맞춤 (P 마커는 1.0 s, S 마커는 끝 − 1 s에서 시작)
async function setMarkers(page: Page, p: number, s: number) {
  for (const [k, target] of [['p', p], ['s', s]] as const) {
    const now = parseFloat((await page.locator(`#${k}V`).textContent())!), n = Math.round((target - now) * 10);
    const btn = page.locator(n > 0 ? `#${k}Plus` : `#${k}Minus`);
    for (let i = 0; i < Math.abs(n); i++) await btn.tap();
    await expect(page.locator(`#${k}V`)).toHaveText(target.toFixed(1) + ' s');
  }
}

test('M1~M7을 터치로 완주', async ({ page }) => {
  await start(page); await touchSizes(page, '소개'); await next(page);
  // M1: 슬라이더를 움직여야 다음으로
  await expect(page.locator('#tutNext')).toBeDisabled();
  await setRange(page, 'dist', 168); await expect(page.locator('#raceNote')).toContainText('S-P 시간 20.0 s'); await touchSizes(page, 'M1 슬라이더'); await next(page);
  await page.locator('[data-q="1"]').tap(); await next(page);
  for (const km of ['168', '252']) await page.locator(`[data-act="${km}"]`).tap();
  await expect(page.locator('#tutBody table')).toContainText('30.0 s'); await touchSizes(page, 'M1 재기'); await next(page); await next(page);
  await send(page, '24.4'); await expect(feedback(page)).toContainText('너무 작습니다');
  await send(page, 'abc'); await expect(feedback(page)).toContainText('숫자를');
  await send(page, '25'); await expect(feedback(page)).toContainText('25 s'); await touchSizes(page, 'M1 보내기'); await next(page); await next(page);
  // M2: 판독 → 확정 → 거리
  await expect(title(page)).toContainText('지진 기록 읽는 법'); await next(page);
  await setMarkers(page, 3.4, 18); await page.locator('[data-act=read]').tap(); await expect(feedback(page)).toContainText('P 마커');
  await setMarkers(page, 3, 18); await page.locator('[data-act=read]').tap(); await expect(feedback(page)).toContainText('15.0 s');
  await expect(page.locator('#pPlus')).toBeDisabled(); await touchSizes(page, 'M2 판독'); await next(page); await next(page);
  await send(page, '129'); await expect(feedback(page)).toContainText('너무 큽니다');
  await send(page, '126'); await expect(feedback(page)).toContainText('126 km'); await next(page); await next(page);
  // M3: 반지름 확정 → 후보 판정 (판정은 확정 반지름 105로)
  await expect(title(page)).toContainText('연습 지도'); await next(page);
  await send(page, '106.9'); await expect(feedback(page)).toContainText('105 km'); await next(page); await next(page);
  for (const [i, v] of [[0, 1], [1, 1], [2, 1], [3, 0], [4, 1]]) await page.locator(`[data-act="c${i}:${v}"]`).tap();
  await page.locator('[data-act=check]').tap(); await expect(page.locator('#tutBody .fb.bad')).toBeVisible();
  await page.locator('[data-act="c4:0"]').tap(); await page.locator('[data-act=check]').tap(); await expect(feedback(page)).toContainText('모두 맞습니다');
  await touchSizes(page, 'M3 후보'); await next(page); await next(page);
  // M4: 교점 개수 경계 (SC-003)
  for (const [r, text] of [[20, '교점 없음 (한 원이 다른 원 안)'], [21, '교점 1개'], [22, '교점 2개'], [188, '교점 2개'], [189, '교점 1개'], [190, '교점 없음 (한 원이 다른 원 안)']] as const) {
    await setRange(page, 'rB', r); await expect(page.locator('#mapNote')).toHaveText(new RegExp('^' + text.replace(/[()]/g, '\\$&')));
  }
  await touchSizes(page, 'M4 탐색'); await next(page);
  await send(page, '63'); await next(page); await next(page);
  await send(page, '1', '0', '101'); await expect(feedback(page)).toContainText('다른 직선');
  await send(page, '0', '0', '5'); await expect(feedback(page)).toContainText('0이면 안 됩니다');
  await send(page, '-168', '0', '-16800'); await expect(feedback(page)).toContainText('x = 100'); await touchSizes(page, 'M4 직선'); await next(page); await next(page);
  // M5·M6
  await send(page, '100', '14', '100', '140'); await expect(feedback(page)).toContainText('(100, 140)'); await next(page); await next(page); await next(page);
  await send(page, '8', '3', '842'); await expect(feedback(page)).toContainText('다른 직선');
  await send(page, '8', '3', '1220'); await expect(feedback(page)).toContainText('8x + 3y = 1220'); await next(page);
  await send(page, '100', '14'); await expect(page.locator('#tutBody table')).toContainText('151.43 km');
  await send(page, '100', '140'); await expect(feedback(page)).toContainText('(100, 140)'); await touchSizes(page, 'M6'); await next(page);
  await expect(page.locator('#tutBody')).toContainText('하나뿐'); await next(page);
  // M7: 관측소마다 판독을 통과해야 거리 입력이 열림 (US3 시나리오 1)
  await expect(title(page)).toContainText('실제 지진'); await next(page);
  const sps = [11.0, 6.8, 10.5], radii = ['92.4', '57.12', '88.2'];
  for (let i = 0; i < 3; i++) {
    await expect(title(page)).toContainText(`관측소 ${i + 1} 기록 판독`);
    await expect(page.locator('#answerIn0')).toBeHidden(); await expect(page.locator('#tutNext')).toBeDisabled();
    await setMarkers(page, 3, 3 + sps[i]); await page.locator('[data-act=read]').tap(); await expect(feedback(page)).toContainText(sps[i].toFixed(1) + ' s');
    await next(page); await send(page, radii[i]); await expect(feedback(page)).toContainText('원을 그렸습니다'); await next(page);
  }
  await send(page, '120', '87'); await expect(feedback(page)).toContainText('5 km');
  await send(page, '109.6', '87'); await expect(feedback(page)).toContainText('통과'); await touchSizes(page, 'M7'); await next(page);
  await expect(page.locator('#tutBody')).toContainText('13 km'); await expect(page.locator('#tutBody')).toContainText('USGS');
  await next(page);
  expect(JSON.parse((await page.evaluate(k => localStorage.getItem(k), DONE))!)).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']);
});

// NFR-006: 캔버스·문구에 쓰는 색이 라이트·다크 바탕 위에서 4.5:1 이상 (WCAG 대비비)
for (const scheme of ['light', 'dark'] as const) {
  test(`색 대비 4.5:1 이상 (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(URL);
    const ratios = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement), hex = (k: string) => css.getPropertyValue('--' + k).trim();
      const lum = (h: string) => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
      const out: { pair: string; r: number }[] = [];
      for (const fg of ['ink', 'muted', 'blue', 's', 'c3', 'coast', 'bad']) for (const bg of ['bg', 'panel', 'sky']) {
        const [a, b] = [lum(hex(fg)), lum(hex(bg))].sort((x, y) => y - x); out.push({ pair: `${fg}/${bg} ${hex(fg)} ${hex(bg)}`, r: (a + 0.05) / (b + 0.05) });
      }
      return out;
    });
    expect(ratios.length).toBe(21);
    for (const { pair, r } of ratios) expect(r, pair).toBeGreaterThanOrEqual(4.5);
    console.log(scheme, 'min contrast', Math.min(...ratios.map(x => x.r)).toFixed(2));
  });
}

// NFR-006 (PR #39 크로스체크 권장 1): M7 지도에 실제로 칠해진 육지·바다 픽셀 위에서 선·글자 색 대비 4.5:1 이상
for (const scheme of ['light', 'dark'] as const) {
  test(`M7 지도 육지·바다 픽셀 위 대비 4.5:1 이상 (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(URL + '?from=M7');
    await expect(page.locator('#tutTitle')).toContainText('M7 실제 지진');
    const out = await page.locator('#map').evaluate(c => {
      const cv = c as HTMLCanvasElement, r = cv.getBoundingClientRect(), d = cv.width / r.width;
      const side = Math.min(r.width - 38, r.height - 32);   // view/map.ts PAD (L 30, T 8, R 8, B 24)
      const px = (x: number, y: number) => { const i = cv.getContext('2d')!.getImageData(Math.round((30 + x / 200 * side) * d), Math.round((8 + side - y / 200 * side) * d), 1, 1).data; return [i[0], i[1], i[2]]; };
      const lum = (c: number[]) => { const v = c.map(x => x / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
      const css = getComputedStyle(document.documentElement), hex = (k: string) => { const h = css.getPropertyValue('--' + k).trim(); return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); };
      // 육지 확인점 (50, 130) km ≈ 36.17°N 128.56°E 내륙, 바다 확인점 (190, 30) km ≈ 130.1°E 동해. 격자선(20 km 간격)과 겹치지 않음
      const bgs = { land: px(50, 130), sea: px(190, 30) }, res: { pair: string; r: number }[] = [];
      for (const fg of ['ink', 'muted', 'blue', 's', 'c3', 'coast', 'bad']) for (const [k, bg] of Object.entries(bgs)) {
        const [a, b] = [lum(hex(fg)), lum(bg)].sort((x, y) => y - x); res.push({ pair: `${fg}/${k} rgb(${bg})`, r: (a + 0.05) / (b + 0.05) });
      }
      return { res, land: bgs.land, sea: bgs.sea, ratio: [cv.width / r.width, cv.height / r.height] };
    });
    // 캔버스 픽셀 수가 화면 크기에 맞는지 (WebKit 첫 로드에서 기본 300×150으로 남던 문제, PR #39)
    expect(Math.abs(out.ratio[0] - out.ratio[1]), `canvas ratio ${out.ratio}`).toBeLessThan(0.02);
    expect(out.land).not.toEqual(out.sea);   // 육지와 바다가 구별되게 칠해졌는지
    expect(out.res.length).toBe(14);
    for (const { pair, r } of out.res) expect(r, pair).toBeGreaterThanOrEqual(4.5);
    console.log(scheme, 'M7 land', out.land, 'sea', out.sea, 'min', Math.min(...out.res.map(x => x.r)).toFixed(2));
  });
}

test('테마를 바꿔도 캔버스가 그려지고, 언어를 바꿔도 입력값 유지', async ({ page }) => {
  await start(page, ['M1', 'M2']); await next(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const painted = await page.locator('#map').evaluate(c => {
    const cv = c as HTMLCanvasElement, d = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height).data;
    let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i + 3] > 0) n++; return n;
  });
  expect(painted).toBeGreaterThan(100);
  await page.locator('#answerIn0').fill('104');
  await page.locator('#langBtn').tap();
  await expect(page.locator('#tutTitle')).toContainText('Distance from A');
  await expect(page.locator('#answerIn0')).toHaveValue('104');
});
