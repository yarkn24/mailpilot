import { Nav } from "@/components/Nav";
import { ConnectImap } from "./ConnectImap";
import { AccountList } from "./AccountList";
import { OAuthBanners } from "./OAuthBanners";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main>
      <Nav active="settings" />
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <h1 className="t-heading">Settings</h1>
        <p className="t-body mt-2" style={{ color: "var(--color-deep-space)" }}>
          Connect one or more mailboxes. They merge into a single inbox with AI summaries, drafts, and prioritization on top.
        </p>

        <OAuthBanners />

        <section className="mt-10">
          <h2 className="t-subheading">Connected mailboxes</h2>
          <AccountList />
        </section>

        <section className="mt-12">
          <h2 className="t-subheading">Add a mailbox</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ProviderCard
              name="Gmail"
              accent="#ea4335"
              logo={<GmailLogo />}
              description="One-click OAuth — gmail.modify + read profile."
              href="/api/oauth/gmail/start"
            />
            <ProviderCard
              name="Microsoft 365"
              accent="#0078d4"
              logo={<MicrosoftLogo />}
              description="One-click OAuth — Mail.ReadWrite, Mail.Send, offline_access. Personal Outlook/Hotmail? Use IMAP below."
              href="/api/oauth/graph/start"
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="t-subheading">Or connect via IMAP</h2>
          <p className="t-caption mt-2" style={{ color: "var(--color-deep-space)" }}>
            Use an <strong>app password</strong>, not your real password. Auto-detected presets for
            <span className="font-medium"> Yahoo, AOL, iCloud, Fastmail, Outlook/Hotmail/Live</span>.
            Custom hosts under Advanced.
          </p>
          <ConnectImap />
        </section>
      </div>
    </main>
  );
}

function ProviderCard({
  name, accent, logo, description, href,
}: {
  name: string;
  accent: string;
  logo: React.ReactNode;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-black/25 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${accent}12` }}
        >
          {logo}
        </div>
        <div className="font-semibold text-black">{name}</div>
        <span
          className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ background: accent }}
        >
          Connect
        </span>
      </div>
      <p className="text-xs leading-relaxed text-black/60">{description}</p>
    </a>
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
