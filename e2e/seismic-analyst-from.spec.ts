// 지진 분석관 확인용 바로가기 ?from= (FR-020, 02와 같은 규칙): 첫 시작만 그 미션의 첫 단계, 진행 기록은 바꾸지 않음
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });
const DONE = 'series:seismic-analyst:done';

test('?from=M7이면 M7 첫 단계로 열리고 앞 미션 기록은 남지 않음', async ({ page }) => {
  await page.goto('/episodes/03-seismic-analyst/?from=m7');
  await expect(page.locator('#tutTitle')).toContainText('M7 실제 지진');
  expect(await page.evaluate(k => localStorage.getItem(k), DONE)).toBeNull();
  await page.goto('/episodes/03-seismic-analyst/');
  await expect(page.locator('#tutTitle')).toContainText('재난 문자 발송팀이 기다립니다');
});

test('모르는 값은 무시하고 평소처럼 시작', async ({ page }) => {
  await page.goto('/episodes/03-seismic-analyst/?from=M9');
  await expect(page.locator('#tutTitle')).toContainText('재난 문자 발송팀이 기다립니다');
});
