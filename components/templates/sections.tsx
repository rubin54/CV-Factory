import type { ReactNode } from "react";

import type { Cv } from "@/lib/cv-schema";
import { SECTION_LABELS, type Design, type SectionId } from "@/lib/design";
import { displayUrl, formatMonth, formatRange } from "@/lib/format";
import {
  Bullets,
  ContactBlock,
  EntryHead,
  ExternalLink,
  Icon,
  MetaList,
  SectionTitle,
  type SectionVariant,
} from "./shared";

/**
 * A section = content + presentation variant. Because the templates only pass
 * IDs through here, order and column assignment come from the design settings
 * instead of from the template.
 *
 * Empty sections render nothing — no heading without content.
 */
export function SectionBlock({
  id,
  cv,
  design,
  variant,
  wrapper: Wrapper = PlainWrapper,
}: {
  id: SectionId;
  cv: Cv;
  design: Design;
  variant: SectionVariant;
  /** Lets templates wrap sections (in tinted tiles, for instance). */
  wrapper?: (props: { children: ReactNode }) => ReactNode;
}) {
  const body = renderBody(id, cv, design, variant);
  if (!body) return null;

  // In the timeline layout the heading carries a full rule and sits above the
  // grid; otherwise it sits directly on top of the content.
  return (
    <Wrapper>
      <section className="doc-section">
        <SectionTitle>{SECTION_LABELS[id]}</SectionTitle>
        {body}
      </section>
    </Wrapper>
  );
}

function PlainWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function renderBody(
  id: SectionId,
  cv: Cv,
  design: Design,
  variant: SectionVariant,
): ReactNode | null {
  switch (id) {
    case "summary":
      return cv.basics.summary ? <Summary text={cv.basics.summary} variant={variant} /> : null;
    case "experience":
      return cv.experience.length ? <ExperienceList cv={cv} variant={variant} /> : null;
    case "projects":
      return cv.projects.length ? <ProjectList cv={cv} variant={variant} /> : null;
    case "skills":
      return cv.skills.length ? <SkillList cv={cv} variant={variant} /> : null;
    case "education":
      return cv.education.length ? <EducationList cv={cv} variant={variant} /> : null;
    case "certifications":
      return cv.certifications.length ? <CertificationList cv={cv} variant={variant} /> : null;
    case "languages":
      return cv.languages.length ? <LanguageList cv={cv} variant={variant} /> : null;
    case "links":
      return cv.basics.links.length ? (
        <LinkList cv={cv} design={design} variant={variant} />
      ) : null;
  }
}

/** Row in the timeline layout: left column (date range), right column (content). */
function TimelineRow({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="doc-entry doc-timeline">
      <span className="doc-mono doc-muted pt-[0.2em] text-[0.8em]">{label ?? ""}</span>
      <div>{children}</div>
    </div>
  );
}

function Summary({ text, variant }: { text: string; variant: SectionVariant }) {
  if (variant === "timeline") {
    return (
      <div className="doc-timeline">
        <span />
        <p>{text}</p>
      </div>
    );
  }
  return <p>{text}</p>;
}

function ExperienceList({ cv, variant }: { cv: Cv; variant: SectionVariant }) {
  return (
    <>
      {cv.experience.map((job, i) => {
        const body = (
          <>
            {variant === "timeline" ? (
              <p className="font-semibold">{job.role}</p>
            ) : (
              <EntryHead left={job.role} right={formatRange(job.startDate, job.endDate)} />
            )}
            <p className="doc-accent text-[0.9em] font-medium">
              {[job.company, job.location].filter(Boolean).join(" · ")}
            </p>
            {job.summary && <p className="doc-muted mt-1">{job.summary}</p>}
            <Bullets items={job.bullets} />
            <MetaList items={job.technologies} />
          </>
        );

        return variant === "timeline" ? (
          <TimelineRow key={`${job.company}-${i}`} label={formatRange(job.startDate, job.endDate)}>
            {body}
          </TimelineRow>
        ) : (
          <div key={`${job.company}-${i}`} className="doc-entry">
            {body}
          </div>
        );
      })}
    </>
  );
}

function ProjectList({ cv, variant }: { cv: Cv; variant: SectionVariant }) {
  if (variant === "aside") {
    return (
      <div className="space-y-1.5">
        {cv.projects.map((project, i) => (
          <div key={`${project.name}-${i}`} className="doc-entry text-[0.92em]">
            <p className="font-medium">{project.name}</p>
            <p className="doc-muted">{project.description}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {cv.projects.map((project, i) => {
        const body = (
          <>
            <EntryHead
              left={project.name}
              right={project.url ? displayUrl(project.url) : undefined}
            />
            <p className="doc-muted">{project.description}</p>
            <MetaList items={project.technologies} />
          </>
        );
        return variant === "timeline" ? (
          <TimelineRow key={`${project.name}-${i}`}>{body}</TimelineRow>
        ) : (
          <div key={`${project.name}-${i}`} className="doc-entry">
            {body}
          </div>
        );
      })}
    </>
  );
}

function SkillList({ cv, variant }: { cv: Cv; variant: SectionVariant }) {
  if (variant === "timeline") {
    return (
      <div className="space-y-1">
        {cv.skills.map((group, i) => (
          <div key={`${group.category}-${i}`} className="doc-entry doc-timeline">
            <span className="doc-mono doc-muted pt-[0.1em] text-[0.8em]">{group.category}</span>
            <p>{group.items.join("  ·  ")}</p>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "aside") {
    return (
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
    );
  }

  return (
    <div className="doc-skill-grid">
      {cv.skills.map((group, i) => (
        <div key={`${group.category}-${i}`} className="contents">
          <span className="doc-muted font-semibold">{group.category}</span>
          <span>{group.items.join("  ·  ")}</span>
        </div>
      ))}
    </div>
  );
}

function EducationList({ cv, variant }: { cv: Cv; variant: SectionVariant }) {
  return (
    <>
      {cv.education.map((entry, i) => {
        const title = [entry.degree, entry.field].filter(Boolean).join(" ");
        const body = (
          <>
            {variant === "timeline" ? (
              <p className="font-semibold">{title}</p>
            ) : (
              <EntryHead left={title} right={formatRange(entry.startDate, entry.endDate)} />
            )}
            <p className="doc-accent text-[0.9em] font-medium">{entry.institution}</p>
            <Bullets items={entry.details} />
          </>
        );
        return variant === "timeline" ? (
          <TimelineRow
            key={`${entry.institution}-${i}`}
            label={formatRange(entry.startDate, entry.endDate)}
          >
            {body}
          </TimelineRow>
        ) : (
          <div key={`${entry.institution}-${i}`} className="doc-entry">
            {body}
          </div>
        );
      })}
    </>
  );
}

function CertificationList({ cv, variant }: { cv: Cv; variant: SectionVariant }) {
  if (variant === "aside") {
    return (
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
    );
  }

  return (
    <>
      {cv.certifications.map((cert, i) =>
        variant === "timeline" ? (
          <TimelineRow key={`${cert.name}-${i}`} label={formatMonth(cert.date)}>
            <span className="font-medium">{cert.name}</span>
            {cert.issuer && <span className="doc-muted"> · {cert.issuer}</span>}
          </TimelineRow>
        ) : (
          <div key={`${cert.name}-${i}`} className="doc-entry">
            <EntryHead left={cert.name} right={formatMonth(cert.date)} />
            {cert.issuer && <p className="doc-muted text-[0.9em]">{cert.issuer}</p>}
          </div>
        ),
      )}
    </>
  );
}

function LanguageList({ cv, variant }: { cv: Cv; variant: SectionVariant }) {
  if (variant === "aside") {
    return (
      <div className="space-y-0.5 text-[0.92em]">
        {cv.languages.map((lang, i) => (
          <p key={`${lang.name}-${i}`}>
            {lang.name}
            <span className="doc-muted"> · {lang.level}</span>
          </p>
        ))}
      </div>
    );
  }

  const line = cv.languages.map((lang) => `${lang.name} (${lang.level})`).join("  ·  ");
  return variant === "timeline" ? (
    <div className="doc-timeline">
      <span />
      <p>{line}</p>
    </div>
  ) : (
    <p>{line}</p>
  );
}

function LinkList({
  cv,
  design,
  variant,
}: {
  cv: Cv;
  design: Design;
  variant: SectionVariant;
}) {
  if (variant === "aside") {
    return (
      <div className="doc-mono space-y-0.5 text-[0.8em] break-words">
        {cv.basics.links.map((link, i) => (
          <p key={`${link.url}-${i}`} className="flex items-baseline gap-1.5">
            {design.showIcons && <Icon name="link" />}
            <ExternalLink url={link.url} label={link.label} />
          </p>
        ))}
      </div>
    );
  }

  const line = (
    <p className="doc-mono flex flex-wrap items-baseline gap-x-3 text-[0.8em]">
      {cv.basics.links.map((link, i) => (
        <span key={`${link.url}-${i}`} className="inline-flex items-baseline gap-1">
          {design.showIcons && <Icon name="link" />}
          <ExternalLink url={link.url} label={link.label} />
        </span>
      ))}
    </p>
  );

  return variant === "timeline" ? (
    <div className="doc-timeline">
      <span />
      {line}
    </div>
  ) : (
    line
  );
}

/** Contact details live in the header, not as a sortable section. */
export { ContactBlock };
