import { CvDocument } from "@/components/CvDocument";
import { photoUrl, readCv, readDesign } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Nackte Vorschau des Master-CVs — genau das, was Puppeteer abgreift. */
export default async function MasterCvPreview() {
  const [cv, design, photo] = await Promise.all([readCv(), readDesign(), photoUrl()]);
  return <CvDocument cv={cv} design={design} photoUrl={photo} />;
}
