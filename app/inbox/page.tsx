import Link from "next/link";
import { Nav } from "@/components/Nav";
import { InboxList } from "./InboxList";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  return (
    <main className="min-h-dvh">
      <Nav active="inbox" />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <Link
            href="/settings"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-white"
          >
            Manage accounts →
          </Link>
        </div>
        <InboxList />
      </div>
    </main>
  );
}
