"use client";

import { useCallback, useRef, useState } from "react";

import { useToast } from "@/components/app/Toast";
import { CvDocument } from "@/components/CvDocument";
import { DesignPanel } from "@/components/DesignPanel";
import { DocumentPreview } from "@/components/DocumentPreview";
import { PageFitBar } from "@/components/PageFitBar";
import { Button } from "@/components/ui";
import { downloadPdf, putJson } from "@/lib/client-api";
import type { Cv } from "@/lib/cv-schema";
import { TEMPLATES, pageContentHeightPx, type Design } from "@/lib/design";

const PREVIEW_SCALE = 0.8;

export function DesignStudio({
  cv,
  initialDesign,
  initialPhotoUrl,
}: {
  cv: Cv;
  initialDesign: Design;
  initialPhotoUrl: string | null;
}) {
  const toast = useToast();
  const [design, setDesign] = useState(initialDesign);
  const [saved, setSaved] = useState(initialDesign);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [pages, setPages] = useState(1);
  const [busy, setBusy] = useState<null | "save" | "pdf">(null);
  const docRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(design) !== JSON.stringify(saved);
  const pageHeight = pageContentHeightPx(design);

  const run = async (kind: "save" | "pdf", fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    run("save", async () => {
      await putJson("/api/design", { design });
      setSaved(design);
      toast.ok("In data/design.json gespeichert.");
    });

  const exportPdf = () =>
    run("pdf", async () => {
      if (dirty) throw new Error("Bitte zuerst speichern — das PDF liest die Datei.");
      const savedTo = await downloadPdf({ target: "master" });
      toast.ok(`PDF exportiert nach ${savedTo}`);
    });

  const handlePages = useCallback((value: number) => setPages(value), []);

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="primary" onClick={save} pending={busy === "save"} disabled={!dirty}>
            {dirty ? "Speichern" : "Gespeichert"}
          </Button>
          <Button onClick={exportPdf} pending={busy === "pdf"}>
            PDF
          </Button>
        </div>

        <DesignPanel
          design={design}
          onChange={setDesign}
          photoUrl={photoUrl}
          onPhotoChange={setPhotoUrl}
          previewCv={cv}
        />
      </div>

      <div className="sticky top-[57px] space-y-2 self-start pt-1">
        <PageFitBar
          label={TEMPLATES[design.template].label}
          pages={pages}
          design={design}
          docRef={docRef}
          pageHeight={pageHeight}
          scale={PREVIEW_SCALE}
          onApply={setDesign}
        />
        <div className="flex justify-center">
          <DocumentPreview
            scale={PREVIEW_SCALE}
            pageHeight={pageHeight}
            onPagesChange={handlePages}
            measureRef={docRef}
          >
            <CvDocument cv={cv} design={design} photoUrl={photoUrl} />
          </DocumentPreview>
        </div>
      </div>
    </div>
  );
}
