/**
 * Owner: security-engineer
 *
 * Verifies that mailpilot's response headers match the hardening posture
 * declared in next.config.ts. Failure of any assertion means a deploy
 * regressed the security configuration.
 */
import { test, expect } from "@playwright/test";

test.describe("security headers — production hardening", () => {
  test("root response carries the documented hardening headers", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["permissions-policy"]).toContain("microphone=()");
    expect(h["permissions-policy"]).toContain("geolocation=()");
  });

  test("/sw.js has Service-Worker-Allowed=/", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.status()).toBe(200);
    const swa = res.headers()["service-worker-allowed"];
    expect(swa).toBe("/");
  });

  test("API responds JSON content-type, not HTML", async ({ request }) => {
    const res = await request.post("/api/summarize", {
      data: { consent: true, thread: "hello" },
    });
    expect(res.headers()["content-type"]).toContain("application/json");
  });
});
