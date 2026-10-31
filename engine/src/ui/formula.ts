// 수식 표시: 브라우저 기본 MathML (의존성 없음, MDN Baseline widely available https://developer.mozilla.org/en-US/docs/Web/MathML)
// 각 함수는 MathML 조각 문자열을 돌려줌. 글자는 이스케이프하므로 조각끼리만 이어 붙일 것
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const mi = (s: string) => `<mi>${esc(s)}</mi>`;
export const mn = (n: number | string) => `<mn>${esc(String(n))}</mn>`;
export const mo = (s: string) => `<mo>${esc(s)}</mo>`;
export const row = (...parts: string[]) => `<mrow>${parts.join('')}</mrow>`;
export const frac = (top: string, bottom: string) => `<mfrac>${top}${bottom}</mfrac>`;
export const root = (...parts: string[]) => `<msqrt>${parts.join('')}</msqrt>`;
export const sup = (base: string, exp: string) => `<msup>${base}${exp}</msup>`;
export const math = (...parts: string[]) => `<math display="block">${parts.join('')}</math>`;
