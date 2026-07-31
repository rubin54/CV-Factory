import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import * as z from "zod";

import { errorResponse, parseBody } from "@/lib/api";
import { assertSafeSlug, EXPORT_DIR, readApplication } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z.discriminatedUnion("target", [
  z.object({ target: z.literal("master") }),
  z.object({ target: z.literal("cv"), slug: z.string().min(1) }),
  z.object({ target: z.literal("letter"), slug: z.string().min(1) }),
]);

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, BodySchema);
    const origin = new URL(req.url).origin;

    let previewPath: string;
    let filename: string;

    if (body.target === "master") {
      previewPath = "/preview/cv";
      filename = "lebenslauf.pdf";
    } else {
      const slug = assertSafeSlug(body.slug);
      const application = await readApplication(slug);
      if (!application) {
        return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
      }
      if (body.target === "letter" && !application.coverLetter) {
        return NextResponse.json(
          { error: "Für diese Bewerbung gibt es noch kein Anschreiben." },
          { status: 409 },
        );
      }
      previewPath =
        body.target === "cv" ? `/preview/application/${slug}` : `/preview/letter/${slug}`;
      filename =
        body.target === "cv" ? `${slug}-lebenslauf.pdf` : `${slug}-anschreiben.pdf`;
    }

    const pdf = await renderPdf(`${origin}${previewPath}`);

    // Zusätzlich zur Download-Antwort auf die Platte, damit man Versionen
    // vergleichen kann ohne jedes Mal neu zu exportieren.
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const savedTo = path.join(EXPORT_DIR, filename);
    await fs.writeFile(savedTo, pdf);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Path": path.relative(process.cwd(), savedTo),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

async function renderPdf(url: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
    if (!response || !response.ok()) {
      throw new Error(
        `Vorschauseite ${url} konnte nicht geladen werden (Status ${response?.status() ?? "?"}).`,
      );
    }
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      // Ränder kommen von hier statt aus dem CSS, damit sie auf jeder Seite
      // greifen und nicht nur oben auf Seite 1.
      margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
