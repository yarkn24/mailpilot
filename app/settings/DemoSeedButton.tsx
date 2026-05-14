"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Persona = "gmail" | "office365" | "yahoo" | "aol" | "all";

export function DemoSeedButton({
  persona, label, accent, subtle,
}: {
  persona: Persona;
  label: string;
  accent?: string;
  subtle?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setError(null);
    try {
      const personas: Exclude<Persona, "all">[] =
        persona === "all" ? ["gmail", "office365", "yahoo", "aol"] : [persona];
      for (const p of personas) {
        const res = await fetch("/api/demo/seed", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ persona: p }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || `seed failed (${res.status})`);
        }
      }
      router.push("/inbox");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "seed failed");
    } finally {
      setBusy(false);
    }
  }

  if (subtle) {
    return (
      <button
        type="button"
        onClick={seed}
        disabled={busy}
        className="text-xs text-black/55 underline-offset-2 hover:text-black/80 hover:underline disabled:opacity-50"
      >
        {busy ? "Seeding…" : label}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={seed}
        disabled={busy}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: accent || "var(--color-ocean-deep)" }}
      >
        <span aria-hidden>▶</span>
        {busy ? "Seeding…" : label}
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </>
  );
}
