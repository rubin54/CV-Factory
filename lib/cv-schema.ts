import * as z from "zod";

/**
 * Ein Schema für drei Zwecke: TypeScript-Typen, Validierung beim Lesen der
 * JSON-Dateien, und via `zodOutputFormat()` das JSON-Schema für Claudes
 * Structured Outputs.
 *
 * Zwei Regeln, weil das Schema an die API geht:
 *   - Keine `.min()` / `.max()` / `.email()` Constraints — Structured Outputs
 *     unterstützen die nicht.
 *   - Optionale Werte als `.nullable()`, nicht `.optional()`. Das Modell muss
 *     das Feld dann explizit auf null setzen statt es wegzulassen, was mit
 *     `additionalProperties: false` deutlich zuverlässiger ist.
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

/** Was `/api/tailor` von Claude zurückbekommt. */
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

/** Was pro Bewerbung auf der Platte liegt (`data/applications/<slug>.json`). */
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
