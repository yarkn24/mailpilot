import { Nav } from "@/components/Nav";
import { MessageView } from "./MessageView";

export const dynamic = "force-dynamic";

export default async function MessagePage({
  params,
}: {
  params: Promise<{ accountId: string; id: string }>;
}) {
  const { accountId, id } = await params;
  return (
    <main className="min-h-dvh">
      <Nav active="inbox" />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <MessageView accountId={accountId} messageId={id} />
      </div>
    </main>
  );
}
