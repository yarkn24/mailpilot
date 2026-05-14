"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface MessageSummary {
  id: string;
  accountId: string;
  messageId: string | null;
  from: { name?: string; address: string };
  subject: string;
  snippet?: string;
  date: string;
  flags: { unread: boolean; flagged: boolean };
  labels?: string[];
}

interface AccountStatus {
  id: string;
  email: string;
  ok: boolean;
  error?: string;
}

const ALL = "all";

export function InboxList() {
  const [messages, setMessages] = useState<MessageSummary[] | null>(null);
  const [accounts, setAccounts] = useState<AccountStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] = useState<string>(ALL);

  useEffect(() => {
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setAccounts(d.accounts ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "fetch failed"));
  }, []);

  const visible = useMemo(() => {
    if (!messages) return null;
    if (activeAccount === ALL) return messages;
    return messages.filter((m) => m.accountId === activeAccount);
  }, [messages, activeAccount]);

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }
  if (visible === null) {
    return (
      <ul className="mt-6 divide-y divide-black/5 overflow-hidden rounded-xl border border-black/8 bg-white">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-black/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-black/5" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-black/5" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const unreadByAccount = countUnread(messages ?? []);

  return (
    <>
      {accounts.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Account switcher">
          <SwitcherChip
            label={`All`}
            count={(messages ?? []).length}
            active={activeAccount === ALL}
            onClick={() => setActiveAccount(ALL)}
          />
          {accounts.map((a) => (
            <SwitcherChip
              key={a.id}
              label={a.email}
              count={unreadByAccount.get(a.id) ?? 0}
              countLabel="unread"
              active={activeAccount === a.id}
              onClick={() => setActiveAccount(a.id)}
              danger={!a.ok}
            />
          ))}
        </div>
      )}

      {accounts.some((a) => !a.ok) && (
        <div className="mt-3 space-y-1">
          {accounts.filter((a) => !a.ok).map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            >
              <strong>{a.email}</strong> — {a.error}
            </div>
          ))}
        </div>
      )}

      {(messages ?? []).length === 0 && accounts.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-black/15 px-6 py-12 text-center">
          <p className="text-sm text-black/60">No mailboxes connected yet.</p>
          <Link
            href="/settings"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-ocean-deep)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Connect a mailbox →
          </Link>
        </div>
      )}
      {visible.length === 0 && accounts.length > 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-black/15 px-4 py-12 text-center text-sm text-black/60">
          {activeAccount === ALL ? "Inbox is empty." : "No messages in this mailbox."}
        </div>
      )}

      {visible.length > 0 && (
        <ul className="mt-4 divide-y divide-black/5 overflow-hidden rounded-xl border border-black/8 bg-white">
          {visible.map((m) => {
            const senderName = m.from.name || m.from.address.split("@")[0];
            const avatarSeed = m.from.address || senderName;
            return (
              <li key={`${m.accountId}:${m.id}`}>
                <Link
                  href={`/inbox/${m.accountId}/${m.id}?subject=${encodeURIComponent(m.subject)}&from=${encodeURIComponent(m.from.address)}${m.messageId ? `&mid=${encodeURIComponent(m.messageId)}` : ""}`}
                  className={
                    "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-sky-dust)]/40 " +
                    (m.flags.unread ? "bg-white" : "bg-black/[0.015]")
                  }
                >
                  <Avatar seed={avatarSeed} name={senderName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "truncate text-sm " +
                          (m.flags.unread ? "font-semibold text-black" : "font-normal text-black/70")
                        }
                      >
                        {senderName}
                      </span>
                      {m.flags.flagged && (
                        <span aria-label="flagged" className="text-amber-500">★</span>
                      )}
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-black/45">
                        {formatTime(m.date)}
                      </span>
                    </div>
                    <div className={"truncate text-sm " + (m.flags.unread ? "font-medium text-black" : "text-black/65")}>
                      {m.subject || "(no subject)"}
                    </div>
                    {m.snippet && (
                      <div className="mt-0.5 truncate text-xs text-black/45">{m.snippet}</div>
                    )}
                    {m.labels && m.labels.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.labels.slice(0, 3).map((l) => (
                          <LabelChip key={l} label={l} />
                        ))}
                      </div>
                    )}
                  </div>
                  {m.flags.unread && (
                    <span aria-label="unread" className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-ocean-deep)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function countUnread(messages: MessageSummary[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of messages) {
    if (x.flags.unread) m.set(x.accountId, (m.get(x.accountId) ?? 0) + 1);
  }
  return m;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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

function Avatar({ seed, name }: { seed: string; name: string }) {
  return (
    <div
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ background: colorForSeed(seed) }}
    >
      {initialsFor(name)}
    </div>
  );
}

function LabelChip({ label }: { label: string }) {
  // Skip Gmail's auto-system labels for cleaner UI
  if (label === "INBOX" || label === "UNREAD" || label === "IMPORTANT") return null;
  const pretty = label.replace(/^CATEGORY_/i, "").toLowerCase();
  return (
    <span
      className="inline-flex items-center rounded-full bg-[var(--color-sky-dust)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ocean-deep)]"
    >
      {pretty}
    </span>
  );
}

function SwitcherChip({
  label, count, countLabel, active, onClick, danger,
}: {
  label: string;
  count?: number;
  countLabel?: string;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors";
  const cls = active
    ? "border-[var(--color-ocean-deep)] bg-[var(--color-ocean-deep)] text-white"
    : danger
      ? "border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100"
      : "border-black/10 bg-white hover:border-black/30";
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`${base} ${cls}`}>
      <span className="truncate max-w-[16rem]">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (active ? "bg-white/20" : "bg-black/8")}>
          {count}{countLabel ? ` ${countLabel}` : ""}
        </span>
      )}
    </button>
  );
}
