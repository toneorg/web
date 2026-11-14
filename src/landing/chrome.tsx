// The top bar and the footer of the public pages.
import Link from "next/link";
import { ToneWordmark } from "@/components/tone-logo";
import { CONTACT_EMAIL } from "@/lib/site";
import { ButtonLink, Container } from "./ui";

type NavLink = { href: string; label: string };

export function LandingNav({
  links,
  cta,
  secondary,
  suffix,
}: {
  links: NavLink[];
  cta: NavLink;
  secondary?: NavLink;
  /** A word after the logo, for the store page ("para lojas"). */
  suffix?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-paper/85 backdrop-blur-md">
      <Container className="flex h-16 items-center gap-6">
        <Link
          href="/"
          aria-label="tone, página inicial"
          className="inline-flex shrink-0 items-baseline gap-2 rounded-tag focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <ToneWordmark className="h-6 w-auto" />
          {suffix ? <span className="font-display text-[1.25rem] leading-none text-graphite italic">{suffix}</span> : null}
        </Link>
        <nav aria-label="Seções" className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-full px-3.5 text-ui text-graphite transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5 md:ms-0">
          {secondary ? (
            <span className="hidden sm:contents">
              <ButtonLink href={secondary.href} tone="ghost">
                {secondary.label}
              </ButtonLink>
            </span>
          ) : null}
          <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
        </div>
      </Container>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-rule">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <ToneWordmark className="h-7 w-auto self-start" />
          <p className="max-w-xs text-small text-graphite">Compre sem dúvida.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap items-center gap-x-6 gap-y-1 text-small text-graphite">
          <Link href="/" className="min-h-11 content-center underline-offset-4 hover:text-ink hover:underline">
            Para você
          </Link>
          <Link href="/lojas" className="min-h-11 content-center underline-offset-4 hover:text-ink hover:underline">
            Para lojas
          </Link>
          <Link href="/privacidade" className="min-h-11 content-center underline-offset-4 hover:text-ink hover:underline">
            Privacidade
          </Link>
          {CONTACT_EMAIL ? (
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="min-h-11 content-center underline-offset-4 hover:text-ink hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          ) : null}
          <span className="min-h-11 content-center">Feita em São Paulo, 2026.</span>
        </nav>
      </Container>
    </footer>
  );
}
