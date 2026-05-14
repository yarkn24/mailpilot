import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8">
      <Header />

      <section className="mt-16 grid grid-cols-12 gap-x-6 gap-y-4">
        <div className="col-span-12 sm:col-span-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            mailpilot &nbsp;/&nbsp; v0.1 &nbsp;/&nbsp; gmail · m365 · imap
          </p>
          <h1 className="mt-3 text-5xl font-bold leading-[1.02] tracking-tight sm:text-[5.5rem]">
            three providers.
            <br />
            <span className="text-[var(--color-accent)]">one inbox.</span>
            <br />
            ai that never logs.
          </h1>
          <p className="mt-6 max-w-xl text-base text-[var(--color-muted)] sm:text-lg">
            Connect a mailbox. Read it. Move on. Summaries, drafts,
            prioritization — opt-in per mailbox, default off. Bodies are
            not stored. Addresses are redacted before any model call.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 font-mono text-[13px]">
            <Link
              href="/settings"
              className="border border-[var(--color-ink)] px-4 py-2 font-medium hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
            >
              $ connect mailbox →
            </Link>
            <Link
              href="/inbox"
              className="border border-[var(--color-rule)] px-4 py-2 font-medium hover:border-[var(--color-ink)]"
            >
              open inbox
            </Link>
            <a
              href="https://github.com/yarkn24/mailpilot/blob/main/docs/ARCHITECTURE.md"
              className="border border-transparent px-4 py-2 font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-white"
            >
              read the architecture
            </a>
          </div>
        </div>

        <aside className="col-span-12 sm:col-span-4">
          <pre className="font-mono text-[11px] leading-relaxed text-[var(--color-muted)] sm:text-[12px]">
{`# auditor.audit @ HEAD
─────────────────────────
R1 PII redaction ........ ok
R3 AI consent gate ...... ok
R4 token budgets ........ ok
R6 intent tests ......... ok
R8 fail loud ............ ok
R10 provider symmetry ... ok

unit tests   22 / 22  ok
e2e tests    44 / 44  ok
build        next 16   ok
deploy       vercel    ok
`}
          </pre>
        </aside>
      </section>

      <hr className="my-16 border-t border-[var(--color-rule)]" />

      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
          // status — what works today
        </h2>
        <ul className="mt-4 divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {STATUS.map((row) => (
            <li key={row.feature} className="grid grid-cols-[6rem_1fr_auto] items-baseline gap-4 px-1 py-3 text-sm">
              <span className={`chip ${row.tone}`}>{row.label}</span>
              <span className="font-medium">{row.feature}</span>
              <span className="text-right font-mono text-xs text-[var(--color-muted)]">
                {row.note}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 grid gap-10 sm:grid-cols-3">
        <Block
          n="01"
          title="one inbox, three providers"
          body="Gmail, Microsoft 365, any IMAP. Deduped by Message-ID across accounts. Provider features surface via capabilities — no lowest-common-denominator UI."
        />
        <Block
          n="02"
          title="ai asks first"
          body="Summaries (Haiku), drafts (Sonnet), prioritization (Haiku batched). Opt-in per mailbox, default off. Bodies are redacted before any model call. Tokens are budgeted, not hoped for."
        />
        <Block
          n="03"
          title="100ms or it didn't happen"
          body="Mobile-first. Keyboard-first. Optimistic UI on every mutation. 360px is the design target, not the afterthought."
        />
      </section>

      <hr className="my-16 border-t border-[var(--color-rule)]" />

      <footer className="font-mono text-[11px] text-[var(--color-muted)]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <span>build: next 16.2</span>
          <span>tests: 66 / 66</span>
          <span>agents: 8</span>
          <span>hooks: 3</span>
        </div>
        <div className="mt-3">claude code · spec-kit · vercel · v0.1</div>
      </footer>
    </main>
  );
}

const STATUS = [
  { feature: "Mobile-ready PWA",                                 label: "OK",   tone: "chip-ok",   note: "manifest + sw + 360px" },
  { feature: "IMAP connect (Yahoo, AOL, iCloud, Fastmail, custom)", label: "OK",   tone: "chip-ok",   note: "app-password" },
  { feature: "Unified inbox across accounts",                    label: "OK",   tone: "chip-ok",   note: "Message-ID dedup" },
  { feature: "Read mail (sandboxed HTML)",                       label: "OK",   tone: "chip-ok",   note: "iframe sandbox" },
  { feature: "Archive / Trash / Mark read",                      label: "OK",   tone: "chip-ok",   note: "IMAP MOVE + flags" },
  { feature: "Compose / Reply via SMTP",                         label: "OK",   tone: "chip-ok",   note: "header-injection guarded" },
  { feature: "Search across accounts",                           label: "OK",   tone: "chip-ok",   note: "server-side BODY search" },
  { feature: "AI summary · Claude Haiku 4.5",                    label: "OK",   tone: "chip-ok",   note: "consent · redact · budget" },
  { feature: "AI reply draft · Claude Sonnet 4.6",               label: "OK",   tone: "chip-ok",   note: "tone-controlled" },
  { feature: "AI prioritization · batched",                      label: "OK",   tone: "chip-ok",   note: "priority bands" },
  { feature: "Gmail OAuth",                                      label: "WIP",  tone: "chip-warn", note: "CASA audit needed" },
  { feature: "Microsoft 365 OAuth",                              label: "WIP",  tone: "chip-warn", note: "Azure publisher verify" },
  { feature: "Long-lived sync · IMAP IDLE / Gmail watch",        label: "OUT",  tone: "chip-stop", note: "needs worker tier" },
] as const;

function Header() {
  return (
    <header className="flex items-baseline justify-between border-b border-[var(--color-rule)] pb-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm">▍</span>
        <span className="font-mono text-base font-semibold tracking-tight">mailpilot</span>
        <span className="font-mono text-[11px] text-[var(--color-muted)]">v0.1</span>
      </div>
      <nav className="font-mono text-[12px]">
        <a
          href="https://github.com/yarkn24/mailpilot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-white"
        >
          github ↗
        </a>
      </nav>
    </header>
  );
}

function Block({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <span className="font-mono text-[11px] text-[var(--color-accent)]">{n}.</span>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
