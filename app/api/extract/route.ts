import { NextResponse } from "next/server";
import * as z from "zod";

import { errorResponse, parseBody } from "@/lib/api";
import { extractCv } from "@/lib/claude";
import { readCv } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z.object({ rawText: z.string().min(1, "Notizen sind leer") });

/**
 * Notizen -> CV-Schema. Speichert bewusst NICHT: das Ergebnis geht zur Ansicht
 * zurück, übernehmen tut es der Mensch.
 */
export async function POST(req: Request) {
  try {
    const { rawText } = await parseBody(req, BodySchema);
    const cv = await extractCv(rawText, await readCv());
    return NextResponse.json({ cv });
  } catch (err) {
    return errorResponse(err);
  }
}
