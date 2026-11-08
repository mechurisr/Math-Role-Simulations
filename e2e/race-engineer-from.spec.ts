// 레이스 엔지니어 확인용 바로가기 ?from=M8 (kitty-specs/race-engineer-from-url-01M6X3KZ, Issue #34)
// 시작 위치만 바꾸고 진행 기록은 바꾸지 않는지 확인
import { expect, test, type Page } from '@playwright/test';

const URL = '/episodes/02-race-engineer/';
const DONE = 'series:race-engineer:done';
test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });

const open = async (page: Page, query: string, done?: string[]) => {
  if (done) await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, [DONE, JSON.stringify(done)]);
  await page.goto(URL + query);
};
const record = (page: Page) => page.evaluate(k => localStorage.getItem(k), DONE);
const title = (page: Page) => page.locator('#tutTitle');
const next = (page: Page) => page.locator('#tutNext').tap();

test('기록 없이 ?from=M8: 질문 없이 M8 첫 단계, 기록은 비어 있음, M8을 끝내면 M8만 기록', async ({ page }) => {
  await open(page, '?from=M8');
  await expect(page.locator('#tut')).toBeVisible();
  await expect(page.locator('#resumeBox')).toBeHidden();
  await expect(title(page)).toHaveText('드라이버의 마지막 질문');
  expect(await record(page)).toBeNull();
  await next(page); await next(page); await next(page);
  await expect(title(page)).toHaveText('M8 남은 제동 찾기');
  expect(await record(page)).toBeNull();
  await page.locator('#radioIn').fill('20.2'); await page.locator('#radioGo').tap();
  await next(page);
  await expect(title(page)).toHaveText('M8 이 숫자가 뜻하는 것');
  expect(JSON.parse((await record(page))!)).toEqual(['M8']);
});

test('M1~M3 기록에서 ?from=M6: 6장 첫 단계, 기록 그대로, 닫고 다시 열면 평소처럼 이어서 하기', async ({ page }) => {
  await open(page, '?from=M6', ['M1', 'M2', 'M3']);
  await expect(page.locator('#resumeBox')).toBeHidden();
  await expect(title(page)).toHaveText('이상한 계산 결과');
  expect(JSON.parse((await record(page))!)).toEqual(['M1', 'M2', 'M3']);
  // 바로가기는 첫 시작에만: 튜토리얼을 닫고 다시 열면 기록대로 M4부터 이어서 하기를 물음
  await page.locator('#tutSkip').tap();
  await page.locator('#tutOpen').tap();
  await expect(page.locator('#resumeGo')).toHaveText('이어서 하기 (M4부터)');
  await page.locator('#resumeGo').tap();
  await expect(title(page)).toHaveText('리어 윙이 하는 일');
});

test('이미 끝낸 미션도 ?from=M8로 그 장의 첫 단계, 기록 그대로', async ({ page }) => {
  const all = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];
  await open(page, '?from=M8', all);
  await expect(page.locator('#resumeBox')).toBeHidden();
  await expect(title(page)).toHaveText('드라이버의 마지막 질문');
  expect(JSON.parse((await record(page))!)).toEqual(all);
});

for (const [query, expected] of [['?from=m3', '재지 않고 계산하기'], ['?from=M1', '드라이버의 질문'], ['?from=M8&x=1', '드라이버의 마지막 질문']] as const) {
  test(`${query}: ${expected}`, async ({ page }) => {
    await open(page, query, ['M1', 'M2', 'M3', 'M4', 'M5']);
    await expect(page.locator('#resumeBox')).toBeHidden();
    await expect(title(page)).toHaveText(expected);
    expect(JSON.parse((await record(page))!)).toEqual(['M1', 'M2', 'M3', 'M4', 'M5']);
  });
}

for (const query of ['?from=M9', '?from=abc', '?from=']) {
  test(`${query}: 값이 없을 때와 같음`, async ({ page }) => {
    // 기록 없음: 평소처럼 튜토리얼이 처음부터 자동으로 열림
    await open(page, query);
    await expect(title(page)).toHaveText('드라이버의 질문');
    expect(await record(page)).toBeNull();
    // 기록 있음: 평소처럼 이어서 할지 물음
    const p2 = await page.context().newPage();
    await p2.addInitScript(([k, v]) => localStorage.setItem(k, v), [DONE, JSON.stringify(['M1', 'M2'])]);
    await p2.goto(URL + query);
    await expect(p2.locator('#resumeGo')).toHaveText('이어서 하기 (M3부터)');
    await expect(p2.locator('#tut')).toBeHidden();
  });
}
