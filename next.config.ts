import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    root: "C:/Users/spars/Desktop/BnB/idproof",
  },
};

export default nextConfig;
