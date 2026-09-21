import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 30000,
  use: {
    launchOptions: process.env.LEARNING_CHROMIUM_PATH
      ? {
          executablePath: process.env.LEARNING_CHROMIUM_PATH,
          args: [
            "--no-sandbox",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--use-gl=disabled",
            "--disable-dev-shm-usage",
            "--no-zygote",
          ],
        }
      : undefined,
    baseURL: "http://127.0.0.1:4173/ai-language-learning/",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run preview -- --port 4173 --host 127.0.0.1",
    url: "http://127.0.0.1:4173/ai-language-learning/",
    reuseExistingServer: !process.env.CI,
  },
});
