// PostHog through this site: the browser calls /ingest and next.config.ts forwards it to PostHog
// Cloud. Shared by the config (rewrites) and the browser (api_host), so both agree.

export const POSTHOG_PROXY_PATH = "/ingest";

/** PostHog Cloud's app host for an ingestion host ("https://us.i.posthog.com" → "https://us.posthog.com"). */
export function posthogUiHost(host: string | undefined): string | null {
  const region = host?.match(/^https:\/\/(us|eu)\.i\.posthog\.com\/?$/)?.[1];
  return region ? `https://${region}.posthog.com` : null;
}

/** The rewrites for the proxy, or none when the host is not PostHog Cloud (it is then called directly). */
export function posthogRewrites(host: string | undefined) {
  const region = host?.match(/^https:\/\/(us|eu)\.i\.posthog\.com\/?$/)?.[1];
  if (!region) return [];
  return [
    { source: `${POSTHOG_PROXY_PATH}/static/:path*`, destination: `https://${region}-assets.i.posthog.com/static/:path*` },
    { source: `${POSTHOG_PROXY_PATH}/array/:path*`, destination: `https://${region}-assets.i.posthog.com/array/:path*` },
    { source: `${POSTHOG_PROXY_PATH}/:path*`, destination: `https://${region}.i.posthog.com/:path*` },
  ];
}
