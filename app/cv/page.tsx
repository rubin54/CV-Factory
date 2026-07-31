import { AppShell } from "@/components/app/AppShell";
import { CvEditor } from "@/components/CvEditor";
import { photoUrl, readCv, readDesign } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MasterCvPage() {
  const [cv, design, photo] = await Promise.all([readCv(), readDesign(), photoUrl()]);

  return (
    <AppShell
      title="Master-CV"
      subtitle="Die Quelle für alle zugeschnittenen Varianten · data/cv.json"
    >
      <CvEditor initialCv={cv} design={design} photoUrl={photo} />
    </AppShell>
  );
}
