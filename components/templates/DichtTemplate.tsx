import { sectionPlan } from "@/lib/design";

import { SectionBlock } from "./sections";
import { ContactBlock, DocShell, Photo, type TemplateProps } from "./shared";

/**
 * Two-column grid in the tradition of dense one-page layouts: a lot of content
 * in little space, sidebar on the right.
 *
 * This is the riskiest of the five layouts — a parser that reads column by
 * column is more likely to scramble this one. The DOM order still puts the main
 * column first so that the extracted text comes out right.
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
