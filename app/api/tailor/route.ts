import { NextResponse } from "next/server";
import * as z from "zod";

import { errorResponse, parseBody } from "@/lib/api";
import { tailorCv } from "@/lib/claude";
import type { Application } from "@/lib/cv-schema";
import { readApplication, readCv, slugify, writeApplication } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z.object({
  company: z.string().min(1, "Firma fehlt"),
  role: z.string().min(1, "Rolle fehlt"),
  jobPosting: z.string().min(1, "Stellenanzeige fehlt"),
  /** Gesetzt beim erneuten Zuschneiden einer bestehenden Bewerbung. */
  slug: z.string().nullish(),
});

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, BodySchema);
    const masterCv = await readCv();

    if (!masterCv.basics.fullName) {
      return NextResponse.json(
        { error: "Der Master-CV ist noch leer. Lege ihn zuerst unter /cv an." },
        { status: 409 },
      );
    }

    const result = await tailorCv(masterCv, body.jobPosting, body.company, body.role);

    const slug = body.slug ?? slugify(body.company, body.role);
    const existing = await readApplication(slug);
    const now = new Date().toISOString();

    const application: Application = {
      slug,
      company: body.company,
      role: body.role,
      jobPosting: body.jobPosting,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      cv: result.cv,
      rationale: result.rationale,
      matchedKeywords: result.matchedKeywords,
      gaps: result.gaps,
      // Ein neu zugeschnittener CV entwertet ein zuvor erzeugtes Anschreiben.
      coverLetter: null,
      // Das Design gehört zur Bewerbung, nicht zum Inhalt — es überlebt einen
      // neuen Zuschnitt.
      design: existing?.design ?? null,
    };

    await writeApplication(application);
    return NextResponse.json({ application });
  } catch (err) {
    return errorResponse(err);
  }
}
