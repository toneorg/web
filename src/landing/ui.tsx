// Pieces shared by the two public pages: the frame, the section opening, the
// buttons and the small marks. Neutral bench of the design system: paper, white
// surfaces with the raised ring, ink for the one action.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** A pill above a title: what this block is about, in a few words. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-full bg-surface px-3.5 text-caption font-medium text-graphite shadow-raised ${className}`}
    >
      {children}
    </span>
  );
}

/** The opening of a section: optional eyebrow, a serif title and a paragraph. */
export function SectionHead({
  eyebrow,
  title,
  children,
  align = "start",
  id,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  align?: "start" | "center";
  id?: string;
}) {
  const centered = align === "center";
  return (
    <div className={`reveal flex max-w-3xl flex-col gap-5 ${centered ? "mx-auto items-center text-center" : "items-start"}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 id={id} className="display-md text-ink">
        {title}
      </h2>
      {children ? <p className={`lead text-graphite ${centered ? "max-w-2xl" : "max-w-2xl"}`}>{children}</p> : null}
    </div>
  );
}

type ButtonTone = "solid" | "outline" | "ghost";

const tones: Record<ButtonTone, string> = {
  solid: "bg-ink text-on-ink hover:bg-ink-pressed focus-visible:outline-ink",
  outline: "bg-surface text-ink shadow-raised hover:bg-paper focus-visible:outline-ink",
  ghost: "text-ink hover:bg-sunken focus-visible:outline-ink",
};

export function buttonClass(tone: ButtonTone = "solid", size: "md" | "lg" = "md") {
  const sizing = size === "lg" ? "min-h-13 px-7 text-[1.0625rem]" : "min-h-11 px-5 text-ui";
  return `press inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 ${sizing} ${tones[tone]}`;
}

export function ButtonLink({
  tone = "solid",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone; size?: "md" | "lg" }) {
  return <Link {...props} className={`${buttonClass(tone, size)} ${className}`} />;
}

/** A question in the person's voice: serif italic, as DESIGN.md asks. */
export function Asked({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <q className={`font-display text-[1.375rem] leading-snug italic text-ink ${className}`}>{children}</q>;
}
