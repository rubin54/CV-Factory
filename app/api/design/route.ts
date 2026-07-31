import { NextResponse } from "next/server";
import * as z from "zod";

import { errorResponse, parseBody } from "@/lib/api";
import { DesignSchema } from "@/lib/design";
import { readApplication, readDesign, writeApplication, writeDesign } from "@/lib/store";

export const runtime = "nodejs";

const BodySchema = z.object({
  design: DesignSchema.nullable(),
  /** Gesetzt: Design nur für diese Bewerbung. Fehlt: globaler Standard. */
  slug: z.string().nullish(),
});

export async function GET() {
  try {
    return NextResponse.json({ design: await readDesign() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request) {
  try {
    const { design, slug } = await parseBody(req, BodySchema);

    if (!slug) {
      if (!design) {
        return NextResponse.json(
          { error: "Der globale Standard lässt sich nicht auf null setzen." },
          { status: 400 },
        );
      }
      await writeDesign(design);
      return NextResponse.json({ design });
    }

    const application = await readApplication(slug);
    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
    }

    // design === null hebt die Abweichung auf: die Bewerbung folgt wieder dem
    // globalen Standard und ändert sich mit, wenn der sich ändert.
    const updated = { ...application, design, updatedAt: new Date().toISOString() };
    await writeApplication(updated);
    return NextResponse.json({ application: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
