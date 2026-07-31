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
import { DEFAULT_DESIGN, DesignSchema, type Design } from "./design";

const DATA_DIR = path.join(process.cwd(), "data");
const CV_PATH = path.join(DATA_DIR, "cv.json");
const DESIGN_PATH = path.join(DATA_DIR, "design.json");
const APPLICATIONS_DIR = path.join(DATA_DIR, "applications");
export const EXPORT_DIR = path.join(process.cwd(), "export");

/** Accepted photo formats and the extension they are stored under. */
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Raised when a file on disk does not match its schema. */
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

/** Master CV. Returns an empty CV when none exists yet. */
export async function readCv(): Promise<Cv> {
  return (await readJson(CV_PATH, CvSchema)) ?? emptyCv();
}

export async function writeCv(cv: Cv): Promise<void> {
  await writeJson(CV_PATH, CvSchema.parse(cv));
}

/** Global design settings; the defaults until something has been saved. */
export async function readDesign(): Promise<Design> {
  return (await readJson(DESIGN_PATH, DesignSchema)) ?? DEFAULT_DESIGN;
}

export async function writeDesign(design: Design): Promise<void> {
  await writeJson(DESIGN_PATH, DesignSchema.parse(design));
}

/**
 * An application's design: its own setting, otherwise the global one. That way
 * changing the default template also changes every application without one.
 */
export async function resolveDesign(application?: Application | null): Promise<Design> {
  return application?.design ?? (await readDesign());
}

/** Path of the stored photo, or null. */
export async function findPhoto(): Promise<{ path: string; mtimeMs: number } | null> {
  for (const ext of new Set(Object.values(PHOTO_TYPES))) {
    const candidate = path.join(DATA_DIR, `photo.${ext}`);
    try {
      const stat = await fs.stat(candidate);
      return { path: candidate, mtimeMs: stat.mtimeMs };
    } catch {
      /* try the next extension */
    }
  }
  return null;
}

/**
 * Photo URL including a cache buster. Without it the preview keeps showing the
 * old image after an upload — in the Puppeteer Chromium too.
 */
export async function photoUrl(): Promise<string | null> {
  const photo = await findPhoto();
  return photo ? `/api/photo?v=${Math.round(photo.mtimeMs)}` : null;
}

export async function writePhoto(data: Buffer, extension: string): Promise<void> {
  await removePhoto();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, `photo.${extension}`), data);
}

export async function removePhoto(): Promise<void> {
  for (const ext of new Set(Object.values(PHOTO_TYPES))) {
    await fs.rm(path.join(DATA_DIR, `photo.${ext}`), { force: true });
  }
}

/**
 * A slug that does not match our format cannot name a file we wrote — that is a
 * "not found", not an error.
 */
export async function readApplication(slug: string): Promise<Application | null> {
  if (!isSafeSlug(slug)) return null;
  return readJson(applicationPath(slug), ApplicationSchema);
}

export async function writeApplication(app: Application): Promise<void> {
  await writeJson(applicationPath(app.slug), ApplicationSchema.parse(app));
}

/** All applications, newest first. Broken files are skipped. */
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
 * Slugs end up in file paths — what remains after normalisation has to be what
 * `slugify` would produce, otherwise the value did not come from us.
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
