// 기대값: answers.md M5·M6. 독립 기준: 구한 점을 두 직선 식에 다시 넣기, 세 원까지 거리
import { describe, expect, it } from 'vitest';
import { intersect, radicalLine, type Circle } from '../src/model/circles';
import { PRACTICE_STATIONS } from '../src/model/constants';
import { commonPoints, intersectLines } from '../src/model/system';
import { distanceFromSp } from '../src/model/waves';

const circles: Circle[] = PRACTICE_STATIONS.map(s => ({ center: s.pos, r: distanceFromSp(s.spTime) }));
const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(b)));

describe('system', () => {
  it('C 반지름 84', () => close(circles[2].r, 84));
  it('원 A − 원 C = 336x + 126y = 51240 (8x + 3y = 1220)', () => expect(radicalLine(circles[0], circles[2])).toEqual({ a: 336, b: 126, c: 51240 }));
  it('x = 100과 8x + 3y = 1220 → (100, 140)', () => {
    const p = intersectLines({ a: 1, b: 0, c: 100 }, { a: 8, b: 3, c: 1220 });
    expect(typeof p).toBe('object'); if (typeof p !== 'object') return;
    close(p.x, 100); close(p.y, 140);
    close(8 * p.x + 3 * p.y, 1220);   // 다시 넣어 확인
  });
  it('두 원의 직선끼리의 교점도 (100, 140)', () => {
    const p = intersectLines(radicalLine(circles[0], circles[1]), radicalLine(circles[0], circles[2]));
    if (typeof p !== 'object') throw new Error('no point'); close(p.x, 100); close(p.y, 140);
  });
  it('평행·같은 직선', () => {
    expect(intersectLines({ a: 1, b: 0, c: 100 }, { a: 2, b: 0, c: 50 })).toBe('parallel');
    expect(intersectLines({ a: 1, b: 0, c: 100 }, { a: 2, b: 0, c: 200 })).toBe('same');
  });
  it('세 원이 함께 지나는 점은 (100, 140) 하나, (100, 14)는 C에서 √22932 ≈ 151.43', () => {
    const r = intersect(circles[0], circles[1]); if (r.count !== 2) throw new Error('need 2');
    const common = commonPoints(circles, r.points);
    expect(common.length).toBe(1); close(common[0].x, 100); close(common[0].y, 140);
    close(Math.hypot(100 - 184, 14 - 140), Math.sqrt(22932)); close(Math.sqrt(22932), 151.43315356948756);
  });
});
