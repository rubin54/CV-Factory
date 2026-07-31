import { NextResponse } from "next/server";
import * as z from "zod";

import { errorResponse, parseBody } from "@/lib/api";
import { writeCoverLetter } from "@/lib/claude";
import { readApplication, writeApplication } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z.object({ slug: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const { slug } = await parseBody(req, BodySchema);
    const application = await readApplication(slug);
    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
    }

    const coverLetter = await writeCoverLetter(
      application.cv,
      application.jobPosting,
      application.company,
      application.role,
    );

    const updated = {
      ...application,
      coverLetter,
      updatedAt: new Date().toISOString(),
    };
    await writeApplication(updated);
    return NextResponse.json({ application: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
