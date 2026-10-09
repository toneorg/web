import { buttonClass } from "./button";
import { SignupLink } from "./signup-context";
import { WORDMARK } from "./site-chrome";

const LINKS = [
  { href: "#porque", label: "Por quê" },
  { href: "#oque", label: "O quê" },
  { href: "#como", label: "Como" },
];

/**
 * The page's navigation: a bar within thumb reach that stays put for the
 * whole scroll and keeps the list one tap away. It floats over the content
 * and respects the home-indicator safe area, so anything that sits at the
 * bottom of a section needs room for it (see the hero's bottom padding).
 */
export function FloatingNav() {
  return (
    <nav
      aria-label="Seções"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-wine-950/90 p-1.5 ps-5 text-coral-50 shadow-[0_0_0_1px_oklch(1_0_0/0.08),0_12px_32px_-12px_oklch(0_0_0/0.45)] backdrop-blur-md">
        <a
          href="#topo"
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
              className="flex min-h-11 items-center rounded-full px-3.5 text-[0.9375rem] text-coral-200 transition-colors duration-150 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
        <SignupLink audience="pessoa" className={`${buttonClass({ variant: "coral" })} sm:ms-2`}>
          Entrar na lista
        </SignupLink>
      </div>
    </nav>
  );
}
