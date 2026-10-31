// 물리값. 출처와 상태: kitty-specs/race-engineer-01M68BAF/answers.md "Physical values"

// 중력가속도 g = 9.8 m/s². 표준중력 9.80665 m/s² (CGPM 1901, NIST SP 330)을 교과서 관례대로 반올림. 01 에피소드와 같은 값
export const G = 9.8;
// 차 질량 [game value]. 팩트체크 교차검증 조합 (m = 800, μ = 1.6, k = 3.2)
export const MASS = 800;   // kg
// 차 최고 속도 [game value]
export const TOP_SPEED_KMH = 340;

export type Surface = 'dry' | 'wet';
export type Wing = 'none' | 'mid' | 'high';

// 타이어 마찰계수 [game value]. 건조 값은 출처 없음(사람 결정).
// 젖음은 OpenStax University Physics Vol.1 표 6.1 고무–콘크리트 건조 1.0 / 젖음 0.5~0.7의 비율(약 0.6)을 1.6에 적용해 반올림
export const MU: Record<Surface, number> = { dry: 1.6, wet: 1.0 };
// 다운포스 계수 k [game value]. 다운포스 F = k v², k = ½ρC_L A (NASA Glenn, Lift Equation). 값 자체는 출처 없음
export const DOWNFORCE: Record<Wing, number> = { none: 0, mid: 1.6, high: 3.2 };   // kg/m
