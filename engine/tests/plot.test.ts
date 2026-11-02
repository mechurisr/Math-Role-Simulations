import { describe, expect, it } from 'vitest';
import { linearScale } from '../src/ui/plot';

describe('linearScale', () => {
  it('양 끝과 가운데', () => {
    const s = linearScale(0, 100, 10, 110);
    expect([s(0), s(50), s(100)]).toEqual([10, 60, 110]);
  });
  it('뒤집힌 범위 (캔버스 y축)', () => expect(linearScale(0, 10, 200, 0)(2)).toBe(160));
  it('범위 밖은 그대로 연장', () => expect(linearScale(0, 10, 0, 100)(20)).toBe(200));
});
