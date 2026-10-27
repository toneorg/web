import type { Metadata } from "next";

// T06: the conversation pages sit on the neutral bench of the design system: they show product photos.
export const metadata: Metadata = {
  title: "Conversas",
  robots: { index: false, follow: false },
};

export default function ConversasLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-paper font-sans text-ink">{children}</div>;
}
