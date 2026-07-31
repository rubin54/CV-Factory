import type { Metadata } from "next";

import { ToastProvider } from "@/components/app/Toast";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Factory",
  description: "Lokaler Lebenslauf-Generator mit Claude",
};

/**
 * Läuft vor dem ersten Paint und setzt das Farbschema, sonst blitzt beim Laden
 * kurz die helle Oberfläche auf. Ohne gespeicherte Wahl gilt die Systemvorgabe.
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
