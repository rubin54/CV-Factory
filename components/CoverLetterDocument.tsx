import type { Basics, CoverLetter } from "@/lib/cv-schema";
import type { Design } from "@/lib/design";

import { DocShell } from "./templates/shared";

/**
 * Das Anschreiben übernimmt Schrift, Farbe, Dichte und Ränder aus denselben
 * Design-Einstellungen wie der Lebenslauf — beides landet im selben Umschlag.
 */
export function CoverLetterDocument({
  basics,
  letter,
  company,
  design,
}: {
  basics: Basics;
  letter: CoverLetter;
  company: string;
  design: Design;
}) {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <DocShell design={design}>
      <header className="flex items-start justify-between gap-8">
        <div>
          <p className="doc-display text-[1.5em] leading-tight font-bold tracking-[-0.02em]">
            {basics.fullName}
          </p>
          {basics.headline && (
            <p className="doc-accent text-[0.95em] font-medium">{basics.headline}</p>
          )}
        </div>
        <div className="doc-mono doc-muted text-right text-[0.8em]">
          {basics.location && <p>{basics.location}</p>}
          {basics.email && <p>{basics.email}</p>}
          {basics.phone && <p>{basics.phone}</p>}
        </div>
      </header>

      <div
        className="mt-3 border-t"
        style={{ borderColor: "var(--accent)", borderTopWidth: "2px" }}
      />

      <p className="doc-muted mt-10">{company}</p>
      <p className="doc-mono doc-muted mt-8 text-right text-[0.8em]">{today}</p>

      <p className="doc-display mt-8 text-[1.1em] font-semibold">{letter.subject}</p>

      <p className="mt-6">{letter.salutation}</p>

      {letter.body.map((paragraph, i) => (
        <p key={i} className="mt-4">
          {paragraph}
        </p>
      ))}

      <p className="mt-8">{letter.closing}</p>
      <p className="doc-display mt-8 text-[1.05em] font-semibold">{basics.fullName}</p>
    </DocShell>
  );
}
