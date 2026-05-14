import { Nav } from "@/components/Nav";
import { ComposeForm } from "./ComposeForm";

export const dynamic = "force-dynamic";

export default function ComposePage() {
  return (
    <main className="min-h-dvh">
      <Nav active="compose" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
        <ComposeForm />
      </div>
    </main>
  );
}
