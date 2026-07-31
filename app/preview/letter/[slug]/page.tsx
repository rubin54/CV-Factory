import { notFound } from "next/navigation";

import { CoverLetterDocument } from "@/components/CoverLetterDocument";
import { readApplication } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CoverLetterPreview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const application = await readApplication(slug);
  if (!application?.coverLetter) notFound();

  return (
    <CoverLetterDocument
      basics={application.cv.basics}
      letter={application.coverLetter}
      company={application.company}
    />
  );
}
