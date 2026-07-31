import { NextResponse } from "next/server";
import * as z from "zod";

import { errorResponse, parseBody } from "@/lib/api";
import { ApplicationStatusSchema } from "@/lib/cv-schema";
import { readApplication, writeApplication } from "@/lib/store";

export const runtime = "nodejs";

const BodySchema = z.object({
  slug: z.string().min(1),
  status: ApplicationStatusSchema,
  note: z.string(),
});

export async function PUT(req: Request) {
  try {
    const body = await parseBody(req, BodySchema);
    const application = await readApplication(body.slug);
    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updated = {
      ...application,
      status: body.status,
      // Only stamp on an actual change — editing the note should not make it
      // look as though the application moved on today.
      statusChangedAt:
        body.status === application.status ? application.statusChangedAt : now,
      statusNote: body.note,
      updatedAt: now,
    };

    await writeApplication(updated);
    return NextResponse.json({ application: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
