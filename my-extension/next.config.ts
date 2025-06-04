import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  trailingSlash: true,
  distDir: "dist",
  basePath: "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
