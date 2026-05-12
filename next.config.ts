import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: "C:/Users/spars/Desktop/BnB/bnb-id-proof",
  },
};

export default nextConfig;
