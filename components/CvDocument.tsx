import type { Cv } from "@/lib/cv-schema";
import type { Design } from "@/lib/design";

import { AkzentTemplate } from "./templates/AkzentTemplate";
import { KompaktTemplate } from "./templates/KompaktTemplate";
import { LinearTemplate } from "./templates/LinearTemplate";
import type { TemplateProps } from "./templates/shared";

const TEMPLATE_COMPONENTS = {
  linear: LinearTemplate,
  kompakt: KompaktTemplate,
  akzent: AkzentTemplate,
} satisfies Record<Design["template"], (props: TemplateProps) => React.ReactNode>;

/**
 * Wählt das Template aus den Design-Einstellungen. Dieselbe Komponente rendert
 * die Live-Vorschau, die Vorschauseite und die Seite, die Puppeteer fotografiert
 * — was hier steht, steht im PDF.
 */
export function CvDocument({
  cv,
  design,
  photoUrl = null,
}: {
  cv: Cv;
  design: Design;
  photoUrl?: string | null;
}) {
  const Template = TEMPLATE_COMPONENTS[design.template];
  return <Template cv={cv} design={design} photoUrl={photoUrl} />;
}
