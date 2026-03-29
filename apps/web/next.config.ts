import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@todo-with-any-ai/shared"],
};

export default nextConfig;
