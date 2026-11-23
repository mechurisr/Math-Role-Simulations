// 미션 단계 모음. 미션 파일은 Game만 알고 화면 세부는 모름
import { tr } from '@series/engine/i18n';
import type { StepState, TutStep } from '@series/engine/tutorial';
import type { Verdict } from '../model/judge';
import type { AnswerSpec } from '../view/answer';
import type { MapScene } from '../view/map';
import { circleSteps } from './circles';
import { epicentreSteps } from './epicenter';
import { gyeongjuSteps } from './gyeongju';
import { residualSteps } from './residual';
import type { Point } from '../model/constants';
import { distanceSteps } from './distance';

export type Control = 'dist' | 'rB' | 'est';
export type Panel = 'race' | 'record' | 'map';
// record: 보여 줄 지진 기록의 S-P 시간, confirmed: 판독이 확정된 상태로 열기, map: 지도에 그릴 것, rB: M4 슬라이더 처음 값
export interface Scene { panel?: Panel; distance?: number; record?: number; confirmed?: boolean; map?: MapScene; rB?: number; est?: Point; open: Control[] }
export interface Game {
  configure(s: Scene): void;
  target(c: Panel | Control): Element;
  markers(): { p: number; s: number };   // 지진 기록의 P·S 마커 위치 (기록 시작부터의 초)
  confirmRecord(): void;                 // 판독 통과: 마커를 정답 위치로 맞추고 잠금
  estimate(): Point;                     // M8 추정점 (지도 km)
  nudgeEst(dx: number, dy: number): void; // 추정점을 0.1 km 단위로 옮김
}
// calc: 답 입력란이 없어도 계산기를 켤 단계 (Issue #40)
export type MissionStep = TutStep & { mission?: string; answer?: AnswerSpec; calc?: boolean; done?: (s: StepState) => boolean };

export const missionSteps = (g: Game): MissionStep[] => [...distanceSteps(g), ...circleSteps(g), ...epicentreSteps(g), ...gyeongjuSteps(g), ...residualSteps(g)];

// 답 판정 결과 문구. 틀리면 방향과 힌트 (FR-007)
export function feedback(v: Verdict | undefined, good: string, hint: string) {
  if (!v) return '';
  if (v.ok) return `<p class="fb good">${good}</p>`;
  const why = { tooHigh: tr('너무 큽니다.', 'Too high.'), tooLow: tr('너무 작습니다.', 'Too low.'), notSameLine: tr('다른 직선입니다.', 'That is a different line.'), far: tr('정답에서 너무 멉니다.', 'Too far from the answer.'), invalid: tr('숫자를 입력해 주세요. 직선은 a와 b가 둘 다 0이면 안 됩니다.', 'Enter numbers. For a line, a and b cannot both be 0.') }[v.reason];
  return `<p class="fb bad">${why} ${v.reason === 'invalid' ? '' : hint}</p>`;
}

// 답을 받는 단계의 공통 처리. 한 번 맞히면 다시 틀려도 통과 상태 유지
export function answerOn(check: (raw: string[]) => Verdict) {
  return { answer: (s: StepState, a?: unknown) => { s.v = check(a as string[]); s.ok = s.ok || s.v.ok; } };
}
