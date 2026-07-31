import { promises as fs } from "node:fs";
import path from "node:path";
import * as z from "zod";
import {
  ApplicationSchema,
  CvSchema,
  emptyCv,
  type Application,
  type Cv,
} from "./cv-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const CV_PATH = path.join(DATA_DIR, "cv.json");
const APPLICATIONS_DIR = path.join(DATA_DIR, "applications");
export const EXPORT_DIR = path.join(process.cwd(), "export");

/** Fehler beim Lesen einer Datei, die nicht zum Schema passt. */
export class StoreValidationError extends Error {
  constructor(file: string, issues: z.ZodError) {
    const details = issues.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    super(`${file} passt nicht zum Schema:\n${details}`);
    this.name = "StoreValidationError";
  }
}

async function readJson<T>(file: string, schema: z.ZodType<T>): Promise<T | null> {
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new StoreValidationError(path.relative(process.cwd(), file), parsed.error);
  }
  return parsed.data;
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** Master-CV. Gibt einen leeren CV zurück, wenn noch keiner existiert. */
export async function readCv(): Promise<Cv> {
  return (await readJson(CV_PATH, CvSchema)) ?? emptyCv();
}

export async function writeCv(cv: Cv): Promise<void> {
  await writeJson(CV_PATH, CvSchema.parse(cv));
}

/**
 * Ein Slug, der nicht unserem Format entspricht, kann keine Datei von uns
 * bezeichnen — das ist ein "nicht gefunden", kein Fehler.
 */
export async function readApplication(slug: string): Promise<Application | null> {
  if (!isSafeSlug(slug)) return null;
  return readJson(applicationPath(slug), ApplicationSchema);
}

export async function writeApplication(app: Application): Promise<void> {
  await writeJson(applicationPath(app.slug), ApplicationSchema.parse(app));
}

/** Alle Bewerbungen, neueste zuerst. Kaputte Dateien werden übersprungen. */
export async function listApplications(): Promise<Application[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(APPLICATIONS_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }

  const apps: Application[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    try {
      const app = await readApplication(entry.replace(/\.json$/, ""));
      if (app) apps.push(app);
    } catch (err) {
      console.error(`Bewerbung übersprungen: ${(err as Error).message}`);
    }
  }
  return apps.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function applicationPath(slug: string): string {
  return path.join(APPLICATIONS_DIR, `${assertSafeSlug(slug)}.json`);
}

/**
 * Slugs landen in Dateipfaden — nach der Normalisierung muss übrig bleiben, was
 * `slugify` erzeugen würde, sonst kommt der Wert nicht von uns.
 */
export function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function assertSafeSlug(slug: string): string {
  if (!isSafeSlug(slug)) {
    throw new Error(`Ungültiger Slug: ${JSON.stringify(slug)}`);
  }
  return slug;
}

export function slugify(...parts: string[]): string {
  const slug = parts
    .join(" ")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "bewerbung";
}
