// 03 전용 선 색. 엔진 테마의 주황(accent)·초록(good)은 밝은 테마의 바탕 위에서 대비가 4.5:1에 못 미쳐(3.2 ~ 4.6)
// 선·글자에 쓰는 색만 이 에피소드에서 진하게 정한다 (NFR-006). 값과 대비는 style.css 주석, e2e/seismic-analyst.spec.ts가 잰다
import { readCssVars, THEME_KEYS, type ThemeColors } from '@series/engine/ui';

export const LINE_KEYS = ['s', 'c3', 'coast', 'land'] as const;   // S파·관측소 B, 관측소 C, 해안선, M7 육지
export type Colors = ThemeColors & Record<typeof LINE_KEYS[number], string>;
export const readColors = (): Colors => readCssVars([...THEME_KEYS, ...LINE_KEYS]) as Colors;
