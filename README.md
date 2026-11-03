# tone: home page and web app

Next.js 16 + Tailwind 4, in Portuguese. While the product is in a closed test, the home page is only the logo, one paragraph on what tone is and the way in: sign in, or create the account with an invite (the same steps as `/conversas`). Everything is black and white, the neutral bench of the design system, like the extension.

| Route | What it is |
|---|---|
| `/` | Logo, one paragraph, sign in. Someone already signed in gets a button to the app |
| `/conversas` | The app (below). The first visit of an account shows a five-step tour (`src/conversas/Onboarding.tsx`); "Rever o tour da tone" in the profile shows it again |
| `/marcas` | Redirects to `/`, so old links and QR codes still land somewhere |
| `/privacidade` | Plain-language data note |

What is measured (product analytics, cost, errors, session replay, feedback) and how to read it: [`docs/analytics.md`](docs/analytics.md).

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
npm test                     # vitest: the BFF, the conversation components, analytics and feedback
```

## Deploy

Vercel works out of the box. Set `TONE_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` (see `.env.example` and `docs/analytics.md`).

## Before publishing, check

- The footer says "Feita em São Paulo, 2026."
- The privacy note has not been reviewed by a lawyer. It names PostHog and the session replay; keep it in step with `instrumentation-client.ts`.
