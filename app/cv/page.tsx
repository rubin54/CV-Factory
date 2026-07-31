import { CvEditor } from "@/components/CvEditor";
import { PageShell } from "@/components/PageShell";
import { readCv } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MasterCvPage() {
  const cv = await readCv();

  return (
    <PageShell
      title="Master-CV"
      subtitle="Die Quelle für alle zugeschnittenen Varianten. Liegt in data/cv.json."
    >
      <CvEditor initialCv={cv} />
    </PageShell>
  );
}
