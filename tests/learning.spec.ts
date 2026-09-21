import { test, expect, type Page } from "@playwright/test";
async function enter(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: /日文.*櫻花島/ }).click();
  await page.getByRole("button", { name: /LEVEL 01/ }).click();
  await page
    .getByRole("button", { name: "1 啟程・第一句話", exact: true })
    .click();
}
async function lesson(page: Page, pass = true) {
  await page
    .getByRole("button", {
      name: pass ? "1 你好。" : "2 請給我水。",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "確認答案" }).click();
  await page.getByRole("button", { name: "下一題" }).click();
  if (pass) {
    await page.getByRole("button", { name: "こんにちは", exact: true }).click();
    await page.getByRole("button", { name: "。", exact: true }).click();
  } else {
    await page.getByRole("button", { name: "。", exact: true }).click();
    await page.getByRole("button", { name: "こんにちは", exact: true }).click();
  }
  await page.getByRole("button", { name: "確認答案" }).click();
  await page.getByRole("button", { name: "下一題" }).click();
  await page.getByRole("button", { name: "開始口說模擬" }).click();
  if (!pass) await page.getByRole("combobox").selectOption("wrong");
  await page.getByRole("button", { name: "顯示模擬評分" }).click();
  await expect(page.getByText("非真實評估", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "確認答案" }).click();
  await page.getByRole("button", { name: "查看學習成果" }).click();
}
test("complete path, persistence, independent profiles", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await lesson(page);
  await expect(page.getByText("+50", { exact: true })).toBeVisible();
  await expect(page.getByText("★★★", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "前往下一關" }).click();
  await expect(page.getByText("水をください。", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "離開關卡" }).click();
  await expect(
    page.getByRole("button", { name: "2 生活裡的小對話", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /3 讓表達更自然 尚未解鎖/ }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByText("⚡ 50 XP", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "切換體驗檔案", exact: true }).click();
  await page.getByLabel("新增體驗檔案").fill("家人二號");
  await page.getByRole("button", { name: "新增", exact: true }).click();
  await expect(page.getByText("⚡ 0 XP", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "開始今天的冒險" }).click();
  await expect(
    page.getByRole("button", { name: /2 生活裡的小對話 尚未解鎖/ }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test("failed attempts do not unlock; weak point retry removes item", async ({
  page,
}) => {
  await enter(page);
  await lesson(page, false);
  await expect(page.getByText("這次練習，也有收穫。")).toBeVisible();
  await page.getByRole("button", { name: "回到冒險地圖", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /2 生活裡的小對話 尚未解鎖/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "弱點複習", exact: true }).click();
  await page.getByRole("button", { name: /啟程・第一句話 初階/ }).click();
  await lesson(page);
  await page.getByRole("button", { name: "弱點複習", exact: true }).click();
  await expect(page.getByText("目前沒有待複習的關卡")).toBeVisible();
});
test("language and level paths, mobile layout, install instructions", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await page.screenshot({
    path: `/tmp/learning-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await expect(page.getByRole("heading", { name: /每天一點點/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "安裝到主畫面" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "知道了" }).click();
  await page.getByRole("button", { name: /英文.*晴空島/ }).click();
  await page.getByRole("button", { name: /LEVEL 03/ }).click();
  await page
    .getByRole("button", { name: "1 啟程・第一句話", exact: true })
    .click();
  await expect(
    page.getByText("How can we reduce our environmental impact?", {
      exact: true,
    }),
  ).toBeVisible();
});
test("replaying improves best stars without duplicate star accumulation", async ({
  page,
}) => {
  await enter(page);
  await lesson(page);
  await page.getByRole("button", { name: "再練一次", exact: true }).click();
  await lesson(page);
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("learning-demo-v1")!),
  );
  expect(state.profiles[0].attempts).toHaveLength(2);
  await page.getByRole("button", { name: "我的成長", exact: true }).click();
  await expect(
    page
      .locator(".stat")
      .filter({ hasText: "最佳星星總數" })
      .getByText("3", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".stat")
      .filter({ hasText: "累積 XP" })
      .getByText("100", { exact: true }),
  ).toBeVisible();
});
test("PWA precaches app for offline reload", async ({ page, context }) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /每天一點點/ })).toBeVisible();
  await expect(
    page.getByText("目前離線，仍可使用已快取的體驗課程。"),
  ).toBeVisible();
  await context.setOffline(false);
});
