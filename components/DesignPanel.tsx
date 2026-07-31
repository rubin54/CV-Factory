"use client";

import { useRef, useState } from "react";

import { Tabs } from "@/components/app/Tabs";
import { useToast } from "@/components/app/Toast";
import { CvDocument } from "@/components/CvDocument";
import { Button, Card } from "@/components/ui";
import type { Cv } from "@/lib/cv-schema";
import {
  DENSITY_PRESETS,
  FONT_PAIR_IDS,
  FONT_PAIRS,
  MARGIN_PRESETS,
  PALETTE_IDS,
  PALETTES,
  SECTION_LABELS,
  TEMPLATE_IDS,
  TEMPLATES,
  normalizeSections,
  type Design,
  type SectionPlacement,
} from "@/lib/design";

type TabId = "vorlage" | "stil" | "layout" | "abschnitte" | "foto";

const TABS: { id: TabId; label: string }[] = [
  { id: "vorlage", label: "Vorlage" },
  { id: "stil", label: "Stil" },
  { id: "layout", label: "Layout" },
  { id: "abschnitte", label: "Abschnitte" },
  { id: "foto", label: "Foto" },
];

export function DesignPanel({
  design,
  onChange,
  photoUrl,
  onPhotoChange,
  previewCv,
}: {
  design: Design;
  onChange: (design: Design) => void;
  photoUrl: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
  /** Wenn gesetzt, werden die Vorlagen als gerenderte Miniaturen gezeigt. */
  previewCv?: Cv;
}) {
  const [tab, setTab] = useState<TabId>("vorlage");
  const set = <K extends keyof Design>(key: K, value: Design[K]) =>
    onChange({ ...design, [key]: value });

  return (
    <div className="space-y-3">
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "vorlage" && (
        <Card>
          {previewCv ? (
            <div className="grid grid-cols-2 gap-2.5">
              {TEMPLATE_IDS.map((id) => (
                <TemplateThumb
                  key={id}
                  id={id}
                  cv={previewCv}
                  design={design}
                  photoUrl={photoUrl}
                  active={design.template === id}
                  onSelect={() => set("template", id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {TEMPLATE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set("template", id)}
                  className={`block w-full rounded-md border p-2.5 text-left transition ${
                    design.template === id
                      ? "border-accent bg-accent-soft"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <span className="text-[13px] font-semibold">{TEMPLATES[id].label}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {TEMPLATES[id].description}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted">
            <span className="font-medium text-ink">{TEMPLATES[design.template].label}:</span>{" "}
            {TEMPLATES[design.template].description}
          </p>
          <p className="mt-1 text-xs text-faint">{TEMPLATES[design.template].atsNote}</p>
        </Card>
      )}

      {tab === "stil" && (
        <>
          <Card title="Akzentfarbe">
            <div className="flex flex-wrap gap-1.5">
              {PALETTE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set("palette", id)}
                  title={PALETTES[id].label}
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition ${
                    design.palette === id
                      ? "border-accent bg-accent-soft font-medium"
                      : "border-line text-muted hover:border-line-strong"
                  }`}
                >
                  <span
                    aria-hidden
                    className="size-3.5 rounded-full ring-1 ring-black/10"
                    style={{ background: PALETTES[id].accent }}
                  />
                  {PALETTES[id].label}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Schrift">
            <div className="grid gap-2 sm:grid-cols-2">
              {FONT_PAIR_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set("fontPair", id)}
                  className={`rounded-md border p-2 text-left transition ${
                    design.fontPair === id
                      ? "border-accent bg-accent-soft"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <span
                    className="block text-[15px] font-semibold"
                    style={{ fontFamily: `${FONT_PAIRS[id].display}, serif` }}
                  >
                    {FONT_PAIRS[id].label}
                  </span>
                  <span
                    className="mt-0.5 block text-[11px] text-muted"
                    style={{ fontFamily: `${FONT_PAIRS[id].body}, sans-serif` }}
                  >
                    {FONT_PAIRS[id].description}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Details">
            <div className="space-y-2 text-[13px]">
              <Toggle
                checked={design.showIcons}
                onChange={(v) => set("showIcons", v)}
                label="Symbole in Kontakt- und Linkzeilen"
                hint="Der Text daneben bleibt unverändert — Parser lesen weiterhin die Adresse."
              />
              <Toggle
                checked={design.showFooter}
                onChange={(v) => set("showFooter", v)}
                label="Fußzeile mit Stand-Datum"
              />
            </div>
          </Card>
        </>
      )}

      {tab === "layout" && (
        <Card title="Dichte & Ränder">
          <div className="mb-3 flex flex-wrap gap-1">
            {DENSITY_PRESETS.map((preset) => {
              const active =
                Math.abs(design.fontSize - preset.fontSize) < 0.06 &&
                Math.abs(design.lineHeight - preset.lineHeight) < 0.02;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...design,
                      fontSize: preset.fontSize,
                      lineHeight: preset.lineHeight,
                      spacing: preset.spacing,
                    })
                  }
                  className={`rounded border px-2 py-0.5 text-xs transition ${
                    active
                      ? "border-accent bg-accent text-accent-text"
                      : "border-line text-muted hover:border-line-strong"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            <Slider
              label="Schriftgröße"
              value={design.fontSize}
              min={7.5}
              max={13}
              step={0.05}
              format={(v) => `${v.toFixed(2)} pt`}
              onChange={(v) => set("fontSize", v)}
            />
            <Slider
              label="Zeilenabstand"
              value={design.lineHeight}
              min={1.15}
              max={1.8}
              step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => set("lineHeight", v)}
            />
            <Slider
              label="Abstände"
              value={design.spacing}
              min={0.5}
              max={1.8}
              step={0.01}
              format={(v) => `${Math.round(v * 100)} %`}
              onChange={(v) => set("spacing", v)}
            />
            <Slider
              label="Seitenrand"
              hint="gilt im PDF für jede Seite"
              value={design.margin}
              min={8}
              max={28}
              step={0.5}
              format={(v) => `${v} mm`}
              onChange={(v) => set("margin", v)}
            />
            <div className="flex flex-wrap gap-1">
              {MARGIN_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => set("margin", preset.mm)}
                  className="rounded border border-line px-2 py-0.5 text-xs text-muted transition hover:border-line-strong"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {tab === "abschnitte" && <SectionsCard design={design} onChange={onChange} />}

      {tab === "foto" && (
        <PhotoCard
          design={design}
          photoUrl={photoUrl}
          onPhotoChange={onPhotoChange}
          onShapeChange={(shape) => set("photoShape", shape)}
          onToggle={(showPhoto) => set("showPhoto", showPhoto)}
        />
      )}
    </div>
  );
}

/**
 * Gerenderte Miniatur einer Vorlage. Zeigt den echten Lebenslauf im echten
 * Layout — fünf Textabsätze sagen einem nicht, wie eine Vorlage aussieht.
 */
function TemplateThumb({
  id,
  cv,
  design,
  photoUrl,
  active,
  onSelect,
}: {
  id: Design["template"];
  cv: Cv;
  design: Design;
  photoUrl: string | null;
  active: boolean;
  onSelect: () => void;
}) {
  // Volle A4-Höhe, damit die Miniatur eine ganze Seite zeigt statt mittendrin
  // abzuschneiden — sonst sieht man vom Aufbau gerade das nicht, was ihn
  // unterscheidet.
  const SCALE = 0.23;
  return (
    <button
      type="button"
      onClick={onSelect}
      title={TEMPLATES[id].description}
      className={`overflow-hidden rounded-md border p-1 text-left transition ${
        active ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong"
      }`}
    >
      <span className="mb-1 block px-1 text-[11px] font-medium">{TEMPLATES[id].label}</span>
      <span
        className="block overflow-hidden rounded-sm bg-white"
        style={{ height: `${Math.round(1123 * SCALE)}px` }}
      >
        <span
          className="block origin-top-left"
          style={{ width: "794px", transform: `scale(${SCALE})` }}
        >
          <CvDocument cv={cv} design={{ ...design, template: id }} photoUrl={photoUrl} />
        </span>
      </span>
    </button>
  );
}

function SectionsCard({
  design,
  onChange,
}: {
  design: Design;
  onChange: (design: Design) => void;
}) {
  const sections = normalizeSections(design.sections);
  const hasAside = TEMPLATES[design.template].hasAside;

  const update = (next: SectionPlacement[]) => onChange({ ...design, sections: next });

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const patch = (index: number, changes: Partial<SectionPlacement>) =>
    update(sections.map((s, i) => (i === index ? { ...s, ...changes } : s)));

  return (
    <Card title="Abschnitte">
      <p className="mb-2.5 text-xs text-muted">
        {hasAside
          ? "Reihenfolge, Sichtbarkeit und ob ein Abschnitt in den Hauptteil oder die Seitenspalte gehört."
          : "Reihenfolge und Sichtbarkeit. Diese Vorlage ist einspaltig — die Spaltenzuordnung wirkt hier nicht."}
      </p>
      <ul className="space-y-1">
        {sections.map((section, index) => (
          <li
            key={section.id}
            className={`flex items-center gap-2 rounded border px-2 py-1.5 ${
              section.visible ? "border-line" : "border-line/60 bg-sunken/60"
            }`}
          >
            <input
              type="checkbox"
              checked={section.visible}
              onChange={(e) => patch(index, { visible: e.target.checked })}
              title="Anzeigen"
            />
            <span
              className={`flex-1 text-[13px] ${
                section.visible ? "" : "text-faint line-through"
              }`}
            >
              {SECTION_LABELS[section.id]}
            </span>

            {hasAside && (
              <div className="inline-flex overflow-hidden rounded border border-line text-[10px]">
                {(["main", "aside"] as const).map((column) => (
                  <button
                    key={column}
                    type="button"
                    onClick={() => patch(index, { column })}
                    className={`px-1.5 py-0.5 transition ${
                      section.column === column
                        ? "bg-accent text-accent-text"
                        : "text-muted hover:bg-sunken"
                    }`}
                  >
                    {column === "main" ? "Haupt" : "Spalte"}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="px-1 text-faint transition hover:text-ink disabled:opacity-25"
              title="Nach oben"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === sections.length - 1}
              className="px-1 text-faint transition hover:text-ink disabled:opacity-25"
              title="Nach unten"
            >
              ↓
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 flex items-baseline justify-between gap-2 text-[11px]">
        <span className="font-medium text-muted">
          {label}
          {hint && <span className="ml-1.5 font-normal text-faint">{hint}</span>}
        </span>
        <span className="font-mono text-faint tabular-nums">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--app-accent)]"
      />
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <span>
        <span className="block">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function PhotoCard({
  design,
  photoUrl,
  onPhotoChange,
  onShapeChange,
  onToggle,
}: {
  design: Design;
  photoUrl: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
  onShapeChange: (shape: Design["photoShape"]) => void;
  onToggle: (showPhoto: boolean) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  const upload = async (file: File) => {
    setPending(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/photo", { method: "POST", body: form });
      const body = (await res.json()) as { photoUrl?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      onPhotoChange(body.photoUrl ?? null);
      onToggle(true);
      toast.ok("Foto hochgeladen.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      await fetch("/api/photo", { method: "DELETE" });
      onPhotoChange(null);
      onToggle(false);
      toast.ok("Foto entfernt.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card title="Bewerbungsfoto">
      <p className="mb-3 text-xs text-muted">
        In Deutschland üblich, in den USA, UK und weiten Teilen Europas dagegen unerwünscht
        — dort kann ein Foto zur Aussortierung führen. Pro Bewerbung umschaltbar.
      </p>

      <div className="flex items-start gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Bewerbungsfoto"
            className={`size-20 shrink-0 object-cover ring-1 ring-line-strong ${
              design.photoShape === "kreis" ? "rounded-full" : "rounded"
            }`}
          />
        ) : (
          <div className="grid size-20 shrink-0 place-items-center rounded border border-dashed border-line-strong text-xs text-faint">
            keins
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={() => inputRef.current?.click()} pending={pending}>
              {photoUrl ? "Ersetzen" : "Hochladen"}
            </Button>
            {photoUrl && (
              <Button size="sm" variant="danger" onClick={remove} pending={pending}>
                Entfernen
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />

          {photoUrl && (
            <>
              <Toggle
                checked={design.showPhoto}
                onChange={onToggle}
                label="Im Lebenslauf anzeigen"
              />
              <div className="flex gap-1.5">
                {(["eckig", "kreis"] as const).map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => onShapeChange(shape)}
                    className={`rounded border px-2 py-0.5 text-xs transition ${
                      design.photoShape === shape
                        ? "border-accent bg-accent text-accent-text"
                        : "border-line text-muted hover:border-line-strong"
                    }`}
                  >
                    {shape === "eckig" ? "Eckig" : "Rund"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
