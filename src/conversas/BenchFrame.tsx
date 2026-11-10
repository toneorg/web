// The neutral bench of the design system, for the screens that show product photos (conversations
// and panels). The components shared with the extension (src/tone/genui) read the design system's
// font tokens; here they point at the faces next/font loaded, whose family names are generated.
import type { ReactNode } from "react";

const FONTS = {
  "--tone-font-sans": "var(--font-host-grotesk), ui-sans-serif, system-ui, sans-serif",
  "--tone-font-display": "var(--font-crimson-pro), ui-serif, Georgia, serif",
} as React.CSSProperties;

export function BenchFrame(props: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper font-sans text-ink" style={FONTS}>
      {props.children}
    </div>
  );
}
