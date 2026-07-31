import { DesignStudio } from "@/components/DesignStudio";
import { PageShell } from "@/components/PageShell";
import { photoUrl, readCv, readDesign } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DesignPage() {
  const [cv, design, photo] = await Promise.all([readCv(), readDesign(), photoUrl()]);

  return (
    <PageShell
      title="Design"
      subtitle="Standard für alle Bewerbungen. Einzelne Bewerbungen können davon abweichen."
    >
      <DesignStudio cv={cv} initialDesign={design} initialPhotoUrl={photo} />
    </PageShell>
  );
}
