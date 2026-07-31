import type { Design } from "./design";
import { computePageBreaks } from "./paginate";

/**
 * Sucht die großzügigste Kombination aus Schriftgröße, Zeilenabstand und
 * Abständen, mit der der Lebenslauf noch auf die gewünschte Seitenzahl passt.
 *
 * Gemessen wird am echten Layout: die CSS-Variablen werden direkt am
 * Dokumentknoten gesetzt und die Höhe ausgelesen, ohne React dazwischen. Ein
 * Durchlauf sind rund zwei Dutzend Messungen — schnell genug für einen Klick.
 */

const RANGE = {
  fontSize: [8.5, 12] as const,
  lineHeight: [1.22, 1.62] as const,
  spacing: [0.55, 1.5] as const,
  /** Der zweite Durchlauf darf über den gekoppelten Wert hinausgehen. */
  lineHeightMax: 1.8,
};

export type FitResult = {
  fontSize: number;
  lineHeight: number;
  spacing: number;
  /** Seitenzahl, die dabei herauskommt. */
  pages: number;
  /** Wurde die Zielseitenzahl erreicht? */
  fits: boolean;
};

/**
 * Ein Regler von „so eng wie vertretbar" bis „luftig". Die drei Größen wandern
 * gemeinsam, damit keine Kombination entsteht, die niemand so einstellen würde
 * — winzige Schrift mit riesigem Zeilenabstand zum Beispiel.
 */
function paramsAt(t: number) {
  const at = ([min, max]: readonly [number, number]) => min + t * (max - min);
  return {
    fontSize: round(at(RANGE.fontSize), 2),
    lineHeight: round(at(RANGE.lineHeight), 3),
    spacing: round(at(RANGE.spacing), 3),
  };
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function autoFit({
  node,
  design,
  pageHeight,
  scale,
  targetPages,
}: {
  /** Der Knoten, der das Dokument enthält (derselbe wie für die Umbrüche). */
  node: HTMLElement;
  design: Design;
  pageHeight: number;
  scale: number;
  targetPages: number;
}): FitResult {
  const shell = node.querySelector<HTMLElement>(".doc-shell");
  if (!shell) {
    return { ...design, pages: 1, fits: false };
  }

  const original = {
    size: shell.style.getPropertyValue("--doc-size"),
    leading: shell.style.getPropertyValue("--doc-leading"),
    sectionGap: shell.style.getPropertyValue("--doc-section-gap"),
    entryGap: shell.style.getPropertyValue("--doc-entry-gap"),
  };

  const apply = (fontSize: number, lineHeight: number, spacing: number) => {
    shell.style.setProperty("--doc-size", `${fontSize}pt`);
    shell.style.setProperty("--doc-leading", String(lineHeight));
    shell.style.setProperty("--doc-section-gap", `${(spacing * 17).toFixed(1)}px`);
    shell.style.setProperty("--doc-entry-gap", `${(spacing * 12).toFixed(1)}px`);
    void shell.offsetHeight; // Layout erzwingen, bevor gemessen wird
    return computePageBreaks(node, pageHeight, scale).length + 1;
  };

  try {
    // Durchlauf 1: größtes t, bei dem die Seitenzahl noch stimmt.
    let low = 0;
    let high = 1;
    let best = paramsAt(0);
    let bestPages = apply(best.fontSize, best.lineHeight, best.spacing);
    const fits = bestPages <= targetPages;

    if (fits) {
      for (let i = 0; i < 16; i++) {
        const mid = (low + high) / 2;
        const candidate = paramsAt(mid);
        const pages = apply(candidate.fontSize, candidate.lineHeight, candidate.spacing);
        if (pages <= targetPages) {
          low = mid;
          best = candidate;
          bestPages = pages;
        } else {
          high = mid;
        }
      }

      // Durchlauf 2: Schriftgröße festhalten, Zeilenabstand aufmachen, solange
      // es passt. Das nutzt den Rest der Seite für Lesbarkeit statt für Luft
      // am Seitenende.
      let lineLow = best.lineHeight;
      let lineHigh = RANGE.lineHeightMax;
      for (let i = 0; i < 12; i++) {
        const mid = round((lineLow + lineHigh) / 2, 3);
        const pages = apply(best.fontSize, mid, best.spacing);
        if (pages <= targetPages) {
          lineLow = mid;
          bestPages = pages;
        } else {
          lineHigh = mid;
        }
      }
      best = { ...best, lineHeight: lineLow };
    }

    return { ...best, pages: bestPages, fits };
  } finally {
    // Die Vorschau gehört React — die direkt gesetzten Werte wieder entfernen.
    shell.style.setProperty("--doc-size", original.size);
    shell.style.setProperty("--doc-leading", original.leading);
    shell.style.setProperty("--doc-section-gap", original.sectionGap);
    shell.style.setProperty("--doc-entry-gap", original.entryGap);
  }
}
