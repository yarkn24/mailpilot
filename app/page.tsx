import Link from "next/link";

export default function Home() {
  return (
    <main>
      <SiteHeader />

      {/* HERO — full-bleed Signal Blue, split layout */}
      <section style={{ background: "var(--color-signal-blue)" }}>
        <div
          className="mx-auto grid items-center gap-12 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-2 lg:gap-12 lg:py-28"
          style={{ maxWidth: "var(--page-max-width)" }}
        >
          <div>
            <h1 className="t-display">One inbox for everything.</h1>
            <p className="t-subheading mt-6 max-w-xl">
              Say hello to a calmer mailbox. Gmail, Microsoft 365, and IMAP in
              one stream. AI summaries, drafts, and prioritization — opt-in per
              mailbox. Bodies are never stored. Addresses are redacted before
              any model call.
            </p>
            <div className="mt-10">
              <Link href="/settings" className="btn-primary">Connect mailbox</Link>
            </div>
          </div>

          {/* Product mock — looks like an actual inbox preview */}
          <InboxMock />
        </div>
      </section>

      {/* WHY — large centered heading like Signal's "Why use Signal?" */}
      <section style={{ background: "var(--color-cloud-cover)" }}>
        <div
          className="mx-auto px-6 sm:px-10"
          style={{ maxWidth: "var(--page-max-width)", paddingTop: "var(--section-gap)", paddingBottom: 24 }}
        >
          <h2 className="t-heading-lg text-center">Why Mailpilot?</h2>
          <p className="t-body mt-3 text-center" style={{ color: "var(--color-deep-space)" }}>
            Privacy you control. Three providers, one shape. AI that has to ask first.
          </p>
        </div>
        <div
          className="mx-auto grid gap-6 px-6 sm:grid-cols-3 sm:px-10"
          style={{ maxWidth: "var(--page-max-width)", paddingBottom: "var(--section-gap)" }}
        >
          <FeatureCard
            title="One inbox, three providers"
            body="Gmail, Microsoft 365, IMAP. Deduped by Message-ID across accounts. Provider features surface via capabilities — no lowest-common-denominator UI."
          />
          <FeatureCard
            title="AI asks first"
            body="Summaries (Haiku 4.5), drafts (Sonnet 4.6), prioritization (Haiku batched). Opt-in per mailbox, default off. Bodies redacted before any model call."
            accent
          />
          <FeatureCard
            title="100ms or it didn't happen"
            body="Mobile-first. Keyboard-first. Optimistic UI on every mutation. 360px is the design target, not the afterthought."
          />
        </div>
      </section>

      {/* WHAT WORKS — alternating Sky Dust */}
      <section style={{ background: "var(--color-sky-dust)" }}>
        <div
          className="mx-auto px-6 sm:px-10"
          style={{ maxWidth: "var(--page-max-width)", paddingTop: "var(--section-gap)", paddingBottom: "var(--section-gap)" }}
        >
          <div className="mb-8 grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="t-heading">What works today</h2>
              <p className="t-body mt-2" style={{ color: "var(--color-deep-space)" }}>
                Shipped in this preview. Not a roadmap — running on the live URL right now.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
              <CounterCard k="22 / 22" v="unit tests" />
              <CounterCard k="44 / 44" v="e2e tests" />
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <ul style={{ borderRadius: "var(--radius-cards)", overflow: "hidden" }}>
              {STATUS.map((row, i) => (
                <li
                  key={row.feature}
                  className="grid grid-cols-[5rem_1fr_auto] items-center gap-4 px-5 py-4 sm:px-7"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-stone-whisper)" }}
                >
                  <span className={`chip ${row.tone}`}>{row.label}</span>
                  <span className="t-body" style={{ fontWeight: 500 }}>{row.feature}</span>
                  <span className="hidden text-right t-caption sm:inline" style={{ color: "var(--color-deep-space)" }}>
                    {row.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* BEHIND THE SCENES — white */}
      <section style={{ background: "var(--color-cloud-cover)" }}>
        <div
          className="mx-auto px-6 sm:px-10"
          style={{ maxWidth: "var(--page-max-width)", paddingTop: "var(--section-gap)", paddingBottom: "var(--section-gap)" }}
        >
          <h2 className="t-heading">Behind the scenes</h2>
          <p className="t-body mt-2" style={{ color: "var(--color-deep-space)" }}>
            Every artifact that proves how this was built with Claude Code.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <DocLink href="https://github.com/yarkn24/mailpilot/blob/main/docs/ARCHITECTURE.md" label="Architecture" sub="One-page system diagram + flows" />
            <DocLink href="https://github.com/yarkn24/mailpilot/blob/main/docs/WORKFLOW.md" label="Multi-agent workflow" sub="How 8 sub-agents build this codebase" />
            <DocLink href="https://github.com/yarkn24/mailpilot/blob/main/CLAUDE.md" label="CLAUDE.md" sub="Project rules + Claude Code discipline" />
            <DocLink href="https://github.com/yarkn24/mailpilot/blob/main/docs/VOICE.md" label="Voice & design language" sub="Five rules + canonical structure" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header style={{ background: "var(--color-cloud-cover)" }}>
      <div
        className="mx-auto flex items-center justify-between px-6 py-5 sm:px-10"
        style={{ maxWidth: "var(--page-max-width)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-9 w-9 items-center justify-center font-extrabold text-white"
            style={{ background: "var(--color-ocean-deep)", borderRadius: 999 }}
          >
            M
          </span>
          <span style={{ color: "var(--color-ocean-deep)", fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            Mailpilot
          </span>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/inbox" className="nav-link">Inbox</Link>
          <Link href="/compose" className="nav-link">Compose</Link>
          <Link href="/settings" className="nav-link">Settings</Link>
          <a
            href="https://github.com/yarkn24/mailpilot"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            GitHub
          </a>
          <a
            href="https://github.com/yarkn24/mailpilot/blob/main/docs/ARCHITECTURE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            Docs
          </a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer style={{ background: "var(--color-sky-dust)", borderTop: "1px solid var(--color-stone-whisper)" }}>
      <div
        className="mx-auto grid items-center gap-4 px-6 py-10 sm:px-10 sm:grid-cols-3"
        style={{ maxWidth: "var(--page-max-width)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center font-extrabold text-white"
            style={{ background: "var(--color-ocean-deep)", borderRadius: 999, fontSize: 13 }}
          >
            M
          </span>
          <span style={{ fontWeight: 600 }}>Mailpilot</span>
        </div>
        <div className="t-body text-center" style={{ color: "var(--color-deep-space)" }}>
          Built with Claude Code · Spec Kit · Vercel
        </div>
        <div className="text-right t-body" style={{ color: "var(--color-deep-space)" }}>
          v0.1 · scaffold
        </div>
      </div>
    </footer>
  );
}

/* Product mock — styled like an actual mailpilot inbox preview */
function InboxMock() {
  return (
    <div
      className="card-elevated relative mx-auto w-full max-w-md overflow-hidden"
      style={{ borderRadius: 22 }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: "var(--color-cloud-cover)", borderBottom: "1px solid var(--color-stone-whisper)" }}
      >
        <span style={{ height: 8, width: 8, borderRadius: 999, background: "#ff5f57", display: "inline-block" }} />
        <span style={{ height: 8, width: 8, borderRadius: 999, background: "#febc2e", display: "inline-block" }} />
        <span style={{ height: 8, width: 8, borderRadius: 999, background: "#28c840", display: "inline-block" }} />
        <span className="ml-3 t-caption" style={{ color: "var(--color-deep-space)" }}>
          mailpilot — Inbox
        </span>
      </div>
      <ul style={{ background: "var(--color-cloud-cover)" }}>
        {MOCK_MESSAGES.map((m, i) => (
          <li
            key={i}
            className="grid grid-cols-[8px_1fr_auto] items-start gap-3 px-4 py-3"
            style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-stone-whisper)" }}
          >
            <span
              style={{
                marginTop: 7,
                height: 8,
                width: 8,
                borderRadius: 999,
                background: m.unread ? "var(--color-ocean-deep)" : "transparent",
                display: "inline-block",
              }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate t-body" style={{ fontWeight: m.unread ? 700 : 500 }}>{m.from}</span>
                {m.aiLabel && (
                  <span
                    className="t-caption"
                    style={{
                      background: "var(--color-signal-blue)",
                      color: "var(--color-night-sky)",
                      padding: "0 6px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    {m.aiLabel}
                  </span>
                )}
              </div>
              <div className="truncate t-body" style={{ color: m.unread ? "var(--color-night-sky)" : "var(--color-deep-space)" }}>
                {m.subject}
              </div>
              {m.snippet && (
                <div className="mt-1 truncate t-caption" style={{ color: "var(--color-deep-space)" }}>
                  {m.snippet}
                </div>
              )}
            </div>
            <span className="t-caption" style={{ color: "var(--color-deep-space)" }}>{m.time}</span>
          </li>
        ))}
      </ul>
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ background: "var(--color-sky-dust)", borderTop: "1px solid var(--color-stone-whisper)" }}
      >
        <span className="t-caption" style={{ color: "var(--color-deep-space)" }}>
          gmail · m365 · imap — all caught up
        </span>
        <span className="t-caption" style={{ color: "var(--color-ocean-deep)", fontWeight: 600 }}>
          ✓ AI consent: per-mailbox
        </span>
      </div>
    </div>
  );
}

const MOCK_MESSAGES = [
  { from: "Maya Johnson",      subject: "Re: design review notes",       snippet: "Summary: pushed back on hero copy; product mock looks great.", time: "11:14", unread: true,  aiLabel: "high" },
  { from: "GitHub",            subject: "PR #142 ready for review",      snippet: "fix(redact): per-call regex; resolves shared-state bug",         time: "10:02", unread: true,  aiLabel: null },
  { from: "Stripe",            subject: "Receipt for May",               snippet: "Your invoice is attached. No action needed.",                   time: "09:31", unread: false, aiLabel: "low"  },
  { from: "Carol Becker",      subject: "Lunch Thursday?",               snippet: "Are you free 12:30 at the place near the office?",              time: "Yest.", unread: false, aiLabel: null },
  { from: "AWS Health",        subject: "Scheduled maintenance",         snippet: "us-east-1: brief degradation window 02:00–02:15 UTC.",         time: "Mon",   unread: false, aiLabel: "low"  },
] as const;

function CounterCard({ k, v }: { k: string; v: string }) {
  return (
    <div
      className="flex items-baseline gap-3 px-4 py-3"
      style={{ background: "var(--color-cloud-cover)", border: "1px solid var(--color-stone-whisper)", borderRadius: "var(--radius-cards)" }}
    >
      <span className="t-heading">{k}</span>
      <span className="t-caption uppercase tracking-wider" style={{ color: "var(--color-deep-space)" }}>{v}</span>
    </div>
  );
}

function FeatureCard({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div
      className="card"
      style={accent ? { background: "var(--color-signal-blue)", borderColor: "var(--color-signal-blue)" } : {}}
    >
      <h3 className="t-subheading">{title}</h3>
      <p className="t-body mt-3" style={{ color: "var(--color-deep-space)" }}>{body}</p>
    </div>
  );
}

function DocLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card flex items-center justify-between gap-4 transition-shadow hover:shadow-lg"
      style={{ padding: "20px 24px" }}
    >
      <div>
        <div className="t-subheading">{label}</div>
        <div className="t-caption" style={{ color: "var(--color-deep-space)" }}>{sub}</div>
      </div>
      <span aria-hidden style={{ color: "var(--color-link-blue)", fontSize: 20 }}>→</span>
    </a>
  );
}

const STATUS = [
  { feature: "Mobile-ready PWA",                                    label: "OK",  tone: "chip-ok",   note: "manifest + sw + 360px" },
  { feature: "IMAP connect (Yahoo, AOL, iCloud, Fastmail, custom)", label: "OK",  tone: "chip-ok",   note: "app password" },
  { feature: "Unified inbox across accounts",                       label: "OK",  tone: "chip-ok",   note: "Message-ID dedup" },
  { feature: "Read mail (sandboxed HTML)",                          label: "OK",  tone: "chip-ok",   note: "iframe sandbox" },
  { feature: "Archive · Trash · Mark read",                         label: "OK",  tone: "chip-ok",   note: "IMAP MOVE + flags" },
  { feature: "Compose · Reply via SMTP",                            label: "OK",  tone: "chip-ok",   note: "header-injection guarded" },
  { feature: "Search across accounts",                              label: "OK",  tone: "chip-ok",   note: "server-side BODY search" },
  { feature: "AI summary · Claude Haiku 4.5",                       label: "OK",  tone: "chip-ok",   note: "consent · redact · budget" },
  { feature: "AI reply draft · Claude Sonnet 4.6",                  label: "OK",  tone: "chip-ok",   note: "tone-controlled" },
  { feature: "AI prioritization · batched",                         label: "OK",  tone: "chip-ok",   note: "priority bands" },
  { feature: "Gmail OAuth",                                         label: "WIP", tone: "chip-warn", note: "CASA audit needed" },
  { feature: "Microsoft 365 OAuth",                                 label: "WIP", tone: "chip-warn", note: "Azure publisher verify" },
  { feature: "Long-lived sync · IMAP IDLE / Gmail watch",           label: "OUT", tone: "chip-stop", note: "needs worker tier" },
] as const;
