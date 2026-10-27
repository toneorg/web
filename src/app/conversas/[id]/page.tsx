import { Conversation } from "@/conversas/Conversation";

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Conversation sessionId={id} />;
}
