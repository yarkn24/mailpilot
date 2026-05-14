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

type Priority = "high" | "normal" | "low";

const ALL = "all";

export function InboxList() {
  const [messages, setMessages] = useState<MessageSummary[] | null>(null);
  const [accounts, setAccounts] = useState<AccountStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [priorities, setPriorities] = useState<Map<string, Priority>>(new Map());
  const [prioritizing, setPrioritizing] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);

  useEffect(() => {
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setAccounts(d.accounts ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "fetch failed"));
  }, []);

  const filtered = useMemo(() => {
    if (!messages) return null;
    let out = messages;
    if (activeAccount !== ALL) out = out.filter((m) => m.accountId === activeAccount);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          (m.from.name || "").toLowerCase().includes(q) ||
          m.from.address.toLowerCase().includes(q) ||
          (m.snippet || "").toLowerCase().includes(q),
      );
    }
    if (sortByPriority && priorities.size > 0) {
      const rank: Record<string, number> = { high: 0, normal: 1, low: 2 };
      out = [...out].sort((a, b) => {
        const ra = rank[priorities.get(keyOf(a)) ?? "normal"] ?? 1;
        const rb = rank[priorities.get(keyOf(b)) ?? "normal"] ?? 1;
        if (ra !== rb) return ra - rb;
        return a.date < b.date ? 1 : -1;
      });
    }
    return out;
  }, [messages, activeAccount, query, sortByPriority, priorities]);

  async function prioritize() {
    if (!messages || messages.length === 0) return;
    setPrioritizing(true);
    try {
      const batch = messages.slice(0, 20).map((m) => ({
        id: keyOf(m),
        from: m.from.address,
        subject: m.subject,
        snippet: m.snippet || "",
      }));
      const res = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent: true, messages: batch }),
      });
      const d = await res.json();
      if (d.priorities && Array.isArray(d.priorities)) {
        const map = new Map<string, Priority>();
        for (const p of d.priorities) {
          if (p.id && (p.band === "high" || p.band === "normal" || p.band === "low")) {
            map.set(p.id, p.band);
          }
        }
        setPriorities(map);
        setSortByPriority(true);
      }
    } finally {
      setPrioritizing(false);
    }
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }
  if (filtered === null) {
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
      {/* Search + AI prioritize toolbar */}
      {(messages ?? []).length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects, senders, previews…"
              className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-black/35 focus:border-[var(--color-ocean-deep)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-ocean-deep)]/15"
            />
          </div>
          <button
            type="button"
            onClick={prioritize}
            disabled={prioritizing}
            className={
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 " +
              (priorities.size > 0
                ? "border-[var(--color-ocean-deep)]/30 bg-[var(--color-sky-dust)]/40 text-[var(--color-ocean-deep)]"
                : "border-black/10 bg-white text-black/70 hover:border-black/25")
            }
          >
            <span aria-hidden>✨</span>
            {prioritizing ? "AI sorting…" : priorities.size > 0 ? "Re-sort" : "AI prioritize"}
          </button>
          {priorities.size > 0 && (
            <button
              type="button"
              onClick={() => setSortByPriority((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/70 hover:border-black/25"
            >
              {sortByPriority ? "Sort by date" : "Sort by priority"}
            </button>
          )}
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Account switcher">
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
      {filtered.length === 0 && accounts.length > 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-black/15 px-4 py-12 text-center text-sm text-black/60">
          {query ? `No messages match "${query}".` : activeAccount === ALL ? "Inbox is empty." : "No messages in this mailbox."}
        </div>
      )}

      {filtered.length > 0 && (
        <ul className="mt-4 divide-y divide-black/5 overflow-hidden rounded-xl border border-black/8 bg-white">
          {filtered.map((m) => {
            const senderName = m.from.name || m.from.address.split("@")[0];
            const avatarSeed = m.from.address || senderName;
            const priority = priorities.get(keyOf(m));
            return (
              <li key={keyOf(m)}>
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
                      {m.flags.flagged && <span aria-label="flagged" className="text-amber-500">★</span>}
                      {priority && <PriorityChip band={priority} />}
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

function keyOf(m: MessageSummary): string {
  return `${m.accountId}:${m.id}`;
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
  if (label === "INBOX" || label === "UNREAD" || label === "IMPORTANT") return null;
  const pretty = label.replace(/^CATEGORY_/i, "").toLowerCase();
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-sky-dust)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ocean-deep)]">
      {pretty}
    </span>
  );
}

function PriorityChip({ band }: { band: Priority }) {
  const map = {
    high: { label: "High", bg: "#fee2e2", fg: "#991b1b" },
    normal: { label: "Normal", bg: "#e0e7ff", fg: "#3730a3" },
    low: { label: "Low", bg: "#f3f4f6", fg: "#6b7280" },
  };
  const s = map[band];
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
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
