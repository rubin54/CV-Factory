import { Card } from "@/components/ui";
import type { CallUsage } from "@/lib/cv-schema";
import {
  USAGE_LABELS,
  formatDuration,
  formatTokens,
  formatUsd,
  totalCost,
} from "@/lib/format";

/**
 * What this application has cost so far. Deliberately per call rather than one
 * total: only that shows you a re-tailoring costing as much again as the first
 * cut, and that the cover letter is the cheap part.
 */
export function UsageCard({ usage }: { usage: CallUsage[] }) {
  const real = usage.filter((entry) => !entry.fixture);
  const total = totalCost(usage);

  return (
    <Card title={`Aufwand · ${usage.length}`} collapsible defaultOpen={false}>
      {usage.length === 0 ? (
        <p className="text-[13px] text-faint">Noch nichts aufgezeichnet.</p>
      ) : (
        <>
          <p className="mb-3 text-[13px] text-muted">
            <strong className="text-ink tabular-nums">{formatUsd(total)}</strong> geschätzt über{" "}
            {real.length} echte{real.length === 1 ? "n" : ""} Aufruf
            {real.length === 1 ? "" : "e"}
            {usage.length > real.length && ` (${usage.length - real.length} aus Fixtures)`}.
          </p>
          <ul className="divide-y divide-line rounded-md border border-line">
            {[...usage].reverse().map((entry, i) => (
              <li key={i} className="px-3 py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-ink">
                    {USAGE_LABELS[entry.kind]}
                    {entry.fixture && (
                      <span className="ml-1.5 text-[11px] text-faint">Fixture</span>
                    )}
                  </span>
                  <span className="shrink-0 text-[13px] font-medium tabular-nums text-ink">
                    {formatUsd(entry.costUsd)}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-faint tabular-nums">
                  <span>{new Date(entry.at).toLocaleString("de-DE")}</span>
                  {!entry.fixture && (
                    <>
                      <span>{formatDuration(entry.ms)}</span>
                      <span>
                        ein {formatTokens(entry.inputTokens)} · aus{" "}
                        {formatTokens(entry.outputTokens)}
                        {entry.cacheReadTokens > 0 &&
                          ` · Cache ${formatTokens(entry.cacheReadTokens)}`}
                      </span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-faint">
            Schätzung aus der Preistabelle in lib/claude.ts — keine abgerechneten Beträge.
          </p>
        </>
      )}
    </Card>
  );
}
