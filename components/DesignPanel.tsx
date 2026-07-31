"use client";

import { useRef, useState } from "react";

import { Button, Card, ErrorBanner } from "@/components/ui";
import {
  DENSITIES,
  DENSITY_IDS,
  FONT_PAIR_IDS,
  FONT_PAIRS,
  MARGIN_IDS,
  MARGINS,
  PALETTE_IDS,
  PALETTES,
  TEMPLATE_IDS,
  TEMPLATES,
  type Design,
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
        <div className="space-y-3">
          <Segmented
            label="Dichte"
            hint="Schriftgröße, Zeilenabstand und Abstände zwischen Abschnitten"
            options={DENSITY_IDS.map((id) => ({ id, label: DENSITIES[id].label }))}
            value={design.density}
            onChange={(value) => set("density", value)}
          />
          <Segmented
            label="Seitenrand"
            hint="Gilt im PDF für jede Seite"
            options={MARGIN_IDS.map((id) => ({
              id,
              label: `${MARGINS[id].label} (${MARGINS[id].mm} mm)`,
            }))}
            value={design.margin}
            onChange={(value) => set("margin", value)}
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

function Segmented<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-600">
        {label}
        {hint && <span className="ml-2 font-normal text-slate-400">{hint}</span>}
      </p>
      <div className="inline-flex rounded-md border border-slate-300 p-0.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded px-2.5 py-1 text-xs transition ${
              value === option.id
                ? "bg-slate-900 font-medium text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
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
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={design.showPhoto}
                  onChange={(e) => onToggle(e.target.checked)}
                />
                Im Lebenslauf anzeigen
              </label>
              <Segmented
                label="Form"
                options={[
                  { id: "eckig" as const, label: "Eckig" },
                  { id: "kreis" as const, label: "Rund" },
                ]}
                value={design.photoShape}
                onChange={onShapeChange}
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
