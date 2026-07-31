import { notFound } from "next/navigation";

import { AppShell } from "@/components/app/AppShell";
import { ApplicationView } from "@/components/ApplicationView";
import { photoUrl, readApplication, readDesign } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const application = await readApplication(slug);
  if (!application) notFound();

  const [globalDesign, photo] = await Promise.all([readDesign(), photoUrl()]);

  return (
    <AppShell
      title={application.role}
      subtitle={`${application.company} · zuletzt geändert ${new Date(
        application.updatedAt,
      ).toLocaleString("de-DE")}`}
    >
      <ApplicationView initial={application} globalDesign={globalDesign} photoUrl={photo} />
    </AppShell>
  );
}
