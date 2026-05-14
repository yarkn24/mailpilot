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
  const [summarizing, setSummarizing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setBody(null);
    setError(null);
    fetch(`/api/message/${accountId}/${messageId}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setBody(d)))
      .catch((e) => setError(e instanceof Error ? e.message : "fetch failed"));
  }, [accountId, messageId]);

  useEffect(() => {
    if (iframeRef.current && body?.html) {
      iframeRef.current.srcdoc = body.html;
    }
  }, [body]);

  async function summarize() {
    if (!body) return;
    setSummarizing(true); setSummary(null);
    const thread = body.text || (body.html || "").replace(/<[^>]+>/g, " ");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent: true, thread }),
      });
      const d = await res.json();
      setSummary(d.error ? `Error: ${d.error}` : d.summary);
    } finally {
      setSummarizing(false);
    }
  }

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
      <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
        {error}
      </div>
    );
  }
  if (!body) return <div className="text-sm text-[var(--color-muted)]">Loading…</div>;

  const replyHref = composeHref({
    mode: "reply",
    accountId, messageId, subject, from, mid,
  });
  const forwardHref = composeHref({
    mode: "forward",
    accountId, messageId, subject, from, mid,
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href="/inbox" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-white">
          ← Inbox
        </Link>
        <div className="ml-auto flex gap-1">
          <ActionButton label="Archive" busy={actionBusy === "archive"} onClick={() => doAction("archive")} />
          <ActionButton label="Trash" busy={actionBusy === "trash"} onClick={() => doAction("trash")} />
        </div>
      </div>

      {subject && (
        <h2 className="mt-4 text-lg font-semibold tracking-tight">{subject}</h2>
      )}
      {from && (
        <div className="mt-1 text-xs text-[var(--color-muted)]">From: {from}</div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={summarize}
          disabled={summarizing}
          className="rounded-md bg-[var(--color-ink)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)] disabled:opacity-50 dark:bg-[var(--color-paper)] dark:text-[var(--color-ink)]"
        >
          {summarizing ? "Summarizing…" : "Summarize"}
        </button>
        <button
          onClick={makeDraft}
          disabled={drafting}
          className="rounded-md border border-[var(--color-ink)]/15 px-3 py-1.5 text-sm font-medium hover:border-[var(--color-ink)]/40 disabled:opacity-50 dark:border-white/20 dark:hover:border-white/40"
        >
          {drafting ? "Drafting…" : "Draft reply"}
        </button>
        <Link
          href={replyHref}
          className="rounded-md border border-[var(--color-ink)]/15 px-3 py-1.5 text-sm font-medium hover:border-[var(--color-ink)]/40 dark:border-white/20 dark:hover:border-white/40"
        >
          Reply
        </Link>
        <Link
          href={forwardHref}
          className="rounded-md border border-[var(--color-ink)]/15 px-3 py-1.5 text-sm font-medium hover:border-[var(--color-ink)]/40 dark:border-white/20 dark:hover:border-white/40"
        >
          Forward
        </Link>
      </div>

      {summary && (
        <div className="mt-4 rounded border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-4 py-3 text-sm">
          <div className="mb-1 text-xs uppercase tracking-wider text-[var(--color-accent)]">AI summary</div>
          <pre className="whitespace-pre-wrap font-sans">{summary}</pre>
        </div>
      )}
      {draft && (
        <div className="mt-4 rounded border border-[var(--color-ink)]/15 px-4 py-3 text-sm dark:border-white/20">
          <div className="mb-1 text-xs uppercase tracking-wider text-[var(--color-muted)]">Draft reply</div>
          <pre className="whitespace-pre-wrap font-sans">{draft}</pre>
        </div>
      )}

      {body.html ? (
        <iframe
          ref={iframeRef}
          sandbox=""
          referrerPolicy="no-referrer"
          className="mt-6 min-h-[60vh] w-full rounded border border-[var(--color-ink)]/10 bg-white dark:border-white/10"
          title="message body"
        />
      ) : (
        <pre className="mt-6 whitespace-pre-wrap rounded border border-[var(--color-ink)]/10 bg-[var(--color-paper)] p-4 text-sm dark:border-white/10 dark:bg-black/40">
          {body.text || "(empty body)"}
        </pre>
      )}
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

function ActionButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="rounded border border-[var(--color-ink)]/15 px-2.5 py-1 text-xs hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
    >
      {busy ? "…" : label}
    </button>
  );
}
