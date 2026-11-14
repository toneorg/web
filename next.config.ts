import type { NextConfig } from "next";
import { posthogRewrites } from "./posthog-proxy";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // PostHog's API paths end in a slash (/e/, /flags/); a redirect would break them behind the proxy.
  skipTrailingSlashRedirect: true,
  // Old /marcas links and QR codes land on the page for stores.
  async redirects() {
    return [{ source: "/marcas", destination: "/lojas", permanent: false }];
  },
  async rewrites() {
    return posthogRewrites(process.env.NEXT_PUBLIC_POSTHOG_HOST);
  },
};

export default nextConfig;
