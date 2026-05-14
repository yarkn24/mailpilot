"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConnectImap() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("993");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "imap",
          email,
          password,
          imapHost: host || undefined,
          imapPort: parseInt(port, 10),
          smtpHost: smtpHost || undefined,
          smtpPort: parseInt(smtpPort, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      // Clear form + refresh server components.
      setEmail(""); setPassword(""); setHost(""); setSmtpHost("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3">
      <Field label="Email address">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yahoo.com"
          className={inputCls}
        />
      </Field>
      <Field label="App password">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="16-character app password"
          className={inputCls}
        />
      </Field>
      <details className="text-sm">
        <summary className="cursor-pointer select-none text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-white">
          Advanced — override host/port (auto-detected for yahoo, aol, icloud, fastmail)
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="IMAP host">
            <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="imap.example.com" className={inputCls} />
          </Field>
          <Field label="IMAP port">
            <input value={port} onChange={(e) => setPort(e.target.value)} className={inputCls} />
          </Field>
          <Field label="SMTP host">
            <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" className={inputCls} />
          </Field>
          <Field label="SMTP port">
            <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </details>
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={busy || !email || !password}
        className="self-start rounded-md bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] disabled:opacity-50 dark:bg-[var(--color-paper)] dark:text-[var(--color-ink)]"
      >
        {busy ? "Connecting…" : "Connect mailbox"}
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
