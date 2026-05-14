import { Nav } from "@/components/Nav";
import { ConnectImap } from "./ConnectImap";
import { AccountList } from "./AccountList";
import { OAuthBanners } from "./OAuthBanners";
import { DemoSeedButton } from "./DemoSeedButton";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main>
      <Nav active="settings" />
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <h1 className="t-heading">Settings</h1>
        <p className="t-body mt-2" style={{ color: "var(--color-deep-space)" }}>
          Connect a real mailbox or try the demo — Mailpilot supports both side by side.
        </p>

        <OAuthBanners />

        <section className="mt-10">
          <h2 className="t-subheading">Connected mailboxes</h2>
          <AccountList />
        </section>

        <section className="mt-12">
          <h2 className="t-subheading">Add a mailbox</h2>
          <p className="t-caption mt-2" style={{ color: "var(--color-deep-space)" }}>
            Real path uses OAuth or IMAP app password. <strong>Demo</strong> seeds a mock mailbox with realistic cross-account mail so you can try every feature instantly — switch between demo accounts like Gmail's multi-inbox.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ProviderCard
              name="Gmail"
              accent="#ea4335"
              logo={<GmailLogo />}
              description="OAuth with gmail.modify. Demo: pre-seeded inbox with GitHub PR alerts, receipts, friends."
              connectHref="/api/oauth/gmail/start"
              connectLabel="Connect"
              demoPersona="gmail"
              demoLabel="Try Gmail demo"
            />
            <ProviderCard
              name="Microsoft 365"
              accent="#0078d4"
              logo={<MicrosoftLogo />}
              description="Graph OAuth (Mail.ReadWrite + Mail.Send). Personal Outlook → use IMAP. Demo: work inbox with incident pages + Q3 planning."
              connectHref="/api/oauth/graph/start"
              connectLabel="Connect"
              demoPersona="office365"
              demoLabel="Try Microsoft 365 demo"
            />
            <ProviderCard
              name="Yahoo / AOL / IMAP"
              accent="#7e22ce"
              logo={<ImapLogo />}
              description="App-password IMAP for Yahoo, AOL, iCloud, Fastmail, Outlook/Hotmail, custom. Demo: Yahoo persona pre-seeded."
              connectHref="#imap-form"
              connectLabel="Use IMAP form below"
              demoPersona="yahoo"
              demoLabel="Try Yahoo demo"
            />
          </div>

          <div className="mt-3 text-center">
            <DemoSeedButton persona="all" label="Or seed all four demo mailboxes at once →" subtle />
          </div>
        </section>

        <section className="mt-12" id="imap-form">
          <h2 className="t-subheading">Connect via IMAP</h2>
          <p className="t-caption mt-2" style={{ color: "var(--color-deep-space)" }}>
            Use an <strong>app password</strong>, not your real password. Auto-detected presets for
            <span className="font-medium"> Yahoo, AOL, iCloud, Fastmail, Outlook, Hotmail, Live, MSN</span>.
            Anything else: enter host/port under Advanced.
          </p>
          <ConnectImap />
        </section>
      </div>
    </main>
  );
}

function ProviderCard({
  name, accent, logo, description, connectHref, connectLabel, demoPersona, demoLabel,
}: {
  name: string;
  accent: string;
  logo: React.ReactNode;
  description: string;
  connectHref: string;
  connectLabel: string;
  demoPersona: "gmail" | "office365" | "yahoo" | "aol";
  demoLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${accent}12` }}
        >
          {logo}
        </div>
        <div className="font-semibold text-black">{name}</div>
      </div>
      <p className="text-xs leading-relaxed text-black/60">{description}</p>
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <a
          href={connectHref}
          className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-black hover:border-black/30"
        >
          {connectLabel}
        </a>
        <DemoSeedButton persona={demoPersona} label={demoLabel} accent={accent} />
      </div>
    </div>
  );
}

function GmailLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22 6.5v11.25c0 .69-.56 1.25-1.25 1.25H18V9.74L12 14.25L6 9.74V19H3.25C2.56 19 2 18.44 2 17.75V6.5C2 5.39 3.18 4.79 4 5.32L6 6.83L12 11.32L18 6.83L20 5.32C20.82 4.79 22 5.39 22 6.5z" />
      <path fill="#34A853" d="M6 19V9.74L12 14.25V19H6z" />
      <path fill="#FBBC04" d="M18 19V9.74L12 14.25V19H18z" />
      <path fill="#EA4335" d="M4 5.32L12 11.32L20 5.32C20.82 4.79 22 5.39 22 6.5L22 6.5L12 14.25L2 6.5C2 5.39 3.18 4.79 4 5.32z" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

function ImapLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" fill="#7e22ce" />
      <path d="M3 7l9 6 9-6" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
