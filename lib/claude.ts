import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type * as z from "zod";

import {
  CoverLetterSchema,
  CvSchema,
  TailoringResultSchema,
  type CoverLetter,
  type Cv,
  type TailoringResult,
} from "./cv-schema";
import { SYSTEM_COVER_LETTER, SYSTEM_EXTRACT, SYSTEM_TAILOR } from "./prompts";

const MODEL = "claude-opus-5";

/** Fehler mit einer Meldung, die man dem Nutzer direkt zeigen kann. */
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
      "ANTHROPIC_API_KEY ist nicht gesetzt. Lege eine .env.local mit dem Key an (siehe .env.local.example) und starte den Dev-Server neu.",
      500,
    );
  }
  client ??= new Anthropic();
  return client;
}

type StructuredCallOptions<T> = {
  system: string;
  /** Stabiler Teil des Prompts — landet vor dem Cache-Breakpoint. */
  context: string;
  /** Variabler Teil — landet nach dem Cache-Breakpoint. */
  task: string;
  schema: z.ZodType<T>;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
};

/**
 * Ein Aufruf mit garantiert schema-konformem Output.
 *
 * Der Cache-Breakpoint sitzt auf dem letzten System-Block: System-Prompt und
 * `context` (z.B. der Master-CV) sind über mehrere Aufrufe hinweg identisch, der
 * variable `task` steht danach in der User-Message.
 */
async function runStructured<T>({
  system,
  context,
  task,
  schema,
  effort,
  maxTokens = 16000,
}: StructuredCallOptions<T>): Promise<T> {
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
    return message.parsed_output;
  } catch (err) {
    throw toClaudeError(err);
  }
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

/** Rohnotizen → strukturierter Lebenslauf. */
export function extractCv(rawText: string, existing: Cv): Promise<Cv> {
  return runStructured({
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

/** Master-CV + Stellenanzeige → zugeschnittene Variante mit Begründung. */
export function tailorCv(
  masterCv: Cv,
  jobPosting: string,
  company: string,
  role: string,
): Promise<TailoringResult> {
  return runStructured({
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

/** Zugeschnittener CV + Anzeige → Anschreiben. */
export function writeCoverLetter(
  cv: Cv,
  jobPosting: string,
  company: string,
  role: string,
): Promise<CoverLetter> {
  return runStructured({
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
