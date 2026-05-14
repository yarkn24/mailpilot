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
          Connect a mailbox. Gmail and Microsoft 365 use OAuth. IMAP uses an
          app password (Yahoo, AOL, iCloud, Fastmail, custom).
        </p>

        <OAuthBanners />

        <section className="mt-8">
          <h2 className="t-subheading">Connected mailboxes</h2>
          <AccountList />
        </section>

        <section className="mt-10">
          <h2 className="t-subheading">Connect Gmail</h2>
          <p className="t-caption mt-2" style={{ color: "var(--color-deep-space)" }}>
            Opens Google&apos;s consent screen. Requested scopes:{" "}
            <code style={{ background: "var(--color-sky-dust)", padding: "1px 6px", borderRadius: 4 }}>gmail.modify</code>{" "}
            and <code style={{ background: "var(--color-sky-dust)", padding: "1px 6px", borderRadius: 4 }}>userinfo.email</code>.
          </p>
          <a href="/api/oauth/gmail/start" className="btn-primary mt-3">
            Connect Gmail
          </a>
        </section>

        <section className="mt-10">
          <h2 className="t-subheading">Connect Microsoft 365</h2>
          <p className="t-caption mt-2" style={{ color: "var(--color-deep-space)" }}>
            Opens Microsoft&apos;s consent screen. Requested scopes:{" "}
            <code style={{ background: "var(--color-sky-dust)", padding: "1px 6px", borderRadius: 4 }}>Mail.ReadWrite</code>,{" "}
            <code style={{ background: "var(--color-sky-dust)", padding: "1px 6px", borderRadius: 4 }}>Mail.Send</code>,{" "}
            <code style={{ background: "var(--color-sky-dust)", padding: "1px 6px", borderRadius: 4 }}>offline_access</code>.
          </p>
          <a href="/api/oauth/graph/start" className="btn-primary mt-3">
            Connect Microsoft 365
          </a>
        </section>

        <section className="mt-12">
          <h2 className="t-subheading">Connect IMAP mailbox</h2>
          <p className="t-caption mt-2" style={{ color: "var(--color-deep-space)" }}>
            Use an <strong>app password</strong>, not your real account
            password. Yahoo, AOL, and iCloud require app passwords from their
            security settings.
          </p>
          <ConnectImap />
        </section>
      </div>
    </main>
  );
}
