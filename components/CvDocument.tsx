import type { Cv } from "@/lib/cv-schema";
import { displayUrl, formatMonth, formatRange, withProtocol } from "@/lib/format";

/**
 * Reine Präsentationskomponente — kein Datenzugriff, keine Effekte. Dieselbe
 * Komponente rendert die Bildschirm-Vorschau und die Seite, die Puppeteer
 * fotografiert. Was hier steht, steht im PDF.
 */
export function CvDocument({ cv }: { cv: Cv }) {
  const { basics } = cv;

  return (
    <div className="doc-shell">
      <article className="doc">
        <header>
          <h1>{basics.fullName || "Name"}</h1>
          {basics.headline && (
            <p className="doc-muted mt-1 text-[12pt]">{basics.headline}</p>
          )}
          <p className="doc-muted mt-2 text-[9.5pt]">
            {[basics.email, basics.phone, basics.location]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
          {basics.links.length > 0 && (
            <p className="mt-1 text-[9.5pt]">
              {basics.links.map((link, i) => (
                <span key={`${link.url}-${i}`}>
                  {i > 0 && <span className="doc-muted">{"  ·  "}</span>}
                  <a href={withProtocol(link.url)}>
                    {link.label || displayUrl(link.url)}
                  </a>
                </span>
              ))}
            </p>
          )}
        </header>

        {basics.summary && (
          <Section title="Profil">
            <p>{basics.summary}</p>
          </Section>
        )}

        {cv.experience.length > 0 && (
          <Section title="Berufserfahrung">
            {cv.experience.map((job, i) => (
              <div key={`${job.company}-${i}`} className="doc-entry">
                <EntryHead
                  left={job.role}
                  right={formatRange(job.startDate, job.endDate)}
                />
                <p className="doc-muted text-[9.5pt]">
                  {[job.company, job.location].filter(Boolean).join(" · ")}
                </p>
                {job.summary && <p className="mt-1">{job.summary}</p>}
                {job.bullets.length > 0 && (
                  <ul className="mt-1">
                    {job.bullets.map((bullet, j) => (
                      <li key={j}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {job.technologies.length > 0 && (
                  <p className="doc-muted mt-1 text-[9pt]">
                    {job.technologies.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {cv.projects.length > 0 && (
          <Section title="Projekte">
            {cv.projects.map((project, i) => (
              <div key={`${project.name}-${i}`} className="doc-entry">
                <EntryHead
                  left={project.name}
                  right={
                    project.url ? (
                      <a href={withProtocol(project.url)}>{displayUrl(project.url)}</a>
                    ) : (
                      ""
                    )
                  }
                />
                <p>{project.description}</p>
                {project.technologies.length > 0 && (
                  <p className="doc-muted mt-1 text-[9pt]">
                    {project.technologies.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {cv.skills.length > 0 && (
          <Section title="Kenntnisse">
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
              {cv.skills.map((group, i) => (
                <div key={`${group.category}-${i}`} className="contents">
                  <dt className="doc-muted font-semibold">{group.category}</dt>
                  <dd>{group.items.join(" · ")}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {cv.education.length > 0 && (
          <Section title="Ausbildung">
            {cv.education.map((entry, i) => (
              <div key={`${entry.institution}-${i}`} className="doc-entry">
                <EntryHead
                  left={[entry.degree, entry.field].filter(Boolean).join(" ")}
                  right={formatRange(entry.startDate, entry.endDate)}
                />
                <p className="doc-muted text-[9.5pt]">{entry.institution}</p>
                {entry.details.length > 0 && (
                  <ul className="mt-1">
                    {entry.details.map((detail, j) => (
                      <li key={j}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {cv.certifications.length > 0 && (
          <Section title="Zertifikate">
            {cv.certifications.map((cert, i) => (
              <div key={`${cert.name}-${i}`} className="doc-entry">
                <EntryHead left={cert.name} right={formatMonth(cert.date)} />
                {cert.issuer && (
                  <p className="doc-muted text-[9.5pt]">{cert.issuer}</p>
                )}
              </div>
            ))}
          </Section>
        )}

        {cv.languages.length > 0 && (
          <Section title="Sprachen">
            <p>
              {cv.languages.map((lang) => `${lang.name} (${lang.level})`).join(" · ")}
            </p>
          </Section>
        )}
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="doc-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function EntryHead({ left, right }: { left: string; right: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-semibold">{left}</span>
      <span className="doc-muted shrink-0 text-[9.5pt] whitespace-nowrap">{right}</span>
    </div>
  );
}
