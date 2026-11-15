import type { NextConfig } from "next";
import { posthogRewrites } from "./posthog-proxy";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // PostHog's API paths end in a slash (/e/, /flags/); a redirect would break them behind the proxy.
  skipTrailingSlashRedirect: true,
  // Old /marcas links and QR codes land on the page for stores. The invite e-mails sent until 15/11/2026 link to
  // /?convite=CODE#entrar, but the root no longer has the sign-in: /conversas reads the code (the query goes along).
  async redirects() {
    return [
      { source: "/marcas", destination: "/lojas", permanent: false },
      { source: "/", has: [{ type: "query", key: "convite" }], destination: "/conversas", permanent: false },
      { source: "/", has: [{ type: "query", key: "redefinir" }], destination: "/conversas", permanent: false },
    ];
  },
  async rewrites() {
    return posthogRewrites(process.env.NEXT_PUBLIC_POSTHOG_HOST);
  },
};

export default nextConfig;
