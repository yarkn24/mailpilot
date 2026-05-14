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

    // The product promise (three lines, one viewport).
    await expect(
      page.getByRole("heading", { name: /one inbox/i }),
    ).toBeVisible();
    await expect(page.getByText(/AI that never logs/i)).toBeVisible();

    // Brand mark is present and recognizable.
    await expect(page.getByText("Mailpilot")).toBeVisible();
  });

  test("renders all three feature panels", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Unified inbox" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI that asks first" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "PWA, mobile-first" })).toBeVisible();
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
    // Pixel 7 profile already applied via projects.mobile-chrome; assertion is
    // that the hero still fits and the CTA stack doesn't overflow.
    await page.goto("/");
    const heading = page.getByRole("heading", { name: /one inbox/i });
    await expect(heading).toBeVisible();

    const archButton = page.getByRole("link", { name: /architecture/i });
    await expect(archButton).toBeVisible();
    const box = await archButton.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(44); // WCAG tap target
    expect(box?.height ?? 0).toBeGreaterThan(40);
  });
});
