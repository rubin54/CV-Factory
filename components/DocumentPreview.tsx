"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { computePageBreaks } from "@/lib/paginate";

const A4_WIDTH_PX = 794; // 210 mm bei 96 dpi

/**
 * Scales the A4 document to the available column width and draws in where the
 * pages break.
 *
 * Otherwise the breaks only become visible in the exported PDF — change the
 * density, export, count pages, change again. Here you see it immediately.
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
  /** Text-body height of a page in CSS pixels. Without it, no breaks. */
  pageHeight?: number;
  onPagesChange?: (pages: number) => void;
  showBreaks?: boolean;
  /** Access to the document node — the auto-fit measures against it. */
  measureRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const docRef = measureRef ?? fallbackRef;
  const [breaks, setBreaks] = useState<number[]>([]);
  // The breaks are measured relative to the text body, which sits one page
  // margin lower than the container the lines are drawn into.
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

    // Before the fonts have loaded the heights are wrong, and the break ends up
    // somewhere other than in the PDF.
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

  // Re-measure after every render: content and design change more often than
  // the element size the ResizeObserver sees.
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
