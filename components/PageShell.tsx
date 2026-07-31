import Link from "next/link";
import type { ReactNode } from "react";

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <nav className="mb-6 flex items-center gap-5 text-sm">
        <Link href="/" className="font-semibold text-slate-900">
          CV Creator
        </Link>
        <Link href="/cv" className="text-slate-600 hover:text-slate-900">
          Master-CV
        </Link>
        <Link href="/design" className="text-slate-600 hover:text-slate-900">
          Design
        </Link>
      </nav>
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
