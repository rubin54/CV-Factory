import { NextResponse } from "next/server";
import * as z from "zod";

import { errorResponse, parseBody } from "@/lib/api";
import { listBackups, parseBackupTarget, restoreBackup } from "@/lib/store";

export const runtime = "nodejs";

/** Rejects anything that does not name a file inside `data/`. */
function requireTarget(raw: string | null) {
  const target = raw ? parseBackupTarget(raw) : null;
  if (!target) throw new Error(`Unbekanntes Ziel: ${JSON.stringify(raw)}`);
  return target;
}

export async function GET(req: Request) {
  try {
    const target = requireTarget(new URL(req.url).searchParams.get("target"));
    return NextResponse.json({ backups: await listBackups(target) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, z.object({ target: z.string(), stamp: z.string() }));
    const target = requireTarget(body.target);
    await restoreBackup(target, body.stamp);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
