import { formatMonth, formatRange } from "@/lib/format";
import {
  Bullets,
  contactItems,
  DocShell,
  EntryHead,
  LinkList,
  MetaList,
  Photo,
  Section,
  type TemplateProps,
} from "./shared";

/**
 * Streng einspaltig. Die Ruhe kommt aus einer festen Datumsspalte links: jeder
 * Abschnitt beginnt an derselben Kante, die Zeiträume bilden eine durchgehende
 * Achse. Kein Kasten, keine Fläche, nichts, woran ein Parser scheitern kann.
 */
export function LinearTemplate({ cv, design, photoUrl }: TemplateProps) {
  const { basics } = cv;

  return (
    <DocShell design={design} template="linear">
      <header className="flex items-start justify-between gap-8">
        <div>
          <h1 className="doc-display text-[2.1em] leading-[1.1] font-bold tracking-[-0.02em]">
            {basics.fullName || "Name"}
          </h1>
          {basics.headline && (
            <p className="doc-accent doc-display mt-0.5 text-[1.15em]">{basics.headline}</p>
          )}
          <p className="doc-mono doc-muted mt-2.5 text-[0.78em]">
            {contactItems(cv).join("  ·  ")}
          </p>
          {basics.links.length > 0 && (
            <p className="doc-mono mt-1 text-[0.78em]">
              <LinkList links={basics.links} separator="  ·  " />
            </p>
          )}
        </div>
        <Photo url={photoUrl} design={design} size={28} />
      </header>

      {basics.summary && (
        <section className="doc-section">
          <div className="doc-timeline">
            <span className="doc-label doc-muted pt-[0.3em]">Profil</span>
            <p>{basics.summary}</p>
          </div>
        </section>
      )}

      {cv.experience.length > 0 && (
        <Section title="Berufserfahrung">
          {cv.experience.map((job, i) => (
            <div key={`${job.company}-${i}`} className="doc-entry doc-timeline">
              <span className="doc-mono doc-muted pt-[0.25em] text-[0.8em]">
                {formatRange(job.startDate, job.endDate)}
              </span>
              <div>
                <p className="font-semibold">{job.role}</p>
                <p className="doc-accent text-[0.9em] font-medium">
                  {[job.company, job.location].filter(Boolean).join(" · ")}
                </p>
                {job.summary && <p className="doc-muted mt-1">{job.summary}</p>}
                <Bullets items={job.bullets} />
                <MetaList items={job.technologies} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {cv.projects.length > 0 && (
        <Section title="Projekte">
          {cv.projects.map((project, i) => (
            <div key={`${project.name}-${i}`} className="doc-entry doc-timeline">
              {/* Projekte haben keinen Zeitraum — die Datumsspalte bleibt leer,
                  damit die Achse durchläuft. */}
              <span />
              <div>
                <EntryHead
                  left={project.name}
                  right={project.url ? project.url.replace(/^https?:\/\//, "") : undefined}
                />
                <p className="doc-muted">{project.description}</p>
                <MetaList items={project.technologies} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {cv.skills.length > 0 && (
        <Section title="Kenntnisse">
          <div className="space-y-1.5">
            {cv.skills.map((group, i) => (
              <div key={`${group.category}-${i}`} className="doc-timeline doc-entry">
                <span className="doc-mono doc-muted pt-[0.1em] text-[0.8em]">
                  {group.category}
                </span>
                <p>{group.items.join("  ·  ")}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {cv.education.length > 0 && (
        <Section title="Ausbildung">
          {cv.education.map((entry, i) => (
            <div key={`${entry.institution}-${i}`} className="doc-entry doc-timeline">
              <span className="doc-mono doc-muted pt-[0.25em] text-[0.8em]">
                {formatRange(entry.startDate, entry.endDate)}
              </span>
              <div>
                <p className="font-semibold">
                  {[entry.degree, entry.field].filter(Boolean).join(" ")}
                </p>
                <p className="doc-accent text-[0.9em] font-medium">{entry.institution}</p>
                <Bullets items={entry.details} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {cv.certifications.length > 0 && (
        <Section title="Zertifikate">
          {cv.certifications.map((cert, i) => (
            <div key={`${cert.name}-${i}`} className="doc-entry doc-timeline">
              <span className="doc-mono doc-muted pt-[0.1em] text-[0.8em]">
                {formatMonth(cert.date)}
              </span>
              <p>
                <span className="font-medium">{cert.name}</span>
                {cert.issuer && <span className="doc-muted"> · {cert.issuer}</span>}
              </p>
            </div>
          ))}
        </Section>
      )}

      {cv.languages.length > 0 && (
        <Section title="Sprachen">
          <div className="doc-timeline">
            <span />
            <p>
              {cv.languages.map((lang) => `${lang.name} (${lang.level})`).join("  ·  ")}
            </p>
          </div>
        </Section>
      )}
    </DocShell>
  );
}
