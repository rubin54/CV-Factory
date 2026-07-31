import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Literata,
  Source_Sans_3,
  Source_Serif_4,
  Space_Grotesk,
} from "next/font/google";

/**
 * next/font downloads the files at build time and self-hosts them — at runtime
 * nothing leaves the machine, not even from the Puppeteer Chromium.
 *
 * Deliberately none of the usual suspects (Inter, Roboto, Arial): those are the
 * reason generated CVs all look alike.
 *
 * The arguments have to be literals — next/font evaluates them statically at
 * build time, so variables or spreads break the build.
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

/** All font variables for the <html> element. */
export const fontVariables = [
  plexSans.variable,
  plexMono.variable,
  sourceSerif.variable,
  sourceSans.variable,
  spaceGrotesk.variable,
  literata.variable,
].join(" ");
