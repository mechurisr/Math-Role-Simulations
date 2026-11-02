import { describe, expect, it } from 'vitest';
import { cornerValues, gripLimit } from '../src/model/corner';
import { CORNERS, cornerWork, judgeCorner, NO_LIMIT_CORNER, racePassed } from '../src/model/race-radio';

const say = (raw: string) => ({ kind: 'number' as const, raw }), none = { kind: 'noLimit' as const };
const reason = (i: number, raw: string) => judgeCorner(CORNERS[i], say(raw)).reason;

describe('코너 표', () => {
  it.each([[0, 'finite'], [1, 'finite'], [2, 'finite'], [3, 'none'], [4, 'finite']])('코너 %d: %s', (i, kind) => expect(gripLimit(cornerValues(CORNERS[i])).kind).toBe(kind));
  it('한계 없는 코너 번호', () => expect(gripLimit(cornerValues(CORNERS[NO_LIMIT_CORNER])).kind).toBe('none'));
});

describe('judgeCorner: answers.md M7 표', () => {
  it.each([
    [0, '122.84', 'pass'], [0, '122.85', 'pass'], [0, '122.86', 'slid'], [0, '119.16', 'pass'], [0, '119.15', 'tooSlow'],
    [1, '324.21', 'pass'], [1, '324.21', 'pass'], [1, '324.22', 'slid'], [1, '314.49', 'pass'], [1, '314.47', 'tooSlow'],
    [2, '118.07', 'pass'], [2, '118.08', 'slid'], [2, '114.53', 'pass'], [2, '114.52', 'tooSlow'],
    [4, '111.12', 'pass'], [4, '111.14', 'slid'], [4, '107.79', 'pass'], [4, '107.78', 'tooSlow'],
  ])('코너 %d, %s km/h → %s', (i, raw, want) => expect(reason(i, raw)).toBe(want));
  it('한계 없는 코너는 "한계 없음"만 성공, 340도 실패', () => {
    expect(judgeCorner(CORNERS[3], none).ok).toBe(true);
    expect(reason(3, '340')).toBe('wantedNoLimit');
  });
  it('340 km/h를 넘는 입력도 그대로 판정', () => { expect(reason(1, '400')).toBe('slid'); expect(reason(3, '400')).toBe('wantedNoLimit'); });
  it('유한한 코너에서 "한계 없음"은 실패', () => expect(judgeCorner(CORNERS[0], none).ok).toBe(false));
  it.each(['', 'abc', '-1', '0'])('입력 %j는 무효', raw => expect(reason(3, raw)).toBe('invalid'));
});

describe('cornerWork: answers.md M7 표', () => {
  it.each([[0, 122.84], [1, 324.21], [2, 118.07], [4, 111.12]])('코너 %d 풀이의 끝값 %d km/h', (i, kmh) => expect(cornerWork(CORNERS[i]).solved!.kmh).toBeCloseTo(kmh, 2));
  it('코너 1의 중간값', () => {
    const w = cornerWork(CORNERS[0]);
    expect(w.mOverR).toBeCloseTo(13.3333, 4); expect(w.muK).toBeCloseTo(2.56, 10);
    expect(w.solved!.muMg).toBeCloseTo(12544, 8); expect(w.solved!.gap).toBeCloseTo(10.7733, 4);
    expect(w.solved!.v2).toBeCloseTo(1164.36, 2); expect(w.solved!.ms).toBeCloseTo(34.123, 3);
  });
  it('v²의 제곱근이 v와 같음', () => [0, 1, 2, 4].forEach(i => { const s = cornerWork(CORNERS[i]).solved!; expect(Math.sqrt(s.v2)).toBeCloseTo(s.ms, 10); }));
  it('코너 4는 풀이 숫자 없이 경계 반지름 156.25 m', () => {
    const w = cornerWork(CORNERS[NO_LIMIT_CORNER]);
    expect(w.solved).toBeNull(); expect(w.boundary).toBeCloseTo(156.25, 10); expect(w.mOverR).toBeLessThanOrEqual(w.muK);
  });
  it('윙이 없으면(k = 0) 경계 반지름이 없고 풀이는 있음', () => {
    const w = cornerWork({ radius: 60, surface: 'dry', wing: 'none' });
    expect(w.boundary).toBeNull(); expect(w.solved!.gap).toBeCloseTo(800 / 60, 10);
  });
});

describe('racePassed', () => {
  it('5개 모두', () => expect(racePassed([true, true, true, true, true])).toBe(true));
  it.each([0, 1, 2, 4])('코너 %d 하나만 틀리면 통과', i => { const r = Array(5).fill(true); r[i] = false; expect(racePassed(r)).toBe(true); });
  it('코너 4를 틀리면 나머지가 맞아도 불통과', () => expect(racePassed([true, true, true, false, true])).toBe(false));
  it('3개면 불통과', () => expect(racePassed([true, false, false, true, true])).toBe(false));
  it('끝나지 않았으면 불통과', () => expect(racePassed([true, true, true, true])).toBe(false));
});
