import { describe, expect, it } from 'vitest';
import { gripLimit, msToKmh } from '../src/model/corner';
import { judgeDrive, judgeNumber, parsePositive } from '../src/model/judge';
import { nextMission, parseDone, resumeIndex } from '../src/model/progress';

const m1 = gripLimit({ radius: 80, mu: 1.6, k: 0 });
const limit = m1.kind === 'finite' ? msToKmh(m1.speed) : NaN;

describe('judgeDrive: M1', () => {
  it.each([[127.5, 'pass'], [122.51, 'pass'], [127, 'pass'], [123, 'pass'], [127.51, 'slid'], [128, 'slid'], [122.49, 'tooSlow'], [122, 'tooSlow']])('%d km/h → %s', (v, reason) => expect(judgeDrive(v, limit).reason).toBe(reason));
  it('한계와 같으면 통과', () => expect(judgeDrive(limit, limit).ok).toBe(true));
});

describe('judgeNumber', () => {
  it('M2 방향: v(80)/v(40) = 1.414, 역수는 불통과', () => {
    expect(judgeNumber('1.41', Math.SQRT2, .02).ok).toBe(true);
    expect(judgeNumber('0.71', Math.SQRT2, .02).reason).toBe('tooLow');
  });
  it('M3 ±2', () => {
    expect(judgeNumber('100.8', 100.8, 2).ok).toBe(true);
    expect(judgeNumber('102.8', 100.8, 2).ok).toBe(true);
    expect(judgeNumber('98.8', 100.8, 2).ok).toBe(true);
    expect(judgeNumber('102.9', 100.8, 2).reason).toBe('tooHigh');
    expect(judgeNumber('98.7', 100.8, 2).reason).toBe('tooLow');
  });
  it.each(['', '   ', 'abc', '0', '-5', 'Infinity'])('입력 %j는 무효', raw => expect(judgeNumber(raw, 100, 2)).toEqual({ ok: false, reason: 'invalid' }));
  it('소수와 공백 허용', () => expect(parsePositive(' 1.41 ')).toBe(1.41));
});

describe('진행 저장', () => {
  it.each([[null, []], ['', []], ['{', []], ['"M1"', []], ['["M1",3]', ['M1']]])('%j', (raw, want) => expect(parseDone(raw)).toEqual(want));
  const steps = [undefined, 'M1', 'M2', 'M2', 'M3'];
  it('끝내지 않은 첫 미션으로', () => expect(resumeIndex(steps, ['M1'])).toBe(2));
  it('처음이면 소개부터', () => expect(resumeIndex(steps, [])).toBe(0));
  it('이어서 할 미션', () => expect(nextMission(steps, ['M1'])).toBe('M2'));
  it('시작 전이면 물어볼 것 없음', () => expect(nextMission(steps, [])).toBeNull());
  it('모두 끝냈으면 물어볼 것 없음', () => expect(nextMission(steps, ['M1', 'M2', 'M3'])).toBeNull());
  it('모두 끝냈으면 처음부터', () => expect(resumeIndex(steps, ['M1', 'M2', 'M3'])).toBe(0));
});
