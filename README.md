# tone: landing page and waitlist

Next.js 16 + Tailwind 4. Three pages, all in Portuguese:

| Route | For | Form |
|---|---|---|
| `/` | People who buy foundation | Quiz-style waitlist: tone on the Monk scale, current foundation, how often they bought the wrong shade, e-mail, opt-in to test with a selfie (reveals WhatsApp) |
| `/marcas` | Makeup brands | Pilot request that walks the commitment ladder: 30-min call → send swatch photos → 60-day A/B pilot |
| `/privacidade` | Both | Plain-language data note linked from both consent boxes |

Background and decisions: `../docs/source-brief.md` (what the project documents say) and
`../docs/design-plan.md` (why the page looks and works the way it does).

## Run

```bash
npm install
cp .env.example .env.local   # optional in dev
npm run dev                  # http://localhost:3000
```

Without `SUBMISSIONS_WEBHOOK_URL`, submissions go to `data/submissions.jsonl` (git-ignored). In a production build that fallback is refused unless `SUBMISSIONS_ALLOW_DISK=1`, so a missing webhook fails loudly instead of losing signups.

## Deploy

Vercel works out of the box. Set these environment variables first:

- `SUBMISSIONS_WEBHOOK_URL`: required in production. See `docs/google-sheets-webhook.md` for a 5-minute Google Sheet setup. The request times out after 10 s, and an HTML reply (what Apps Script sends when the script crashes) counts as a failure.
- `NEXT_PUBLIC_SITE_URL`: the public URL, so link previews in WhatsApp and Instagram show the image.
- `NEXT_PUBLIC_CONTACT_EMAIL`: the address for deletion requests on `/privacidade`.

## QR codes for the event

Each submission stores `utm_source`, `utm_medium`, `utm_campaign`, `ref` and the referrer, so use tagged links:

- Consumers: `https://<domain>/?utm_source=evento&utm_medium=qr&utm_campaign=<nome-do-evento>`
- Brands: `https://<domain>/marcas?utm_source=evento&utm_medium=qr&utm_campaign=<nome-do-evento>`

Shares from the success screen arrive with `?ref=convite`.

## Where to edit

- Copy: `src/app/page.tsx`, `src/app/marcas/page.tsx`, `src/app/privacidade/page.tsx`
- Form fields, option values, validation messages and the saved record shape: `src/lib/forms.ts` (shared by the forms and the server actions; option labels live next to each form)
- Form layout: `src/components/waitlist-form.tsx`, `src/components/brand-form.tsx`; shared pieces in `src/components/form-parts.tsx`
- Illustrative numbers (sample match, covered tones): `src/lib/sample.ts`
- Colors and type: `src/app/globals.css` (tokens), `src/lib/tones.ts` (Monk scale)

## Before publishing, check

- The founders' note on `/` is signed "Vivian e Gabriel". Confirm the wording with Vivian.
- The result card and the brand chart are marked "Exemplo ilustrativo". Replace them with real outputs once the pilot has them.
- The privacy promises (selfie deleted within hours, nothing sold) match pilot task F3.3. Have a lawyer review them before the first selfie test.
- Visits are not tracked yet, only submissions. For visit → signup rate, add Vercel Analytics or PostHog.
- "Quantas vezes você já comprou base no tom errado?", "Plataforma da loja" and "Tons de base na cartela" are optional on the server but carry no "(opcional)" marker. Decide whether they should be required or marked.
