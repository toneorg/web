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
    debug: process.env.NODE_ENV === "development",
  });
}
