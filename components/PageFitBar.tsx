"use client";

import { useState, type RefObject } from "react";

import { Button } from "@/components/ui";
import { autoFit } from "@/lib/autofit";
import type { Design } from "@/lib/design";

/**
 * Zeigt die Seitenzahl und bietet den Auto-Fit an. Ohne das sieht man erst im
 * exportierten PDF, ob man auf einer Seite landet.
 */
export function PageFitBar({
  label,
  pages,
  design,
  docRef,
  pageHeight,
  scale,
  onApply,
}: {
  label: string;
  pages: number;
  design: Design;
  docRef: RefObject<HTMLDivElement | null>;
  pageHeight: number;
  scale: number;
  onApply: (design: Design) => void;
}) {
  const [note, setNote] = useState<string | null>(null);

  const fit = (targetPages: number) => {
    const node = docRef.current;
    if (!node) return;

    const result = autoFit({ node, design, pageHeight, scale, targetPages });
    onApply({
      ...design,
      fontSize: result.fontSize,
      lineHeight: result.lineHeight,
      spacing: result.spacing,
    });

    setNote(
      result.fits
        ? `Passt auf ${targetPages === 1 ? "eine Seite" : `${targetPages} Seiten`} bei ${result.fontSize.toFixed(2)} pt.`
        : `Passt auch bei kleinster Schrift nicht auf ${targetPages === 1 ? "eine Seite" : `${targetPages} Seiten`} — es sind ${result.pages}. Kürze Inhalte oder blende einen Abschnitt aus.`,
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium text-slate-500">Vorschau · {label}</span>
      <span
        className={`rounded px-1.5 py-0.5 font-medium ${
          pages === 1 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
        }`}
      >
        {pages} {pages === 1 ? "Seite" : "Seiten"}
      </span>

      <span className="ml-auto flex items-center gap-1.5">
        <Button
          onClick={() => {
            setNote(null);
            fit(1);
          }}
        >
          Auf 1 Seite
        </Button>
        <Button
          onClick={() => {
            setNote(null);
            fit(2);
          }}
        >
          Auf 2
        </Button>
      </span>

      {note && <p className="basis-full text-slate-500">{note}</p>}
    </div>
  );
}
