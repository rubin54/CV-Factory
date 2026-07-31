"use client";

import { useState } from "react";

import { CoverLetterDocument } from "@/components/CoverLetterDocument";
import { CvDocument } from "@/components/CvDocument";
import { DocumentPreview } from "@/components/CvEditor";
import { Button, Card, ErrorBanner } from "@/components/ui";
import { downloadPdf, postJson } from "@/lib/client-api";
import type { Application } from "@/lib/cv-schema";

export function ApplicationView({ initial }: { initial: Application }) {
  const [application, setApplication] = useState(initial);
  const [tab, setTab] = useState<"cv" | "letter">("cv");
  const [busy, setBusy] = useState<null | "letter" | "pdf-cv" | "pdf-letter" | "retailor">(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
        <DocumentPreview>
          {tab === "cv" ? (
            <CvDocument cv={application.cv} />
          ) : application.coverLetter ? (
            <CoverLetterDocument
              basics={application.cv.basics}
              letter={application.coverLetter}
              company={application.company}
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
