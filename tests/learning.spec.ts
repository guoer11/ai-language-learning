import { test, expect, type Page } from "@playwright/test";
import {
  questions,
  course,
  starsForScore,
  type Language,
  type Level,
} from "../src/data";
import { readingParts, japaneseTokens } from "../src/japanese";
import { compareContent } from "../src/OralPractice";
test.beforeEach(async ({ page }) => {
  await page.clock.install();
});
async function enter(
  page: Page,
  language: Language = "ja",
  level: Level = "beginner",
  lesson = 0,
) {
  await page.goto("./");
  await page
    .getByRole("button", {
      name: language === "ja" ? "日文 櫻花島 開始探索" : "英文 晴空島 開始探索",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: new RegExp(
        "LEVEL 0" +
          (["beginner", "intermediate", "advanced"].indexOf(level) + 1),
      ),
    })
    .click();
  await page
    .getByRole("button", {
      name: new RegExp(
        "^" +
          (lesson + 1) +
          " " +
          course(language, level).worlds[0].units.flatMap((u) => u.lessons)[
            lesson
          ].title +
          "$",
      ),
    })
    .click();
}
async function answerQuestion(
  page: Page,
  q: ReturnType<typeof questions>[number],
  correct = true,
) {
  if (q.type === "choice") {
    if (q.audioOnly) {
      await expect(
        page.getByText("先聽聲音，再選答案", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "無法播放？改用文字提示" })
        .click();
    }
    const choice = correct
      ? q.answer!
      : q.options!.find((o) => o !== q.answer)!;
    await page
      .getByRole("button", {
        name: q.options!.indexOf(choice) + 1 + " " + choice,
        exact: true,
      })
      .click();
  } else if (q.type === "order") {
    for (const token of correct ? q.tokens! : [...q.tokens!].reverse())
      await page
        .locator(".word-bank")
        .getByRole("button", { name: token, exact: true })
        .and(page.locator("button:not(:disabled)"))
        .first()
        .click();
  } else {
    await page
      .getByLabel("辨識文字／手動輸入")
      .fill(correct ? q.target : "不同的錯誤內容");
    await page.getByRole("button", { name: "比對內容", exact: true }).click();
    await expect(page.getByText("尚未評估", { exact: true })).toHaveCount(4);
  }
  await page.getByRole("button", { name: "確認答案" }).click();
  if (correct) {
    await page.clock.fastForward(3000);
  } else {
    await expect(page.locator(".answer-explanation")).toContainText(
      "為什麼這樣回答",
    );
    await page
      .getByRole("button", {
        name: q.type === "speaking" ? "查看學習成果" : "下一題",
        exact: true,
      })
      .click();
  }
}
async function finish(
  page: Page,
  count = 5,
  language: Language = "ja",
  level: Level = "beginner",
  lesson = 0,
) {
  const qs = questions(language, level, lesson);
  for (let i = 0; i < qs.length; i++)
    await answerQuestion(page, qs[i], i < count);
}
test("course has 48 distinct lessons, hierarchy and all score bands", () => {
  const ids = new Set<string>(),
    targets = new Set<string>();
  for (const l of ["ja", "en"] as Language[])
    for (const v of ["beginner", "intermediate", "advanced"] as Level[]) {
      const c = course(l, v);
      expect(c.worlds).toHaveLength(1);
      expect(c.worlds[0].units).toHaveLength(2);
      for (const lesson of c.worlds[0].units.flatMap((u) => u.lessons)) {
        const qs = questions(l, v, lesson.index);
        expect(qs).toHaveLength(5);
        expect(
          new Set([
            qs[1].studyText,
            qs[2].studyText,
            qs[3].studyText,
            qs[4].studyText,
          ]).size,
        ).toBe(4);
        if (l === "ja") {
          expect(qs[2].tokens!.join("")).toBe(qs[2].target);
          for (const text of qs.flatMap((q) => [
            q.studyText,
            ...(q.optionsForeign ? q.options! : []),
          ])) {
            expect(
              readingParts(text).filter(
                (p) => !p.reading && /\p{Script=Han}/u.test(p.text),
              ),
            ).toEqual([]);
          }
        }
        targets.add(qs[4].target);
        for (const q of qs) {
          expect(ids.has(q.id)).toBe(false);
          ids.add(q.id);
          if (q.options) {
            expect(new Set(q.options).size).toBe(4);
            expect(q.options).toContain(q.answer);
          }
        }
      }
    }
  expect(ids.size).toBe(240);
  expect(targets.size).toBe(48);
  expect([0, 20, 40, 60, 80, 100].map(starsForScore)).toEqual([
    0, 0, 0, 1, 2, 3,
  ]);
  expect(
    compareContent("I would like some water.", "I would like some coffee."),
  ).toBe(false);
  expect(
    compareContent("I would like some water.", "I WOULD LIKE SOME WATER"),
  ).toBe(true);
  expect(compareContent("こんにちは。", "こんにちは")).toBe(true);
});
test("correct answer waits three seconds, wrong answer stays, exit cancels pending advance", async ({
  page,
}) => {
  await enter(page, "ja", "intermediate");
  const qs = questions("ja", "intermediate", 0);
  await expect(page.locator(".target rt")).toHaveText(["まど"]);
  await page
    .getByRole("button", {
      name: `${qs[0].options!.indexOf(qs[0].answer!) + 1} ${qs[0].answer}`,
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "確認答案" }).click();
  await page.clock.runFor(2000);
  await expect(page.locator(".lesson-top")).toContainText("1 / 5");
  await page.clock.runFor(1000);
  await expect(page.locator(".lesson-top")).toContainText("2 / 5");
  const wrong = qs[1].options!.find((o) => o !== qs[1].answer)!;
  await page
    .getByRole("button", {
      name: `${qs[1].options!.indexOf(wrong) + 1} ${wrong}`,
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "確認答案" }).click();
  await expect(page.locator(".answer-explanation")).toContainText("徵求許可");
  await expect(page.locator(".answer-explanation rt")).not.toHaveCount(0);
  await page.clock.fastForward(10000);
  await expect(page.locator(".lesson-top")).toContainText("2 / 5");
  await page.getByRole("button", { name: "下一題", exact: true }).click();
  expect(qs[2].tokens).toEqual([
    "予約",
    "を",
    "変更",
    "したい",
    "の",
    "です",
    "が",
    "。",
  ]);
  for (const token of qs[2].tokens!)
    await page
      .locator(".word-bank")
      .getByRole("button", { name: token, exact: true })
      .and(page.locator("button:not(:disabled)"))
      .first()
      .click();
  await page.getByRole("button", { name: "確認答案" }).click();
  await page.getByRole("button", { name: "離開關卡" }).click();
  await page.clock.fastForward(5000);
  await expect(page.locator(".lesson-shell")).toHaveCount(0);
  await page.getByRole("button", { name: "1 選擇座位", exact: true }).click();
  await expect(page.locator(".lesson-top")).toContainText("1 / 5");
});
test("complete flow, unlock, persistence and independent profiles", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await finish(page);
  await expect(page.getByText("+70", { exact: true })).toBeVisible();
  await expect(page.getByText("★★★", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "前往下一關" }).click();
  await expect(page.locator(".target ruby")).toContainText("水");
  await expect(page.locator(".target rt")).toHaveText(["みず"]);
  await page.getByRole("button", { name: "離開關卡" }).click();
  await expect(
    page.getByRole("button", { name: "2 禮貌與飲水", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "3 表達感謝 尚未解鎖", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByText("⚡ 70 XP", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "帳號與登入", exact: true }).click();
  await page.getByLabel("新增體驗檔案").fill("家人二號");
  await page.getByRole("button", { name: "新增", exact: true }).click();
  await expect(page.getByText("⚡ 0 XP", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "開始今天的冒險" }).click();
  await expect(
    page.getByRole("button", { name: "2 禮貌與飲水 尚未解鎖", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
for (const correct of [0, 3, 4])
  test("achievable score band " + correct, async ({ page }) => {
    await enter(page);
    await finish(page, correct);
    await expect(page.locator(".result-stars")).toHaveText(
      correct === 0 ? "☆☆☆" : correct === 3 ? "★☆☆" : "★★☆",
    );
    if (correct === 0) {
      await page
        .getByRole("button", { name: "回到冒險地圖", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "2 禮貌與飲水 尚未解鎖",
          exact: true,
        }),
      ).toBeDisabled();
    }
  });
test("weakness replay clears list, best stars do not double count", async ({
  page,
}) => {
  await enter(page);
  await finish(page, 3);
  await page.getByRole("button", { name: "弱點複習", exact: true }).click();
  await page.getByRole("button", { name: /第一句問候 初階/ }).click();
  await finish(page);
  await page.getByRole("button", { name: "弱點複習", exact: true }).click();
  await expect(page.getByText("目前沒有待複習的關卡")).toBeVisible();
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
      .getByText("120", { exact: true }),
  ).toBeVisible();
});
test("old progress retained and new lessons do not overwrite records", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("learning-demo-v1"))
      localStorage.setItem(
        "learning-demo-v1",
        JSON.stringify({
          version: 1,
          active: "old",
          profiles: [
            {
              id: "old",
              name: "舊冒險家",
              avatar: "🐻",
              attempts: [
                {
                  id: "legacy",
                  path: "ja:beginner",
                  lesson: 0,
                  date: "2026-09-21",
                  score: 100,
                  xp: 50,
                  stars: 3,
                  wrong: [],
                  mock: true,
                },
              ],
            },
          ],
        }),
      );
  });
  await enter(page);
  await finish(page, 4);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("learning-demo-v1")!),
  );
  expect(saved.profiles[0].attempts).toHaveLength(2);
  expect(saved.profiles[0].attempts[0].id).toBe("legacy");
  expect(saved.profiles[0].attempts[1].curriculumVersion).toBe(3);
  expect(saved.profiles[0].attempts[1].oral.source).toBe("typed");
  expect(saved.profiles[0].attempts[1].oral.pronunciation).toBeNull();
});
test("advanced English content, mobile layout and installation dialog", async ({
  page,
}, info) => {
  await page.goto("./");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "安裝到主畫面" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "知道了" }).click();
  await enter(page, "en", "advanced");
  await finish(page, 5, "en", "advanced");
  await expect(page.getByText("+70", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/learning-v2-" + info.project.name + ".png",
    fullPage: true,
  });
});
test("browser speech requires consent, transcript evaluated without pronunciation score", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__aborted = false;
    (window as any).SpeechRecognition = class {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: any;
      onend: any;
      onerror: any;
      start() {
        setTimeout(() => {
          this.onresult?.({
            results: [{ isFinal: true, 0: { transcript: "私は学生です。" } }],
          });
          this.onend?.();
        }, 20);
      }
      stop() {
        this.onend?.();
      }
      abort() {
        (window as any).__aborted = true;
      }
    };
  });
  await enter(page);
  const qs = questions("ja", "beginner", 0);
  for (const q of qs.slice(0, 4)) await answerQuestion(page, q);
  await expect(
    page.getByRole("button", { name: "開始語音辨識" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "開始語音辨識" }).click();
  await expect(page.getByLabel("辨識文字／手動輸入")).toHaveValue(
    "私は学生です。",
  );
  await page.getByRole("button", { name: "比對內容", exact: true }).click();
  await expect(
    page.getByText("✓ 文字內容符合目標句", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "確認答案" }).click();
  await page.clock.fastForward(3000);
  await expect(page.getByText("+70", { exact: true })).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("learning-demo-v1")!),
  );
  expect(saved.profiles[0].attempts[0].oral.source).toBe("browser");
  expect(await page.evaluate(() => (window as any).__aborted)).toBe(true);
});
test("speech denial and recording denial allow typed fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).SpeechRecognition = class {
      onerror: any;
      onresult: any;
      onend: any;
      start() {
        this.onerror?.({ error: "not-allowed" });
      }
      stop() {}
      abort() {}
    };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () => Promise.reject(new Error("denied")),
      configurable: true,
    });
  });
  await enter(page);
  for (const q of questions("ja", "beginner", 0).slice(0, 4))
    await answerQuestion(page, q);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "開始語音辨識" }).click();
  await expect(page.getByRole("alert")).toContainText("權限");
  // A real speech engine emits the error asynchronously; finish the test's engine end state.
  await page.getByRole("button", { name: /停止辨識|開始語音辨識/ }).count();
  await page.getByRole("button", { name: "離開關卡" }).click();
  await page.getByRole("button", { name: "1 第一句問候", exact: true }).click();
  for (const q of questions("ja", "beginner", 0).slice(0, 4))
    await answerQuestion(page, q);
  await page.getByRole("button", { name: "錄音回放", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("無法錄音");
  await answerQuestion(page, questions("ja", "beginner", 0)[4]);
  await expect(page.getByText("+70", { exact: true })).toBeVisible();
});
test("recording playback deletes blob and stops microphone on exit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__stopped = 0;
    (window as any).__revoked = 0;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => ({
        getTracks: () => [
          {
            stop: () => {
              (window as any).__stopped++;
            },
          },
        ],
      }),
      configurable: true,
    });
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (u) => {
      (window as any).__revoked++;
      revoke(u);
    };
    (window as any).MediaRecorder = class {
      state = "inactive";
      mimeType = "audio/webm";
      ondataavailable: any;
      onstop: any;
      onerror: any;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["test"], { type: "audio/webm" }),
        });
        this.onstop?.();
      }
    };
  });
  await enter(page);
  for (const q of questions("ja", "beginner", 0).slice(0, 4))
    await answerQuestion(page, q);
  await page.getByRole("button", { name: "錄音回放", exact: true }).click();
  await page.getByRole("button", { name: "停止錄音", exact: true }).click();
  await expect(page.locator("audio")).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: "刪除這段錄音" }).click();
  await expect(page.locator("audio")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__revoked)).toBe(1);
  await page.getByRole("button", { name: "錄音回放", exact: true }).click();
  await page.getByRole("button", { name: "離開關卡" }).click();
  expect(
    await page.evaluate(() => (window as any).__stopped),
  ).toBeGreaterThanOrEqual(2);
});
test("late microphone permission after leaving stops granted tracks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__stopped = 0;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        new Promise((resolve) => {
          (window as any).__grant = () =>
            resolve({
              getTracks: () => [
                {
                  stop: () => {
                    (window as any).__stopped++;
                  },
                },
              ],
            });
        }),
      configurable: true,
    });
  });
  await enter(page);
  for (const q of questions("ja", "beginner", 0).slice(0, 4))
    await answerQuestion(page, q);
  await page.getByRole("button", { name: "錄音回放", exact: true }).click();
  await page.getByRole("button", { name: "離開關卡" }).click();
  await page.evaluate(() => (window as any).__grant());
  await expect
    .poll(() => page.evaluate(() => (window as any).__stopped))
    .toBe(1);
});
test("PWA serves cached app with network truly unavailable", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  expect(
    await page.evaluate(async () => {
      try {
        await fetch(location.origin + "/learning-offline-probe?" + Date.now(), {
          cache: "no-store",
        });
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "onLine", {
      get: () => false,
      configurable: true,
    }),
  );
  await page.reload();
  await expect(page.getByRole("heading", { name: /每天一點點/ })).toBeVisible();
  await expect(
    page.getByText("目前離線，仍可使用已快取的體驗課程。"),
  ).toBeVisible();
  await context.setOffline(false);
});
