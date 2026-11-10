import type { Metadata } from "next";
import "@toneorg/design/tokens.css";
import "@/tone/genui/genui.css";
import { BenchFrame } from "@/conversas/BenchFrame";

// A panel's page shows product photos, like the conversations: the same neutral bench.
export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function PaineisLayout({ children }: { children: React.ReactNode }) {
  return <BenchFrame>{children}</BenchFrame>;
}
