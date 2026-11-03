import posthog from "posthog-js";
import { POSTHOG_PROXY_PATH, posthogUiHost } from "./posthog-proxy";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!projectToken || !host) {
  // Without PostHog configured the site works the same; only analytics are off.
  if (process.env.NODE_ENV === "development")
    console.warn("PostHog desligado: defina NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN e NEXT_PUBLIC_POSTHOG_HOST.");
} else {
  const uiHost = posthogUiHost(host);
  posthog.init(projectToken, {
    // Through this site (next.config.ts rewrites /ingest to PostHog), so ad blockers do not drop
    // the events and recordings of beta testers. A self-hosted or unknown host is called directly.
    api_host: uiHost ? POSTHOG_PROXY_PATH : host,
    ui_host: uiHost ?? undefined,
    defaults: "2026-01-30",
    // Only people who signed in get a profile; visits to the home page stay anonymous events.
    person_profiles: "identified_only",
    // Errors in the browser: uncaught exceptions and unhandled rejections go to error tracking.
    capture_exceptions: true,
    // Session replay: what the person types and what is marked data-ph-mask (the conversation,
    // the titles of conversations, the memory, the panels) never leave the browser as text; only
    // the layout and clicks do. Console logs and request timings help explain an error in a replay;
    // request and response bodies and headers are never recorded.
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
      recordHeaders: false,
      recordBody: false,
    },
    enable_recording_console_log: true,
    capture_performance: { network_timing: true, web_vitals: true },
    debug: process.env.NODE_ENV === "development",
    loaded: (client) => {
      // On every event: which app and which deploy, to tell a regression from a habit.
      client.register({ app: "tone-web", release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev" });
    },
  });
}
