import Link from "next/link";

import { AppShell } from "@/components/app/AppShell";
import { NewApplicationForm } from "@/components/NewApplicationForm";
import { Card, EmptyState } from "@/components/ui";
import { listApplications, readCv } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cv, applications] = await Promise.all([readCv(), listApplications()]);
  const hasMasterCv = Boolean(cv.basics.fullName);
  const withLetter = applications.filter((a) => a.coverLetter).length;
  const openGaps = applications.reduce((sum, a) => sum + a.gaps.length, 0);

  return (
    <AppShell
      title="Bewerbungen"
      subtitle="Pro Stellenanzeige eine zugeschnittene Variante aus dem Master-CV."
    >
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <NewApplicationForm disabled={!hasMasterCv} />

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Stat value={applications.length} label="Bewerbungen" />
            <Stat value={withLetter} label="mit Anschreiben" />
            <Stat value={openGaps} label="Lücken gesamt" tone={openGaps > 0 ? "warn" : "ok"} />
          </div>

          <Card title="Zuletzt bearbeitet">
            {applications.length === 0 ? (
              <EmptyState
                title="Noch keine Bewerbung"
                hint="Füge links eine Stellenanzeige ein — Claude schneidet den Master-CV darauf zu und zeigt dir, was fehlt."
              />
            ) : (
              <ul className="-my-1 divide-y divide-line">
                {applications.map((app) => (
                  <li key={app.slug}>
                    <Link
                      href={`/applications/${app.slug}`}
                      className="-mx-2 flex items-baseline justify-between gap-3 rounded px-2 py-2 transition hover:bg-sunken"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium">
                          {app.role}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {app.company}
                          {app.gaps.length > 0 && (
                            <span className="ml-2 text-warn">
                              {app.gaps.length} Lücke{app.gaps.length === 1 ? "" : "n"}
                            </span>
                          )}
                          {app.coverLetter && (
                            <span className="ml-2 text-ok">+ Anschreiben</span>
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] text-faint tabular-nums">
                        {new Date(app.updatedAt).toLocaleDateString("de-DE")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  value,
  label,
  tone = "neutral",
}: {
  value: number;
  label: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  const color = tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
      <p className={`text-xl font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{label}</p>
    </div>
  );
}
