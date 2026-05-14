import Link from "next/link";

export function Nav({ active }: { active?: "inbox" | "compose" | "settings" }) {
  return (
    <header style={{ background: "var(--color-cloud-cover)", borderBottom: "1px solid var(--color-stone-whisper)" }}>
      <div
        className="mx-auto flex items-center justify-between px-6 py-4 sm:px-10"
        style={{ maxWidth: "var(--page-max-width)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center font-semibold text-white"
            style={{ background: "var(--color-ocean-deep)", borderRadius: 8 }}
          >
            M
          </span>
          <span className="t-body" style={{ fontWeight: 600 }}>Mailpilot</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Tab href="/inbox" label="Inbox" active={active === "inbox"} />
          <Tab href="/compose" label="Compose" active={active === "compose"} />
          <Tab href="/settings" label="Settings" active={active === "settings"} />
        </nav>
      </div>
    </header>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link href={href} className="nav-link" aria-current={active ? "page" : undefined}>
      {label}
    </Link>
  );
}
