import { notFound } from "next/navigation";

import { ApplicationView } from "@/components/ApplicationView";
import { PageShell } from "@/components/PageShell";
import { readApplication } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const application = await readApplication(slug);
  if (!application) notFound();

  return (
    <PageShell
      title={application.role}
      subtitle={`${application.company} · zuletzt geändert ${new Date(
        application.updatedAt,
      ).toLocaleString("de-DE")}`}
    >
      <ApplicationView initial={application} />
    </PageShell>
  );
}
