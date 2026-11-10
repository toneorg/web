import { PanelPage } from "@/conversas/PanelPage";

export default async function PainelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PanelPage watchId={id} />;
}
