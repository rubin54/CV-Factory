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
  /** Set when re-tailoring an existing application. */
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

    const { data: result, usage } = await tailorCv(
      masterCv,
      body.jobPosting,
      body.company,
      body.role,
    );

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
      // A freshly tailored CV invalidates any cover letter written before it.
      // The previous version stays in data/.backups/ — a re-tailoring you did
      // not want is undoable.
      coverLetter: null,
      // The design belongs to the application, not to its content — it survives
      // a re-tailoring.
      design: existing?.design ?? null,
      // Status and cost history likewise: they describe the application, not
      // this particular cut of the CV.
      status: existing?.status ?? "entwurf",
      statusChangedAt: existing?.statusChangedAt ?? null,
      statusNote: existing?.statusNote ?? "",
      usage: [...(existing?.usage ?? []), usage],
    };

    await writeApplication(application);
    return NextResponse.json({ application });
  } catch (err) {
    return errorResponse(err);
  }
}
