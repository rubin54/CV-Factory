import { notFound } from "next/navigation";

import { CvDocument } from "@/components/CvDocument";
import { readApplication } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ApplicationCvPreview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const application = await readApplication(slug);
  if (!application) notFound();
  return <CvDocument cv={application.cv} />;
}
