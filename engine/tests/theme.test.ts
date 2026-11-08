import { describe, expect, it } from 'vitest';
import { afterStylesLoaded } from '../src/ui/theme';

// 가짜 window: addEventListener로 받은 리스너를 기록해 직접 부름
const fakeWin = () => {
  const calls: { type: string; once?: boolean; fn: () => void }[] = [];
  return { calls, win: { addEventListener: (type: string, fn: () => void, o?: AddEventListenerOptions) => calls.push({ type, once: o?.once, fn }) } as unknown as Pick<Window, 'addEventListener'> };
};

describe('afterStylesLoaded (Issue #36)', () => {
  for (const readyState of ['loading', 'interactive'] as const) {
    it(`${readyState}: load에서 한 번 부름`, () => {
      const { calls, win } = fakeWin(); let n = 0;
      afterStylesLoaded(() => n++, { readyState }, win);
      expect(n).toBe(0);
      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe('load'); expect(calls[0].once).toBe(true);
      calls[0].fn(); expect(n).toBe(1);
    });
  }
  it('complete: 이미 다 읽었으므로 등록하지 않음', () => {
    const { calls, win } = fakeWin(); let n = 0;
    afterStylesLoaded(() => n++, { readyState: 'complete' }, win);
    expect(calls).toHaveLength(0); expect(n).toBe(0);
  });
});
