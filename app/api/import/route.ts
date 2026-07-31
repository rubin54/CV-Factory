import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api";
import { importCv } from "@/lib/claude";
import { readCv } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Well below the API's 32 MB limit. A CV that is bigger than this is a scan at
 * needlessly high resolution, and every megabyte costs tokens and time.
 */
const MAX_BYTES = 10 * 1024 * 1024;

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Existing CV -> CV schema. Like `/api/extract` this deliberately does not
 * save: the result comes back for review and you accept it.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Die Datei ist leer." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Die Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB, erlaubt sind 10 MB).` },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    const existing = await readCv();

    let result;
    if (file.type === "application/pdf" || name.endsWith(".pdf")) {
      // Goes to the API unchanged — Claude reads the layout itself.
      result = await importCv({ pdfBase64: buffer.toString("base64") }, existing);
    } else if (file.type === DOCX_TYPE || name.endsWith(".docx")) {
      const text = await docxToText(buffer);
      if (!text.trim()) {
        return NextResponse.json(
          { error: "Aus der DOCX ließ sich kein Text lesen. Speichere sie als PDF und versuche es damit." },
          { status: 422 },
        );
      }
      result = await importCv({ text }, existing);
    } else if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
      result = await importCv({ text: buffer.toString("utf8") }, existing);
    } else {
      return NextResponse.json(
        { error: `${file.name}: PDF, DOCX oder Text — ein anderes Format kann ich nicht lesen.` },
        { status: 415 },
      );
    }

    return NextResponse.json({ cv: result.data, usage: result.usage });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * DOCX has no document block type in the API, so the text has to come out here.
 * mammoth reads the document structure rather than just unzipping the XML, so
 * headings and lists survive as line breaks instead of collapsing into one line.
 */
async function docxToText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}
