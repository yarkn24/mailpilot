/**
 * Owner: qa-engineer
 *
 * Verifies the public landing surface: shell loads, key copy is present,
 * PWA manifest reachable, navigation works. Intent: a visitor arriving cold
 * understands what mailpilot is within one viewport.
 */
import { test, expect } from "@playwright/test";

test.describe("landing page — public surface", () => {
  test("loads with brand and value prop above the fold", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Mailpilot/i);

    // The product promise lives in the hero — H1 + subheading.
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/one inbox/i);

    // Subheading or feature cards mention the three providers + AI privacy.
    await expect(page.getByText(/gmail.*microsoft 365.*imap/i).first()).toBeVisible();
    await expect(page.getByText(/redact|opt-in|never stored/i).first()).toBeVisible();

    // Brand mark — case-insensitive (landing uses lowercase "mailpilot").
    await expect(page.getByText(/mailpilot/i).first()).toBeVisible();
  });

  test("renders all three feature panels", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /one inbox, three providers/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /ai asks first/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /100ms or it didn't happen/i })).toBeVisible();
  });

  test("PWA manifest is reachable and valid JSON", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest.name).toBe("Mailpilot");
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBe(true);
  });

  test("service worker file is served with correct cache headers", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toContain("must-revalidate");
  });

  test("mobile viewport: hero is readable and CTAs are tappable", async ({ page }) => {
    // Pixel 7 profile applied via projects.mobile-chrome; assertion is that
    // the hero still fits and CTAs meet WCAG tap-target minimum.
    await page.goto("/");
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    const archButton = page.getByRole("link", { name: /architecture/i });
    await expect(archButton).toBeVisible();
    const box = await archButton.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(44); // WCAG tap target
    expect(box?.height ?? 0).toBeGreaterThan(40);
  });
});
