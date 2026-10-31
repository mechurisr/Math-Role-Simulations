// 미션 단계 모음. 미션 파일은 Game만 알고 화면 세부는 모름
import type { StepState, TutStep } from '@series/engine/tutorial';
import type { Surface, Wing } from '../model/constants';
import type { RadioSpec } from '../view/radio';
import { basicSteps } from './basic';
import { downforceSteps } from './downforce';
import { raceSteps } from './race';

export type Control = 'speed' | 'radius' | 'surface' | 'wing' | 'go';
export interface Scene { speed?: number; radius?: number; surface?: Surface; wing?: Wing; open: Control[]; limit?: boolean; graph?: boolean }
export interface Game {
  configure(s: Scene): void;
  condition(): string;      // 지금 조건 m·g·μ·k·r (FR-015)
  target(c: Control | 'stage' | 'forces'): Element;
  drive(kmh: number, slide: boolean): void;   // 판정이 정한 결과를 차로 보여 줌
  clearRadio(): void;
}
export interface Drive { kmh: number; slid: boolean }
export type MissionStep = TutStep & { mission?: string; radio?: RadioSpec; radioHidden?: (s: StepState) => boolean; done?: (s: StepState) => boolean };

export const missionSteps = (g: Game): MissionStep[] => [...basicSteps(g), ...downforceSteps(g), ...raceSteps(g)];
