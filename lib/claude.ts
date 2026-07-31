import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type * as z from "zod";

import {
  CoverLetterSchema,
  CvSchema,
  TailoringResultSchema,
  type CallUsage,
  type CoverLetter,
  type Cv,
  type TailoringResult,
} from "./cv-schema";
import { SYSTEM_COVER_LETTER, SYSTEM_EXTRACT, SYSTEM_TAILOR } from "./prompts";

const MODEL = "claude-opus-5";

const FIXTURE_DIR = path.join(process.cwd(), "data", "fixtures");

/**
 * Price per million tokens in USD, Opus tier. **Check this against
 * anthropic.com/pricing** — a stale table produces confident but wrong figures.
 * Overridable without a code change via CV_FACTORY_PRICE_IN / _OUT.
 *
 * The two multipliers are properties of the API, not of the model: reading from
 * the cache costs a tenth of a normal input token, writing to it a quarter more.
 */
const PRICE_IN = Number(process.env.CV_FACTORY_PRICE_IN ?? 15);
const PRICE_OUT = Number(process.env.CV_FACTORY_PRICE_OUT ?? 75);
const CACHE_READ_FACTOR = 0.1;
const CACHE_WRITE_FACTOR = 1.25;

/**
 * `fixture` answers from `data/fixtures/`, `record` calls for real and saves the
 * answer there, anything else calls normally. Set in `.env.local` via
 * CV_FACTORY_CLAUDE.
 *
 * The point of it: prompts and rendering can be iterated on without waiting two
 * minutes and paying for a call each time — and without a key at all.
 */
function mode(): "fixture" | "record" | "live" {
  const value = process.env.CV_FACTORY_CLAUDE;
  return value === "fixture" || value === "record" ? value : "live";
}

export function isFixtureMode(): boolean {
  return mode() === "fixture";
}

/** Error carrying a message that can be shown to the user as-is. */
export class ClaudeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ClaudeError";
  }
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ClaudeError(
      "ANTHROPIC_API_KEY ist nicht gesetzt. Lege eine .env.local mit dem Key an (siehe .env.local.example) und starte den Dev-Server neu. Zum Ausprobieren ohne Key: CV_FACTORY_CLAUDE=fixture.",
      500,
    );
  }
  client ??= new Anthropic();
  return client;
}

/** What a call returns: the result plus what it cost. */
export type CallResult<T> = { data: T; usage: CallUsage };

type StructuredCallOptions<T> = {
  system: string;
  /** Stable part of the prompt — sits before the cache breakpoint. */
  context: string;
  /** Variable part — sits after the cache breakpoint. Blocks allow documents. */
  task: string | Anthropic.ContentBlockParam[];
  schema: z.ZodType<T>;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
  /** Name under which the answer is saved as a fixture and read back. */
  kind: CallUsage["kind"];
};

/**
 * One call with output guaranteed to match the schema.
 *
 * The cache breakpoint sits on the last system block: the system prompt and
 * `context` (the master CV, for instance) stay identical across calls, while the
 * variable `task` follows in the user message.
 */
async function runStructured<T>({
  system,
  context,
  task,
  schema,
  effort,
  maxTokens = 16000,
  kind,
}: StructuredCallOptions<T>): Promise<CallResult<T>> {
  if (mode() === "fixture") return readFixture(kind, schema);

  const startedAt = performance.now();
  try {
    const message = await getClient().messages.parse({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { effort, format: zodOutputFormat(schema) },
      system: [
        { type: "text", text: system },
        { type: "text", text: context, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: task }],
    });

    if (message.stop_reason === "refusal") {
      throw new ClaudeError(
        "Claude hat die Anfrage abgelehnt. Prüfe den eingefügten Text auf ungewöhnliche Inhalte.",
        422,
      );
    }
    if (message.stop_reason === "max_tokens") {
      throw new ClaudeError(
        "Die Antwort wurde abgeschnitten, weil sie zu lang wurde. Kürze die Eingabe und versuche es erneut.",
        502,
      );
    }
    if (!message.parsed_output) {
      throw new ClaudeError(
        "Claude hat kein auswertbares Ergebnis geliefert. Bitte erneut versuchen.",
        502,
      );
    }

    if (mode() === "record") await writeFixture(kind, message.parsed_output);

    return {
      data: message.parsed_output,
      usage: toUsage(kind, message.usage, performance.now() - startedAt),
    };
  } catch (err) {
    throw toClaudeError(err);
  }
}

/** Token counts and elapsed time from one answer, plus the price estimate. */
function toUsage(kind: CallUsage["kind"], usage: Anthropic.Usage, ms: number): CallUsage {
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;

  const costUsd =
    ((inputTokens + cacheReadTokens * CACHE_READ_FACTOR + cacheWriteTokens * CACHE_WRITE_FACTOR) *
      PRICE_IN +
      outputTokens * PRICE_OUT) /
    1_000_000;

  return {
    kind,
    at: new Date().toISOString(),
    model: MODEL,
    ms: Math.round(ms),
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    costUsd,
    fixture: false,
  };
}

function fixturePath(kind: CallUsage["kind"]): string {
  return path.join(FIXTURE_DIR, `${kind}.json`);
}

/**
 * A fixture goes through the same schema as a live answer. That is the whole
 * point: a recording that has gone stale because the schema changed fails here
 * loudly, instead of quietly working with data the API would no longer produce.
 */
async function readFixture<T>(
  kind: CallUsage["kind"],
  schema: z.ZodType<T>,
): Promise<CallResult<T>> {
  const file = fixturePath(kind);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ClaudeError(
        `Fixture-Modus ist an, aber ${path.relative(process.cwd(), file)} fehlt. Nimm einmal mit CV_FACTORY_CLAUDE=record auf oder lege die Datei von Hand an.`,
        500,
      );
    }
    throw err;
  }

  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new ClaudeError(
      `Die Fixture ${kind}.json passt nicht mehr zum Schema:\n${details}\nNimm sie neu auf.`,
      500,
    );
  }

  return {
    data: parsed.data,
    usage: {
      kind,
      at: new Date().toISOString(),
      model: `${MODEL} (Fixture)`,
      ms: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      costUsd: 0,
      fixture: true,
    },
  };
}

async function writeFixture(kind: CallUsage["kind"], data: unknown): Promise<void> {
  await fs.mkdir(FIXTURE_DIR, { recursive: true });
  await fs.writeFile(fixturePath(kind), JSON.stringify(data, null, 2) + "\n", "utf8");
  console.info(`[claude] Fixture aufgezeichnet: data/fixtures/${kind}.json`);
}

function toClaudeError(err: unknown): ClaudeError {
  if (err instanceof ClaudeError) return err;
  if (err instanceof Anthropic.AuthenticationError) {
    return new ClaudeError("Der ANTHROPIC_API_KEY wurde abgelehnt. Bitte prüfen.", 401);
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new ClaudeError(
      "Rate-Limit erreicht. Kurz warten und noch einmal versuchen.",
      429,
    );
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new ClaudeError("Keine Verbindung zur Anthropic-API.", 503);
  }
  if (err instanceof Anthropic.APIError) {
    return new ClaudeError(`Anthropic-API-Fehler: ${err.message}`, err.status ?? 502);
  }
  return new ClaudeError(
    err instanceof Error ? err.message : "Unbekannter Fehler",
    500,
  );
}

/** Raw notes -> structured CV. */
export function extractCv(rawText: string, existing: Cv): Promise<CallResult<Cv>> {
  return runStructured({
    kind: "extract",
    system: SYSTEM_EXTRACT,
    context: `<bestehender_lebenslauf>\n${JSON.stringify(existing, null, 2)}\n</bestehender_lebenslauf>`,
    task: [
      "Überführe die folgenden Notizen in das Lebenslauf-Schema.",
      "Der bestehende Lebenslauf oben ist der Ausgangspunkt: übernimm ihn vollständig",
      "und ergänze bzw. korrigiere ihn anhand der Notizen. Gib den kompletten,",
      "zusammengeführten Lebenslauf zurück, nicht nur das Neue.",
      "",
      "<notizen>",
      rawText,
      "</notizen>",
    ].join("\n"),
    schema: CvSchema,
    effort: "medium",
  });
}

/**
 * Existing CV as a document -> structured CV.
 *
 * A PDF goes to the API unchanged as a document block: Claude reads the pages
 * itself, including their layout. That is more reliable than any text
 * extraction here, because a two-column CV comes out of a text extractor with
 * the columns interleaved. DOCX has no such block type, so the route converts
 * it to text beforehand and passes it in here as `text`.
 */
export function importCv(
  source: { pdfBase64: string } | { text: string },
  existing: Cv,
): Promise<CallResult<Cv>> {
  const instruction = [
    "Im Anhang bzw. unten steht ein bereits bestehender Lebenslauf.",
    "Übertrage ihn vollständig in das Schema: alle Stationen, alle Zeiträume,",
    "alle Aufgaben. Formuliere nichts um und lasse nichts weg.",
    "",
    "Wenn oben bereits ein Lebenslauf steht, führe beides zusammen und gib das",
    "vollständige Ergebnis zurück. Was du im Dokument nicht findest, bleibt leer —",
    "erfinde keine Daten, um Lücken zu schließen.",
  ].join("\n");

  const task: Anthropic.ContentBlockParam[] =
    "pdfBase64" in source
      ? [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: source.pdfBase64 },
          },
          { type: "text", text: instruction },
        ]
      : [{ type: "text", text: `${instruction}\n\n<lebenslauf>\n${source.text}\n</lebenslauf>` }];

  return runStructured({
    kind: "import",
    system: SYSTEM_EXTRACT,
    context: `<bestehender_lebenslauf>\n${JSON.stringify(existing, null, 2)}\n</bestehender_lebenslauf>`,
    task,
    schema: CvSchema,
    effort: "medium",
  });
}

/** Master CV + job posting -> tailored variant with a rationale. */
export function tailorCv(
  masterCv: Cv,
  jobPosting: string,
  company: string,
  role: string,
): Promise<CallResult<TailoringResult>> {
  return runStructured({
    kind: "tailor",
    system: SYSTEM_TAILOR,
    context: `<master_cv>\n${JSON.stringify(masterCv, null, 2)}\n</master_cv>`,
    task: [
      `Schneide den Master-CV auf diese Stelle zu: ${role} bei ${company}.`,
      "",
      "<stellenanzeige>",
      jobPosting,
      "</stellenanzeige>",
    ].join("\n"),
    schema: TailoringResultSchema,
    effort: "high",
  });
}

/** Tailored CV + posting -> cover letter. */
export function writeCoverLetter(
  cv: Cv,
  jobPosting: string,
  company: string,
  role: string,
): Promise<CallResult<CoverLetter>> {
  return runStructured({
    kind: "cover-letter",
    system: SYSTEM_COVER_LETTER,
    context: `<lebenslauf>\n${JSON.stringify(cv, null, 2)}\n</lebenslauf>`,
    task: [
      `Schreibe das Anschreiben für die Stelle ${role} bei ${company}.`,
      "",
      "<stellenanzeige>",
      jobPosting,
      "</stellenanzeige>",
    ].join("\n"),
    schema: CoverLetterSchema,
    effort: "high",
    maxTokens: 8000,
  });
}
