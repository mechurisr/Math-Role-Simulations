import { describe, expect, it } from 'vitest';
import { gripLimit } from '../src/model/corner';
import { AXIS_MAX_KMH, graphRange } from '../src/model/graph-range';

const at = (radius: number) => graphRange(gripLimit({ radius, mu: 1.6, k: 3.2 }));

describe('graphRange: 건조·윙 높음', () => {
  it.each([[106, 'shown'], [122, 'shown'], [123, 'shown'], [151, 'shown'], [152, 'offAxis'], [156, 'offAxis'], [156.24, 'offAxis'], [156.25, 'noCrossing'], [156.26, 'noCrossing'], [200, 'noCrossing']])('r=%d → %s', (r, state) => expect(at(r).state).toBe(state));
  it('M4 교점은 답과 같음', () => expect(at(106).crossingKmh).toBeCloseTo(258.804, 2));
  it('340 km/h 아래 교점이면 축은 340 km/h', () => expect(at(100).xMaxKmh).toBe(340));
  it('최고 속도를 넘는 교점도 축 안에 들어옴', () => {
    const g = at(150);
    expect(g.crossingKmh!).toBeCloseTo(872.95, 1);
    expect(g.xMaxKmh).toBeGreaterThan(g.crossingKmh!);
    expect(g.xMaxKmh).toBeLessThanOrEqual(AXIS_MAX_KMH);
  });
  it('교점이 없으면 교점 값도 없음', () => { expect(at(200).crossingKmh).toBeNull(); expect(at(155).crossingKmh).toBeNull(); });
});
