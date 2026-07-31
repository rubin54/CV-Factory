"use client";

import { useState } from "react";

import Link from "next/link";
import { useCallback, useRef } from "react";

import { CoverLetterDocument } from "@/components/CoverLetterDocument";
import { CvDocument } from "@/components/CvDocument";
import { DesignPanel } from "@/components/DesignPanel";
import { DocumentPreview } from "@/components/DocumentPreview";
import { PageFitBar } from "@/components/PageFitBar";
import { Button, Card, ErrorBanner } from "@/components/ui";
import { downloadPdf, postJson, putJson } from "@/lib/client-api";
import type { Application } from "@/lib/cv-schema";
import { TEMPLATES, pageContentHeightPx, type Design } from "@/lib/design";

const PREVIEW_SCALE = 0.62;

export function ApplicationView({
  initial,
  globalDesign,
  photoUrl: initialPhotoUrl,
}: {
  initial: Application;
  globalDesign: Design;
  photoUrl: string | null;
}) {
  const [application, setApplication] = useState(initial);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [draftDesign, setDraftDesign] = useState<Design | null>(initial.design);
  const [editDesign, setEditDesign] = useState(false);
  const [tab, setTab] = useState<"cv" | "letter">("cv");
  const [busy, setBusy] = useState<
    null | "letter" | "pdf-cv" | "pdf-letter" | "retailor" | "design"
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pages, setPages] = useState(1);
  const docRef = useRef<HTMLDivElement>(null);
  const handlePages = useCallback((value: number) => setPages(value), []);

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
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

  const generateLetter = () =>
    run("letter", async () => {
      const { application: updated } = await postJson<{ application: Application }>(
        "/api/cover-letter",
        { slug: application.slug },
      );
      setApplication(updated);
      setTab("letter");
    });

  const retailor = () =>
    run("retailor", async () => {
      const { application: updated } = await postJson<{ application: Application }>(
        "/api/tailor",
        {
          slug: application.slug,
          company: application.company,
          role: application.role,
          jobPosting: application.jobPosting,
        },
      );
      setApplication(updated);
      setTab("cv");
      setNotice("Neu zugeschnitten. Ein vorheriges Anschreiben wurde verworfen.");
    });

  const exportPdf = (target: "cv" | "letter") =>
    run(target === "cv" ? "pdf-cv" : "pdf-letter", async () => {
      const savedTo = await downloadPdf({ target, slug: application.slug });
      setNotice(`PDF exportiert nach ${savedTo}`);
    });

  const saveDesign = (design: Design | null) =>
    run("design", async () => {
      const { application: updated } = await putJson<{ application: Application }>(
        "/api/design",
        { design, slug: application.slug },
      );
      setApplication(updated);
      setDraftDesign(design);
      setNotice(
        design
          ? "Design dieser Bewerbung gespeichert."
          : "Zurück auf den globalen Standard.",
      );
    });

  // Was gerade gerendert wird: der Entwurf im Panel, sonst das gespeicherte
  // Design der Bewerbung, sonst der globale Standard.
  const activeDesign = draftDesign ?? application.design ?? globalDesign;
  const designDirty =
    JSON.stringify(draftDesign) !== JSON.stringify(application.design);

  return (
    <div className="grid gap-6 xl:grid-cols-[520px_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={tab === "cv" ? "primary" : "secondary"}
            onClick={() => setTab("cv")}
          >
            Lebenslauf
          </Button>
          <Button
            variant={tab === "letter" ? "primary" : "secondary"}
            onClick={() => setTab("letter")}
            disabled={!application.coverLetter}
          >
            Anschreiben
          </Button>
        </div>
        <PageFitBar
          label={TEMPLATES[activeDesign.template].label}
          pages={pages}
          design={activeDesign}
          docRef={docRef}
          pageHeight={pageContentHeightPx(activeDesign)}
          scale={PREVIEW_SCALE}
          onApply={setDraftDesign}
        />
        <DocumentPreview
          scale={PREVIEW_SCALE}
          pageHeight={pageContentHeightPx(activeDesign)}
          onPagesChange={handlePages}
          measureRef={docRef}
        >
          {tab === "cv" ? (
            <CvDocument cv={application.cv} design={activeDesign} photoUrl={photoUrl} />
          ) : application.coverLetter ? (
            <CoverLetterDocument
              basics={application.cv.basics}
              letter={application.coverLetter}
              company={application.company}
              design={activeDesign}
            />
          ) : null}
        </DocumentPreview>
      </div>

      <div className="space-y-4">
        <ErrorBanner message={error} />
        {notice && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <Card title="Aktionen">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={generateLetter}
              pending={busy === "letter"}
            >
              {application.coverLetter ? "Anschreiben neu schreiben" : "Anschreiben schreiben"}
            </Button>
            <Button onClick={() => exportPdf("cv")} pending={busy === "pdf-cv"}>
              CV als PDF
            </Button>
            <Button
              onClick={() => exportPdf("letter")}
              pending={busy === "pdf-letter"}
              disabled={!application.coverLetter}
            >
              Anschreiben als PDF
            </Button>
            <Button onClick={retailor} pending={busy === "retailor"}>
              Neu zuschneiden
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            data/applications/{application.slug}.json
          </p>
        </Card>

        <Card
          title="Design"
          actions={
            <Button onClick={() => setEditDesign((value) => !value)}>
              {editDesign ? "Zuklappen" : "Anpassen"}
            </Button>
          }
        >
          <p className="text-sm text-slate-700">
            {application.design ? (
              <>
                Eigenes Design: <strong>{TEMPLATES[application.design.template].label}</strong>
              </>
            ) : (
              <>
                Folgt dem globalen Standard (
                <strong>{TEMPLATES[globalDesign.template].label}</strong>) — ändert sich
                mit, wenn du ihn unter{" "}
                <Link href="/design" className="underline underline-offset-2">
                  Design
                </Link>{" "}
                anpasst.
              </>
            )}
          </p>

          {editDesign && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() => saveDesign(draftDesign ?? activeDesign)}
                  pending={busy === "design"}
                  disabled={!designDirty && Boolean(application.design)}
                >
                  Für diese Bewerbung speichern
                </Button>
                {application.design && (
                  <Button
                    onClick={() => saveDesign(null)}
                    pending={busy === "design"}
                    title="Diese Bewerbung folgt wieder dem globalen Standard"
                  >
                    Auf Standard zurücksetzen
                  </Button>
                )}
              </div>
              <DesignPanel
                design={activeDesign}
                onChange={setDraftDesign}
                photoUrl={photoUrl}
                onPhotoChange={setPhotoUrl}
              />
            </div>
          )}
        </Card>

        <Card title="Was Claude geändert hat">
          <BulletList items={application.rationale} empty="Keine Begründung geliefert." />
        </Card>

        <Card title={`Lücken (${application.gaps.length})`}>
          <p className="mb-2 text-xs text-slate-500">
            Anforderungen ohne Beleg im Master-CV. Diese stehen bewusst nicht im
            Lebenslauf — hier entscheidest du, ob sich die Bewerbung lohnt oder ob dir
            ein Beleg nur im Master-CV fehlt.
          </p>
          {application.gaps.length === 0 ? (
            <p className="text-sm text-emerald-700">
              Keine — alle Anforderungen sind belegt.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {application.gaps.map((gap, i) => (
                <li
                  key={i}
                  className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-sm text-amber-900"
                >
                  {gap}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Belegte Begriffe aus der Anzeige">
          {application.matchedKeywords.length === 0 ? (
            <p className="text-sm text-slate-400">Keine.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {application.matchedKeywords.map((keyword, i) => (
                <span
                  key={i}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Stellenanzeige">
          <pre className="max-h-72 overflow-auto text-xs whitespace-pre-wrap text-slate-600">
            {application.jobPosting}
          </pre>
        </Card>
      </div>
    </div>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
