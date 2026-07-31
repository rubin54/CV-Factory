import type { CSSProperties } from "react";
import * as z from "zod";

/**
 * Design-Einstellungen. Diese gehen NICHT an die API — hier sind Constraints und
 * Enums erlaubt.
 *
 * Die Werte sind bewusst kuratierte Sets statt freier Farbwähler und
 * Schriftgrößen: ein Lebenslauf mit frei gewählter Farbe und Schrift sieht in
 * neun von zehn Fällen schlechter aus als einer aus abgestimmten Vorgaben.
 */

export const TEMPLATE_IDS = ["linear", "kompakt", "akzent"] as const;
export const PALETTE_IDS = ["graphit", "tinte", "moos", "rost", "aubergine"] as const;
export const FONT_PAIR_IDS = ["plex", "source", "grotesk", "literata"] as const;
export const DENSITY_IDS = ["luftig", "normal", "dicht"] as const;
export const MARGIN_IDS = ["schmal", "normal", "breit"] as const;

export const DesignSchema = z.object({
  template: z.enum(TEMPLATE_IDS),
  palette: z.enum(PALETTE_IDS),
  fontPair: z.enum(FONT_PAIR_IDS),
  density: z.enum(DENSITY_IDS),
  margin: z.enum(MARGIN_IDS),
  showPhoto: z.boolean(),
  photoShape: z.enum(["kreis", "eckig"]),
});

export type Design = z.infer<typeof DesignSchema>;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const DEFAULT_DESIGN: Design = {
  template: "kompakt",
  palette: "tinte",
  fontPair: "plex",
  density: "normal",
  margin: "normal",
  showPhoto: false,
  photoShape: "eckig",
};

export const TEMPLATES: Record<
  TemplateId,
  { label: string; description: string; atsNote: string }
> = {
  kompakt: {
    label: "Kompakt",
    description:
      "Kopfzeile über die volle Breite, links eine schmale Spalte für Kontakt, Kenntnisse und Sprachen, rechts der Fließtext.",
    atsNote: "Haupttext bleibt einspaltig — für die meisten Parser unproblematisch.",
  },
  linear: {
    label: "Linear",
    description:
      "Streng einspaltig. Wirkt über Typografie, Weißraum und eine feste Datumsspalte statt über Layout.",
    atsNote: "Maximal parsersicher.",
  },
  akzent: {
    label: "Akzent",
    description:
      "Farbiges Kopfband, getönte Seitenspalte, größere Typo. Der auffälligste der drei.",
    atsNote: "Für Direktbewerbungen; bei automatisiertem Screening riskanter.",
  },
};

export const PALETTES: Record<
  (typeof PALETTE_IDS)[number],
  { label: string; accent: string; accentSoft: string; onAccent: string; ink: string }
> = {
  graphit: {
    label: "Graphit",
    accent: "#2f3743",
    accentSoft: "#eef0f3",
    onAccent: "#ffffff",
    ink: "#14171c",
  },
  tinte: {
    label: "Tinte",
    accent: "#1f3f68",
    accentSoft: "#eaeff6",
    onAccent: "#ffffff",
    ink: "#14171c",
  },
  moos: {
    label: "Moos",
    accent: "#2c5647",
    accentSoft: "#e9f0ec",
    onAccent: "#ffffff",
    ink: "#15191b",
  },
  rost: {
    label: "Rost",
    accent: "#8a3f27",
    accentSoft: "#f6ece7",
    onAccent: "#ffffff",
    ink: "#1c1714",
  },
  aubergine: {
    label: "Aubergine",
    accent: "#4d3560",
    accentSoft: "#f0ecf4",
    onAccent: "#ffffff",
    ink: "#181420",
  },
};

export const FONT_PAIRS: Record<
  (typeof FONT_PAIR_IDS)[number],
  { label: string; description: string; display: string; body: string; mono: string }
> = {
  plex: {
    label: "Plex",
    description: "IBM Plex Sans & Mono — technisch, präzise, ohne Tech-Klischee.",
    display: "var(--font-plex-sans)",
    body: "var(--font-plex-sans)",
    mono: "var(--font-plex-mono)",
  },
  source: {
    label: "Source",
    description: "Source Serif über Source Sans — ruhig, klassisch, sehr lesbar.",
    display: "var(--font-source-serif)",
    body: "var(--font-source-sans)",
    mono: "var(--font-plex-mono)",
  },
  grotesk: {
    label: "Grotesk",
    description: "Space Grotesk über Plex Sans — markante Überschriften, nüchterner Text.",
    display: "var(--font-space-grotesk)",
    body: "var(--font-plex-sans)",
    mono: "var(--font-plex-mono)",
  },
  literata: {
    label: "Literata",
    description: "Literata über Source Sans — warm und erzählerisch, gut für Fließtext.",
    display: "var(--font-literata)",
    body: "var(--font-source-sans)",
    mono: "var(--font-plex-mono)",
  },
};

export const DENSITIES: Record<
  (typeof DENSITY_IDS)[number],
  { label: string; fontSize: string; lineHeight: string; sectionGap: string; entryGap: string }
> = {
  luftig: {
    label: "Luftig",
    fontSize: "11pt",
    lineHeight: "1.55",
    sectionGap: "22px",
    entryGap: "15px",
  },
  normal: {
    label: "Normal",
    fontSize: "10.25pt",
    lineHeight: "1.45",
    sectionGap: "17px",
    entryGap: "12px",
  },
  dicht: {
    label: "Dicht",
    fontSize: "9.5pt",
    lineHeight: "1.35",
    sectionGap: "12px",
    entryGap: "9px",
  },
};

/** Seitenrand in Millimetern — greift im PDF über Puppeteer, nicht über CSS. */
export const MARGINS: Record<(typeof MARGIN_IDS)[number], { label: string; mm: number }> = {
  schmal: { label: "Schmal", mm: 12 },
  normal: { label: "Normal", mm: 16 },
  breit: { label: "Breit", mm: 20 },
};

/** Design-Einstellungen als CSS-Custom-Properties für den Dokument-Container. */
export function designToCssVars(design: Design): CSSProperties {
  const palette = PALETTES[design.palette];
  const fonts = FONT_PAIRS[design.fontPair];
  const density = DENSITIES[design.density];

  return {
    "--accent": palette.accent,
    "--accent-soft": palette.accentSoft,
    "--on-accent": palette.onAccent,
    "--ink": palette.ink,
    "--muted": "color-mix(in srgb, var(--ink) 55%, white)",
    "--rule": "color-mix(in srgb, var(--ink) 18%, white)",
    "--font-display": fonts.display,
    "--font-body": fonts.body,
    "--font-mono": fonts.mono,
    "--doc-size": density.fontSize,
    "--doc-leading": density.lineHeight,
    "--doc-section-gap": density.sectionGap,
    "--doc-entry-gap": density.entryGap,
    "--doc-pad": `${MARGINS[design.margin].mm}mm`,
  } as CSSProperties;
}
