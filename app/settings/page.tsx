import { Nav } from "@/components/Nav";
import { ConnectImap } from "./ConnectImap";
import { AccountList } from "./AccountList";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main className="min-h-dvh">
      <Nav active="settings" />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Connect a mailbox. IMAP works today (Yahoo, AOL, iCloud, Fastmail,
          custom). Gmail and Microsoft 365 OAuth ship in a follow-up.
        </p>

        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Connected mailboxes
          </h2>
          <AccountList />
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Connect IMAP mailbox
          </h2>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Use an <strong>app password</strong>, not your real account
            password. Yahoo, AOL, and iCloud require app passwords from their
            security settings.
          </p>
          <ConnectImap />
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Connect Gmail · soon
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Google OAuth requires a verified app for the <code>gmail.modify</code> scope.
            The provider abstraction is in place; the flow lands in a follow-up.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Connect Microsoft 365 · soon
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Azure AD app registration + publisher verification required.
            Same shape as Gmail — abstraction ready, OAuth flow pending.
          </p>
        </section>
      </div>
    </main>
  );
}
