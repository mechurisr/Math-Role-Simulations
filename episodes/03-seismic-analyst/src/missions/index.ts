// 미션 단계 모음. 미션 파일은 Game만 알고 화면 세부는 모름
import { tr } from '@series/engine/i18n';
import type { StepState, TutStep } from '@series/engine/tutorial';
import type { Verdict } from '../model/judge';
import type { AnswerSpec } from '../view/answer';
import { distanceSteps } from './distance';

export type Control = 'dist';
export interface Scene { distance?: number; open: Control[] }
export interface Game {
  configure(s: Scene): void;
  target(c: 'race' | Control): Element;
}
export type MissionStep = TutStep & { mission?: string; answer?: AnswerSpec; done?: (s: StepState) => boolean };

export const missionSteps = (g: Game): MissionStep[] => [...distanceSteps(g)];

// 답 판정 결과 문구. 틀리면 방향과 힌트 (FR-007)
export function feedback(v: Verdict | undefined, good: string, hint: string) {
  if (!v) return '';
  if (v.ok) return `<p class="fb good">${good}</p>`;
  const why = { tooHigh: tr('너무 큽니다.', 'Too high.'), tooLow: tr('너무 작습니다.', 'Too low.'), invalid: tr('숫자를 입력해 주세요.', 'Enter a number.') }[v.reason];
  return `<p class="fb bad">${why} ${v.reason === 'invalid' ? '' : hint}</p>`;
}

// 답을 받는 단계의 공통 처리. 한 번 맞히면 다시 틀려도 통과 상태 유지
export function answerOn(check: (raw: string[]) => Verdict) {
  return { answer: (s: StepState, a?: unknown) => { s.v = check(a as string[]); s.ok = s.ok || s.v.ok; } };
}
