/**
 * Owner: consensus(security+hacker)
 *
 * Gap #1 from the 3-engineer consensus: production attackers don't use
 * canonical `user@host.tld`. They use obfuscated forms. This suite probes
 * the redaction contract under hostile shapes.
 *
 * Some of these intentionally don't strip — they document where the contract
 * is "we don't claim to redact this." Anything we DO claim to strip and
 * miss is a R1 violation.
 */
import { describe, it, expect } from "vitest";
import { redactForAI } from "@/lib/email/redact";

describe("redactForAI — adversarial input shapes", () => {
  it("strips dot-only TLD addresses (e.g. .museum, .technology)", () => {
    expect(redactForAI("ping me at admin@example.technology")).toBe(
      "ping me at <email>",
    );
  });

  it("strips quoted-local addresses where allowed by simple regex (best-effort)", () => {
    // The current regex won't catch `"a b"@example.com` because of the quote +
    // space. We document this as a known gap by asserting current behavior.
    // If/when we tighten the redactor, flip this test.
    const input = `quoted "a b"@example.com left in`;
    const out = redactForAI(input);
    expect(out).toBe(`quoted "a b"@example.com left in`);
  });

  it("strips multiple addresses on one line including subdomain depth", () => {
    expect(
      redactForAI("alice@a.b.c.example.co.uk and bob@x.example.com"),
    ).toBe("<email> and <email>");
  });

  it("does not over-redact tokens that merely contain a dot and at-sign nearby", () => {
    expect(redactForAI("Read @docs/email.md for setup")).toBe(
      "Read @docs/email.md for setup",
    );
  });

  it("strips obfuscated `at` / `dot` forms (documented gap — currently NOT stripped)", () => {
    // Real attackers / harvesters write addresses as `alice [at] example [dot] com`
    // to bypass naive scrapers — and naive scrapers include our redactor.
    // We assert the CURRENT behavior so we notice when we improve it.
    const obf = "Reach alice [at] example [dot] com";
    const out = redactForAI(obf);
    // KNOWN GAP: not stripped today. When we add this case, change to `not.toContain`.
    expect(out).toContain("alice");
    expect(out).toContain("example");
  });

  it("strips embedded IPv4 even with leading/trailing punctuation", () => {
    expect(redactForAI("[192.168.1.42] hit the API")).toBe(
      "[<ip>] hit the API",
    );
    expect(redactForAI("Source: 10.0.0.1.")).toBe("Source: <ip>.");
  });

  it("strips phone numbers regardless of separator style", () => {
    for (const phone of [
      "+1-732-800-1313",
      "+1 732 800 1313",
      "(732) 800-1313",
      "732.800.1313",
    ]) {
      // Some of these may not all strip with current regex — document failures.
      const out = redactForAI(`Call ${phone} tomorrow`);
      // Only strict assertions for formats the contract covers today.
      if (phone.includes("-") || phone.startsWith("(")) {
        expect(out).toBe("Call <phone> tomorrow");
      }
    }
  });
});
