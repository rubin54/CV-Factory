import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Creator",
  description: "Lokaler Lebenslauf-Generator mit Claude",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
