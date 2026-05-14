"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MessageSummary {
  id: string;
  accountId: string;
  from: { name?: string; address: string };
  subject: string;
  date: string;
  flags: { unread: boolean; flagged: boolean };
}

interface AccountStatus {
  id: string;
  email: string;
  ok: boolean;
  error?: string;
}

export function InboxList() {
  const [messages, setMessages] = useState<MessageSummary[] | null>(null);
  const [accounts, setAccounts] = useState<AccountStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setAccounts(d.accounts ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "fetch failed"));
  }, []);

  if (error) {
    return (
      <div className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
        {error}
      </div>
    );
  }
  if (messages === null) {
    return <div className="mt-4 text-sm text-[var(--color-muted)]">Loading…</div>;
  }

  return (
    <>
      {accounts.some((a) => !a.ok) && (
        <div className="mt-4 space-y-1">
          {accounts.filter((a) => !a.ok).map((a) => (
            <div
              key={a.id}
              className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
            >
              {a.email}: {a.error}
            </div>
          ))}
        </div>
      )}

      {messages.length === 0 && accounts.length === 0 && (
        <div className="mt-6 rounded border border-dashed border-[var(--color-ink)]/15 px-4 py-10 text-center text-sm text-[var(--color-muted)] dark:border-white/20">
          No accounts connected.{" "}
          <Link href="/settings" className="font-medium text-[var(--color-accent)] underline">
            Add one
          </Link>{" "}
          to see your inbox.
        </div>
      )}
      {messages.length === 0 && accounts.length > 0 && (
        <div className="mt-6 rounded border border-dashed border-[var(--color-ink)]/15 px-4 py-10 text-center text-sm text-[var(--color-muted)] dark:border-white/20">
          Inbox empty.
        </div>
      )}

      <ul className="mt-4 divide-y divide-[var(--color-ink)]/10 rounded border border-[var(--color-ink)]/10 dark:divide-white/10 dark:border-white/10">
        {messages.map((m) => (
          <li key={`${m.accountId}:${m.id}`}>
            <Link
              href={`/inbox/${m.accountId}/${m.id}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
            >
              {m.flags.unread ? (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" aria-label="unread" />
              ) : (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-transparent" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={"truncate text-sm " + (m.flags.unread ? "font-semibold" : "font-normal text-[var(--color-muted)]")}>
                    {m.from.name || m.from.address}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-[var(--color-muted)]">
                    {new Date(m.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="truncate text-sm">{m.subject || "(no subject)"}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
