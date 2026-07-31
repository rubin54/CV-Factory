"use client";

import { useRef, useState } from "react";

import { Button, Card, ErrorBanner } from "@/components/ui";
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

export function DesignPanel({
  design,
  onChange,
  photoUrl,
  onPhotoChange,
}: {
  design: Design;
  onChange: (design: Design) => void;
  photoUrl: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
}) {
  const set = <K extends keyof Design>(key: K, value: Design[K]) =>
    onChange({ ...design, [key]: value });

  return (
    <div className="space-y-4">
      <Card title="Vorlage">
        <div className="space-y-2">
          {TEMPLATE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => set("template", id)}
              className={`block w-full rounded-md border p-3 text-left transition ${
                design.template === id
                  ? "border-slate-800 bg-slate-50"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <span className="text-sm font-semibold text-slate-800">
                {TEMPLATES[id].label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-600">
                {TEMPLATES[id].description}
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                {TEMPLATES[id].atsNote}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Akzentfarbe">
        <div className="flex flex-wrap gap-2">
          {PALETTE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => set("palette", id)}
              title={PALETTES[id].label}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition ${
                design.palette === id
                  ? "border-slate-800 bg-slate-50 font-medium text-slate-900"
                  : "border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              <span
                aria-hidden
                className="size-4 rounded-full ring-1 ring-black/10"
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
              className={`rounded-md border p-2.5 text-left transition ${
                design.fontPair === id
                  ? "border-slate-800 bg-slate-50"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <span
                className="block text-base font-semibold text-slate-900"
                style={{ fontFamily: `${FONT_PAIRS[id].display}, serif` }}
              >
                {FONT_PAIRS[id].label}
              </span>
              <span
                className="mt-0.5 block text-xs text-slate-600"
                style={{ fontFamily: `${FONT_PAIRS[id].body}, sans-serif` }}
              >
                {FONT_PAIRS[id].description}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Dichte & Ränder">
        <div className="mb-3 flex flex-wrap gap-1.5">
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
                className={`rounded border px-2 py-1 text-xs transition ${
                  active
                    ? "border-slate-800 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
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
          <div className="flex flex-wrap gap-1.5">
            {MARGIN_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => set("margin", preset.mm)}
                className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:border-slate-400"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <SectionsCard design={design} onChange={onChange} />

      <Card title="Details">
        <div className="space-y-2 text-sm text-slate-700">
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

      <PhotoCard
        design={design}
        photoUrl={photoUrl}
        onPhotoChange={onPhotoChange}
        onShapeChange={(shape) => set("photoShape", shape)}
        onToggle={(showPhoto) => set("showPhoto", showPhoto)}
      />
    </div>
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
      <p className="mb-3 text-xs text-slate-500">
        Reihenfolge und Sichtbarkeit.{" "}
        {hasAside
          ? "Bei dieser Vorlage entscheidet zusätzlich, ob ein Abschnitt in den Hauptteil oder die Seitenspalte gehört."
          : "Diese Vorlage ist einspaltig — die Spaltenzuordnung wirkt hier nicht."}
      </p>
      <ul className="space-y-1">
        {sections.map((section, index) => (
          <li
            key={section.id}
            className={`flex items-center gap-2 rounded border px-2 py-1.5 ${
              section.visible ? "border-slate-200" : "border-slate-100 bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={section.visible}
              onChange={(e) => patch(index, { visible: e.target.checked })}
              title="Anzeigen"
            />
            <span
              className={`flex-1 text-sm ${
                section.visible ? "text-slate-800" : "text-slate-400 line-through"
              }`}
            >
              {SECTION_LABELS[section.id]}
            </span>

            {hasAside && (
              <div className="inline-flex overflow-hidden rounded border border-slate-200 text-[11px]">
                {(["main", "aside"] as const).map((column) => (
                  <button
                    key={column}
                    type="button"
                    onClick={() => patch(index, { column })}
                    className={`px-1.5 py-0.5 transition ${
                      section.column === column
                        ? "bg-slate-800 text-white"
                        : "text-slate-500 hover:bg-slate-100"
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
              className="px-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
              title="Nach oben"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === sections.length - 1}
              className="px-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
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
      <span className="mb-0.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-slate-600">
          {label}
          {hint && <span className="ml-1.5 font-normal text-slate-400">{hint}</span>}
        </span>
        <span className="font-mono text-slate-500 tabular-nums">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-slate-800"
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
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/photo", { method: "POST", body: form });
      const body = (await res.json()) as { photoUrl?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      onPhotoChange(body.photoUrl ?? null);
      onToggle(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    setError(null);
    try {
      await fetch("/api/photo", { method: "DELETE" });
      onPhotoChange(null);
      onToggle(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card title="Bewerbungsfoto">
      <p className="mb-3 text-xs text-slate-500">
        In Deutschland üblich, in den USA, UK und weiten Teilen Europas dagegen unerwünscht
        — dort kann ein Foto zur Aussortierung führen. Pro Bewerbung umschaltbar.
      </p>
      <ErrorBanner message={error} />

      <div className="mt-2 flex items-start gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Bewerbungsfoto"
            className={`size-20 shrink-0 object-cover ring-1 ring-slate-200 ${
              design.photoShape === "kreis" ? "rounded-full" : "rounded"
            }`}
          />
        ) : (
          <div className="grid size-20 shrink-0 place-items-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
            keins
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => inputRef.current?.click()} pending={pending}>
              {photoUrl ? "Ersetzen" : "Hochladen"}
            </Button>
            {photoUrl && (
              <Button variant="danger" onClick={remove} pending={pending}>
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
                        ? "border-slate-800 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-400"
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
