import { sectionPlan } from "@/lib/design";

import { SectionBlock } from "./sections";
import { ContactBlock, DocShell, Photo, type TemplateProps } from "./shared";

/**
 * Zweispaltiges Raster in der Tradition der dichten Ein-Seiten-Layouts: viel
 * Inhalt auf wenig Fläche, Seitenspalte rechts.
 *
 * Das ist das riskanteste der fünf Layouts — ein Parser, der spaltenweise
 * liest, mischt hier eher als bei den anderen. Die DOM-Reihenfolge stellt
 * trotzdem den Hauptteil nach vorn, damit der extrahierte Text stimmt.
 */
export function DichtTemplate({ cv, design, photoUrl }: TemplateProps) {
  const { basics } = cv;
  const plan = sectionPlan(design);
  const showAside = plan.aside.length > 0 || (design.showPhoto && Boolean(photoUrl));

  return (
    <DocShell design={design}>
      <header className="doc-band-thin flex items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="doc-display text-[1.9em] leading-[1.05] font-bold tracking-[-0.02em]">
            {basics.fullName || "Name"}
          </h1>
          {basics.headline && (
            <p className="doc-accent text-[0.98em] font-medium">{basics.headline}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <ContactBlock cv={cv} design={design} layout="stacked" />
        </div>
      </header>

      <div className={`mt-3 ${showAside ? "doc-columns" : ""}`}>
        <main>
          {plan.main.map((id) => (
            <SectionBlock key={id} id={id} cv={cv} design={design} variant="main" />
          ))}
        </main>

        {showAside && (
          <aside className="doc-aside">
            {design.showPhoto && photoUrl && (
              <div className="mb-3">
                <Photo url={photoUrl} design={design} size={30} />
              </div>
            )}
            {plan.aside.map((id) => (
              <SectionBlock key={id} id={id} cv={cv} design={design} variant="aside" />
            ))}
          </aside>
        )}
      </div>
    </DocShell>
  );
}
