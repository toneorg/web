# What is measured, and where to look

One PostHog project for the web and the extension. The person is the same `distinct_id` on both (the tone user id): the web calls `posthog.identify(id)` after sign-in, and the server sends its events with the same id. Name and e-mail never go.

## Where each kind of signal comes from

| Signal | Sent by | Event or tool |
|---|---|---|
| Use of each feature on the web | browser, `src/conversas/analytics.ts` | events below, all with `surface: "web"`, `app` and `release` |
| Use of the agent and the extension | tone server (`toneorg/extension`, `apps/server/src/events.ts`) | `message_sent`, `recommendation_shown`, `recommendation_clicked`, `component_shown`, `panel_opened`, `browser_action_completed`… with `surface` |
| Cost per person and per feature | tone server, at every settled operation (`budget/ledger.ts`) | `cost_recorded`: `costUsd`, `category`, `purpose`, `provider`, `model`, tokens, `basis`, `tone_session_id` |
| Model calls in detail | tone server (`llm/models.ts`) | `$ai_generation` (LLM analytics): model, tokens, cost, latency, trace = conversation |
| Errors in the browser | posthog-js `capture_exceptions`, error boundaries (`src/app/error.tsx`, `src/app/conversas/error.tsx`, `global-error.tsx`) | `$exception` |
| Errors on the web server | `onRequestError` in `src/instrumentation.ts` | `$exception` with `surface: "web-server"`, plus OTLP log `next_request_error` |
| Failed API calls seen by the person | `src/conversas/api.ts` | `api_request_failed` (`route` without ids, `method`, `status`) |
| BFF health | `src/app/api/tone/[...path]/route.ts` | OTLP log `tone_api_proxy_completed` (`route`, `status_code`, `duration_ms`, `request_id`) |
| Errors on the tone server and in the extension panel | tone server | `server_error` (`where`, `error_type`); the message stays in the `errors` table, shown in `/admin` |
| Feedback | web and extension, through the server | `feedback_submitted` with `kind` (`bug`, `idea`, `missing`), `message`, `path`, linked to the session replay (`$session_id`); also listed in `/admin` |
| Session replay | posthog-js on the web | inputs and `[data-ph-mask]` masked (conversation, memory, panels, conversation titles); console logs and request timings recorded, bodies and headers never |

`cost_recorded` already includes the model calls; sum it, not `$ai_generation`, for the total bill. Its `purpose` tells what the money went to (the agent's turn, research, media, a watch reading…).

## Web events

| Area | Events |
|---|---|
| Entry | `sign_in_completed` (`method`), `sign_in_failed` (`step`, `status`, `reason`), `invite_checked`, `signed_out` |
| Tour | `onboarding_started`, `onboarding_step_viewed` (`step`, `step_id`), `onboarding_completed` (`started_example`), `onboarding_skipped` (`step`), `onboarding_reopened` |
| Conversations | `conversation_started` (`source`, `has_initial_query`), `conversation_opened` (`position`, `started_on`), `conversation_message_sent` (`turn`, `length`, `with_product`), `conversation_turn_completed` / `_failed` / `_stopped` (`duration_ms`, `first_text_ms`, `research_results`, `reason`), `conversation_reply_selected`, `product_picked`, `product_unpicked`, `product_videos_requested`, `product_videos_failed`, `situation_outcome_recorded` |
| Research in the person's Chrome | `local_research_opened`, `local_research_started` (`stores`), `local_research_failed`, `local_research_stopped` |
| Agent's components | `decision_changed`, `recommendation_rejected_clicked` (`reason`), `watch_draft_saved`, `watch_draft_confirmed` |
| Panels | `panel_create_opened`, `panel_planned` (`planned`, `duration_ms`), `panel_plan_failed`, `panel_created` (`kind`, `condition`, `email`), `panel_action` (`action`), `panel_action_failed` |
| Profile and data | `memory_added` (`kind`), `memory_confirmed`, `memory_deleted`, `memories_cleared`, `data_exported`, `account_deleted`, `watch_muted_by_link` |
| Feedback | `feedback_opened`, `feedback_submitted` (from the browser only when the server could not take it, `delivered: "posthog_only"`), `feedback_failed` |

## In the PostHog project, check once

- **Session replay** is on (Project settings → Session replay → "Record user sessions"). The code asks for it, but the project switch decides.
- **Error tracking** is on, so `$exception` events become issues.
- **Authorized domains** include the site's domain (for the toolbar and heatmaps).
- `NEXT_PUBLIC_POSTHOG_HOST` is `https://us.i.posthog.com` or `https://eu.i.posthog.com`: then the browser sends everything through `/ingest` on this site, which ad blockers do not drop. Any other host is called directly.
- The tone server has `POSTHOG_PROJECT_TOKEN` (and `POSTHOG_HOST`) set to the same project, or no server event, cost or feedback arrives.
