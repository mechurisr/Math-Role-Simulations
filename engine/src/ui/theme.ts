// 캔버스는 CSS 변수를 직접 못 쓰므로 --이름 값을 읽어 와 색 문자열로 씀
export function readCssVars<K extends string>(keys: readonly K[]): Record<K, string> {
  const s = getComputedStyle(document.documentElement), out = {} as Record<K, string>;
  keys.forEach(k => out[k] = s.getPropertyValue('--' + k).trim());
  return out;
}
// 스타일시트가 늦게 적용되는 브라우저(WebKit, 캐시 없이 처음 열 때)는 모듈 스크립트가 돌 때 CSS 변수가 아직 비어 있음.
// load는 스타일시트까지 다 읽은 뒤 오므로 그때 한 번 더 cb. 이미 다 읽었으면 아무것도 안 함 (Issue #36)
export function afterStylesLoaded(cb: () => void, doc: Pick<Document, 'readyState'> = document, win: Pick<Window, 'addEventListener'> = window): void {
  if (doc.readyState !== 'complete') win.addEventListener('load', () => cb(), { once: true });
}
// 시스템 다크 모드 전환과 <html data-theme> 변경을 모두 감지. 처음 열 때 스타일이 늦게 적용되면 그 뒤에도 한 번 부름
export function onThemeChange(cb: () => void): void {
  afterStylesLoaded(cb);
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', cb); } catch { /* 구형 브라우저 */ }
  new MutationObserver(cb).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
export const THEME_KEYS = ['bg', 'panel', 'ink', 'muted', 'line', 'accent', 'blue', 'ground', 'ground2', 'sky', 'good', 'bad'] as const;
export type ThemeColors = Record<typeof THEME_KEYS[number], string>;
