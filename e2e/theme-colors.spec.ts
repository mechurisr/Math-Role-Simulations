// 처음 열 때(캐시 없는 새 컨텍스트) 캔버스가 테마 색으로 그려지는지 (kitty-specs/webkit-theme-colors-01M6X62J, Issue #36)
// WebKit은 스크립트가 돌 때 CSS 변수가 비어 있어 예전에는 load 뒤에도 검정으로만 그렸음. CI 에서는 세 엔진으로 실행
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 } });

const PAGES = [
  ['레이스 엔지니어', '/episodes/02-race-engineer/'],
  ['자주포', '/episodes/01-calculus-howitzer/'],
] as const;

for (const scheme of ['light', 'dark'] as const) for (const [name, url] of PAGES) {
  test(`${name} ${scheme}: load 뒤 캔버스에 테마 색이 쓰임`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    // load 뒤의 그리기에서 쓴 색만 모음 (init script의 load 리스너가 페이지 것보다 먼저 등록되어 먼저 불림)
    await page.addInitScript(() => {
      const w = window as unknown as { used: string[]; loaded: boolean }; w.used = []; w.loaded = false;
      addEventListener('load', () => { w.loaded = true; });
      const P = CanvasRenderingContext2D.prototype;
      for (const k of ['fill', 'stroke', 'fillText', 'fillRect'] as const) {
        const orig = P[k] as (...a: unknown[]) => void;
        (P as unknown as Record<string, unknown>)[k] = function (this: CanvasRenderingContext2D, ...a: unknown[]) {
          if (w.loaded) w.used.push(String(k === 'stroke' ? this.strokeStyle : this.fillStyle));
          return orig.apply(this, a);
        };
      }
    });
    await page.goto(url);
    await expect.poll(() => page.evaluate(() => (window as unknown as { used: string[] }).used.length)).toBeGreaterThan(0);
    const r = await page.evaluate(() => {
      // 테마 변수를 캔버스가 쓰는 표기(#rrggbb)로 바꿔 비교
      const cx = document.createElement('canvas').getContext('2d')!, s = getComputedStyle(document.documentElement);
      const norm = (v: string) => { cx.fillStyle = '#010203'; cx.fillStyle = v; return cx.fillStyle; };
      const theme = new Set(['ink', 'accent', 'blue', 'ground', 'good', 'bad', 'muted', 'line'].map(k => s.getPropertyValue('--' + k).trim()).filter(Boolean).map(norm));
      const used = [...new Set((window as unknown as { used: string[] }).used)];
      return { theme: [...theme], used, hits: used.filter(c => theme.has(c)) };
    });
    console.log(`${name} ${scheme}: 쓴 색 ${r.used.join(' ')} / 테마 색과 일치 ${r.hits.length}`);
    expect(r.theme.length, '테마 변수').toBeGreaterThan(0);
    expect(r.hits.length, `${name}: 테마 색으로 그린 것이 있어야 함`).toBeGreaterThan(0);
  });
}
