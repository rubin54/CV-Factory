import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";

/**
 * Rahmen jeder Seite: Seitenleiste links, darin die Navigation mit aktivem
 * Zustand, rechts eine Kopfzeile und der Inhalt.
 *
 * Die Kopfzeile klebt oben — bei den langen Editorseiten weiß man sonst nach
 * ein paar Bildschirmhöhen nicht mehr, wo man ist.
 */
export function AppShell({
  title,
  subtitle,
  toolbar,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  /** Aktionen rechts in der Kopfzeile. */
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-line bg-app/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="truncate text-xs text-muted">{subtitle}</p>
              )}
            </div>
            {toolbar && <div className="flex shrink-0 items-center gap-2">{toolbar}</div>}
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-5 py-5">{children}</main>
      </div>
    </div>
  );
}
