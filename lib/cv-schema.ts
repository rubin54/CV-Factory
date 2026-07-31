import * as z from "zod";

import { DesignSchema } from "./design";

/**
 * One schema for three purposes: TypeScript types, validation when reading the
 * JSON files, and — through `zodOutputFormat()` — the JSON Schema for Claude's
 * structured outputs.
 *
 * Two rules, because the schema goes to the API:
 *   - No `.min()` / `.max()` / `.email()` constraints — structured outputs do
 *     not support them.
 *   - Optional values as `.nullable()`, not `.optional()`. The model then has to
 *     set the field to null explicitly instead of omitting it, which is far more
 *     reliable together with `additionalProperties: false`.
 *
 * The `.describe()` texts stay in German: they are part of the schema sent to
 * Claude and steer the wording of the generated CV.
 */

export const LinkSchema = z.object({
  label: z.string().describe('Anzeigename, z.B. "GitHub" oder "LinkedIn"'),
  url: z.string(),
});

export const BasicsSchema = z.object({
  fullName: z.string(),
  headline: z
    .string()
    .describe('Berufsbezeichnung unter dem Namen, z.B. "Senior Backend Engineer"'),
  email: z.string(),
  phone: z.string().nullable(),
  location: z.string().nullable().describe('Stadt/Land, z.B. "Hamburg, Deutschland"'),
  summary: z
    .string()
    .describe("Kurzprofil, zwei bis vier Sätze, in der Ich-Form ohne Floskeln"),
  links: z.array(LinkSchema),
});

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string().nullable(),
  startDate: z.string().describe('Format "YYYY-MM", z.B. "2021-03"'),
  endDate: z.string().nullable().describe('Format "YYYY-MM"; null bedeutet "bis heute"'),
  summary: z.string().nullable().describe("Ein Satz Kontext zur Rolle, optional"),
  bullets: z
    .array(z.string())
    .describe("Erfolge und Verantwortlichkeiten, je ein Stichpunkt, ergebnisorientiert"),
  technologies: z.array(z.string()),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string().describe('z.B. "B.Sc." oder "Ausbildung"'),
  field: z.string().nullable().describe('Fachrichtung, z.B. "Wirtschaftsinformatik"'),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  details: z.array(z.string()).describe("Schwerpunkte, Abschlussarbeit, Note"),
});

export const SkillGroupSchema = z.object({
  category: z.string().describe('Gruppenname, z.B. "Sprachen" oder "Cloud & DevOps"'),
  items: z.array(z.string()),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  url: z.string().nullable(),
  technologies: z.array(z.string()),
});

export const LanguageSchema = z.object({
  name: z.string(),
  level: z.string().describe('z.B. "Muttersprache", "C1", "verhandlungssicher"'),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable(),
  date: z.string().nullable(),
});

export const CvSchema = z.object({
  basics: BasicsSchema,
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  skills: z.array(SkillGroupSchema),
  projects: z.array(ProjectSchema),
  languages: z.array(LanguageSchema),
  certifications: z.array(CertificationSchema),
});

/** What `/api/tailor` gets back from Claude. */
export const TailoringResultSchema = z.object({
  cv: CvSchema.describe("Der zugeschnittene Lebenslauf"),
  rationale: z
    .array(z.string())
    .describe(
      "Je ein Satz pro relevanter Änderung: was wurde umpriorisiert, umformuliert oder weggelassen und warum",
    ),
  matchedKeywords: z
    .array(z.string())
    .describe("Begriffe aus der Stellenanzeige, die durch echte Erfahrung belegt sind"),
  gaps: z
    .array(z.string())
    .describe(
      "Anforderungen der Anzeige, für die es im Master-CV keinen Beleg gibt. Diese gehören NICHT in den CV.",
    ),
});

export const CoverLetterSchema = z.object({
  subject: z.string().describe('Betreffzeile, z.B. "Bewerbung als …"'),
  salutation: z.string().describe('z.B. "Sehr geehrte Frau …" oder "Sehr geehrtes Team,"'),
  body: z.array(z.string()).describe("Absätze des Anschreibens, je ein Array-Eintrag"),
  closing: z.string().describe('Grußformel, z.B. "Mit freundlichen Grüßen"'),
});

/**
 * Where an application stands. Deliberately a short, linear list — anything
 * finer grained turns into bookkeeping you stop maintaining after a week.
 */
export const APPLICATION_STATUSES = [
  "entwurf",
  "beworben",
  "gespraech",
  "absage",
  "zusage",
] as const;

export const ApplicationStatusSchema = z.enum(APPLICATION_STATUSES);

/** Label and colour token per status — shared by list, badge and selector. */
export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; tone: "neutral" | "accent" | "ok" | "warn" | "danger" }
> = {
  entwurf: { label: "Entwurf", tone: "neutral" },
  beworben: { label: "Beworben", tone: "accent" },
  gespraech: { label: "Gespräch", tone: "warn" },
  absage: { label: "Absage", tone: "danger" },
  zusage: { label: "Zusage", tone: "ok" },
};

/**
 * What one Claude call cost. Written per call so the price of an application is
 * visible instead of only showing up on the invoice at the end of the month.
 */
export const CallUsageSchema = z.object({
  kind: z.enum(["extract", "import", "tailor", "cover-letter"]),
  at: z.string(),
  model: z.string(),
  ms: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheReadTokens: z.number(),
  cacheWriteTokens: z.number(),
  /** Estimate from the price table in lib/claude.ts, not a billed figure. */
  costUsd: z.number(),
  /** true when the answer came from a fixture — then nothing was charged. */
  fixture: z.boolean(),
});

/** What sits on disk per application (`data/applications/<slug>.json`). */
export const ApplicationSchema = z.object({
  slug: z.string(),
  company: z.string(),
  role: z.string(),
  jobPosting: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  cv: CvSchema,
  rationale: z.array(z.string()),
  matchedKeywords: z.array(z.string()),
  gaps: z.array(z.string()),
  coverLetter: CoverLetterSchema.nullable(),
  /**
   * Design override for this application only — null means the global setting
   * from data/design.json. `.default(null)` keeps older or hand-written files
   * without the field valid.
   */
  design: DesignSchema.nullable().default(null),
  /**
   * Status of the application. `.default()` on all three, so files written
   * before this existed stay readable.
   */
  status: ApplicationStatusSchema.default("entwurf"),
  /** ISO timestamp of the last status change, null while still a draft. */
  statusChangedAt: z.string().nullable().default(null),
  /** Free text on the status: interview date, reason for rejection, contact. */
  statusNote: z.string().default(""),
  /** One entry per Claude call for this application, oldest first. */
  usage: z.array(CallUsageSchema).default([]),
});

export type Link = z.infer<typeof LinkSchema>;
export type Basics = z.infer<typeof BasicsSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Cv = z.infer<typeof CvSchema>;
export type TailoringResult = z.infer<typeof TailoringResultSchema>;
export type CoverLetter = z.infer<typeof CoverLetterSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type CallUsage = z.infer<typeof CallUsageSchema>;

export function emptyCv(): Cv {
  return {
    basics: {
      fullName: "",
      headline: "",
      email: "",
      phone: null,
      location: null,
      summary: "",
      links: [],
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
  };
}
