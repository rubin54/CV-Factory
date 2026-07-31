/**
 * Works out where Chromium breaks the document into pages when printing.
 *
 * Why not simply divide height by page height: elements with
 * `break-inside: avoid` are not cut, they are pushed onto the next page whole.
 * That leaves whitespace at the bottom of a page, and the naive calculation
 * ends up counting too few pages.
 *
 * The model here is deliberately the same one Chromium uses: collect the
 * unbreakable blocks, place them in order, and end the page in front of any
 * block that would otherwise cross the page edge.
 */

type Atom = { top: number; bottom: number };

/**
 * Collects the unbreakable blocks: everything with `break-inside: avoid` plus
 * elements without children. Anything else is descended into, so that a break
 * between its children stays possible.
 */
function collectAtoms(root: HTMLElement, scale: number): Atom[] {
  const rootTop = root.getBoundingClientRect().top;
  const atoms: Atom[] = [];

  const walk = (element: Element) => {
    const style = getComputedStyle(element);
    if (style.display === "none") return;

    const unbreakable = style.breakInside === "avoid" || style.pageBreakInside === "avoid";
    const children = Array.from(element.children);

    if (unbreakable || children.length === 0) {
      const rect = element.getBoundingClientRect();
      if (rect.height > 0.5) {
        atoms.push({
          top: (rect.top - rootTop) / scale,
          bottom: (rect.bottom - rootTop) / scale,
        });
      }
      return;
    }
    children.forEach(walk);
  };

  Array.from(root.children).forEach(walk);
  return atoms.sort((a, b) => a.top - b.top);
}

/**
 * Positions of the page breaks, measured from the top of the document in
 * unscaled CSS pixels. Page count = breaks + 1.
 */
export function computePageBreaks(
  container: HTMLElement,
  pageHeight: number,
  scale = 1,
): number[] {
  if (pageHeight <= 0) return [];

  // Measure the text body, not the page: on screen `.doc-shell` carries the
  // page margin as padding, whereas in the PDF that margin comes from Puppeteer.
  // Measuring the shell would count the margin twice and overestimate by a page.
  const root = container.querySelector<HTMLElement>(".doc") ?? container;

  const atoms = collectAtoms(root, scale);
  const totalHeight = root.getBoundingClientRect().height / scale;
  const breaks: number[] = [];
  let pageTop = 0;

  /** Fill pages until y falls on the current one. */
  const fillUntil = (y: number) => {
    let guard = 0;
    while (y >= pageTop + pageHeight && guard++ < 200) {
      pageTop += pageHeight;
      breaks.push(pageTop);
    }
  };

  for (const atom of atoms) {
    if (atom.bottom <= pageTop + pageHeight) continue;

    // If the block only starts past the page edge, everything in between is an
    // uncontested break.
    if (atom.top >= pageTop + pageHeight) {
      fillUntil(atom.top);
      if (atom.bottom <= pageTop + pageHeight) continue;
    }

    // Taller than a page: Chromium cuts this one too.
    if (atom.bottom - atom.top > pageHeight) {
      fillUntil(atom.bottom);
      continue;
    }

    if (atom.top > pageTop) {
      breaks.push(atom.top);
      pageTop = atom.top;
    } else {
      fillUntil(atom.bottom);
    }
  }

  // The half pixel prevents a blank page when the content ends exactly on the
  // page edge.
  fillUntil(totalHeight - 0.5);
  return breaks;
}
