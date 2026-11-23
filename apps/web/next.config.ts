import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // The Express API is the source of truth; Next rewrites /api/* in dev only
  // when NEXT_PUBLIC_API_URL is not set. In production the web app calls the
  // API directly via NEXT_PUBLIC_API_URL.
  transpilePackages: ["@daily-pulse/shared"],
};

export default nextConfig;
