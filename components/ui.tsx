"use client";

import { useState, type ReactNode } from "react";

export function Button({
  children,
  onClick,
  type = "button",
  variant = "secondary",
  size = "md",
  disabled,
  pending,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  pending?: boolean;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-45";
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1.5 text-[13px]",
  } as const;
  const variants = {
    primary: "bg-accent text-accent-text hover:opacity-90",
    secondary: "border border-line-strong bg-surface text-ink hover:bg-sunken",
    ghost: "text-muted hover:bg-sunken hover:text-ink",
    danger: "text-danger hover:bg-danger-soft",
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || pending}
      title={title}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
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
      className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

const inputClass =
  "w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-accent";

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
      <span className="mb-1 block text-[11px] font-medium text-muted">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
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
      <span className="mb-1 block text-[11px] font-medium text-muted">
        {label}
        {hint && <span className="ml-2 font-normal text-faint">{hint}</span>}
      </span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-y leading-relaxed`}
      />
    </label>
  );
}

/**
 * string[] as a textarea with one line per entry. For bullets, tech lists and
 * details that is faster to work with than one input field per line.
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
  id,
  collapsible = false,
  defaultOpen = true,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
  /** Collapsible — against the endless scroll in the editor and design panel. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;

  return (
    <section
      id={id}
      className="scroll-mt-20 rounded-lg border border-line bg-surface shadow-[var(--app-shadow)]"
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-4 py-2.5">
          {title ? (
            collapsible ? (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="-mx-1 flex items-center gap-1.5 rounded px-1 text-[13px] font-semibold text-ink"
                aria-expanded={isOpen}
              >
                <span
                  aria-hidden
                  className={`text-faint transition-transform ${isOpen ? "rotate-90" : ""}`}
                >
                  ›
                </span>
                {title}
              </button>
            ) : (
              <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
            )
          ) : (
            <span />
          )}
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      {isOpen && (
        <div className={`px-4 pb-4 ${title || actions ? "" : "pt-4"}`}>{children}</div>
      )}
    </section>
  );
}

/** Repeatable list with add, remove and reorder. */
export function Repeatable<T>({
  label,
  items,
  onChange,
  create,
  render,
  summary,
  id,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  summary?: (item: T, index: number) => string;
  id?: string;
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
      id={id}
      title={`${label}${items.length ? ` · ${items.length}` : ""}`}
      collapsible
      actions={
        <Button size="sm" onClick={() => onChange([...items, create()])}>
          Hinzufügen
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="text-[13px] text-faint">Noch nichts erfasst.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-md border border-line bg-sunken/40 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-medium text-muted">
                  {summary?.(item, index) || `#${index + 1}`}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    title="Nach oben"
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    title="Nach unten"
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
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

/** Empty state with a call to action instead of a bare "none yet". */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center">
      <p className="text-[13px] font-medium text-muted">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-xs text-faint">{hint}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}
