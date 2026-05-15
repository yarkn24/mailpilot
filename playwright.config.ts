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
  // Retry once locally too — first hit to a Vercel serverless function can
  // cold-start and exceed the default per-request timeout.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  // Generous per-test timeout to absorb cold starts on the live URL.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "test-results",
  preserveOutput: "always",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://mailpilot-virid.vercel.app",
    trace: "on-first-retry",
    video: { mode: "on", size: { width: 1280, height: 720 } },
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
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
