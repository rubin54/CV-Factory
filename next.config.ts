import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer must not be bundled into the server bundle — it loads its Chromium
  // from node_modules at runtime.
  serverExternalPackages: ["puppeteer"],
  // Without this Next guesses the workspace root from lockfiles and ends up in
  // the home directory, because there is a package-lock.json there.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
