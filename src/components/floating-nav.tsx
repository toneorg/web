import Link from "next/link";
import { ANCHOR, SIGN_IN_PATH } from "@/lib/site";
import { buttonClass } from "./button";
import { SignupLink } from "./signup-context";
import { WORDMARK } from "./site-chrome";

const LINKS = [
  { href: `#${ANCHOR.what}`, label: "Como funciona" },
  { href: `#${ANCHOR.how}`, label: "Seus dados" },
];

/**
 * Bottom padding for anything that ends a screen under the nav (the hero, the
 * footer), so the bar never sits on top of it. Keyboard focus gets the same
 * room from `scroll-padding-bottom` in globals.css.
 */
export const NAV_CLEARANCE = "pb-28 sm:pb-32";

/**
 * The page's navigation: a bar within thumb reach that stays put for the
 * whole scroll and keeps the list and the sign-in one tap away. It floats over the content
 * and respects the home-indicator safe area.
 */
export function FloatingNav() {
  return (
    <nav
      aria-label="Seções"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-wine-950/90 p-1.5 ps-5 text-coral-50 shadow-floating backdrop-blur-md">
        <a
          href={`#${ANCHOR.top}`}
          aria-label="tone, voltar ao topo"
          className={`${WORDMARK} pe-3 text-[1.5rem]`}
        >
          tone
        </a>
        <div className="hidden items-center sm:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center rounded-full px-3.5 text-ui font-normal text-coral-200 transition-colors duration-150 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
        <Link
          href={SIGN_IN_PATH}
          className="flex min-h-11 items-center rounded-full px-3.5 text-ui text-coral-50 underline decoration-coral-50/40 underline-offset-[6px] transition-colors duration-150 hover:decoration-coral-50 focus-visible:outline-coral-200"
        >
          Entrar
        </Link>
        <SignupLink audience="pessoa" className={`${buttonClass({ variant: "coral" })} sm:ms-2`}>
          Pedir convite
        </SignupLink>
      </div>
    </nav>
  );
}
