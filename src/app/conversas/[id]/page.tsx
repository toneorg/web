import { Conversation } from "@/conversas/Conversation";

export default async function ConversaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ primeira?: string | string[]; painel?: string | string[] }>;
}) {
  const { id } = await params;
  const { primeira, painel } = await searchParams;
  return (
    <Conversation
      sessionId={id}
      first={typeof primeira === "string" ? primeira.slice(0, 4000) : null}
      panelId={typeof painel === "string" ? painel.slice(0, 60) : null}
    />
  );
}
