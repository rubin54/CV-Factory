"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Bewerbungen", icon: <StackIcon /> },
  { href: "/cv", label: "Master-CV", icon: <DocIcon /> },
  { href: "/design", label: "Design", icon: <PaletteIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-dvh w-14 shrink-0 flex-col items-center gap-1 border-r border-line bg-surface py-3 lg:w-52 lg:items-stretch lg:px-3">
      <Link
        href="/"
        className="mb-3 flex items-center gap-2 rounded-md px-1 py-1 lg:px-2"
        title="CV Factory"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded bg-accent text-[13px] font-bold text-accent-text">
          CV
        </span>
        <span className="hidden text-sm font-semibold tracking-tight lg:block">Factory</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map((item) => {
          // "/" darf nicht bei jedem Pfad aktiv sein.
          const active =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/applications")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition ${
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:bg-sunken hover:text-ink"
              }`}
            >
              <span className="grid size-5 shrink-0 place-items-center">{item.icon}</span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex justify-center lg:justify-start">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function iconProps() {
  return {
    viewBox: "0 0 16 16",
    className: "size-[17px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function StackIcon(): ReactNode {
  return (
    <svg {...iconProps()}>
      <rect x="2.2" y="2.4" width="11.6" height="4" rx="1" />
      <rect x="2.2" y="9.6" width="11.6" height="4" rx="1" />
    </svg>
  );
}

function DocIcon(): ReactNode {
  return (
    <svg {...iconProps()}>
      <path d="M4 1.8h5l3 3v9.4H4Z" />
      <path d="M9 1.8v3h3M6 8.4h4M6 11h3" />
    </svg>
  );
}

function PaletteIcon(): ReactNode {
  return (
    <svg {...iconProps()}>
      <path d="M8 1.8a6.2 6.2 0 0 0 0 12.4c.9 0 1.4-.6 1.4-1.3 0-.8-.7-1.2-.7-1.9 0-.6.5-1 1.1-1h1.3a3.1 3.1 0 0 0 3.1-3.1C14.2 4 11.4 1.8 8 1.8Z" />
      <circle cx="5.4" cy="6.2" r=".9" fill="currentColor" stroke="none" />
      <circle cx="8" cy="4.6" r=".9" fill="currentColor" stroke="none" />
      <circle cx="10.7" cy="6" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}
