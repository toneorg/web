import Link from "next/link";

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

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function SiteFooter() {
  return (
    <footer className="bg-wine-950 text-coral-200">
      <Container className="flex flex-col gap-10 pb-28 pt-16 sm:flex-row sm:items-end sm:justify-between sm:pb-32">
        <div className="flex flex-col gap-3">
          <Wordmark className="text-coral-50" />
          <p className="text-[0.9375rem]">Feita em São Paulo, 2026.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-3 text-[0.9375rem]">
          <Link href="/privacidade" className="underline-offset-4 hover:underline">
            Privacidade
          </Link>
          {contact ? (
            <a href={`mailto:${contact}`} className="underline-offset-4 hover:underline">
              {contact}
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

/** Sets the stagger position for `rise` and `reveal-item`. */
export function order(i: number) {
  return { "--i": i } as React.CSSProperties;
}
