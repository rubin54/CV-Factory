import {
  APPLICATION_STATUSES,
  STATUS_META,
  type ApplicationStatus,
} from "@/lib/cv-schema";

type Tone = (typeof STATUS_META)[ApplicationStatus]["tone"];

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-line bg-sunken text-muted",
  accent: "border-accent/30 bg-accent-soft text-accent",
  ok: "border-ok/30 bg-ok-soft text-ok",
  warn: "border-warn/30 bg-warn-soft text-warn",
  danger: "border-danger/30 bg-danger-soft text-danger",
};

/** Colour-coded status label. Server component — used in lists as well. */
export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[11px] font-medium ${TONE_CLASS[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
}

/**
 * All statuses as one row of buttons instead of a dropdown: there are five of
 * them and the whole point is seeing at a glance where an application stands.
 */
export function StatusPicker({
  value,
  onChange,
  disabled,
}: {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Status">
      {APPLICATION_STATUSES.map((status) => {
        const meta = STATUS_META[status];
        const active = status === value;
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(status)}
            className={`rounded-md border px-2 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${
              active
                ? TONE_CLASS[meta.tone]
                : "border-line bg-surface text-faint hover:bg-sunken hover:text-ink"
            }`}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
