import type { Design } from "./design";
import { computePageBreaks } from "./paginate";

/**
 * Finds the most generous combination of font size, line height and spacing
 * that still fits the CV onto the requested number of pages.
 *
 * Measured against the real layout: the CSS variables are set directly on the
 * document node and the height read back, with no React in between. One run is
 * roughly two dozen measurements — fast enough for a single click.
 */

const RANGE = {
  fontSize: [8.5, 12] as const,
  lineHeight: [1.22, 1.62] as const,
  spacing: [0.55, 1.5] as const,
  /** The second pass may go beyond the coupled value. */
  lineHeightMax: 1.8,
};

export type FitResult = {
  fontSize: number;
  lineHeight: number;
  spacing: number;
  /** Page count this results in. */
  pages: number;
  /** Was the target page count reached? */
  fits: boolean;
};

/**
 * One dial from "as tight as defensible" to "airy". The three values move
 * together so that no combination arises that nobody would choose by hand —
 * tiny type with a huge line height, for instance.
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
  /** The node containing the document (the same one used for the breaks). */
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
    void shell.offsetHeight; // force layout before measuring
    return computePageBreaks(node, pageHeight, scale).length + 1;
  };

  try {
    // Pass 1: the largest t at which the page count still holds.
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

      // Pass 2: hold the font size, open up the line height for as long as it
      // still fits. That spends the rest of the page on readability instead of
      // leaving air at the bottom.
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
    // The preview belongs to React — remove the directly set values again.
    shell.style.setProperty("--doc-size", original.size);
    shell.style.setProperty("--doc-leading", original.leading);
    shell.style.setProperty("--doc-section-gap", original.sectionGap);
    shell.style.setProperty("--doc-entry-gap", original.entryGap);
  }
}
