// 판정 경계. 기대값은 answers.md M1 (25.0 s, 통과 24.5 ~ 25.5)
import { describe, expect, it } from 'vitest';
import { judgeValue, parseNumber } from '../src/model/judge';
import { nextMission, parseDone, resumeIndex } from '../src/model/progress';
import { spTime } from '../src/model/waves';

describe('parseNumber', () => {
  it('빈 값·숫자 아님은 null', () => { expect(parseNumber('')).toBeNull(); expect(parseNumber('  ')).toBeNull(); expect(parseNumber('abc')).toBeNull(); });
  it('positive면 0 이하는 null', () => { expect(parseNumber('0', { positive: true })).toBeNull(); expect(parseNumber('-3', { positive: true })).toBeNull(); });
  it('좌표·계수는 음수 허용, 유니코드 빼기표도', () => { expect(parseNumber('-3')).toBe(-3); expect(parseNumber('−3')).toBe(-3); expect(parseNumber(' 12.5 ')).toBe(12.5); });
});

describe('M1 판정 (정답 25 s, ±0.5)', () => {
  const ans = spTime(210);
  it.each(['24.5', '25', '25.5'])('%s 통과', raw => expect(judgeValue(raw, ans, 0.5, { positive: true }).ok).toBe(true));
  it('24.49는 낮음, 25.51은 높음', () => {
    expect(judgeValue('24.49', ans, 0.5, { positive: true })).toEqual({ ok: false, reason: 'tooLow' });
    expect(judgeValue('25.51', ans, 0.5, { positive: true })).toEqual({ ok: false, reason: 'tooHigh' });
  });
  it.each(['', 'abc', '0', '-3'])('"%s"는 invalid', raw => expect(judgeValue(raw, ans, 0.5, { positive: true })).toEqual({ ok: false, reason: 'invalid' }));
});

describe('진행 저장', () => {
  const steps = [undefined, 'M1', 'M1', 'M2', undefined];
  it('깨진 값은 처음 상태', () => { expect(parseDone('{')).toEqual([]); expect(parseDone('[1,"M1"]')).toEqual(['M1']); expect(parseDone(null)).toEqual([]); });
  it('끝내지 않은 첫 미션부터', () => { expect(resumeIndex(steps, [])).toBe(0); expect(resumeIndex(steps, ['M1'])).toBe(3); expect(resumeIndex(steps, ['M1', 'M2'])).toBe(0); });
  it('이어서 할 미션 이름', () => { expect(nextMission(steps, [])).toBeNull(); expect(nextMission(steps, ['M1'])).toBe('M2'); expect(nextMission(steps, ['M1', 'M2'])).toBeNull(); });
});

describe('좌표 판정 (±1 km)', () => {
  it('경계 포함', async () => {
    const { judgePoint } = await import('../src/model/judge');
    expect(judgePoint({ x: 101, y: 140 }, { x: 100, y: 140 }, 1).ok).toBe(true);
    expect(judgePoint({ x: 100.71, y: 140.71 }, { x: 100, y: 140 }, 1)).toEqual({ ok: false, reason: 'far' });
    expect(judgePoint(null, { x: 100, y: 140 }, 1)).toEqual({ ok: false, reason: 'invalid' });
  });
});
