import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // The brand page became a mode of the signup section. Old /marcas links and
  // QR codes keep working, and their utm parameters pass through.
  async redirects() {
    return [{ source: "/marcas", destination: "/?para=marca#lista", permanent: false }];
  },
};

export default nextConfig;
