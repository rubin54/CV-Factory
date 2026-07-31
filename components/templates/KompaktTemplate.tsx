import { formatMonth, formatRange, withProtocol, displayUrl } from "@/lib/format";
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
 * Kopfzeile über die volle Breite, darunter eine schmale Spalte für alles, was
 * man nur nachschlägt (Kontakt, Kenntnisse, Sprachen, Zertifikate), und rechts
 * der Fließtext.
 *
 * Der Haupttext bleibt dabei eine Spalte: für einen Parser liest sich das
 * Dokument als Seitenspalte-dann-Hauptteil, nicht als zerhackte Zeilen.
 */
export function KompaktTemplate({ cv, design, photoUrl }: TemplateProps) {
  const { basics } = cv;
  const hasAside =
    (design.showPhoto && Boolean(photoUrl)) ||
    contactItems(cv).length > 0 ||
    basics.links.length > 0 ||
    cv.skills.length > 0 ||
    cv.languages.length > 0 ||
    cv.certifications.length > 0;

  return (
    <DocShell design={design} template="kompakt">
      {/* Das Foto steht in der Seitenspalte, nicht in der Kopfzeile: dort würde
          es die Zeile auf Fotohöhe aufziehen und oben eine tote Fläche neben
          dem Namen hinterlassen. */}
      <header className="pb-4">
        <h1 className="doc-display text-[2.3em] leading-[1.05] font-bold tracking-[-0.025em]">
          {basics.fullName || "Name"}
        </h1>
        {basics.headline && (
          <p className="doc-accent mt-1 text-[1.1em] font-medium">{basics.headline}</p>
        )}
      </header>

      <div
        className={`border-t pt-4 ${hasAside ? "doc-columns" : ""}`}
        style={{ borderColor: "var(--accent)", borderTopWidth: "2px" }}
      >
        <aside className={hasAside ? "doc-aside" : "hidden"}>
          {design.showPhoto && photoUrl && (
            <div className="mb-4">
              <Photo url={photoUrl} design={design} size={38} />
            </div>
          )}

          {contactItems(cv).length > 0 && (
            <section>
              <h2 className="doc-h2 doc-label doc-heading">Kontakt</h2>
              <div className="doc-mono space-y-0.5 text-[0.8em] break-words">
                {contactItems(cv).map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </section>
          )}

          {basics.links.length > 0 && (
            <Section title="Online">
              <div className="doc-mono space-y-0.5 text-[0.8em] break-words">
                {basics.links.map((link, i) => (
                  <p key={`${link.url}-${i}`}>
                    <a href={withProtocol(link.url)}>
                      {link.label || displayUrl(link.url)}
                    </a>
                  </p>
                ))}
              </div>
            </Section>
          )}

          {cv.skills.length > 0 && (
            <Section title="Kenntnisse">
              <div className="space-y-2">
                {cv.skills.map((group, i) => (
                  <div key={`${group.category}-${i}`} className="doc-entry">
                    <p className="doc-mono doc-muted text-[0.75em] tracking-wide uppercase">
                      {group.category}
                    </p>
                    <p className="text-[0.92em]">{group.items.join(", ")}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {cv.languages.length > 0 && (
            <Section title="Sprachen">
              <div className="space-y-0.5 text-[0.92em]">
                {cv.languages.map((lang, i) => (
                  <p key={`${lang.name}-${i}`}>
                    {lang.name}
                    <span className="doc-muted"> · {lang.level}</span>
                  </p>
                ))}
              </div>
            </Section>
          )}

          {cv.certifications.length > 0 && (
            <Section title="Zertifikate">
              <div className="space-y-1.5">
                {cv.certifications.map((cert, i) => (
                  <div key={`${cert.name}-${i}`} className="doc-entry text-[0.92em]">
                    <p className="font-medium">{cert.name}</p>
                    <p className="doc-mono doc-muted text-[0.8em]">
                      {[cert.issuer, formatMonth(cert.date)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </aside>

        <main>
          {basics.summary && (
            <section>
              <h2 className="doc-h2 doc-label doc-heading">Profil</h2>
              <p>{basics.summary}</p>
            </section>
          )}

          {cv.experience.length > 0 && (
            <Section title="Berufserfahrung">
              {cv.experience.map((job, i) => (
                <ExperienceEntry key={`${job.company}-${i}`} job={job} />
              ))}
            </Section>
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
