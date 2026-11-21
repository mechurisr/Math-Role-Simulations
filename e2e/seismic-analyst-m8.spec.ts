// 지진 분석관 M8 (심화): 바로가기로 열어 카드 안 화살표 버튼만으로 최소점까지, 끄는 동안 스크롤 안 됨, 터치 크기
// 기대값: answers.md M8 (① 52.92, ② (96.58, 136.16) ±1 km)
import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 180_000 });
test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });

test('M8을 버튼과 끌기로 완주', async ({ page }) => {
  await page.goto('/episodes/03-seismic-analyst/?from=M8');
  await expect(page.locator('#tutTitle')).toContainText('M8'); await page.locator('#tutNext').tap();
  await page.locator('#answerIn0').fill('52.92'); await page.locator('#answerGo').tap();
  await expect(page.locator('#tutBody .fb')).toContainText('52.92'); await page.locator('#tutNext').tap(); await page.locator('#tutNext').tap();
  await expect(page.locator('#resF')).toHaveText('52.92');
  // 끌기: 지도 위쪽(카드에 가리지 않는 곳)에서. 페이지가 스크롤되지 않고 점만 움직임.
  // Firefox는 isMobile 에뮬레이션에서 page.mouse가 포인터 이벤트를 보내지 않아(2026-11-21 확인) 터치 포인터 이벤트를 직접 보냄
  await page.locator('#map').scrollIntoViewIfNeeded();
  await expect(page.locator('#map')).toHaveCSS('touch-action', 'none');
  // 단계 진입 때 시작된 부드러운 스크롤이 멈춘 뒤에 기준값을 잼
  await page.waitForFunction(() => new Promise(res => { const a = scrollY; setTimeout(() => res(scrollY === a), 300); }));
  const y0 = await page.evaluate(() => scrollY), before = await page.locator('#resAt').textContent();
  await page.locator('#map').evaluate(c => {
    const r = c.getBoundingClientRect(), x0 = r.left + r.width / 2, ys = r.top + 60;
    const fire = (type: string, x: number, y: number) => c.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }));
    fire('pointerdown', x0, ys); for (let i = 1; i <= 5; i++) fire('pointermove', x0 - 6 * i, ys + 6 * i); fire('pointerup', x0 - 30, ys + 30);
  });
  await expect(page.locator('#resAt')).not.toHaveText(before!);
  expect(await page.evaluate(() => scrollY)).toBe(y0);
  // 끈 점에서 버튼으로 (96.6, 136.2)까지
  const at = (await page.locator('#resAt').textContent())!.match(/\(([-\d.]+), ([-\d.]+)\)/)!;
  const moves: [string, number][] = [[(96.6 - +at[1]) > 0 ? 'e:1:0' : 'e:-1:0', Math.round(Math.abs(96.6 - +at[1]) * 10)], [(136.2 - +at[2]) > 0 ? 'e:0:1' : 'e:0:-1', Math.round(Math.abs(136.2 - +at[2]) * 10)]];
  for (const [act, n] of moves) for (let i = 0; i < n; i++) await page.locator(`[data-act="${act}"]`).tap();
  await expect(page.locator('#resAt')).toContainText('(96.6, 136.2)');
  await expect(page.locator('.est-f')).toHaveText('1.39');
  const sizes = await page.locator('.est-pad button, [data-act=sendEst]').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }));
  expect(sizes.length).toBe(5);
  for (const [w, h] of sizes) { expect(w).toBeGreaterThanOrEqual(44); expect(h).toBeGreaterThanOrEqual(44); }
  await page.locator('[data-act=sendEst]').tap(); await expect(page.locator('#tutBody .fb')).toContainText('찾았습니다');
  await page.locator('#tutNext').tap(); await expect(page.locator('#tutBody')).toContainText('5.1 km');
});
