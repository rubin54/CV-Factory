import { NextResponse } from "next/server";
import * as z from "zod";

import { errorResponse, parseBody } from "@/lib/api";
import { CvSchema } from "@/lib/cv-schema";
import { readCv, writeCv } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ cv: await readCv() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request) {
  try {
    const { cv } = await parseBody(req, z.object({ cv: CvSchema }));
    await writeCv(cv);
    return NextResponse.json({ cv });
  } catch (err) {
    return errorResponse(err);
  }
}
