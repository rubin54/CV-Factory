"use client";

import Link from "next/link";
import { useState } from "react";

import { useToast } from "@/components/app/Toast";
import { CvDocument } from "@/components/CvDocument";
import { DocumentPreview } from "@/components/DocumentPreview";
import { Button, Card, Field, Repeatable, StringList, TextArea } from "@/components/ui";
import { downloadPdf, postJson, putJson } from "@/lib/client-api";
import type { Cv } from "@/lib/cv-schema";
import { TEMPLATES, pageContentHeightPx, type Design } from "@/lib/design";

/** Sprungziele der Editorkarten — Reihenfolge wie im Formular. */
const ANCHORS = [
  ["notizen", "Notizen"],
  ["basis", "Basis"],
  ["links", "Links"],
  ["erfahrung", "Erfahrung"],
  ["projekte", "Projekte"],
  ["kenntnisse", "Kenntnisse"],
  ["ausbildung", "Ausbildung"],
  ["zertifikate", "Zertifikate"],
  ["sprachen", "Sprachen"],
] as const;

export function CvEditor({
  initialCv,
  design,
  photoUrl,
}: {
  initialCv: Cv;
  design: Design;
  photoUrl: string | null;
}) {
  const toast = useToast();
  const [cv, setCv] = useState<Cv>(initialCv);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "extract" | "pdf">(null);
  const [notes, setNotes] = useState("");
  const [pages, setPages] = useState(1);

  const update = (patch: Partial<Cv>) => {
    setCv((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const run = async (kind: "save" | "extract" | "pdf", fn: () => Promise<void>) => {
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
      await putJson("/api/cv", { cv });
      setDirty(false);
      toast.ok("In data/cv.json gespeichert.");
    });

  const extract = () =>
    run("extract", async () => {
      const { cv: merged } = await postJson<{ cv: Cv }>("/api/extract", { rawText: notes });
      setCv(merged);
      setDirty(true);
      setNotes("");
      toast.ok("Notizen eingearbeitet — bitte durchsehen und dann speichern.");
    });

  const exportPdf = () =>
    run("pdf", async () => {
      if (dirty) throw new Error("Bitte zuerst speichern — das PDF liest die Datei.");
      const savedTo = await downloadPdf({ target: "master" });
      toast.ok(`PDF exportiert nach ${savedTo}`);
    });

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_540px]">
      <div className="min-w-0 space-y-3">
        <div className="sticky top-[57px] z-10 -mx-1 flex flex-wrap items-center gap-x-3 gap-y-2 bg-app/90 px-1 py-2 backdrop-blur">
          <Button variant="primary" onClick={save} pending={busy === "save"} disabled={!dirty}>
            {dirty ? "Speichern" : "Gespeichert"}
          </Button>
          <Button onClick={exportPdf} pending={busy === "pdf"}>
            PDF
          </Button>
          <Link
            href="/preview/cv"
            target="_blank"
            className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Vorschau ↗
          </Link>

          <nav className="flex flex-1 flex-wrap justify-end gap-0.5">
            {ANCHORS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded px-1.5 py-0.5 text-[11px] text-faint transition hover:bg-sunken hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <Card
          id="notizen"
          title="Notizen einwerfen"
          collapsible
          actions={
            <Button
              variant="primary"
              size="sm"
              onClick={extract}
              pending={busy === "extract"}
              disabled={notes.trim().length === 0}
            >
              Einarbeiten
            </Button>
          }
        >
          <p className="mb-2 text-xs text-muted">
            Unsortierter Text — Stationen, Aufgaben, Zahlen. Claude ordnet das in die Felder
            unten ein und ergänzt den bestehenden Stand, statt ihn zu ersetzen. Nichts wird
            dabei erfunden.
          </p>
          <TextArea
            label="Notizen"
            rows={5}
            value={notes}
            onChange={setNotes}
            placeholder="2021–2024 Backend bei Acme, Node/Postgres, Team von 3 …"
          />
        </Card>

        <Card id="basis" title="Basisdaten" collapsible>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Name"
              value={cv.basics.fullName}
              onChange={(v) => update({ basics: { ...cv.basics, fullName: v } })}
            />
            <Field
              label="Berufsbezeichnung"
              value={cv.basics.headline}
              onChange={(v) => update({ basics: { ...cv.basics, headline: v } })}
            />
            <Field
              label="E-Mail"
              value={cv.basics.email}
              onChange={(v) => update({ basics: { ...cv.basics, email: v } })}
            />
            <Field
              label="Telefon"
              value={cv.basics.phone ?? ""}
              onChange={(v) => update({ basics: { ...cv.basics, phone: v || null } })}
            />
            <Field
              label="Ort"
              value={cv.basics.location ?? ""}
              onChange={(v) => update({ basics: { ...cv.basics, location: v || null } })}
            />
          </div>
          <div className="mt-3">
            <TextArea
              label="Kurzprofil"
              rows={3}
              value={cv.basics.summary}
              onChange={(v) => update({ basics: { ...cv.basics, summary: v } })}
            />
          </div>
        </Card>

        <Repeatable
          id="links"
          label="Links"
          items={cv.basics.links}
          onChange={(links) => update({ basics: { ...cv.basics, links } })}
          create={() => ({ label: "", url: "" })}
          summary={(link) => link.label || link.url}
          render={(link, patch) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Bezeichnung"
                value={link.label}
                onChange={(v) => patch({ label: v })}
              />
              <Field label="URL" value={link.url} onChange={(v) => patch({ url: v })} />
            </div>
          )}
        />

        <Repeatable
          id="erfahrung"
          label="Berufserfahrung"
          items={cv.experience}
          onChange={(experience) => update({ experience })}
          create={() => ({
            company: "",
            role: "",
            location: null,
            startDate: "",
            endDate: null,
            summary: null,
            bullets: [],
            technologies: [],
          })}
          summary={(job) => [job.role, job.company].filter(Boolean).join(" · ")}
          render={(job, patch) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Rolle" value={job.role} onChange={(v) => patch({ role: v })} />
                <Field
                  label="Firma"
                  value={job.company}
                  onChange={(v) => patch({ company: v })}
                />
                <Field
                  label="Von (YYYY-MM)"
                  value={job.startDate}
                  onChange={(v) => patch({ startDate: v })}
                  placeholder="2021-03"
                />
                <Field
                  label="Bis (leer = bis heute)"
                  value={job.endDate ?? ""}
                  onChange={(v) => patch({ endDate: v || null })}
                  placeholder="2024-09"
                />
                <Field
                  label="Ort"
                  value={job.location ?? ""}
                  onChange={(v) => patch({ location: v || null })}
                />
              </div>
              <TextArea
                label="Kontext (optional)"
                rows={2}
                value={job.summary ?? ""}
                onChange={(v) => patch({ summary: v || null })}
              />
              <StringList
                label="Stichpunkte"
                rows={5}
                values={job.bullets}
                onChange={(bullets) => patch({ bullets })}
              />
              <StringList
                label="Technologien"
                rows={2}
                values={job.technologies}
                onChange={(technologies) => patch({ technologies })}
              />
            </>
          )}
        />

        <Repeatable
          id="projekte"
          label="Projekte"
          items={cv.projects}
          onChange={(projects) => update({ projects })}
          create={() => ({ name: "", description: "", url: null, technologies: [] })}
          summary={(project) => project.name}
          render={(project, patch) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" value={project.name} onChange={(v) => patch({ name: v })} />
                <Field
                  label="URL"
                  value={project.url ?? ""}
                  onChange={(v) => patch({ url: v || null })}
                />
              </div>
              <TextArea
                label="Beschreibung"
                rows={3}
                value={project.description}
                onChange={(v) => patch({ description: v })}
              />
              <StringList
                label="Technologien"
                rows={2}
                values={project.technologies}
                onChange={(technologies) => patch({ technologies })}
              />
            </>
          )}
        />

        <Repeatable
          id="kenntnisse"
          label="Kenntnisse"
          items={cv.skills}
          onChange={(skills) => update({ skills })}
          create={() => ({ category: "", items: [] })}
          summary={(group) => group.category}
          render={(group, patch) => (
            <>
              <Field
                label="Kategorie"
                value={group.category}
                onChange={(v) => patch({ category: v })}
                placeholder="Sprachen, Cloud & DevOps, …"
              />
              <StringList
                label="Einträge"
                rows={3}
                values={group.items}
                onChange={(items) => patch({ items })}
              />
            </>
          )}
        />

        <Repeatable
          id="ausbildung"
          label="Ausbildung"
          items={cv.education}
          onChange={(education) => update({ education })}
          create={() => ({
            institution: "",
            degree: "",
            field: null,
            startDate: null,
            endDate: null,
            details: [],
          })}
          summary={(entry) => [entry.degree, entry.institution].filter(Boolean).join(" · ")}
          render={(entry, patch) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Abschluss"
                  value={entry.degree}
                  onChange={(v) => patch({ degree: v })}
                  placeholder="B.Sc."
                />
                <Field
                  label="Fachrichtung"
                  value={entry.field ?? ""}
                  onChange={(v) => patch({ field: v || null })}
                />
                <Field
                  label="Institution"
                  value={entry.institution}
                  onChange={(v) => patch({ institution: v })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Von"
                    value={entry.startDate ?? ""}
                    onChange={(v) => patch({ startDate: v || null })}
                    placeholder="2017-10"
                  />
                  <Field
                    label="Bis"
                    value={entry.endDate ?? ""}
                    onChange={(v) => patch({ endDate: v || null })}
                    placeholder="2021-03"
                  />
                </div>
              </div>
              <StringList
                label="Details"
                rows={3}
                values={entry.details}
                onChange={(details) => patch({ details })}
              />
            </>
          )}
        />

        <Repeatable
          id="zertifikate"
          label="Zertifikate"
          items={cv.certifications}
          onChange={(certifications) => update({ certifications })}
          create={() => ({ name: "", issuer: null, date: null })}
          summary={(cert) => cert.name}
          render={(cert, patch) => (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Name" value={cert.name} onChange={(v) => patch({ name: v })} />
              <Field
                label="Aussteller"
                value={cert.issuer ?? ""}
                onChange={(v) => patch({ issuer: v || null })}
              />
              <Field
                label="Datum"
                value={cert.date ?? ""}
                onChange={(v) => patch({ date: v || null })}
                placeholder="2023-06"
              />
            </div>
          )}
        />

        <Repeatable
          id="sprachen"
          label="Sprachen"
          items={cv.languages}
          onChange={(languages) => update({ languages })}
          create={() => ({ name: "", level: "" })}
          summary={(lang) => [lang.name, lang.level].filter(Boolean).join(" · ")}
          render={(lang, patch) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Sprache" value={lang.name} onChange={(v) => patch({ name: v })} />
              <Field
                label="Niveau"
                value={lang.level}
                onChange={(v) => patch({ level: v })}
                placeholder="Muttersprache, C1, …"
              />
            </div>
          )}
        />
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-[57px] space-y-2 pt-2">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-muted">
              Vorschau · {TEMPLATES[design.template].label}
              <span
                className={`ml-2 rounded px-1.5 py-0.5 font-medium ${
                  pages === 1 ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
                }`}
              >
                {pages} {pages === 1 ? "Seite" : "Seiten"}
              </span>
            </span>
            <Link href="/design" className="text-muted underline-offset-2 hover:underline">
              Design ändern
            </Link>
          </div>
          <DocumentPreview
            scale={0.64}
            pageHeight={pageContentHeightPx(design)}
            onPagesChange={setPages}
          >
            <CvDocument cv={cv} design={design} photoUrl={photoUrl} />
          </DocumentPreview>
        </div>
      </aside>
    </div>
  );
}
