"use client";

import type { RefObject } from "react";

import { useToast } from "@/components/app/Toast";
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
  const toast = useToast();

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

    const ziel = targetPages === 1 ? "eine Seite" : `${targetPages} Seiten`;
    if (result.fits) {
      toast.ok(`Passt auf ${ziel} bei ${result.fontSize.toFixed(2)} pt.`);
    } else {
      toast.error(
        `Passt auch bei kleinster Schrift nicht auf ${ziel} — es sind ${result.pages}. Kürze Inhalte oder blende einen Abschnitt aus.`,
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted">Vorschau · {label}</span>
      <span
        className={`rounded px-1.5 py-0.5 font-medium ${
          pages === 1 ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
        }`}
      >
        {pages} {pages === 1 ? "Seite" : "Seiten"}
      </span>

      <span className="ml-2 flex items-center gap-1">
        <span className="text-faint">Auto-Fit:</span>
        <Button size="sm" onClick={() => fit(1)}>
          1 Seite
        </Button>
        <Button size="sm" onClick={() => fit(2)}>
          2 Seiten
        </Button>
      </span>
    </div>
  );
}
