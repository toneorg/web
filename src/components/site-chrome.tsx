import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

/** Vertical room every full section gets, so the rhythm between them stays even. */
export const SECTION = "py-24 sm:py-32 lg:py-40";

/**
 * The page grid: one column that can shrink on phones, twelve on wide
 * screens. Callers add their own row gap and alignment.
 */
export const GRID = "grid grid-cols-1 lg:grid-cols-12 lg:gap-x-8";

/** The logo's lettering: the display face, one step heavier than body weight. Size is set per use. */
export const WORDMARK = "font-display font-medium leading-none tracking-[-0.04em]";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="tone, página inicial"
      className={`${WORDMARK} text-[1.875rem] ${className}`}
    >
      tone
    </Link>
  );
}

/** The text link on the trailing side of the header. */
export const HEADER_LINK =
  "-me-3 flex min-h-11 items-center rounded-full px-3 text-[0.9375rem] font-medium underline decoration-wine/40 underline-offset-[6px] transition-colors duration-150 hover:decoration-wine";

/** Wordmark on the leading side, one link on the trailing side. Sits on a coral ground. */
export function SiteHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between">
      <Wordmark />
      {children}
    </header>
  );
}

/** `className` sets the bottom padding: the home page needs room for the floating nav. */
export function SiteFooter({ className = "pb-16" }: { className?: string }) {
  return (
    <footer className="bg-wine-950 text-coral-200">
      <Container
        className={`flex flex-col gap-10 pt-16 sm:flex-row sm:items-end sm:justify-between ${className}`}
      >
        <div className="flex flex-col gap-3">
          <Wordmark className="text-coral-50" />
          <p className="text-[0.9375rem]">Feita em São Paulo, 2026.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-3 text-[0.9375rem]">
          <Link href="/privacidade" className="underline-offset-4 hover:underline">
            Privacidade
          </Link>
          {CONTACT_EMAIL ? (
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline-offset-4 hover:underline">
              {CONTACT_EMAIL}
            </a>
          ) : null}
        </nav>
      </Container>
    </footer>
  );
}

/** Small print under a sourced number. */
export function Source({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[0.875rem] leading-snug text-muted">{children}</p>;
}
