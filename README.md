# tone: landing page and waitlist

Next.js 16 + Tailwind 4, in Portuguese. The page says what tone is today (a shopping assistant in a Chrome side panel and on the web, built in `toneorg/extension`), why it exists, what it does, and ends in an invite request, because the product is in a closed test. "Entrar" (header, floating nav, status and end sections) goes to `/conversas`, where an existing account signs in.

| Route | What it is |
|---|---|
| `/` | The landing page. One e-mail field at the top and one at the end ("Pedir convite"), and links to sign in |
| `/marcas` | Redirects to `/?para=marca#lista`, which opens the end section on the brand form. The page no longer pitches brands; this only keeps old links and QR codes working |
| `/privacidade` | Plain-language data note, linked from every form |

What the page is allowed to promise comes from `toneorg/extension` (`README.md`, `docs/requisitos.md`, `docs/acompanhamentos.md`). Each section names the requirement it leans on. Nothing here promises payment, automatic purchases or a store beyond Amazon Brasil and Mercado Livre.

## Conversations (`/conversas`)

The person's side of tone: sign in with the same account as the extension, conversations from both surfaces, new conversation, memory, the week's balance, and the agent's answers with research progress, decision board and watch drafts. Product pages open only on the person's click, in a new tab, and only store pages that do not pay.

- **No tone credential in the browser's JavaScript.** The pages call this site's `/api/tone/*` (`src/app/api/tone/[...path]/route.ts`), a back end for front end (`src/lib/tone-bff.ts`): a closed list of API routes, the `tone_web` cookie and nothing else forwarded, changes only with `x-tone-web: 1` from this origin, and the API's cookie rewritten to this origin as `HttpOnly; SameSite=Strict; Path=/api/tone` (plus `Secure` over HTTPS).
- **Same contracts as the server.** `src/tone/shared` is a generated copy of `packages/shared/src` from `toneorg/extension` (the commit is in each header and in `SOURCE`). After the contracts change there, run `npm run sync:shared -- ../extension`; never edit the copy.
- **Same components as the extension.** `src/tone/genui` is a generated copy of `packages/genui-react/src` from the same repository: the drawings of every component the agent writes, and their CSS (`genui.css`, loaded with the design system's `tokens.css` in `src/app/conversas/layout.tsx`). `src/conversas/Program.tsx` only decides what each button does on the web. The same sync command copies it; never edit the copy, and ESLint skips `src/tone`.
- **Design system.** These pages sit on the neutral bench of `@toneorg/design` (`theme.css`); `npm run check:design` reads `src/conversas` and `src/app/conversas` (see `tone-design.json`).
- **No install scripts.** `.npmrc` turns dependency scripts off: `@openuidev/lang-core` ships an install-time telemetry script. The blocks are drawn with `@openuidev/react-lang`, as in the extension, with its observability off (`publishObservability={false}`).
- Set `TONE_API_URL` (the tone server, reached from this server) and `NEXT_PUBLIC_SITE_URL`. Without `TONE_API_URL` the API answers 503 and the pages say the web is not connected yet.

What it does not do yet, and how it was checked: `toneorg/extension` `docs/web-conversas.md`.

## Run

```bash
npm install
cp .env.example .env.local   # optional in dev
npm run dev                  # http://localhost:3000
npm test                     # vitest: the BFF and the conversation components
```

Without `SUBMISSIONS_WEBHOOK_URL`, submissions go to `data/submissions.jsonl` (git-ignored). In a production build that fallback is refused unless `SUBMISSIONS_ALLOW_DISK=1`, so a missing webhook fails loudly instead of losing signups.

## Deploy

Vercel works out of the box. Set these environment variables first:

- `SUBMISSIONS_WEBHOOK_URL`: required in production. See `docs/google-sheets-webhook.md` for a 5-minute Google Sheet setup. The request times out after 15 s (longer than the 10 s the script may wait for its lock), and an HTML reply (what Apps Script sends when the script crashes) counts as a failure.
- `NEXT_PUBLIC_SITE_URL`: the public URL, so link previews in WhatsApp and Instagram show the image, and the share link on the success screen points home.
- `NEXT_PUBLIC_CONTACT_EMAIL`: the address for deletion requests on `/privacidade` and in the footer.

## The three forms

Each one is a server action in `src/app/actions.ts` and saves one record, told apart by `kind`.

| `kind` | When | Fields |
|---|---|---|
| `waitlist` | She types her e-mail, at the top or at the end (`placement`) | e-mail only. This alone puts her on the list |
| `profile` | No longer shown on the page (it asked about skin tone, for the old foundation product). The action `saveProfile` and the contract stay so earlier rows keep their meaning | tone band 1 to 10, current foundation, how often she bought the wrong shade, opt-in to test the beta (reveals WhatsApp), and a consent box. Matched to the `waitlist` row by e-mail |
| `brand` | The end section in brand mode | name, e-mail, brand, site, platform and the commitment ladder: 30-minute call → swatch photos → 60-day pilot with a control group |

The tone band is sensitive data under the LGPD, so it is only collected in the second step, behind its own consent box, and stored as a number.

Each form has a hidden trap field that only bots fill. A row that arrives with it filled is still saved, with `suspect: true`, so a person whose browser autofilled it is not lost; filter that column out when reading the sheet.

Once she joins, the page remembers it in `sessionStorage` for the life of the tab (`src/lib/signup-store.ts`), so a reload or a visit to the privacy note does not ask for the e-mail again.

Every record also carries `utm_source`, `utm_medium`, `utm_campaign`, `ref` and the referrer. Tagged links:

- People: `https://<domain>/?utm_source=evento&utm_medium=qr&utm_campaign=<nome-do-evento>`
- Brands: `https://<domain>/marcas?utm_source=evento&utm_medium=qr&utm_campaign=<nome-do-evento>`

Shares from the success screen arrive with `?ref=convite`.

## Where to edit

- Copy and layout of each section: `src/sections/` (one file per section, in page order in `src/app/page.tsx`); the privacy note is `src/app/privacidade/page.tsx`
- Field names, option values and the saved record shape: `src/lib/forms.ts` (shared by the forms and the server actions). Validation and its messages: `src/lib/forms.server.ts`
- Site-wide constants (public URL, contact address, section anchors): `src/lib/site.ts`
- Form layout: `src/components/email-capture.tsx`, `brand-form.tsx`; shared pieces in `form-parts.tsx`; the state the two e-mail fields share in `signup-context.tsx`
- Colors and type: the design system, `@toneorg/design` (see Design below). This page's motion: `src/app/globals.css`. The skin-tone scale: `src/lib/tones.ts`

## Design

The palette, the fonts, the text styles and the rules for using them live in the tone design system, [`toneorg/design`](https://github.com/toneorg/design), installed here as `@toneorg/design` at a fixed tag. `src/app/globals.css` imports its Tailwind theme, and `npm run check:design` (also in CI) fails when a color is written by hand outside `src/lib/tones.ts`. To change a color or a font, change it there, release a version and run `npm install github:toneorg/design#vX.Y.Z` here. What follows is how this page applies those rules.

- **Color.** One hue. Every color is the brand coral `#e26b5c` moved up or down in lightness, down to a wine `#340b10` that serves as ink. Coral grounds are where tone speaks in the first person: the hero, the "Eu nunca pago" promise and the list. The landing page shows no skin tones; `src/lib/tones.ts` stays for the form contract.
- **Contrast.** Wine on coral is 5.4:1, so wine is the only text color on coral. White on coral and coral on white are both 3.2:1, which only passes at display sizes; small coral text on white uses `coral-600`.
- **Type.** Crimson Pro for display, light on wide screens and one step heavier on phones. Host Grotesk for everything else. Italic serif is her voice (the questions); roman is tone answering.
- **Motion.** Each animation shows something the product does: a request being typed and answered in the hero, her questions drifting past, the side panel's research steps and short list arriving in order, the list of what tone does not do being crossed out, the timeline drawing itself. All of it stops under `prefers-reduced-motion`, and the looping pieces rest while off screen.

## Before publishing, check

- The side-panel demo, the watch card, the memories and the hero exchanges are invented and labelled "Exemplo ilustrativo" where they are not plainly decorative. Replace them with real outputs once the test has them.
- The status section says the test is closed and invite-only, on Amazon Brasil and Mercado Livre. Confirm against `toneorg/extension` before each deploy.
- The sourced numbers in `src/sections/why.tsx` are quoted from `../docs/comum/01-tese-e-posicionamento.md`. If a number changes there, change it here.
- The footer says "Feita em São Paulo, 2026."
- The privacy note has not been reviewed by a lawyer.
- Visits are counted with Vercel Web Analytics (`<Analytics />` in `src/app/layout.tsx`), without cookies. It collects nothing until Analytics is enabled for the project in the Vercel dashboard, and nothing in local dev. `/privacidade` says so.
