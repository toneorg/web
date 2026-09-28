import Link from "next/link";

export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-[76rem] px-4 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Wordmark() {
  return (
    <Link
      href="/"
      className="display text-[1.75rem] leading-none tracking-[-0.05em]"
      aria-label="tone, página inicial"
    >
      tone
    </Link>
  );
}

export function SiteHeader({ href, label }: { href: string; label: string }) {
  return (
    <header>
      <Container className="flex items-center justify-between py-5 sm:py-7">
        <Wordmark />
        <Link
          href={href}
          className="-me-3 rounded-full px-3 py-2 text-[0.95rem] font-medium underline decoration-rule decoration-2 underline-offset-[6px] transition-colors duration-150 hover:decoration-ink"
        >
          {label}
        </Link>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="pb-10 pt-24 sm:pt-32">
      <Container className="flex flex-col gap-6 text-[0.95rem] text-graphite sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Wordmark />
          <p>Feita em São Paulo, 2026.</p>
        </div>
        <nav aria-label="Rodapé" className="flex gap-6">
          <Link href="/marcas" className="underline-offset-4 hover:underline">
            Para marcas
          </Link>
          <Link href="/privacidade" className="underline-offset-4 hover:underline">
            Privacidade
          </Link>
        </nav>
      </Container>
    </footer>
  );
}

export function ButtonLink({
  href,
  children,
  tone = "ink",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "ink" | "paper";
}) {
  const colors =
    tone === "ink"
      ? "bg-ink text-paper hover:bg-[#3d3631]"
      : "bg-paper text-ink hover:bg-white";
  return (
    <Link
      href={href}
      className={`press inline-flex min-h-13 items-center justify-center rounded-full px-7 text-[1.05rem] font-semibold ${colors}`}
    >
      {children}
    </Link>
  );
}

export function Source({ children }: { children: React.ReactNode }) {
  return <span className="text-[0.8rem] leading-snug opacity-75">{children}</span>;
}
