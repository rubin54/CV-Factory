"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "ok" | "error";
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{
  ok: (message: string) => void;
  error: (message: string) => void;
} | null>(null);

/**
 * Kurze Einblendungen statt Banner im Inhalt: eine Erfolgsmeldung soll nicht
 * das halbe Formular nach unten schieben und danach stehen bleiben.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.floor(performance.now() * 1000) % 1000;
    setToasts((current) => [...current, { id, kind, message }]);
    // Fehler bleiben länger stehen — die will man wirklich lesen.
    const ttl = kind === "error" ? 9000 : 4000;
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), ttl);
  }, []);

  const api = useMemo(
    () => ({
      ok: (message: string) => push("ok", message),
      error: (message: string) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg ${
              toast.kind === "error"
                ? "border-danger/30 bg-danger-soft text-danger"
                : "border-ok/30 bg-ok-soft text-ok"
            }`}
          >
            <span className="mt-px shrink-0">{toast.kind === "error" ? "!" : "✓"}</span>
            <span className="flex-1 whitespace-pre-wrap">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToasts((c) => c.filter((t) => t.id !== toast.id))}
              className="shrink-0 opacity-50 transition hover:opacity-100"
              aria-label="Schließen"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast benötigt einen ToastProvider");
  return context;
}
