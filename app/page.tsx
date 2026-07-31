import Link from "next/link";

import { NewApplicationForm } from "@/components/NewApplicationForm";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui";
import { listApplications, readCv } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cv, applications] = await Promise.all([readCv(), listApplications()]);
  const hasMasterCv = Boolean(cv.basics.fullName);

  return (
    <PageShell
      title="Bewerbungen"
      subtitle="Pro Stellenanzeige eine zugeschnittene Variante aus dem Master-CV."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <NewApplicationForm disabled={!hasMasterCv} />

        <Card title={`Bisherige Bewerbungen (${applications.length})`}>
          {applications.length === 0 ? (
            <p className="text-sm text-slate-400">Noch keine.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.map((app) => (
                <li key={app.slug}>
                  <Link
                    href={`/applications/${app.slug}`}
                    className="flex items-baseline justify-between gap-4 py-2.5 hover:text-slate-900"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {app.role}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {app.company}
                        {app.gaps.length > 0 && (
                          <span className="ml-2 text-amber-700">
                            {app.gaps.length} Lücke{app.gaps.length === 1 ? "" : "n"}
                          </span>
                        )}
                        {app.coverLetter && (
                          <span className="ml-2 text-emerald-700">+ Anschreiben</span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(app.updatedAt).toLocaleDateString("de-DE")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
