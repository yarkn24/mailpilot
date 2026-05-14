"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  email: string;
  provider: string;
}

export function ComposeForm() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const imap = (d.accounts ?? []).filter((a: Account) => a.provider === "imap");
        setAccounts(imap);
        if (imap[0]) setFrom(imap[0].id);
      });
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accountId: from,
          to,
          cc: cc || undefined,
          subject,
          body: bodyText,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || `send failed (${res.status})`);
        return;
      }
      setSent(true);
      setTimeout(() => router.push("/inbox"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "send failed");
    } finally {
      setBusy(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="mt-6 rounded border border-dashed border-[var(--color-ink)]/15 px-4 py-8 text-sm text-[var(--color-muted)] dark:border-white/20">
        Connect an IMAP account first. Compose uses SMTP from the connected
        mailbox.
      </div>
    );
  }

  return (
    <form onSubmit={send} className="mt-6 grid gap-3">
      <Field label="From">
        <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.email}</option>
          ))}
        </select>
      </Field>
      <Field label="To">
        <input type="email" required value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Cc">
        <input value={cc} onChange={(e) => setCc(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Subject">
        <input required value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Body">
        <textarea
          required
          rows={10}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          className={inputCls + " resize-y"}
        />
      </Field>
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      {sent && (
        <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
          Sent. Redirecting…
        </div>
      )}
      <button
        type="submit"
        disabled={busy || !to || !subject || !bodyText}
        className="self-start rounded-md bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] disabled:opacity-50 dark:bg-[var(--color-paper)] dark:text-[var(--color-ink)]"
      >
        {busy ? "Sending…" : "Send"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded border border-[var(--color-ink)]/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] dark:border-white/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );
}
