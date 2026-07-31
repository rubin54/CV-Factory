"use client";

import { useState } from "react";

import { CvDocument } from "@/components/CvDocument";
import { DesignPanel } from "@/components/DesignPanel";
import { DocumentPreview } from "@/components/DocumentPreview";
import { Button, ErrorBanner } from "@/components/ui";
import { downloadPdf, putJson } from "@/lib/client-api";
import type { Cv } from "@/lib/cv-schema";
import { TEMPLATE_IDS, TEMPLATES, type Design } from "@/lib/design";

export function DesignStudio({
  cv,
  initialDesign,
  initialPhotoUrl,
}: {
  cv: Cv;
  initialDesign: Design;
  initialPhotoUrl: string | null;
}) {
  const [design, setDesign] = useState(initialDesign);
  const [saved, setSaved] = useState(initialDesign);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [busy, setBusy] = useState<null | "save" | "pdf">(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);

  const dirty = JSON.stringify(design) !== JSON.stringify(saved);

  const run = async (kind: "save" | "pdf", fn: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    run("save", async () => {
      await putJson("/api/design", { design });
      setSaved(design);
      setNotice("In data/design.json gespeichert.");
    });

  const exportPdf = () =>
    run("pdf", async () => {
      if (dirty) throw new Error("Bitte zuerst speichern — das PDF liest die Datei.");
      const savedTo = await downloadPdf({ target: "master" });
      setNotice(`PDF exportiert nach ${savedTo}`);
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={save} pending={busy === "save"} disabled={!dirty}>
            {dirty ? "Speichern" : "Gespeichert"}
          </Button>
          <Button onClick={exportPdf} pending={busy === "pdf"}>
            Als PDF exportieren
          </Button>
          <Button onClick={() => setCompare((value) => !value)}>
            {compare ? "Einzelansicht" : "Vorlagen vergleichen"}
          </Button>
        </div>

        <ErrorBanner message={error} />
        {notice && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <DesignPanel
          design={design}
          onChange={setDesign}
          photoUrl={photoUrl}
          onPhotoChange={setPhotoUrl}
        />
      </div>

      <div>
        {compare ? (
          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {TEMPLATE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDesign({ ...design, template: id });
                  setCompare(false);
                }}
                className={`rounded-lg border p-2 text-left transition ${
                  design.template === id
                    ? "border-slate-800 bg-white"
                    : "border-transparent hover:border-slate-300"
                }`}
              >
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {TEMPLATES[id].label}
                </span>
                <DocumentPreview scale={0.38}>
                  <CvDocument
                    cv={cv}
                    design={{ ...design, template: id }}
                    photoUrl={photoUrl}
                  />
                </DocumentPreview>
              </button>
            ))}
          </div>
        ) : (
          <div className="sticky top-4">
            <p className="mb-2 text-xs font-medium text-slate-500">
              Live-Vorschau · {TEMPLATES[design.template].label}
            </p>
            <DocumentPreview scale={0.78}>
              <CvDocument cv={cv} design={design} photoUrl={photoUrl} />
            </DocumentPreview>
          </div>
        )}
      </div>
    </div>
  );
}
