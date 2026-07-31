import { sectionPlan } from "@/lib/design";

import { SectionBlock } from "./sections";
import { ContactBlock, DocShell, Photo, type TemplateProps } from "./shared";

/**
 * Strictly single column. The calm comes from a fixed date column on the left:
 * every section starts at the same edge and the date ranges form a continuous
 * axis. No boxes, no fills, nothing a parser can trip over.
 */
export function LinearTemplate({ cv, design, photoUrl }: TemplateProps) {
  const { basics } = cv;
  const plan = sectionPlan(design);

  return (
    <DocShell design={design}>
      <header className="flex items-start justify-between gap-8">
        <div>
          <h1 className="doc-display text-[2.1em] leading-[1.1] font-bold tracking-[-0.02em]">
            {basics.fullName || "Name"}
          </h1>
          {basics.headline && (
            <p className="doc-accent doc-display mt-0.5 text-[1.15em]">{basics.headline}</p>
          )}
          <div className="mt-2.5">
            <ContactBlock cv={cv} design={design} layout="inline" />
          </div>
        </div>
        <Photo url={photoUrl} design={design} size={28} />
      </header>

      {plan.main.map((id) => (
        <SectionBlock key={id} id={id} cv={cv} design={design} variant="timeline" />
      ))}
    </DocShell>
  );
}
