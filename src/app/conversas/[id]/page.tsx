import { redirect } from "next/navigation";

/**
 * An old conversation address goes to the single chat, scrolled to that conversation (15/11/2026).
 * Panels have no conversation of their own since 20/11/2026: `?painel=` links land there too.
 */
export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/conversas?em=${encodeURIComponent(id)}`);
}
