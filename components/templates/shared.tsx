import type { ReactNode } from "react";

import type { Cv, Experience, Link as CvLink } from "@/lib/cv-schema";
import type { Design } from "@/lib/design";
import { designToCssVars } from "@/lib/design";
import { displayUrl, formatRange, withProtocol } from "@/lib/format";

/** Was jedes Template als Props bekommt. */
export type TemplateProps = {
  cv: Cv;
  design: Design;
  /** URL des Bewerbungsfotos, oder null wenn keines hinterlegt ist. */
  photoUrl: string | null;
};

/**
 * Setzt die Design-Variablen und die Template-Klasse. Alles darunter liest nur
 * noch `var(--…)` — deshalb wirkt jede Einstellung in allen Templates gleich.
 */
export function DocShell({
  design,
  template,
  children,
}: {
  design: Design;
  template: string;
  children: ReactNode;
}) {
  return (
    <div className="doc-shell" style={designToCssVars(design)}>
      <article className={`doc tpl-${template}`}>{children}</article>
    </div>
  );
}

export function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`doc-section ${className}`}>
      <h2 className="doc-h2 doc-label doc-heading">{title}</h2>
      {children}
    </section>
  );
}

/** Titelzeile eines Eintrags: Bezeichnung links, Zeitraum rechts. */
export function EntryHead({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-semibold">{left}</span>
      {right ? (
        <span className="doc-mono doc-muted shrink-0 text-[0.8em] whitespace-nowrap">
          {right}
        </span>
      ) : null}
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="doc-bullets mt-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Tech-Stacks, Sprachlisten: mono, gedämpft, mit Mittelpunkt getrennt. */
export function MetaList({ items, className = "" }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <p className={`doc-mono doc-muted mt-1 text-[0.78em] ${className}`}>
      {items.join("  ·  ")}
    </p>
  );
}

export function LinkList({ links, separator }: { links: CvLink[]; separator: string }) {
  if (links.length === 0) return null;
  return (
    <>
      {links.map((link, i) => (
        <span key={`${link.url}-${i}`}>
          {i > 0 && <span className="opacity-50">{separator}</span>}
          <a href={withProtocol(link.url)}>{link.label || displayUrl(link.url)}</a>
        </span>
      ))}
    </>
  );
}

export function Photo({
  url,
  design,
  size,
}: {
  url: string | null;
  design: Design;
  size: number;
}) {
  if (!design.showPhoto || !url) return null;
  // Rund heißt quadratisch — ein Hochformat mit border-radius ergibt ein Ei.
  const isRound = design.photoShape === "kreis";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={`doc-photo shrink-0 ${isRound ? "doc-photo-kreis" : ""}`}
      style={{ width: `${size}mm`, height: `${isRound ? size : size * 1.2}mm` }}
    />
  );
}

/** Eine Berufsstation — in allen Templates gleich aufgebaut. */
export function ExperienceEntry({ job }: { job: Experience }) {
  return (
    <div className="doc-entry">
      <EntryHead left={job.role} right={formatRange(job.startDate, job.endDate)} />
      <p className="doc-accent text-[0.9em] font-medium">
        {[job.company, job.location].filter(Boolean).join(" · ")}
      </p>
      {job.summary && <p className="doc-muted mt-1">{job.summary}</p>}
      <Bullets items={job.bullets} />
      <MetaList items={job.technologies} />
    </div>
  );
}

/** Kontaktangaben als Zeilen (Seitenspalte) oder als eine Zeile (Kopfzeile). */
export function contactItems(cv: Cv): string[] {
  return [cv.basics.email, cv.basics.phone, cv.basics.location].filter(
    (value): value is string => Boolean(value),
  );
}
