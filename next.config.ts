import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  webpack(config) {
    if (process.env.VERCEL) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "cloudflare:workers": path.resolve("./lib/vercel-cloudflare-shim.ts"),
      };
    }
    return config;
  },
  turbopack: process.env.VERCEL
    ? {
        resolveAlias: {
          "cloudflare:workers": "./lib/vercel-cloudflare-shim.ts",
        },
      }
    : undefined,
};

export default nextConfig;
