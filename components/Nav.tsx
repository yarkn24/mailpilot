import Link from "next/link";

export function Nav({ active }: { active?: "inbox" | "compose" | "settings" }) {
  return (
    <nav className="flex items-center gap-1 border-b border-[var(--color-ink)]/10 px-4 py-3 text-sm dark:border-white/10">
      <Link href="/" className="mr-4 font-semibold tracking-tight">
        Mailpilot
      </Link>
      <Tab href="/inbox" label="Inbox" active={active === "inbox"} />
      <Tab href="/compose" label="Compose" active={active === "compose"} />
      <Tab href="/settings" label="Settings" active={active === "settings"} />
    </nav>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={
        "rounded px-3 py-1.5 " +
        (active
          ? "bg-[var(--color-ink)] text-[var(--color-paper)] dark:bg-[var(--color-paper)] dark:text-[var(--color-ink)]"
          : "hover:bg-black/5 dark:hover:bg-white/10")
      }
    >
      {label}
    </Link>
  );
}
