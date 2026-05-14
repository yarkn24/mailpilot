"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function OAuthBanners() {
  const sp = useSearchParams();
  const router = useRouter();
  const [connected, setConnected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = sp.get("connected");
    const e = sp.get("error");
    setConnected(c);
    setError(e);
    if (c || e) {
      // Clear the query string after one render so a refresh doesn't re-show.
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      url.searchParams.delete("error");
      router.replace(url.pathname + (url.search ? `?${url.searchParams}` : ""));
    }
  }, [sp, router]);

  if (!connected && !error) return null;
  return (
    <div className="mt-4 space-y-2">
      {connected && (
        <div
          className="px-4 py-3 t-body"
          style={{ background: "var(--color-signal-blue)", borderRadius: 8, color: "var(--color-night-sky)" }}
        >
          ✓ Connected {connected === "gmail" ? "Gmail" : connected === "graph" ? "Microsoft 365" : connected}.
        </div>
      )}
      {error && (
        <div
          className="px-4 py-3 t-body"
          style={{ background: "#ffe4e1", borderRadius: 8, color: "#7a1f1f", border: "1px solid #f3b8b0" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
