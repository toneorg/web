import { Conversation } from "@/conversas/Conversation";

export default async function ConversaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ primeira?: string | string[] }>;
}) {
  const { id } = await params;
  const { primeira } = await searchParams;
  return <Conversation sessionId={id} first={typeof primeira === "string" ? primeira.slice(0, 4000) : null} />;
}
