"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  provider: string;
  email: string;
  displayName?: string;
  addedAt: string;
}

export function AccountList() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounts").then((r) => r.json()).then((d) => setAccounts(d.accounts ?? []));
  }, []);

  async function remove(id: string) {
    if (!confirm("Disconnect this mailbox? Stored credentials are wiped.")) return;
    setBusy(id);
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setAccounts((cur) => (cur ?? []).filter((a) => a.id !== id));
      router.refresh();
    }
  }

  if (accounts === null) {
    return <div className="mt-3 text-sm text-[var(--color-muted)]">Loading…</div>;
  }
  if (accounts.length === 0) {
    return (
      <div className="mt-3 rounded border border-dashed border-[var(--color-ink)]/15 px-4 py-6 text-sm text-[var(--color-muted)] dark:border-white/20">
        No mailboxes connected. Add one below to see your inbox.
      </div>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-[var(--color-ink)]/10 rounded border border-[var(--color-ink)]/10 dark:divide-white/10 dark:border-white/10">
      {accounts.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <div>
            <div className="font-medium">{a.email}</div>
            <div className="text-xs text-[var(--color-muted)]">
              {a.provider.toUpperCase()} · added {new Date(a.addedAt).toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => remove(a.id)}
            disabled={busy === a.id}
            className="rounded border border-[var(--color-ink)]/15 px-3 py-1 text-xs hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
          >
            {busy === a.id ? "…" : "Disconnect"}
          </button>
        </li>
      ))}
    </ul>
  );
}
