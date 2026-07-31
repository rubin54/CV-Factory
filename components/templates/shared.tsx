import { Fragment, type ReactNode } from "react";

import type { Cv } from "@/lib/cv-schema";
import type { Design } from "@/lib/design";
import { designToCssVars } from "@/lib/design";
import { displayUrl, withProtocol } from "@/lib/format";

/** What every template receives as props. */
export type TemplateProps = {
  cv: Cv;
  design: Design;
  /** URL of the photo, or null when none is stored. */
  photoUrl: string | null;
};

/** How a section is rendered — decided by the template, not by the content. */
export type SectionVariant = "main" | "aside" | "timeline";

/**
 * Sets the design variables and the template class. Everything below only reads
 * `var(--…)` — which is why every setting behaves the same in all templates.
 */
export function DocShell({
  design,
  children,
}: {
  design: Design;
  children: ReactNode;
}) {
  return (
    <div className="doc-shell" style={designToCssVars(design)}>
      <article className={`doc tpl-${design.template}`}>
        {children}
        {design.showFooter && <DocFooter />}
      </article>
    </div>
  );
}

function DocFooter() {
  const stand = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  return (
    <footer className="doc-mono doc-muted mt-6 border-t pt-2 text-[0.72em]" style={{ borderColor: "var(--rule)" }}>
      Stand: {stand}
    </footer>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="doc-h2 doc-heading">{children}</h2>;
}

/** Heading line of an entry: label on the left, date range on the right. */
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

/** Tech stacks and the like: mono, muted, separated by middots. */
export function MetaList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <p className="doc-mono doc-muted mt-1 flex flex-wrap gap-x-2 text-[0.78em]">
      {items.map((item, i) => (
        <Fragment key={item}>
          {i > 0 && <span className="opacity-40">·</span>}
          <span>{item}</span>
        </Fragment>
      ))}
    </p>
  );
}

export function ExternalLink({ url, label }: { url: string; label?: string }) {
  return <a href={withProtocol(url)}>{label || displayUrl(url)}</a>;
}

/* ---------------------------------------------------------------------------
   Icons. Deliberately inline SVG with currentColor and aria-hidden: the text
   next to them is untouched, so a parser still reads the address rather than an
   icon-font glyph.
   --------------------------------------------------------------------------- */

type IconName = "mail" | "phone" | "pin" | "link";

const ICON_PATHS: Record<IconName, ReactNode> = {
  mail: (
    <>
      <rect x="2.5" y="4" width="11" height="8" rx="1.2" />
      <path d="M2.8 4.8 8 9l5.2-4.2" />
    </>
  ),
  phone: (
    <path d="M4 2.8h2.2l1.1 2.7-1.4 1a7.5 7.5 0 0 0 3.6 3.6l1-1.4 2.7 1.1v2.2a1 1 0 0 1-1.1 1A11 11 0 0 1 3 3.9 1 1 0 0 1 4 2.8Z" />
  ),
  pin: (
    <>
      <path d="M8 14s4.5-4.6 4.5-7.6a4.5 4.5 0 0 0-9 0C3.5 9.4 8 14 8 14Z" />
      <circle cx="8" cy="6.4" r="1.7" />
    </>
  ),
  link: (
    <>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M2.4 8h11.2M8 2.4c1.5 1.7 2.3 3.6 2.3 5.6S9.5 12 8 13.6C6.5 12 5.7 10 5.7 8S6.5 4.1 8 2.4Z" />
    </>
  ),
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className="doc-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export type ContactItem = { icon: IconName; text: string };

export function contactItems(cv: Cv): ContactItem[] {
  const items: ContactItem[] = [];
  if (cv.basics.email) items.push({ icon: "mail", text: cv.basics.email });
  if (cv.basics.phone) items.push({ icon: "phone", text: cv.basics.phone });
  if (cv.basics.location) items.push({ icon: "pin", text: cv.basics.location });
  return items;
}

/** Contact details on one line (header) or stacked (sidebar). */
export function ContactBlock({
  cv,
  design,
  layout,
  separator = "  ·  ",
}: {
  cv: Cv;
  design: Design;
  layout: "inline" | "stacked";
  separator?: string;
}): ReactNode {
  const items = contactItems(cv);
  if (items.length === 0) return null;

  if (layout === "stacked") {
    return (
      <div className="doc-mono space-y-0.5 text-[0.8em] break-words">
        {items.map((item) => (
          <p key={item.text} className="flex items-baseline gap-1.5">
            {design.showIcons && <Icon name={item.icon} />}
            <span>{item.text}</span>
          </p>
        ))}
      </div>
    );
  }

  // Spacing through flex gap rather than spaces in the text: HTML collapses
  // repeated spaces, which made the separator stick to the next icon.
  return (
    <p className="doc-mono flex flex-wrap items-baseline gap-x-2 text-[0.78em]">
      {items.map((item, i) => (
        <Fragment key={item.text}>
          {i > 0 && <span className="opacity-40">{separator}</span>}
          <span className="inline-flex items-baseline gap-1">
            {design.showIcons && <Icon name={item.icon} />}
            <span>{item.text}</span>
          </span>
        </Fragment>
      ))}
    </p>
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
  // Round means square — a portrait format with border-radius gives an egg.
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
