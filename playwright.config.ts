import { defineConfig, devices } from "@playwright/test";

/**
 * Mailpilot E2E configuration.
 *
 * - Records video for EVERY test (per assignment requirement — screen
 *   recordings are uploaded as an artifact).
 * - Tests target the live Vercel deployment by default. Override with
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 for local runs.
 * - Mobile profile included — mailpilot is mobile-first; we test 360px width.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://mailpilot-virid.vercel.app",
    trace: "on-first-retry",
    video: "on",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
