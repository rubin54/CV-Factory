import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Literata,
  Source_Sans_3,
  Source_Serif_4,
  Space_Grotesk,
} from "next/font/google";

/**
 * next/font lädt die Dateien zur Buildzeit herunter und hostet sie selbst — zur
 * Laufzeit geht kein Request nach außen, auch nicht aus dem Puppeteer-Chromium.
 *
 * Bewusst keine Standardverdächtigen (Inter, Roboto, Arial): die sind der Grund,
 * warum generierte Lebensläufe alle gleich aussehen.
 *
 * Die Argumente müssen literal sein — next/font wertet sie zur Buildzeit
 * statisch aus, Variablen oder Spreads brechen den Build.
 */

export const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-serif",
  display: "swap",
});

export const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-sans",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const literata = Literata({
  subsets: ["latin", "latin-ext"],
  variable: "--font-literata",
  display: "swap",
});

/** Alle Schrift-Variablen fürs <html>-Element. */
export const fontVariables = [
  plexSans.variable,
  plexMono.variable,
  sourceSerif.variable,
  sourceSans.variable,
  spaceGrotesk.variable,
  literata.variable,
].join(" ");
