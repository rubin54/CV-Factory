import { displayUrl, formatMonth, formatRange, withProtocol } from "@/lib/format";
import {
  Bullets,
  contactItems,
  DocShell,
  EntryHead,
  ExperienceEntry,
  MetaList,
  Photo,
  Section,
  type TemplateProps,
} from "./shared";

/**
 * Farbiges Kopfband, getönte Kacheln in der Seitenspalte, größere Typo.
 *
 * Die Tönung sitzt bewusst auf den einzelnen Kacheln und nicht auf der ganzen
 * Spalte: eine durchgehende Fläche reißt beim Seitenumbruch am Seitenende ab,
 * Kacheln wandern sauber auf die nächste Seite.
 */
export function AkzentTemplate({ cv, design, photoUrl }: TemplateProps) {
  const { basics } = cv;

  return (
    <DocShell design={design} template="akzent">
      <header className="doc-band flex items-center justify-between gap-6">
        <div>
          <h1 className="doc-display text-[2.5em] leading-[1.02] font-bold tracking-[-0.03em]">
            {basics.fullName || "Name"}
          </h1>
          {basics.headline && (
            <p className="mt-1.5 text-[1.05em] opacity-90">{basics.headline}</p>
          )}
          <p className="doc-mono mt-3 text-[0.76em] opacity-80">
            {contactItems(cv).join("  ·  ")}
          </p>
        </div>
        <Photo url={photoUrl} design={design} size={32} />
      </header>

      {basics.summary && <p className="mt-5 text-[1.05em] leading-snug">{basics.summary}</p>}

      <div className="doc-columns mt-5">
        <aside>
          {basics.links.length > 0 && (
            <div className="doc-tile">
              <h2 className="doc-h2 doc-label doc-heading">Online</h2>
              <div className="doc-mono space-y-0.5 text-[0.8em] break-words">
                {basics.links.map((link, i) => (
                  <p key={`${link.url}-${i}`}>
                    <a href={withProtocol(link.url)}>
                      {link.label || displayUrl(link.url)}
                    </a>
                  </p>
                ))}
              </div>
            </div>
          )}

          {cv.skills.length > 0 && (
            <div className="doc-tile">
              <h2 className="doc-h2 doc-label doc-heading">Kenntnisse</h2>
              <div className="space-y-2">
                {cv.skills.map((group, i) => (
                  <div key={`${group.category}-${i}`}>
                    <p className="doc-mono doc-muted text-[0.75em] tracking-wide uppercase">
                      {group.category}
                    </p>
                    <p className="text-[0.92em]">{group.items.join(", ")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cv.languages.length > 0 && (
            <div className="doc-tile">
              <h2 className="doc-h2 doc-label doc-heading">Sprachen</h2>
              <div className="space-y-0.5 text-[0.92em]">
                {cv.languages.map((lang, i) => (
                  <p key={`${lang.name}-${i}`}>
                    {lang.name}
                    <span className="doc-muted"> · {lang.level}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {cv.certifications.length > 0 && (
            <div className="doc-tile">
              <h2 className="doc-h2 doc-label doc-heading">Zertifikate</h2>
              <div className="space-y-1.5">
                {cv.certifications.map((cert, i) => (
                  <div key={`${cert.name}-${i}`} className="text-[0.92em]">
                    <p className="font-medium">{cert.name}</p>
                    <p className="doc-mono doc-muted text-[0.8em]">
                      {[cert.issuer, formatMonth(cert.date)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main>
          {cv.experience.length > 0 && (
            <section>
              <h2 className="doc-h2 doc-label doc-heading">Berufserfahrung</h2>
              {cv.experience.map((job, i) => (
                <ExperienceEntry key={`${job.company}-${i}`} job={job} />
              ))}
            </section>
          )}

          {cv.projects.length > 0 && (
            <Section title="Projekte">
              {cv.projects.map((project, i) => (
                <div key={`${project.name}-${i}`} className="doc-entry">
                  <EntryHead
                    left={project.name}
                    right={project.url ? displayUrl(project.url) : undefined}
                  />
                  <p className="doc-muted">{project.description}</p>
                  <MetaList items={project.technologies} />
                </div>
              ))}
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
                  <p className="doc-accent text-[0.9em] font-medium">{entry.institution}</p>
                  <Bullets items={entry.details} />
                </div>
              ))}
            </Section>
          )}
        </main>
      </div>
    </DocShell>
  );
}
