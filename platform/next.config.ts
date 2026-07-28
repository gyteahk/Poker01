import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Nested under parent monorepo (also has Next/React). Pin tracing root so Next
  // does not treat the parent lockfile as the workspace root.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
