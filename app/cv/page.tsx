import { AppShell } from "@/components/app/AppShell";
import { CvEditor } from "@/components/CvEditor";
import { photoUrl, readCv, readDesign } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * `?beleg=…&von=<slug>` comes from the gaps list of an application: the notes
 * field is prefilled with the missing evidence and there is a way back. Read
 * here on the server rather than with `useSearchParams`, so the editor stays a
 * component with plain props.
 */
export default async function MasterCvPage({
  searchParams,
}: {
  searchParams: Promise<{ beleg?: string; von?: string }>;
}) {
  const [cv, design, photo, params] = await Promise.all([
    readCv(),
    readDesign(),
    photoUrl(),
    searchParams,
  ]);

  return (
    <AppShell
      title="Master-CV"
      subtitle="Die Quelle für alle zugeschnittenen Varianten · data/cv.json"
    >
      <CvEditor
        initialCv={cv}
        design={design}
        photoUrl={photo}
        gap={params.beleg ?? null}
        fromSlug={params.von ?? null}
      />
    </AppShell>
  );
}
