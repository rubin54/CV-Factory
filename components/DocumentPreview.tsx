"use client";

import type { ReactNode } from "react";

/**
 * Skaliert das A4-Dokument (210 mm ≈ 794 px) auf die verfügbare Spaltenbreite.
 * Die Höhe wird über die Skalierung mitgezogen, damit darunter kein Loch bleibt.
 */
export function DocumentPreview({
  children,
  scale = 0.62,
}: {
  children: ReactNode;
  scale?: number;
}) {
  return (
    <div className="overflow-hidden" style={{ width: `${794 * scale}px`, maxWidth: "100%" }}>
      <div
        style={{
          width: "794px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          marginBottom: `${-(1 - scale) * 100}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
