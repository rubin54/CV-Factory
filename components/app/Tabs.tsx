"use client";

/** Schmale Reiterleiste — bricht bei wenig Platz um statt zu scrollen. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; badge?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-sunken p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
            value === tab.id
              ? "bg-surface text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className="text-[10px] text-faint tabular-nums">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
