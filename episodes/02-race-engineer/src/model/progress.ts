// 끝낸 미션 저장 형식: ["M1","M2"]. 값이 없거나 깨져 있으면 처음 상태
export function parseDone(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

// 끝내지 않은 첫 미션의 단계 번호. 처음이거나 모두 끝냈으면 소개부터
export function resumeIndex(stepMissions: (string | undefined)[], done: string[]): number {
  if (!done.length) return 0;
  const i = stepMissions.findIndex(m => m !== undefined && !done.includes(m));
  return i < 0 ? 0 : i;
}

// 이어서 할 미션 이름. 시작 전이거나 모두 끝냈으면 null
export function nextMission(stepMissions: (string | undefined)[], done: string[]): string | null {
  if (!done.length) return null;
  return stepMissions.find(m => m !== undefined && !done.includes(m)) ?? null;
}
