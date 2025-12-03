import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["adm-zip", "pdf-parse", "mammoth"],
  experimental: {
    serverComponentsExternalPackages: ["adm-zip", "pdf-parse", "mammoth"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add parent dist directory to webpack resolve for dynamic imports
      // Dynamic imports will load at runtime, avoiding bundling issues
      config.resolve.alias = {
        ...config.resolve.alias,
        "@pie-dist": path.resolve(__dirname, "../dist"),
      };
    }
    return config;
  },
};

export default nextConfig;
