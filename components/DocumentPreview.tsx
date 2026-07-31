"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { computePageBreaks } from "@/lib/paginate";

const A4_WIDTH_PX = 794; // 210 mm bei 96 dpi

/**
 * Skaliert das A4-Dokument auf die verfügbare Spaltenbreite und zeichnet ein,
 * wo die Seiten umbrechen.
 *
 * Die Umbrüche stehen sonst erst im exportierten PDF fest — man ändert die
 * Dichte, exportiert, zählt Seiten, ändert wieder. Hier sieht man es sofort.
 */
export function DocumentPreview({
  children,
  scale = 0.62,
  pageHeight,
  onPagesChange,
  showBreaks = true,
  measureRef,
}: {
  children: ReactNode;
  scale?: number;
  /** Satzspiegelhöhe einer Seite in CSS-Pixeln. Ohne diese keine Umbrüche. */
  pageHeight?: number;
  onPagesChange?: (pages: number) => void;
  showBreaks?: boolean;
  /** Zugriff auf den Dokumentknoten — der Auto-Fit misst daran. */
  measureRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const docRef = measureRef ?? fallbackRef;
  const [breaks, setBreaks] = useState<number[]>([]);
  // Die Umbrüche werden relativ zum Textkörper gemessen; der sitzt um den
  // Seitenrand tiefer als der Container, in dem gezeichnet wird.
  const [bodyTop, setBodyTop] = useState(0);

  const measure = useCallback(() => {
    const node = docRef.current;
    if (!node || !pageHeight) {
      setBreaks((current) => (current.length === 0 ? current : []));
      return;
    }

    const body = node.querySelector<HTMLElement>(".doc");
    const offset = body
      ? (body.getBoundingClientRect().top - node.getBoundingClientRect().top) / scale
      : 0;
    setBodyTop((current) => (Math.abs(current - offset) < 0.5 ? current : offset));

    const next = computePageBreaks(node, pageHeight, scale);
    setBreaks((current) =>
      current.length === next.length && current.every((v, i) => Math.abs(v - next[i]) < 0.5)
        ? current
        : next,
    );
  }, [docRef, pageHeight, scale]);

  useEffect(() => {
    onPagesChange?.(breaks.length + 1);
  }, [breaks.length, onPagesChange]);

  useEffect(() => {
    const node = docRef.current;
    if (!node) return;

    // Vor dem Laden der Schriften stimmen die Höhen nicht — dann liegt der
    // Umbruch woanders als im PDF.
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) measure();
    });

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [measure]);

  // Nach jedem Render neu messen: Inhalt und Design ändern sich häufiger als
  // die Elementgröße, die der ResizeObserver sieht.
  useEffect(measure);

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: `${A4_WIDTH_PX * scale}px`, maxWidth: "100%" }}
    >
      <div
        ref={docRef}
        style={{
          width: `${A4_WIDTH_PX}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          marginBottom: `${-(1 - scale) * 100}%`,
        }}
      >
        {children}
      </div>

      {showBreaks &&
        breaks.map((offset, i) => (
          <div
            key={i}
            className="pointer-events-none absolute right-0 left-0 flex items-center"
            style={{ top: `${(offset + bodyTop) * scale}px` }}
          >
            <div className="h-0 flex-1 border-t border-dashed border-rose-400/70" />
            <span className="bg-rose-50 px-1 py-px text-[9px] font-medium text-rose-600">
              Seite {i + 2}
            </span>
          </div>
        ))}
    </div>
  );
}
