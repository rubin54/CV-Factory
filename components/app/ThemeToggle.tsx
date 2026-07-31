"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * The script in `layout.tsx` sets `data-theme` before the first paint — here it
 * is only read and toggled, so nothing flashes.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("cv-factory-theme", next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Zu hell wechseln" : "Zu dunkel wechseln"}
      aria-label={theme === "dark" ? "Zu hell wechseln" : "Zu dunkel wechseln"}
      className="flex size-8 items-center justify-center rounded-md text-faint transition hover:bg-sunken hover:text-ink"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M13.5 9.4A5.8 5.8 0 0 1 6.6 2.5a5.8 5.8 0 1 0 6.9 6.9Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="3.1" />
      <path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1" />
    </svg>
  );
}
