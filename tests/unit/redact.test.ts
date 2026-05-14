import { describe, it, expect } from "vitest";
import { redactForAI } from "@/lib/email/redact";

describe("redactForAI — PII boundary before LLM calls", () => {
  it("strips email addresses to <email> token", () => {
    const input = "Reply to alice@example.com about the launch";
    expect(redactForAI(input)).toBe("Reply to <email> about the launch");
  });

  it("strips multiple addresses including plus-aliases and subdomains", () => {
    const input =
      "CC bob+ops@team.example.com and carol@uk.example.co.uk on this";
    expect(redactForAI(input)).toBe("CC <email> and <email> on this");
  });

  it("does not corrupt non-email tokens that contain @", () => {
    const input = "Mention @alice in the standup notes";
    expect(redactForAI(input)).toBe("Mention @alice in the standup notes");
  });

  it("strips phone numbers in common formats", () => {
    expect(redactForAI("Call +1-732-800-1313 today")).toBe(
      "Call <phone> today",
    );
    expect(redactForAI("Call (732) 800-1313 today")).toBe(
      "Call <phone> today",
    );
  });

  it("strips mailto: prefixed addresses (previously missed)", () => {
    expect(redactForAI("Click mailto:alice@example.com to reply")).toBe(
      "Click <email> to reply",
    );
  });

  it("strips IPv4 addresses", () => {
    expect(redactForAI("Received from 192.168.1.42 at noon")).toBe(
      "Received from <ip> at noon",
    );
  });

  it("returns empty input unchanged", () => {
    expect(redactForAI("")).toBe("");
  });

  it("is safe under repeated concurrent calls (no shared regex state)", () => {
    // If EMAIL_RE were a shared module-level /g regex, lastIndex carryover
    // would cause one of these calls to skip a match.
    const input = "a@a.com and b@b.com and c@c.com";
    const expected = "<email> and <email> and <email>";
    for (let i = 0; i < 50; i++) {
      expect(redactForAI(input)).toBe(expected);
    }
  });
});
