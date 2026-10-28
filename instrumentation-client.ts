import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!projectToken || !host) {
  // Without PostHog configured the site works the same; only analytics are off.
  if (process.env.NODE_ENV === "development")
    console.warn("PostHog desligado: defina NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN e NEXT_PUBLIC_POSTHOG_HOST.");
} else {
  posthog.init(projectToken, {
    api_host: host,
    defaults: "2026-01-30",
    capture_exceptions: true,
    // Session replay: what the person types and what is marked data-ph-mask (the conversation,
    // the titles of conversations, the memory) never leave the browser as text; only the layout and clicks do.
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
      recordHeaders: false,
      recordBody: false,
    },
    debug: process.env.NODE_ENV === "development",
  });
}
