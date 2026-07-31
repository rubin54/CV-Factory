"use client";

import type { ReactNode } from "react";

export function Button({
  children,
  onClick,
  type = "button",
  variant = "secondary",
  disabled,
  pending,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  pending?: boolean;
  title?: string;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-200/60",
    danger: "text-red-700 hover:bg-red-50",
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || pending}
      title={title}
      className={`${base} ${variants[variant]}`}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-slate-500"
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {hint && <span className="ml-2 font-normal text-slate-400">{hint}</span>}
      </span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-slate-500"
      />
    </label>
  );
}

/**
 * string[] als Textarea mit einer Zeile pro Eintrag. Für Stichpunkte, Tech-Listen
 * und Details ist das schneller zu bedienen als einzelne Input-Felder pro Zeile.
 */
export function StringList({
  label,
  values,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <TextArea
      label={label}
      hint="ein Eintrag pro Zeile"
      rows={rows}
      placeholder={placeholder}
      value={values.join("\n")}
      onChange={(text) =>
        onChange(
          text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

export function Card({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

/** Wiederholbare Liste mit Hinzufügen, Entfernen und Verschieben. */
export function Repeatable<T>({
  label,
  items,
  onChange,
  create,
  render,
  summary,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  summary?: (item: T, index: number) => string;
}) {
  const replace = (index: number, patch: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Card
      title={label}
      actions={
        <Button onClick={() => onChange([...items, create()])}>+ Hinzufügen</Button>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Noch nichts erfasst.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-md border border-slate-200 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-slate-500">
                  {summary?.(item, index) || `#${index + 1}`}
                </span>
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    title="Nach oben"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    title="Nach unten"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                    title="Entfernen"
                  >
                    Entfernen
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {render(item, (patch) => replace(index, patch))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm whitespace-pre-wrap text-red-800">
      {message}
    </p>
  );
}
