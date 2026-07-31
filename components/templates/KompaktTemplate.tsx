import { sectionPlan } from "@/lib/design";

import { SectionBlock } from "./sections";
import { ContactBlock, DocShell, Photo, type TemplateProps } from "./shared";

/**
 * Kopfzeile über die volle Breite, darunter eine schmale Spalte für alles, was
 * man nur nachschlägt, und rechts der Fließtext.
 *
 * Im DOM steht der Hauptteil VOR der Seitenspalte — die Spalte wird per CSS
 * nach links gesetzt. So liest ein Parser (und jeder, der den PDF-Text
 * kopiert) zuerst die Berufserfahrung und nicht die Kenntnisliste.
 */
export function KompaktTemplate({ cv, design, photoUrl }: TemplateProps) {
  const { basics } = cv;
  const plan = sectionPlan(design);
  const showAside = plan.aside.length > 0 || (design.showPhoto && Boolean(photoUrl));

  return (
    <DocShell design={design}>
      {/* Das Foto steht in der Seitenspalte, nicht in der Kopfzeile: dort würde
          es die Zeile auf Fotohöhe aufziehen und neben dem Namen eine tote
          Fläche hinterlassen. */}
      <header className="pb-4">
        <h1 className="doc-display text-[2.3em] leading-[1.05] font-bold tracking-[-0.025em]">
          {basics.fullName || "Name"}
        </h1>
        {basics.headline && (
          <p className="doc-accent mt-1 text-[1.1em] font-medium">{basics.headline}</p>
        )}
      </header>

      <div
        className={`border-t pt-4 ${showAside ? "doc-columns" : ""}`}
        style={{ borderColor: "var(--accent)", borderTopWidth: "2px" }}
      >
        <main>
          {plan.main.map((id) => (
            <SectionBlock key={id} id={id} cv={cv} design={design} variant="main" />
          ))}
        </main>

        {showAside && (
          <aside className="doc-aside">
            {design.showPhoto && photoUrl && (
              <div className="mb-4">
                <Photo url={photoUrl} design={design} size={38} />
              </div>
            )}
            <section className="doc-section">
              <h2 className="doc-h2 doc-heading">Kontakt</h2>
              <ContactBlock cv={cv} design={design} layout="stacked" />
            </section>
            {plan.aside.map((id) => (
              <SectionBlock key={id} id={id} cv={cv} design={design} variant="aside" />
            ))}
          </aside>
        )}
      </div>
    </DocShell>
  );
}
