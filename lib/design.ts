import type { CSSProperties } from "react";
import * as z from "zod";

/**
 * Design-Einstellungen. Diese gehen NICHT an die API — hier sind Constraints und
 * Enums erlaubt.
 *
 * Farben und Schriften sind kuratierte Sets statt freier Wähler: ein Lebenslauf
 * mit selbst gewählter Farbe und Schrift sieht meist schlechter aus als einer
 * aus abgestimmten Vorgaben. Größen und Abstände sind dagegen stufenlos — der
 * Auto-Fit sucht darüber die Kombination, mit der der Inhalt auf N Seiten passt.
 */

export const TEMPLATE_IDS = ["klassik", "linear", "kompakt", "akzent", "dicht"] as const;
export const PALETTE_IDS = ["graphit", "tinte", "moos", "rost", "aubergine"] as const;
export const FONT_PAIR_IDS = ["plex", "source", "grotesk", "literata"] as const;

/** Abschnitte, die sich sortieren, ausblenden und verschieben lassen. */
export const SECTION_IDS = [
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
  "languages",
  "links",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  summary: "Profil",
  experience: "Berufserfahrung",
  projects: "Projekte",
  skills: "Kenntnisse",
  education: "Ausbildung",
  certifications: "Zertifikate",
  languages: "Sprachen",
  links: "Online",
};

export const SectionPlacementSchema = z.object({
  id: z.enum(SECTION_IDS),
  visible: z.boolean(),
  /** Nur bei Vorlagen mit Seitenspalte wirksam. */
  column: z.enum(["main", "aside"]),
});

export type SectionPlacement = z.infer<typeof SectionPlacementSchema>;

/**
 * Reihenfolge nach dem, was für Software-Lebensläufe empfohlen wird:
 * Profil, Erfahrung, Projekte, Ausbildung — Nachschlagbares in die Seitenspalte.
 */
export const DEFAULT_SECTIONS: SectionPlacement[] = [
  { id: "summary", visible: true, column: "main" },
  { id: "experience", visible: true, column: "main" },
  { id: "projects", visible: true, column: "main" },
  { id: "education", visible: true, column: "main" },
  { id: "links", visible: true, column: "aside" },
  { id: "skills", visible: true, column: "aside" },
  { id: "languages", visible: true, column: "aside" },
  { id: "certifications", visible: true, column: "aside" },
];

export const DesignSchema = z.object({
  template: z.enum(TEMPLATE_IDS),
  palette: z.enum(PALETTE_IDS),
  fontPair: z.enum(FONT_PAIR_IDS),

  /** Grundschriftgröße in pt. Der Auto-Fit variiert diesen Wert zuerst. */
  fontSize: z.number().min(7.5).max(13),
  /** Zeilenabstand, einheitenlos. Zweiter Stellhebel des Auto-Fits. */
  lineHeight: z.number().min(1.15).max(1.8),
  /** Multiplikator für Abstände zwischen Abschnitten und Einträgen. */
  spacing: z.number().min(0.5).max(1.8),
  /** Seitenrand in Millimetern — wirkt im PDF über Puppeteer. */
  margin: z.number().min(8).max(28),

  sections: z.array(SectionPlacementSchema).default(DEFAULT_SECTIONS),
  showPhoto: z.boolean(),
  photoShape: z.enum(["kreis", "eckig"]),
  /** Symbole in der Kontaktzeile. Der Text daneben bleibt unverändert lesbar. */
  showIcons: z.boolean().default(true),
  /** Fußzeile mit Stand-Datum. */
  showFooter: z.boolean().default(false),
});

export type Design = z.infer<typeof DesignSchema>;

export const DEFAULT_DESIGN: Design = {
  template: "kompakt",
  palette: "tinte",
  fontPair: "plex",
  fontSize: 10.25,
  lineHeight: 1.45,
  spacing: 1,
  margin: 16,
  sections: DEFAULT_SECTIONS,
  showPhoto: false,
  photoShape: "eckig",
  showIcons: true,
  showFooter: false,
};

/** Voreinstellungen für die Schnellwahl — der Auto-Fit rechnet dazwischen. */
export const DENSITY_PRESETS = [
  { label: "Luftig", fontSize: 11, lineHeight: 1.55, spacing: 1.3 },
  { label: "Normal", fontSize: 10.25, lineHeight: 1.45, spacing: 1 },
  { label: "Dicht", fontSize: 9.5, lineHeight: 1.35, spacing: 0.78 },
  { label: "Sehr dicht", fontSize: 8.8, lineHeight: 1.25, spacing: 0.6 },
] as const;

export const MARGIN_PRESETS = [
  { label: "Schmal", mm: 12 },
  { label: "Normal", mm: 16 },
  { label: "Breit", mm: 20 },
] as const;

export const TEMPLATES: Record<
  TemplateId,
  { label: string; description: string; atsNote: string; hasAside: boolean }
> = {
  klassik: {
    label: "Klassik",
    description:
      "Zentrierte Kopfzeile, Kontaktzeile mit Trennstrichen, Abschnittstitel in Kapitälchen über einer Linie. Der De-facto-Standard in der Tech-Branche.",
    atsNote: "Einspaltig, maximal parsersicher.",
    hasAside: false,
  },
  linear: {
    label: "Linear",
    description:
      "Streng einspaltig mit fester Datumsspalte links. Die Zeiträume bilden eine durchgehende Achse.",
    atsNote: "Einspaltig, maximal parsersicher.",
    hasAside: false,
  },
  kompakt: {
    label: "Kompakt",
    description:
      "Kopfzeile über die volle Breite, schmale Seitenspalte für Nachschlagbares, rechts der Fließtext.",
    atsNote: "Haupttext einspaltig; im PDF steht die Erfahrung vor der Seitenspalte.",
    hasAside: true,
  },
  akzent: {
    label: "Akzent",
    description:
      "Farbiges Kopfband, getönte Kacheln in der Seitenspalte, größere Typo. Der auffälligste der fünf.",
    atsNote: "Für Direktbewerbungen; bei automatisiertem Screening riskanter.",
    hasAside: true,
  },
  dicht: {
    label: "Dicht",
    description:
      "Echtes Zweispalten-Raster, das viel Inhalt auf eine Seite bringt. Für viele Projekte und Stationen.",
    atsNote: "Zweispaltig — das riskanteste Layout für Parser.",
    hasAside: true,
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

/**
 * Ergänzt fehlende Abschnitte und wirft Unbekanntes weg. Ohne das würde eine
 * von Hand editierte design.json Abschnitte verschwinden lassen, ohne dass es
 * jemandem auffällt.
 */
export function normalizeSections(sections: SectionPlacement[]): SectionPlacement[] {
  const seen = new Set<SectionId>();
  const result: SectionPlacement[] = [];

  for (const entry of sections) {
    if (!SECTION_IDS.includes(entry.id) || seen.has(entry.id)) continue;
    seen.add(entry.id);
    result.push(entry);
  }
  for (const fallback of DEFAULT_SECTIONS) {
    if (!seen.has(fallback.id)) result.push(fallback);
  }
  return result;
}

/** Abschnitte nach Spalte, in der eingestellten Reihenfolge. */
export function sectionPlan(design: Design): { main: SectionId[]; aside: SectionId[] } {
  const sections = normalizeSections(design.sections).filter((s) => s.visible);
  const hasAside = TEMPLATES[design.template].hasAside;

  return {
    main: sections.filter((s) => !hasAside || s.column === "main").map((s) => s.id),
    aside: hasAside ? sections.filter((s) => s.column === "aside").map((s) => s.id) : [],
  };
}

/** Design-Einstellungen als CSS-Custom-Properties für den Dokument-Container. */
export function designToCssVars(design: Design): CSSProperties {
  const palette = PALETTES[design.palette];
  const fonts = FONT_PAIRS[design.fontPair];

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
    "--doc-size": `${design.fontSize}pt`,
    "--doc-leading": String(design.lineHeight),
    "--doc-section-gap": `${(design.spacing * 17).toFixed(1)}px`,
    "--doc-entry-gap": `${(design.spacing * 12).toFixed(1)}px`,
    "--doc-pad": `${design.margin}mm`,
  } as CSSProperties;
}

/** Satzspiegel einer A4-Seite in CSS-Pixeln, bei gegebenem Rand. */
export function pageContentHeightPx(design: Design): number {
  const MM_TO_PX = 96 / 25.4;
  return (297 - 2 * design.margin) * MM_TO_PX;
}
