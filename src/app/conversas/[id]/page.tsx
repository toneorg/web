import { redirect } from "next/navigation";
import { Conversation } from "@/conversas/Conversation";

/**
 * A panel's conversation (`?painel=`) is still its own page, opened from the panel. Any other
 * old conversation address goes to the single chat, scrolled to that conversation (15/11/2026).
 */
export default async function ConversaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ primeira?: string | string[]; painel?: string | string[] }>;
}) {
  const { id } = await params;
  const { primeira, painel } = await searchParams;
  if (typeof painel !== "string" || !painel) redirect(`/conversas?em=${encodeURIComponent(id)}`);
  return (
    <Conversation
      sessionId={id}
      first={typeof primeira === "string" ? primeira.slice(0, 4000) : null}
      panelId={painel.slice(0, 60)}
    />
  );
}
