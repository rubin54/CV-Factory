import { sectionPlan } from "@/lib/design";

import { SectionBlock } from "./sections";
import { ContactBlock, DocShell, Photo, type TemplateProps } from "./shared";

/**
 * Centred header, contact line with separators, section titles in caps above a
 * full-width rule — the shape that raises the fewest questions in tech.
 *
 * Single column: the sidebar assignment of the sections is ignored here,
 * everything ends up in one flow.
 */
export function KlassikTemplate({ cv, design, photoUrl }: TemplateProps) {
  const { basics } = cv;
  const plan = sectionPlan(design);

  return (
    <DocShell design={design}>
      <header className="flex flex-col items-center text-center">
        {design.showPhoto && photoUrl && (
          <div className="mb-3">
            <Photo url={photoUrl} design={design} size={26} />
          </div>
        )}
        <h1 className="doc-display text-[2.1em] leading-[1.1] font-bold tracking-[0.02em]">
          {basics.fullName || "Name"}
        </h1>
        {basics.headline && (
          <p className="doc-accent mt-0.5 text-[1.05em] font-medium">{basics.headline}</p>
        )}
        <div className="mt-2 flex justify-center">
          <ContactBlock cv={cv} design={design} layout="inline" separator="|" />
        </div>
      </header>

      {plan.main.map((id) => (
        <SectionBlock key={id} id={id} cv={cv} design={design} variant="main" />
      ))}
    </DocShell>
  );
}
