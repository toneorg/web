# tone: landing page and waitlist

Next.js 16 + Tailwind 4, in Portuguese. The page says why tone exists, what it does and how, and ends in a waitlist, because the product is not live yet.

| Route | What it is |
|---|---|
| `/` | The landing page. One e-mail field at the top and one at the end; the end section can switch to a pilot request for brands |
| `/marcas` | Redirects to `/?para=marca#lista`, which opens the end section on the brand form. Old links and QR codes keep working, and their `utm_*` parameters pass through |
| `/privacidade` | Plain-language data note, linked from every form |

What the page is allowed to promise comes from the planning folder, `../docs` (start at `../docs/README.md`). Nothing here promises a selfie, a virtual try-on or an accuracy number: none of those exist.

## Run

```bash
npm install
cp .env.example .env.local   # optional in dev
npm run dev                  # http://localhost:3000
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
| `profile` | Optional, shown right after she joins | tone band 1 to 10, current foundation, how often she bought the wrong shade, opt-in to test the beta (reveals WhatsApp), and a consent box. Matched to the `waitlist` row by e-mail |
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
- Form layout: `src/components/email-capture.tsx`, `profile-form.tsx`, `brand-form.tsx`; shared pieces in `form-parts.tsx`; the state the two e-mail fields share in `signup-context.tsx`
- Colors, type and motion: `src/app/globals.css`; the skin-tone scale in `src/lib/tones.ts`

## Design

- **Color.** One hue. Every color is the brand coral `#e26b5c` moved up or down in lightness, down to a wine `#340b10` that serves as ink. Coral grounds are where tone speaks in the first person: the hero, the neutrality promise and the list. Skin tones appear only where they are data: the product-page dots, the scale and the tone picker.
- **Contrast.** Wine on coral is 5.4:1, so wine is the only text color on coral. White on coral and coral on white are both 3.2:1, which only passes at display sizes; small coral text on white uses `coral-600`.
- **Type.** Crimson Pro for display, light on wide screens and one step heavier on phones. Host Grotesk for everything else. Italic serif is her voice (the questions); roman is tone answering.
- **Motion.** Each animation shows something the product does: the link being typed and answered in the hero, the swatch selection that cannot settle, her questions drifting past, the answers arriving in order, the list of what tone is not being crossed out, the timeline drawing itself. All of it stops under `prefers-reduced-motion`, and the looping pieces rest while off screen.

## Before publishing, check

- The demo cards and the hero exchanges are invented and labelled "Exemplo ilustrativo". Replace them with real outputs once the beta has them.
- The timeline says "Fim de 2026" for the closed beta and gives its size (30 to 50 people, half in tone bands 7 to 10). Confirm against `../docs/README.md` before each deploy; the plan allows the beta to slip.
- The sourced numbers in `src/sections/why.tsx` are quoted from `../docs/comum/01-tese-e-posicionamento.md`. If a number changes there, change it here.
- "Num teste nosso, uma pele escura foi lida como muito clara" (`src/sections/how.tsx`) refers to the local widget test recorded in the skin-measurement research. Keep the sentence only while that is still the reason photos are off.
- The footer says "Feita em São Paulo, 2026."
- If the Google Sheet webhook is already deployed, add the `profile` tab to its script (`docs/google-sheets-webhook.md`); until then those rows land in `Outros`.
- The privacy note has not been reviewed by a lawyer.
- Visits are counted with Vercel Web Analytics (`<Analytics />` in `src/app/layout.tsx`), without cookies. It collects nothing until Analytics is enabled for the project in the Vercel dashboard, and nothing in local dev. `/privacidade` says so.
