import type { ReactNode } from "react";

import { sectionPlan } from "@/lib/design";

import { SectionBlock } from "./sections";
import { ContactBlock, DocShell, Photo, type TemplateProps } from "./shared";

/**
 * Farbiges Kopfband, getönte Kacheln in der Seitenspalte, größere Typo.
 *
 * Die Tönung sitzt bewusst auf den einzelnen Kacheln und nicht auf der ganzen
 * Spalte: eine durchgehende Fläche reißt beim Seitenumbruch am Seitenende ab,
 * Kacheln wandern sauber auf die nächste Seite.
 */
export function AkzentTemplate({ cv, design, photoUrl }: TemplateProps) {
  const { basics } = cv;
  const plan = sectionPlan(design);
  const showAside = plan.aside.length > 0;

  return (
    <DocShell design={design}>
      <header className="doc-band flex items-center justify-between gap-6">
        <div>
          <h1 className="doc-display text-[2.5em] leading-[1.02] font-bold tracking-[-0.03em]">
            {basics.fullName || "Name"}
          </h1>
          {basics.headline && (
            <p className="mt-1.5 text-[1.05em] opacity-90">{basics.headline}</p>
          )}
          <div className="mt-3 opacity-85">
            <ContactBlock cv={cv} design={design} layout="inline" />
          </div>
        </div>
        <Photo url={photoUrl} design={design} size={32} />
      </header>

      <div className={`mt-5 ${showAside ? "doc-columns" : ""}`}>
        <main>
          {plan.main.map((id) => (
            <SectionBlock key={id} id={id} cv={cv} design={design} variant="main" />
          ))}
        </main>

        {showAside && (
          <aside>
            {plan.aside.map((id) => (
              <SectionBlock
                key={id}
                id={id}
                cv={cv}
                design={design}
                variant="aside"
                wrapper={Tile}
              />
            ))}
          </aside>
        )}
      </div>
    </DocShell>
  );
}

function Tile({ children }: { children: ReactNode }) {
  return <div className="doc-tile">{children}</div>;
}
