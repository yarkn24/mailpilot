"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Body {
  id: string;
  accountId: string;
  html: string | null;
  text: string | null;
  attachments: { filename: string; size: number; contentType: string }[];
}

export function MessageView({ accountId, messageId }: { accountId: string; messageId: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const subject = sp.get("subject") ?? "";
  const from = sp.get("from") ?? "";
  const mid = sp.get("mid") ?? "";

  const [body, setBody] = useState<Body | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryVendor, setSummaryVendor] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setBody(null);
    setError(null);
    setSummary(null);
    setSummaryVendor(null);
    setDraft(null);
    fetch(`/api/message/${accountId}/${messageId}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setBody(d)))
      .catch((e) => setError(e instanceof Error ? e.message : "fetch failed"));
  }, [accountId, messageId]);

  // AI-first: auto-summarize once body is loaded (consent gated by per-account toggle;
  // demo mode passes consent: true). UI shows the summary inline above the message.
  useEffect(() => {
    if (!body) return;
    if (summary !== null || summarizing) return;
    const thread = body.text || (body.html || "").replace(/<[^>]+>/g, " ");
    if (!thread.trim()) return;
    setSummarizing(true);
    fetch("/api/summarize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ consent: true, thread }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setSummary(`Couldn't summarize: ${d.error}`);
        } else {
          setSummary(d.summary);
          setSummaryVendor(d.vendor || d.model || null);
        }
      })
      .catch((e) => setSummary(`Couldn't summarize: ${e instanceof Error ? e.message : "fetch failed"}`))
      .finally(() => setSummarizing(false));
  }, [body, summary, summarizing]);

  useEffect(() => {
    if (iframeRef.current && body?.html) {
      iframeRef.current.srcdoc = body.html;
    }
  }, [body]);

  async function makeDraft() {
    if (!body) return;
    setDrafting(true); setDraft(null);
    const thread = body.text || (body.html || "").replace(/<[^>]+>/g, " ");
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent: true, thread, tone: "neutral" }),
      });
      const d = await res.json();
      setDraft(d.error ? `Error: ${d.error}` : d.draft);
    } finally {
      setDrafting(false);
    }
  }

  async function doAction(action: "archive" | "trash" | "markRead") {
    setActionBusy(action);
    await fetch("/api/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId, messageId, action }),
    });
    setActionBusy(null);
    if (action !== "markRead") {
      router.push("/inbox");
      router.refresh();
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }
  if (!body) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-1/2 animate-pulse rounded bg-black/5" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-black/5" />
        <div className="mt-6 h-64 w-full animate-pulse rounded-xl bg-black/5" />
      </div>
    );
  }

  const replyHref = composeHref({
    mode: "reply",
    accountId, messageId, subject, from, mid,
  });
  const forwardHref = composeHref({
    mode: "forward",
    accountId, messageId, subject, from, mid,
  });

  const senderName = from || "Unknown";
  const senderAddress = from;

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href="/inbox" className="text-sm font-medium text-[var(--color-ocean-deep)] hover:underline">
          ← Inbox
        </Link>
        <div className="ml-auto flex gap-1.5">
          <ActionButton label="Archive" busy={actionBusy === "archive"} onClick={() => doAction("archive")} />
          <ActionButton label="Trash" danger busy={actionBusy === "trash"} onClick={() => doAction("trash")} />
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <Avatar seed={senderAddress} name={senderName} large />
        <div className="flex-1 min-w-0">
          {subject && (
            <h2 className="text-xl font-semibold leading-tight tracking-tight text-black">{subject}</h2>
          )}
          {from && (
            <div className="mt-1 text-sm text-black/60">
              <span className="font-medium text-black/80">{senderName.split("<")[0].trim()}</span>
              {senderAddress.includes("@") && (
                <span className="text-black/40"> &lt;{senderAddress}&gt;</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI summary — auto-loaded, AI-first prominent placement */}
      <div className="mt-5 rounded-xl border border-[var(--color-ocean-deep)]/15 bg-gradient-to-br from-[var(--color-sky-dust)]/40 to-white px-4 py-3.5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ocean-deep)]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-ocean-deep)] text-[10px] text-white">∑</span>
          AI summary
          {summaryVendor && (
            <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-black/50">
              {summaryVendor}
            </span>
          )}
        </div>
        <div className="mt-2 text-sm leading-relaxed text-black/85">
          {summarizing && !summary && (
            <div className="space-y-2 py-1">
              <div className="h-3 w-full animate-pulse rounded bg-black/8" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-black/8" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-black/8" />
            </div>
          )}
          {summary && (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{summary}</pre>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={replyHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-ocean-deep)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          ↵ Reply
        </Link>
        <Link
          href={forwardHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black hover:border-black/30"
        >
          → Forward
        </Link>
        <button
          onClick={makeDraft}
          disabled={drafting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-ocean-deep)]/30 bg-[var(--color-sky-dust)]/40 px-4 py-2 text-sm font-medium text-[var(--color-ocean-deep)] hover:bg-[var(--color-sky-dust)] disabled:opacity-50"
        >
          {drafting ? "Drafting…" : "✨ AI draft reply"}
        </button>
      </div>

      {draft && (
        <div className="mt-4 rounded-xl border border-[var(--color-ocean-deep)]/15 bg-[var(--color-sky-dust)]/30 px-4 py-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ocean-deep)]">
            AI draft reply
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-black/85">{draft}</pre>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-black/8 bg-white p-1 shadow-sm">
        {body.html ? (
          <iframe
            ref={iframeRef}
            sandbox=""
            referrerPolicy="no-referrer"
            className="min-h-[60vh] w-full rounded-lg bg-white"
            title="message body"
          />
        ) : (
          <pre className="whitespace-pre-wrap rounded-lg bg-white p-5 font-sans text-sm leading-relaxed text-black/85">
            {body.text || "(empty body)"}
          </pre>
        )}
      </div>
    </>
  );
}

function composeHref(o: {
  mode: "reply" | "forward";
  accountId: string;
  messageId: string;
  subject: string;
  from: string;
  mid: string;
}): string {
  const params = new URLSearchParams();
  params.set("account", o.accountId);
  params.set(o.mode === "reply" ? "reply" : "forward", o.messageId);
  if (o.mid) params.set("refMessageId", o.mid);
  if (o.subject) {
    const cleaned = o.subject.replace(/^(re|fwd|fw):\s*/i, "");
    params.set("subject", (o.mode === "reply" ? "Re: " : "Fwd: ") + cleaned);
  }
  if (o.mode === "reply" && o.from) params.set("to", o.from);
  return `/compose?${params.toString()}`;
}

const AVATAR_PALETTE = [
  "#2c6bed", "#7c3aed", "#db2777", "#dc2626", "#ea580c",
  "#ca8a04", "#16a34a", "#0891b2", "#0284c7", "#4f46e5",
];

function colorForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ seed, name, large }: { seed: string; name: string; large?: boolean }) {
  const size = large ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs";
  return (
    <div
      aria-hidden
      className={`flex ${size} shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ background: colorForSeed(seed) }}
    >
      {initialsFor(name)}
    </div>
  );
}

function ActionButton({ label, danger, busy, onClick }: { label: string; danger?: boolean; busy: boolean; onClick: () => void }) {
  const cls = danger
    ? "border-red-200 text-red-700 hover:bg-red-50"
    : "border-black/10 text-black/80 hover:bg-black/5";
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${cls}`}
    >
      {busy ? "…" : label}
    </button>
  );
}
