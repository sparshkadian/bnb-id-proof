import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: "C:/Users/spars/Desktop/BnB/idproof",
  },
};

export default nextConfig;
