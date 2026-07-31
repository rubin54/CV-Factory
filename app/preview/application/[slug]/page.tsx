import { notFound } from "next/navigation";

import { CvDocument } from "@/components/CvDocument";
import { photoUrl, readApplication, resolveDesign } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ApplicationCvPreview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const application = await readApplication(slug);
  if (!application) notFound();

  const [design, photo] = await Promise.all([resolveDesign(application), photoUrl()]);
  return <CvDocument cv={application.cv} design={design} photoUrl={photo} />;
}
