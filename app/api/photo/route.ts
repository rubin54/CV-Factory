import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api";
import { findPhoto, photoUrl, PHOTO_TYPES, removePhoto, writePhoto } from "@/lib/store";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Serves the photo from data/ — it lives outside public/ on purpose. */
export async function GET() {
  const photo = await findPhoto();
  if (!photo) return new NextResponse(null, { status: 404 });

  const data = await fs.readFile(photo.path);
  const extension = path.extname(photo.path).slice(1);

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME_BY_EXTENSION[extension] ?? "application/octet-stream",
      // The cache buster in the URL makes the response unique, so it may be
      // cached for a long time.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei empfangen." }, { status: 400 });
    }
    const extension = PHOTO_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: `Format ${file.type || "unbekannt"} wird nicht unterstützt — JPEG, PNG oder WebP.` },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Die Datei ist ${(file.size / 1024 / 1024).toFixed(1)} MB groß, erlaubt sind 5 MB.` },
        { status: 413 },
      );
    }

    await writePhoto(Buffer.from(await file.arrayBuffer()), extension);
    return NextResponse.json({ photoUrl: await photoUrl() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE() {
  try {
    await removePhoto();
    return NextResponse.json({ photoUrl: null });
  } catch (err) {
    return errorResponse(err);
  }
}
