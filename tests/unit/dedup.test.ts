import { describe, it, expect } from "vitest";
import { dedupeMessages, type RawMessage } from "@/lib/email/dedupe";

describe("dedupeMessages — unified inbox semantics", () => {
  it("dedupes across providers using canonical RFC Message-ID", () => {
    const gmail: RawMessage = {
      providerId: "gmail-1",
      provider: "gmail",
      messageId: "<abc@mailpilot.app>",
      date: new Date("2026-05-14T10:00:00Z"),
      from: "alice@example.com",
      subject: "Hi",
    };
    const imap: RawMessage = {
      providerId: "imap-9",
      provider: "imap",
      messageId: "<abc@mailpilot.app>",
      date: new Date("2026-05-14T10:00:00Z"),
      from: "alice@example.com",
      subject: "Hi",
    };
    expect(dedupeMessages([gmail, imap])).toHaveLength(1);
  });

  it("falls back to (date, from, subject_hash) tuple when Message-ID is missing", () => {
    const a: RawMessage = {
      providerId: "imap-1",
      provider: "imap",
      messageId: null,
      date: new Date("2026-05-14T10:00:00Z"),
      from: "bob@example.com",
      subject: "Re: launch",
    };
    const b: RawMessage = {
      providerId: "imap-2",
      provider: "imap",
      messageId: null,
      date: new Date("2026-05-14T10:00:00Z"),
      from: "bob@example.com",
      subject: "Re: launch",
    };
    expect(dedupeMessages([a, b])).toHaveLength(1);
  });

  it("does NOT collapse legitimately distinct messages with same subject/from but different timestamps", () => {
    const morning: RawMessage = {
      providerId: "g1",
      provider: "gmail",
      messageId: null,
      date: new Date("2026-05-14T08:00:00Z"),
      from: "carol@example.com",
      subject: "Standup",
    };
    const afternoon: RawMessage = {
      providerId: "g2",
      provider: "gmail",
      messageId: null,
      date: new Date("2026-05-14T15:00:00Z"),
      from: "carol@example.com",
      subject: "Standup",
    };
    expect(dedupeMessages([morning, afternoon])).toHaveLength(2);
  });
});
