/**
 * Rechnet nach, wo Chromium das Dokument beim Druck umbricht.
 *
 * Warum nicht einfach Höhe durch Seitenhöhe teilen: Elemente mit
 * `break-inside: avoid` werden nicht zerschnitten, sondern komplett auf die
 * nächste Seite geschoben. Dadurch entsteht am Seitenende Leerraum, und die
 * naive Rechnung zählt zu wenig Seiten.
 *
 * Das Modell hier ist bewusst das gleiche wie Chromiums: unteilbare Blöcke
 * sammeln, der Reihe nach einsortieren, und sobald einer über die Seitenkante
 * ragen würde, die Seite vor ihm beenden.
 */

type Atom = { top: number; bottom: number };

/**
 * Unteilbare Blöcke einsammeln: alles mit `break-inside: avoid` sowie Elemente
 * ohne Kindelemente. Bei allem anderen wird weiter nach unten gelaufen, damit
 * ein Umbruch zwischen den Kindern möglich bleibt.
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
 * Positionen der Seitenumbrüche, gemessen vom oberen Rand des Dokuments in
 * ungeskalierten CSS-Pixeln. Seitenzahl = Umbrüche + 1.
 */
export function computePageBreaks(
  container: HTMLElement,
  pageHeight: number,
  scale = 1,
): number[] {
  if (pageHeight <= 0) return [];

  // Gemessen wird der Textkörper, nicht die Seite: `.doc-shell` trägt auf dem
  // Bildschirm den Seitenrand als Innenabstand, im PDF kommt der dagegen von
  // Puppeteer. Würde man die Hülle messen, zählte der Rand doppelt und die
  // Schätzung läge eine Seite zu hoch.
  const root = container.querySelector<HTMLElement>(".doc") ?? container;

  const atoms = collectAtoms(root, scale);
  const totalHeight = root.getBoundingClientRect().height / scale;
  const breaks: number[] = [];
  let pageTop = 0;

  /** Seiten füllen, bis y auf der aktuellen Seite liegt. */
  const fillUntil = (y: number) => {
    let guard = 0;
    while (y >= pageTop + pageHeight && guard++ < 200) {
      pageTop += pageHeight;
      breaks.push(pageTop);
    }
  };

  for (const atom of atoms) {
    if (atom.bottom <= pageTop + pageHeight) continue;

    // Beginnt der Block erst hinter der Seitenkante, liegen dazwischen nur
    // Umbrüche ohne Konflikt.
    if (atom.top >= pageTop + pageHeight) {
      fillUntil(atom.top);
      if (atom.bottom <= pageTop + pageHeight) continue;
    }

    // Höher als eine Seite: den zerschneidet auch Chromium.
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

  // Der halbe Pixel verhindert eine Leerseite, wenn der Inhalt exakt auf der
  // Kante endet.
  fillUntil(totalHeight - 0.5);
  return breaks;
}
