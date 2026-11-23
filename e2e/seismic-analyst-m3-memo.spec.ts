// 지진 분석관 M3 후보 판정: 식 표시·메모 칸·계산기 (Issue #40, kitty-specs/seismic-m3-memo-01M81BVG).
// 메모 칸은 채점하지 않음 — 판정·통과는 버튼 선택만으로 (수락 시나리오 4). 360px 터치. CI 에서는 세 엔진으로 실행
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });

const next = (page: Page) => page.locator('#tutNext').tap();
const title = (page: Page) => page.locator('#tutTitle');
const memos = (page: Page) => page.locator('#tutBody input.memo');
const fab = (page: Page) => page.locator('#calcFab');
// 정답 판정: ①②③ 원 위, ④⑤ 아님 (answers.md M3)
const RIGHT: [number, 0 | 1][] = [[0, 1], [1, 1], [2, 1], [3, 0], [4, 0]];

// ?from=M3 → 연습 지도 → 거리 105 → 원의 방정식 → 후보 판정 단계
async function toSort(page: Page) {
  await page.goto('/episodes/03-seismic-analyst/?from=M3');
  await expect(title(page)).toContainText('연습 지도'); await next(page);
  await page.locator('#answerIn0').fill('105'); await page.locator('#answerGo').tap(); await next(page);
  await expect(title(page)).toContainText('M3 원의 방정식');
  await expect(fab(page), '앞 단계(답 입력란 없음)는 계산기 숨김').toBeHidden();
  await next(page);
  await expect(title(page)).toContainText('M3 진앙 후보 가려내기');
}

// 360px: 메모 칸이 각 후보의 "원 위" 버튼 왼쪽 같은 줄, 44px 이상, "아님" 버튼까지 본문 안
async function rowLayout(page: Page, lang: string) {
  for (let i = 0; i < 5; i++) {
    const m = (await memos(page).nth(i).boundingBox())!, on = (await page.locator(`[data-act="c${i}:1"]`).boundingBox())!;
    console.log(`[${lang}] 후보 ${i + 1} 메모 칸 ${m.width.toFixed(0)}×${m.height.toFixed(0)} @${m.x.toFixed(0)}, 원 위 버튼 @${on.x.toFixed(0)}`);
    expect(m.x + m.width, `[${lang}] 후보 ${i + 1} 칸이 버튼 왼쪽`).toBeLessThanOrEqual(on.x);
    expect(Math.abs((m.y + m.height / 2) - (on.y + on.height / 2)), `[${lang}] 후보 ${i + 1} 같은 줄`).toBeLessThan(4);
    expect(m.width).toBeGreaterThanOrEqual(44); expect(m.height).toBeGreaterThanOrEqual(44);
    // 오른쪽 "아님" 버튼이 튜토리얼 본문 안에 다 들어옴 (카드 안 넘침은 페이지 가로 스크롤로 안 잡힘)
    const off = (await page.locator(`[data-act="c${i}:0"]`).boundingBox())!, bodyBox = (await page.locator('#tutBody').boundingBox())!;
    console.log(`[${lang}] 후보 ${i + 1} 아님 버튼 오른쪽 ${(off.x + off.width).toFixed(0)}, 본문 오른쪽 ${(bodyBox.x + bodyBox.width).toFixed(0)}`);
    expect(off.x + off.width, `[${lang}] 후보 ${i + 1} 아님 버튼이 본문 안`).toBeLessThanOrEqual(bodyBox.x + bodyBox.width + 0.5);
  }
}

test('식이 문제 위에, 메모 칸이 각 후보의 버튼 왼쪽 한 줄에 있고 계산기를 쓸 수 있다', async ({ page }) => {
  await toSort(page);
  // 식이 본문 첫 요소이고 첫 문단보다 위
  const first = await page.locator('#tutBody > *').first().evaluate(e => e.tagName.toLowerCase());
  expect(first).toBe('math');
  await expect(page.locator('#tutBody > math')).toContainText('105');
  await expect(memos(page)).toHaveCount(5);
  await rowLayout(page, '한국어');
  // 영문은 "Not on"이 "아님"보다 넓어 여유가 줄어듦 — 같은 배치를 다시 잼
  await page.locator('#langBtn').tap(); await expect(title(page)).toContainText('Sort the candidates');
  await rowLayout(page, 'English');
  await page.locator('#langBtn').tap();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await expect(memos(page).first()).toHaveAttribute('inputmode', 'decimal');
  // 계산기: ④ (100, 100)의 좌변 84² + 23² = 7585
  await expect(fab(page)).toBeVisible(); await fab(page).tap();
  for (const k of ['8', '4', '^', '2', '+', '2', '3', '^', '2', '=']) await page.locator(`.calc-keys [data-key="${k}"]`).tap();
  await expect(page.locator('#calcRes')).toHaveText('7585');
});

test('메모는 다시 그려져도 남고, 판정에 쓰이지 않으며, 단계를 다시 들어오면 비워진다', async ({ page }) => {
  await toSort(page);
  // 일부러 틀린 값을 적음 — 판정은 버튼만 봄
  await memos(page).nth(0).fill('11025'); await memos(page).nth(3).fill('999');
  for (const [i, v] of RIGHT) await page.locator(`[data-act="c${i}:${v}"]`).tap();
  await expect(memos(page).nth(0)).toHaveValue('11025');
  await page.locator('[data-act=check]').tap();
  await expect(page.locator('#tutBody .fb')).toContainText('모두 맞습니다');
  await expect(page.locator('#tutNext')).toBeEnabled();
  await page.locator('#langBtn').tap();
  await expect(page.locator('#tutBody .fb')).toContainText('All right');
  await expect(memos(page).nth(0)).toHaveValue('11025'); await expect(memos(page).nth(3)).toHaveValue('999');
  await expect(memos(page).nth(0)).toHaveAttribute('aria-label', /note/);
  await page.locator('#langBtn').tap();
  // 다음 단계(답 입력란 없음)는 계산기 숨김. 돌아오면 선택과 메모 모두 처음부터
  await next(page); await expect(title(page)).toContainText('M3 왜 중요할까요');
  await expect(fab(page)).toBeHidden();
  await page.locator('#tutPrev').tap(); await expect(title(page)).toContainText('M3 진앙 후보 가려내기');
  for (let i = 0; i < 5; i++) await expect(memos(page).nth(i)).toHaveValue('');
});

// 낮은 휴대폰: 계산기를 펼치면 카드가 38vh로 줄고, 이 단계는 보내기 칸이 없어 자동 스크롤도 없음.
// 학습자가 카드 안을 스크롤해 아래쪽 ④⑤ 메모 칸에 닿고, 계산기에 가리지 않는지 잰다 (PR #41 크로스체크)
for (const height of [568, 640]) {
  test.describe(`360×${height}`, () => {
    test.use({ viewport: { width: 360, height } });
    test('계산기를 펼친 채 모든 후보의 메모 칸에 닿아 적을 수 있다', async ({ page }) => {
      await toSort(page);
      await fab(page).tap();
      await expect(page.locator('.calc-keys')).toBeVisible();
      for (let i = 0; i < 5; i++) {
        const m = memos(page).nth(i);
        await m.evaluate(e => e.scrollIntoView({ block: 'nearest' }));
        const b = (await m.boundingBox())!;
        // 칸 가운데를 누르면 칸 자신이 맞아야 함 (계산기·다른 요소에 가리면 실패)
        const hit = await page.evaluate(([x, y]) => (document.elementFromPoint(x, y) as HTMLElement | null)?.dataset.memo ?? null, [b.x + b.width / 2, b.y + b.height / 2]);
        console.log(`${height} 후보 ${i + 1} 메모 칸 y ${b.y.toFixed(0)}–${(b.y + b.height).toFixed(0)}, 가운데에 닿는 요소 data-memo=${hit}`);
        expect(hit, `${height} 후보 ${i + 1} 메모 칸이 가리지 않음`).toBe(String(i));
        expect(b.y, `${height} 후보 ${i + 1} 화면 안`).toBeGreaterThanOrEqual(0);
        expect(b.y + b.height).toBeLessThanOrEqual(height);
        await m.tap(); await m.fill(String(1000 + i));
      }
      await expect(page.locator('.calc-keys'), '메모를 적어도 계산기는 펼친 채').toBeVisible();
      for (let i = 0; i < 5; i++) await expect(memos(page).nth(i)).toHaveValue(String(1000 + i));
    });
  });
}
