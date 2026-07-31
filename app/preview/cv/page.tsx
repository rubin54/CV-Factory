import { CvDocument } from "@/components/CvDocument";
import { readCv } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Nackte Vorschau des Master-CVs — genau das, was Puppeteer abgreift. */
export default async function MasterCvPreview() {
  return <CvDocument cv={await readCv()} />;
}
