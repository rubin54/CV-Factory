import { CvDocument } from "@/components/CvDocument";
import { photoUrl, readCv, readDesign } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Bare preview of the master CV — exactly what Puppeteer captures. */
export default async function MasterCvPreview() {
  const [cv, design, photo] = await Promise.all([readCv(), readDesign(), photoUrl()]);
  return <CvDocument cv={cv} design={design} photoUrl={photo} />;
}
