import type { Metadata } from "next";
import "@toneorg/design/tokens.css";
import "@/tone/genui/genui.css";
import { BenchFrame } from "@/conversas/BenchFrame";

// T06: the conversation pages sit on the neutral bench of the design system: they show product photos.
export const metadata: Metadata = {
  title: "Conversas",
  robots: { index: false, follow: false },
};

export default function ConversasLayout({ children }: { children: React.ReactNode }) {
  return <BenchFrame>{children}</BenchFrame>;
}
