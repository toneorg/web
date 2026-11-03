import Link from "next/link";
import { ToneWordmark } from "@/components/tone-logo";
import { CONTACT_EMAIL } from "@/lib/site";

/** The wordmark, linked home. Takes the color of the text around it. */
export function Wordmark({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="tone, página inicial"
      className="inline-flex rounded-tag focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <ToneWordmark className={className} />
    </Link>
  );
}

/** One quiet line at the bottom of the public pages: privacy and contact. */
export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-md flex-wrap items-center gap-x-6 gap-y-2 px-5 pb-8 text-caption text-graphite">
      <span>Feita em São Paulo, 2026.</span>
      <Link href="/privacidade" className="min-h-11 content-center underline-offset-4 hover:underline">
        Privacidade
      </Link>
      {CONTACT_EMAIL ? (
        <a href={`mailto:${CONTACT_EMAIL}`} className="min-h-11 content-center underline-offset-4 hover:underline">
          {CONTACT_EMAIL}
        </a>
      ) : null}
    </footer>
  );
}
