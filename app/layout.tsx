import type { Metadata } from "next";

import { ToastProvider } from "@/components/app/Toast";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Factory",
  description: "Lokaler Lebenslauf-Generator mit Claude",
};

/**
 * Runs before the first paint and sets the colour scheme; otherwise the light UI
 * flashes up briefly while loading. Without a stored choice the system setting
 * applies.
 */
const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem("cv-factory-theme");
  var dark = stored ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.documentElement.dataset.theme = "dark";
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
