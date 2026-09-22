import { test, expect, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });
const api = "https://mflhfttirywdsqvjhvhl.supabase.co/auth/v1";
const uidA = "10000000-0000-4000-8000-000000000001";
const uidB = "10000000-0000-4000-8000-000000000002";
const translatorKey = "sb-mflhfttirywdsqvjhvhl-auth-token";
function user(id = uidA) {
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: `${id === uidA ? "alice" : "bob"}@example.test`,
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: { full_name: id === uidA ? "測試甲" : "測試乙" },
    created_at: "2026-01-01T00:00:00Z",
  };
}
function session(id = uidA) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const encode = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString("base64url");
  return {
    access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, exp, aud: "authenticated", role: "authenticated" })}.test-signature`,
    refresh_token: "test-only-refresh",
    expires_in: 3600,
    expires_at: exp,
    token_type: "bearer",
    user: user(id),
  };
}
function save(id: string, name: string, xp: number) {
  return {
    version: 1,
    active: id,
    profiles: [
      {
        id,
        name,
        avatar: "🌱",
        attempts: [
          {
            id: "test-attempt",
            path: "ja:beginner",
            lesson: 0,
            date: "2026-01-01",
            xp,
            score: 100,
            stars: 3,
            wrong: [],
            mock: false,
            curriculumVersion: 2,
          },
        ],
      },
    ],
  };
}
async function signedIn(page: Page, id = uidA) {
  await page.route(`${api}/user`, (r) => r.fulfill({ json: user(id) }));
  await page.addInitScript(
    ({ s, translatorKey, guest, account, id }) => {
      localStorage.setItem("learning-auth-v1", JSON.stringify(s));
      localStorage.setItem(translatorKey, "translator-untouched");
      localStorage.setItem("learning-demo-v1", JSON.stringify(guest));
      localStorage.setItem(
        `learning-account-v1:${id}`,
        JSON.stringify(account),
      );
    },
    {
      s: session(id),
      translatorKey,
      guest: save("explorer", "訪客", 20),
      account: save(id, id === uidA ? "測試甲" : "測試乙", 70),
      id,
    },
  );
  await page.goto("./");
  await expect(page.getByRole("region", { name: "Google 帳號" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "帳號與登入" }).click();
  await expect(
    page.getByRole("button", { name: "登出這個帳號" }),
  ).toBeVisible();
}

test("Google login uses PKCE, app redirect, account chooser and isolated session storage", async ({
  page,
}) => {
  await page.route(`${api}/authorize?**`, (r) =>
    r.fulfill({ body: "OAuth navigation test" }),
  );
  await page.goto("./");
  await expect(page.getByRole("region", { name: "Google 帳號" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "帳號與登入" }).click();
  await page.getByRole("button", { name: "使用 Google 登入" }).click();
  await page.waitForURL("**/auth/v1/authorize?**");
  const url = new URL(page.url());
  expect(url.searchParams.get("provider")).toBe("google");
  expect(url.searchParams.get("redirect_to")).toBe(
    "http://127.0.0.1:4173/ai-language-learning/",
  );
  expect(url.searchParams.get("code_challenge_method")).toBe("s256");
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  expect(url.searchParams.get("prompt")).toBe("select_account");
});

test("callback exchanges code once and restores signed-in account on reload", async ({
  page,
}) => {
  let exchanges = 0;
  await page.addInitScript(() =>
    localStorage.setItem(
      "learning-auth-v1-code-verifier",
      JSON.stringify("test-verifier"),
    ),
  );
  await page.route(`${api}/token?grant_type=pkce`, (r) => {
    exchanges++;
    expect(r.request().postDataJSON().auth_code).toBe("test-code");
    return r.fulfill({ json: session() });
  });
  await page.route(`${api}/user`, (r) => r.fulfill({ json: user() }));
  await page.goto("./?code=test-code");
  await page.getByRole("button", { name: "帳號與登入" }).click();
  await expect(
    page.getByText("測試甲，歡迎回來", { exact: true }),
  ).toBeVisible();
  expect(page.url()).not.toContain("code=");
  expect(exchanges).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "帳號與登入" }).click();
  await expect(
    page.getByText("測試甲，歡迎回來", { exact: true }),
  ).toBeVisible();
  expect(exchanges).toBe(1);
});

test("signed-in progress separated from guest; local logout preserves translator and progress", async ({
  page,
}) => {
  await signedIn(page);
  await expect(page.locator(".topbar")).toContainText("70 XP");
  await page.getByRole("button", { name: "帳號與登入" }).click();
  await expect(page.getByLabel("新增體驗檔案")).toHaveCount(0);
  let scope = "";
  await page.route(`${api}/logout?**`, (r) => {
    scope = new URL(r.request().url()).searchParams.get("scope")!;
    return r.fulfill({ status: 204 });
  });
  await page.getByRole("button", { name: "登出這個帳號" }).click();
  await expect(page.getByRole("region", { name: "Google 帳號" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "帳號與登入" }).click();
  await expect(
    page.getByRole("button", { name: "使用 Google 登入" }),
  ).toBeVisible();
  expect(scope).toBe("local");
  await expect(page.locator(".topbar")).toContainText("20 XP");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), translatorKey),
  ).toBe("translator-untouched");
  expect(
    await page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem(`learning-account-v1:${id}`)!)
          .profiles[0].attempts[0].xp,
      uidA,
    ),
  ).toBe(70);
});

test("another Google account never inherits previous account progress", async ({
  page,
}) => {
  await page.addInitScript(
    ({ id, s }) =>
      localStorage.setItem(`learning-account-v1:${id}`, JSON.stringify(s)),
    { id: uidA, s: save(uidA, "測試甲", 900) },
  );
  await signedIn(page, uidB);
  await expect(page.locator(".topbar")).toContainText("70 XP");
  await expect(page.locator(".topbar")).not.toContainText("900");
  await expect(
    page.getByText("測試乙，歡迎回來", { exact: true }),
  ).toBeVisible();
});

test("cancelled OAuth clears callback error and preserves guest learning", async ({
  page,
}) => {
  await page.goto("./?error=access_denied&error_description=untrusted-message");
  await expect(page.getByRole("alert")).toContainText("Google 登入未完成");
  expect(page.url()).not.toContain("error=");
  await expect(page.getByText("untrusted-message")).toHaveCount(0);
  await page
    .getByRole("button", { name: "日文 櫻花島 開始探索", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /LEVEL 01/ })).toBeVisible();
});

test("invalid callback cannot claim login success", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "learning-auth-v1-code-verifier",
      JSON.stringify("test-verifier"),
    ),
  );
  await page.route(`${api}/token?grant_type=pkce`, (r) =>
    r.fulfill({
      status: 400,
      json: { error: "invalid_grant", error_description: "Expired code" },
    }),
  );
  await page.goto("./?code=expired");
  await expect(page.getByRole("alert")).toContainText("登入連結已失效");
  await expect(page.getByRole("button", { name: "登出這個帳號" })).toHaveCount(
    0,
  );
});

test("logout failure clears local session and reports incomplete revocation", async ({
  page,
}) => {
  await signedIn(page);
  await page.route(`${api}/logout?**`, (r) =>
    r.fulfill({ status: 400, json: { msg: "temporary error" } }),
  );
  await page.getByRole("button", { name: "登出這個帳號" }).click();
  await expect(page.getByRole("region", { name: "Google 帳號" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "帳號與登入" }).click();
  await expect(page.getByRole("alert")).toContainText("伺服器未能確認登出");
  await expect(
    page.getByRole("button", { name: "使用 Google 登入" }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() => localStorage.getItem("learning-auth-v1")),
  ).toBeNull();
});
