export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-between px-6 py-10 sm:py-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-accent)] font-bold text-white"
          >
            M
          </span>
          <span className="text-lg font-semibold tracking-tight">Mailpilot</span>
        </div>
        <nav className="text-sm text-[var(--color-muted)]">
          <a
            href="https://github.com/yarkn24/mailpilot"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-ink)] dark:hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </header>

      <section className="mt-16 sm:mt-24">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          AI-first email · Gmail · Microsoft 365 · IMAP
        </p>
        <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
          One inbox.
          <br />
          Three providers.
          <br />
          AI that never logs.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)] sm:text-xl">
          A universal email client built mobile-first, with summaries, reply drafts,
          and prioritization powered by Claude. Privacy-respecting: AI is opt-in per
          mailbox, content never leaves a redaction layer, and bodies are never
          stored long-term.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md bg-[var(--color-ink)] px-5 py-3 text-sm font-medium text-[var(--color-paper)] opacity-60 dark:bg-[var(--color-paper)] dark:text-[var(--color-ink)]"
            title="Auth flow ships in the next iteration"
          >
            Connect mailbox · soon
          </button>
          <a
            href="https://github.com/yarkn24/mailpilot/blob/main/docs/ARCHITECTURE.md"
            className="rounded-md border border-[var(--color-ink)]/15 px-5 py-3 text-sm font-medium hover:border-[var(--color-ink)]/40 dark:border-white/20 dark:hover:border-white/40"
          >
            Read the architecture →
          </a>
        </div>
      </section>

      <section className="mt-16 grid gap-6 sm:mt-24 sm:grid-cols-3">
        <Feature
          title="Unified inbox"
          body="Gmail, Microsoft 365, and any IMAP provider in one stream. Deduped by Message-ID across accounts."
        />
        <Feature
          title="AI that asks first"
          body="Summaries, drafts, and prioritization are opt-in per mailbox. Default off. Some employers ban LLM email processing — we respect that."
        />
        <Feature
          title="PWA, mobile-first"
          body="Installable, offline-capable, push-enabled. Designed for 360px before it's designed for 1440px."
        />
      </section>

      <footer className="mt-16 flex items-center justify-between text-xs text-[var(--color-muted)] sm:mt-24">
        <span>Built with Claude Code · Spec-Kit · Vercel</span>
        <span>v0.1 · scaffold</span>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
        {body}
      </p>
    </div>
  );
}
