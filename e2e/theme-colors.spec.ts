// 처음 열 때(캐시 없는 새 컨텍스트) 캔버스가 테마 색으로 그려지는지 (kitty-specs/webkit-theme-colors-01M6X62J, Issue #36)
// WebKit은 스크립트가 돌 때 CSS 변수가 비어 있어 예전에는 load 뒤에도 검정으로만 그렸음. CI 에서는 세 엔진으로 실행
// 캔버스마다 따로 단언: 한 장만 다시 검정이 되는 부분 회귀도 잡도록 (SC-001, PR #37 크로스체크 [권장] 2)
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 } });

const RACE = '/episodes/02-race-engineer/';
// [이름, 주소, 반드시 그려져야 하는 캔버스, 열고 나서 할 일]
const PAGES: [string, string, string[], ((page: Page) => Promise<void>)?][] = [
  ['레이스 엔지니어', RACE, ['stage']],
  ['자주포', '/episodes/01-calculus-howitzer/', ['field', 'chart']],
  // 마찰원은 M8 첫 단계에서야 보이므로 M1~M7을 마친 상태로 이어 하기 (Issue #36이 처음 보고된 그림)
  ['레이스 엔지니어 M8 마찰원', RACE, ['circle'], async page => {
    await page.locator('#resumeGo').click();
    await page.locator('#tutNext').click();
    await expect(page.locator('#circleBox')).toBeVisible();
  }],
];

for (const scheme of ['light', 'dark'] as const) for (const [name, url, need, then] of PAGES) {
  test(`${name} ${scheme}: load 뒤 캔버스마다 테마 색이 쓰임`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    // load 뒤의 그리기에서 쓴 색을 캔버스별로 모음 (init script의 load 리스너가 페이지 것보다 먼저 등록되어 먼저 불림)
    await page.addInitScript(m8 => {
      if (m8) localStorage.setItem('series:race-engineer:done', JSON.stringify(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']));
      const w = window as unknown as { used: [string, string][]; loaded: boolean }; w.used = []; w.loaded = false;
      addEventListener('load', () => { w.loaded = true; });
      const P = CanvasRenderingContext2D.prototype;
      for (const k of ['fill', 'stroke', 'fillText', 'fillRect'] as const) {
        const orig = P[k] as (...a: unknown[]) => void;
        (P as unknown as Record<string, unknown>)[k] = function (this: CanvasRenderingContext2D, ...a: unknown[]) {
          if (w.loaded && this.canvas.id) w.used.push([this.canvas.id, String(k === 'stroke' ? this.strokeStyle : this.fillStyle)]);
          return orig.apply(this, a);
        };
      }
    }, !!then);
    await page.goto(url);
    await then?.(page);
    await expect.poll(() => page.evaluate(need => {
      const ids = new Set((window as unknown as { used: [string, string][] }).used.map(([id]) => id));
      return need.filter(id => !ids.has(id));
    }, need), '그려져야 하는 캔버스').toEqual([]);
    const r = await page.evaluate(() => {
      // 테마 변수를 캔버스가 쓰는 표기(#rrggbb)로 바꿔 비교
      const cx = document.createElement('canvas').getContext('2d')!, s = getComputedStyle(document.documentElement);
      const norm = (v: string) => { cx.fillStyle = '#010203'; cx.fillStyle = v; return cx.fillStyle; };
      const theme = new Set(['ink', 'accent', 'blue', 'ground', 'good', 'bad', 'muted', 'line'].map(k => s.getPropertyValue('--' + k).trim()).filter(Boolean).map(norm));
      const by: Record<string, { used: string[]; hits: number }> = {};
      for (const [id, c] of (window as unknown as { used: [string, string][] }).used) {
        const e = by[id] ??= { used: [], hits: 0 };
        if (!e.used.includes(c)) { e.used.push(c); if (theme.has(c)) e.hits++; }
      }
      return { theme: [...theme], by };
    });
    for (const [id, e] of Object.entries(r.by)) console.log(`${name} ${scheme} #${id}: 쓴 색 ${e.used.join(' ')} / 테마 색과 일치 ${e.hits}`);
    expect(r.theme.length, '테마 변수').toBeGreaterThan(0);
    // load 뒤 그린 캔버스는 모두 (반드시 그려져야 하는 것 포함) 테마 색을 하나 이상 써야 함
    for (const [id, e] of Object.entries(r.by)) expect(e.hits, `${name} #${id}: 테마 색으로 그린 것이 있어야 함 (쓴 색 ${e.used.join(' ')})`).toBeGreaterThan(0);
  });
}
