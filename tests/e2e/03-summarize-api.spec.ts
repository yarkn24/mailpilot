/**
 * Owner: qa-engineer + security-engineer
 *
 * Verifies the contract of POST /api/summarize: consent gate, type
 * validation, size guard, response shape. Each assertion encodes WHY
 * (CLAUDE.md R6).
 */
import { test, expect } from "@playwright/test";

const ENDPOINT = "/api/summarize";

test.describe("POST /api/summarize", () => {
  test("rejects request with no consent (R3 — AI opt-in default OFF)", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { thread: "Hello, please summarize." },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/consent/i);
  });

  test("rejects request with truthy-but-not-true consent (e.g. string)", async ({ request }) => {
    // R3 requires explicit boolean opt-in. Truthy strings, arrays, numbers
    // must not pass.
    for (const consent of ["yes", "true", 1, [true], { ok: true }] as const) {
      const res = await request.post(ENDPOINT, {
        data: { consent, thread: "hi" },
      });
      expect(
        res.status(),
        `consent=${JSON.stringify(consent)} should be 403`,
      ).toBe(403);
    }
  });

  test("rejects request with empty thread", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { consent: true, thread: "" },
    });
    expect(res.status()).toBe(400);
  });

  test("rejects request with oversized thread (cost / DoS guard)", async ({ request }) => {
    const huge = "A".repeat(16_000 * 4 + 1);
    const res = await request.post(ENDPOINT, {
      data: { consent: true, thread: huge },
    });
    expect(res.status()).toBe(413);
  });

  test("accepts well-formed request and returns stub summary shape", async ({ request }) => {
    const thread = "Lorem ipsum dolor sit amet.";
    const res = await request.post(ENDPOINT, {
      data: { consent: true, thread },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Stub path returns model="stub" when no AI key is configured; live path
    // returns a real model id (gemini-2.5-flash or claude-haiku-4-5).
    expect(typeof body.model).toBe("string");
    expect(body.model.length).toBeGreaterThan(0);
    expect(body.summary).toBeTruthy();
    expect(body.truncated).toBe(false);
    if (body.model === "stub") {
      expect(body.input_chars).toBe(thread.length);
    }

    // Endpoint must NOT echo post-redaction body content — would leak
    // anything redaction missed (R1).
    expect(body).not.toHaveProperty("redacted_preview");
  });

  test("flags truncation when input exceeds budget but within size guard", async ({ request }) => {
    const justOver = "B".repeat(16_001);
    const res = await request.post(ENDPOINT, {
      data: { consent: true, thread: justOver },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.truncated).toBe(true);
    if (body.model === "stub") {
      expect(body.input_chars).toBe(16_000);
    }
  });
});
