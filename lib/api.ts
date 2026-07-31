import { NextResponse } from "next/server";
import * as z from "zod";

import { ClaudeError } from "./claude";
import { StoreValidationError } from "./store";

/**
 * Übersetzt alles, was in einer Route hochkommen kann, in eine Antwort mit einer
 * Meldung, die die UI direkt anzeigen kann. Kein Stacktrace an den Browser.
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ClaudeError) {
    console.error(`[claude] ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof StoreValidationError) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  if (err instanceof z.ZodError) {
    const details = err.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return NextResponse.json({ error: `Ungültige Anfrage: ${details}` }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Unbekannter Fehler" },
    { status: 500 },
  );
}

/** Liest und validiert den Request-Body. Wirft ZodError bei Fehlschlag. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new z.ZodError([
      { code: "custom", message: "Body ist kein gültiges JSON", path: [], input: undefined },
    ]);
  }
  return schema.parse(raw);
}
