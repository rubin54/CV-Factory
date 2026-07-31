import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer darf nicht in das Server-Bundle gebündelt werden — es lädt sein
  // Chromium zur Laufzeit aus node_modules.
  serverExternalPackages: ["puppeteer"],
  // Ohne das rät Next die Workspace-Wurzel anhand von Lockfiles und landet im
  // Home-Verzeichnis, weil dort ein package-lock.json liegt.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
