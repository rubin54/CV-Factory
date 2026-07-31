import type { Basics, CoverLetter } from "@/lib/cv-schema";

export function CoverLetterDocument({
  basics,
  letter,
  company,
}: {
  basics: Basics;
  letter: CoverLetter;
  company: string;
}) {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="doc-shell">
      <article className="doc">
        <header className="text-right text-[9.5pt]">
          <p className="text-[11pt] font-semibold">{basics.fullName}</p>
          {basics.location && <p className="doc-muted">{basics.location}</p>}
          <p className="doc-muted">
            {[basics.email, basics.phone].filter(Boolean).join("  ·  ")}
          </p>
        </header>

        <p className="doc-muted mt-10 text-[9.5pt]">{company}</p>
        <p className="doc-muted mt-6 text-right text-[9.5pt]">{today}</p>

        <p className="mt-8 font-semibold">{letter.subject}</p>

        <p className="mt-6">{letter.salutation}</p>

        {letter.body.map((paragraph, i) => (
          <p key={i} className="mt-4">
            {paragraph}
          </p>
        ))}

        <p className="mt-8">{letter.closing}</p>
        <p className="mt-6">{basics.fullName}</p>
      </article>
    </div>
  );
}
