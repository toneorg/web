# tone: home page and web app

Next.js 16 + Tailwind 4, in Portuguese. Two public pages: the home page speaks to the person who buys and takes the waiting list; `/lojas` sells tone to stores and takes pilot requests. Everything is black and white, the neutral bench of the design system, like the app. What tone is, for whom and the words to use: [`CONTEXT.md`](CONTEXT.md). The copy of both pages: [`docs/copy/landing.md`](docs/copy/landing.md).

| Route | What it is |
|---|---|
| `/` | The page for the person: what tone does, the why behind every recommendation, neutrality, the waiting list. "Entrar" leads to `/conversas` |
| `/lojas` | The page for stores: tone for stores, the report of doubts, the pilot with a control group, the pilot request |
| `/conversas` | The app (below): one chat with the tone. The first visit of an account shows a four-step tour (`src/conversas/Onboarding.tsx`); "Rever o tour" in the profile shows it again. `?em=<session>` opens the chat at that conversation, `?buscar=1` with the search open, `?perfil=1` with the profile open |
| `/conversas/<id>` | A panel's conversation with `?painel=`; any other old conversation link redirects to `/conversas?em=<id>` |
| `/conversas/perfil` | Redirects to `/conversas?perfil=1` |
| `/marcas` | Redirects to `/lojas`, so old links and QR codes still land somewhere |
| `/privacidade` | Plain-language data note |

What is measured (product analytics, cost, errors, session replay, feedback) and how to read it: [`docs/analytics.md`](docs/analytics.md).

## Public pages (`src/landing`)

- The demos (`ConsumerDemo`, `StoreDemo`) play the product's steps when they scroll into view and stop off screen; the server renders the last step, so without script or with reduced motion they are simply complete. Blocks rise in with a scroll-driven animation (`reveal` in `globals.css`), with no script.
- The forms post to `/api/lista` and `/api/piloto` (`src/lib/leads.ts`), which validate and forward each entry from the server to `LEADS_WEBHOOK_URL`. This site keeps no copy. Without the variable they answer 503 and the forms show the contact e-mail.
- Analytics: `waitlist_joined`, `waitlist_failed`, `pilot_requested` (platform and traffic band only), `pilot_failed`. Never the e-mail or the name.

## Conversations (`/conversas`)

The person's side of tone, and its only client: sign in, the chat, memory, the week's balance, and the agent's answers with research progress, decision board and watch drafts. Product pages open only on the person's click, in a new tab, and only store pages that do not pay.

- **One chat, like a messaging app** (15/11/2026, `src/conversas/Chat.tsx`, `Conversation.tsx`, `timeline.ts`). No list of conversations and no "new conversation": the person's sessions are drawn one after the other (`GET /api/chat/sessions`), as bubbles (theirs on the right, the tone's on the left; the agent's components full width), with a separator per day. The newest sessions load first and older ones as the person scrolls up (or with "Ver mensagens anteriores"). Under the hood a message after 6 hours without one (`SESSION_GAP_MS`) opens a new server session with no greeting (`silent`), so purchase situations, research and the decision board stay per session; the person only sees the day change. Only lines said in this visit are a live region, so loading history is not read aloud.
- **Top bar**: home, the panels toggle on a phone, Feedback, **Buscar** (also Cmd/Ctrl+K) and the avatar with the person's initial. The panels column on the left is unchanged.
- **Search** (`Search.tsx`): a folha that asks `GET /api/messages/search?q=` as the person types (250 ms pause). The server reads the person's last 3,000 messages of the chat (both sides, text only, accents and case ignored, `src/tone/shared/search.ts`) and returns up to 30, newest first, each with a snippet, its time and its place in the transcript; the web marks the words with the same rule. Arrows and Enter or a click take the chat there: the sessions down to it are read, the message is scrolled to, focused and ringed for 2.4 s.
- **Profile** (`Profile.tsx`): no longer a tab or a page. The avatar opens it as a drawer at the trailing edge (a folha on a phone): memory, occasions ("Funcionou?", and a tap takes the chat to that conversation), connections, data, sessions, "Rever o tour", "Sair". Folhas trap Tab, close on Escape (only the top one) and give the focus back (`Sheet.tsx`).
- **A panel's conversation** (`/conversas/<id>?painel=<watch>`) is still its own page, opened from the panel, with the same bubbles and composer.

- **No tone credential in the browser's JavaScript.** The pages call this site's `/api/tone/*` (`src/app/api/tone/[...path]/route.ts`), a back end for front end (`src/lib/tone-bff.ts`): a closed list of API routes, the `tone_web` cookie and nothing else forwarded, changes only with `x-tone-web: 1` from this origin, and the API's cookie rewritten to this origin as `HttpOnly; SameSite=Strict; Path=/api/tone` (plus `Secure` over HTTPS).
- **Same contracts as the server.** `src/tone/shared` is a generated copy of `packages/shared/src` from the `toneorg/server` repository, expected at `../server` (the commit is in each header and in `SOURCE`). After the contracts change there, run `npm run sync:shared -- ../server`; never edit the copy.
- **Components from the server repository.** `src/tone/genui` is a generated copy of `packages/genui-react/src` from the same repository: the drawings of every component the agent writes, and their CSS (`genui.css`, loaded with the design system's `tokens.css` in `src/app/conversas/layout.tsx`). `src/conversas/Program.tsx` only decides what each button does on the web; `src/conversas/frames.ts` redraws the frames saved in old conversations with the same components. The same sync command copies it; never edit the copy, and ESLint skips `src/tone`.
- **Design system.** These pages sit on the neutral bench of `@toneorg/design` (`theme.css`); `npm run check:design` reads `src/conversas` and `src/app/conversas` (see `tone-design.json`).
- **No install scripts.** `.npmrc` turns dependency scripts off: `@openuidev/lang-core` ships an install-time telemetry script. The blocks are drawn with `@openuidev/react-lang`, with its observability off (`publishObservability={false}`).
- Set `TONE_API_URL` (the tone server, reached from this server) and `NEXT_PUBLIC_SITE_URL`. Without `TONE_API_URL` the API answers 503 and the pages say the web is not connected yet.

What it does not do yet, and how it was checked: `docs/web-conversas.md` in the server repository.

## Run

```bash
npm install
cp .env.example .env.local   # optional in dev
npm run dev                  # http://localhost:3000
npx tsc --noEmit             # types
npm test                     # vitest: the BFF, the conversation components, analytics and feedback
```

## Deploy

Vercel works out of the box. Set `TONE_API_URL` (production: `https://tone-server.fly.dev`), `LEADS_WEBHOOK_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` (see `.env.example` and `docs/analytics.md`).

## Before publishing, check

- The footer says "Feita em São Paulo, 2026."
- The privacy note has not been reviewed by a lawyer. It names PostHog and the session replay; keep it in step with `instrumentation-client.ts`.
