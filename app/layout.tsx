import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Creator",
  description: "Lokaler Lebenslauf-Generator mit Claude",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
