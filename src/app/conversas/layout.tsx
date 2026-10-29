import type { Metadata } from "next";
import "@toneorg/design/tokens.css";
import "@/tone/genui/genui.css";

// T06: the conversation pages sit on the neutral bench of the design system: they show product photos.
export const metadata: Metadata = {
  title: "Conversas",
  robots: { index: false, follow: false },
};

// The components shared with the extension (src/tone/genui) read the design system's font tokens;
// here they point at the faces next/font loaded, whose family names are generated.
const FONTS = {
  "--tone-font-sans": "var(--font-host-grotesk), ui-sans-serif, system-ui, sans-serif",
  "--tone-font-display": "var(--font-crimson-pro), ui-serif, Georgia, serif",
} as React.CSSProperties;

export default function ConversasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper font-sans text-ink" style={FONTS}>
      {children}
    </div>
  );
}
