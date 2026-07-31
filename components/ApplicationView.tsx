"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { useToast } from "@/components/app/Toast";
import { CoverLetterDocument } from "@/components/CoverLetterDocument";
import { CvDocument } from "@/components/CvDocument";
import { DesignPanel } from "@/components/DesignPanel";
import { DocumentPreview } from "@/components/DocumentPreview";
import { PageFitBar } from "@/components/PageFitBar";
import { Button, Card, EmptyState } from "@/components/ui";
import { downloadPdf, postJson, putJson } from "@/lib/client-api";
import type { Application } from "@/lib/cv-schema";
import { TEMPLATES, pageContentHeightPx, type Design } from "@/lib/design";

const PREVIEW_SCALE = 0.64;

export function ApplicationView({
  initial,
  globalDesign,
  photoUrl: initialPhotoUrl,
}: {
  initial: Application;
  globalDesign: Design;
  photoUrl: string | null;
}) {
  const toast = useToast();
  const [application, setApplication] = useState(initial);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [draftDesign, setDraftDesign] = useState<Design | null>(initial.design);
  const [editDesign, setEditDesign] = useState(false);
  const [tab, setTab] = useState<"cv" | "letter">("cv");
  const [pages, setPages] = useState(1);
  const [busy, setBusy] = useState<
    null | "letter" | "pdf-cv" | "pdf-letter" | "retailor" | "design"
  >(null);
  const docRef = useRef<HTMLDivElement>(null);
  const handlePages = useCallback((value: number) => setPages(value), []);

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
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
      toast.ok("Anschreiben erzeugt.");
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
      toast.ok("Neu zugeschnitten. Ein vorheriges Anschreiben wurde verworfen.");
    });

  const exportPdf = (target: "cv" | "letter") =>
    run(target === "cv" ? "pdf-cv" : "pdf-letter", async () => {
      const savedTo = await downloadPdf({ target, slug: application.slug });
      toast.ok(`PDF exportiert nach ${savedTo}`);
    });

  const saveDesign = (design: Design | null) =>
    run("design", async () => {
      const { application: updated } = await putJson<{ application: Application }>(
        "/api/design",
        { design, slug: application.slug },
      );
      setApplication(updated);
      setDraftDesign(design);
      toast.ok(
        design ? "Design dieser Bewerbung gespeichert." : "Zurück auf den globalen Standard.",
      );
    });

  // What is being rendered right now: the draft in the panel, otherwise the
  // application's saved design, otherwise the global default.
  const activeDesign = draftDesign ?? application.design ?? globalDesign;
  const designDirty = JSON.stringify(draftDesign) !== JSON.stringify(application.design);

  return (
    <div className="grid gap-5 xl:grid-cols-[540px_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex overflow-hidden rounded-md border border-line-strong">
            {(["cv", "letter"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                disabled={id === "letter" && !application.coverLetter}
                className={`px-2.5 py-1.5 text-[13px] font-medium transition disabled:opacity-40 ${
                  tab === id ? "bg-accent text-accent-text" : "bg-surface text-muted hover:bg-sunken"
                }`}
              >
                {id === "cv" ? "Lebenslauf" : "Anschreiben"}
              </button>
            ))}
          </div>
        </div>

        {tab === "cv" && (
          <PageFitBar
            label={TEMPLATES[activeDesign.template].label}
            pages={pages}
            design={activeDesign}
            docRef={docRef}
            pageHeight={pageContentHeightPx(activeDesign)}
            scale={PREVIEW_SCALE}
            onApply={setDraftDesign}
          />
        )}

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

      <div className="space-y-3">
        <Card title="Aktionen">
          <div className="flex flex-wrap gap-1.5">
            <Button variant="primary" onClick={generateLetter} pending={busy === "letter"}>
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
          <p className="mt-2.5 font-mono text-[11px] text-faint">
            data/applications/{application.slug}.json
          </p>
        </Card>

        <Card
          title="Design"
          actions={
            <Button size="sm" onClick={() => setEditDesign((v) => !v)}>
              {editDesign ? "Zuklappen" : "Anpassen"}
            </Button>
          }
        >
          <p className="text-[13px] text-muted">
            {application.design ? (
              <>
                Eigenes Design:{" "}
                <strong className="text-ink">
                  {TEMPLATES[application.design.template].label}
                </strong>
              </>
            ) : (
              <>
                Folgt dem globalen Standard (
                <strong className="text-ink">{TEMPLATES[globalDesign.template].label}</strong>
                ) — ändert sich mit, wenn du ihn unter{" "}
                <Link href="/design" className="underline underline-offset-2">
                  Design
                </Link>{" "}
                anpasst.
              </>
            )}
          </p>

          {editDesign && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => saveDesign(draftDesign ?? activeDesign)}
                  pending={busy === "design"}
                  disabled={!designDirty && Boolean(application.design)}
                >
                  Für diese Bewerbung speichern
                </Button>
                {application.design && (
                  <Button
                    size="sm"
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
                previewCv={application.cv}
              />
            </div>
          )}
        </Card>

        <Card title="Was Claude geändert hat" collapsible>
          {application.rationale.length === 0 ? (
            <p className="text-[13px] text-faint">Keine Begründung geliefert.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-[13px]">
              {application.rationale.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Lücken · ${application.gaps.length}`} collapsible>
          <p className="mb-2 text-xs text-muted">
            Anforderungen ohne Beleg im Master-CV. Diese stehen bewusst nicht im Lebenslauf —
            hier entscheidest du, ob sich die Bewerbung lohnt oder ob dir ein Beleg nur im
            Master-CV fehlt.
          </p>
          {application.gaps.length === 0 ? (
            <p className="text-[13px] text-ok">Keine — alle Anforderungen sind belegt.</p>
          ) : (
            <ul className="space-y-1">
              {application.gaps.map((gap, i) => (
                <li
                  key={i}
                  className="rounded border border-warn/25 bg-warn-soft px-2.5 py-1.5 text-[13px] text-warn"
                >
                  {gap}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Belegte Begriffe aus der Anzeige" collapsible defaultOpen={false}>
          {application.matchedKeywords.length === 0 ? (
            <EmptyState title="Keine Begriffe erfasst." />
          ) : (
            <div className="flex flex-wrap gap-1">
              {application.matchedKeywords.map((keyword, i) => (
                <span
                  key={i}
                  className="rounded border border-line bg-sunken px-1.5 py-0.5 text-[11px] text-muted"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Stellenanzeige" collapsible defaultOpen={false}>
          <pre className="max-h-72 overflow-auto text-[11px] leading-relaxed whitespace-pre-wrap text-muted">
            {application.jobPosting}
          </pre>
        </Card>
      </div>
    </div>
  );
}
