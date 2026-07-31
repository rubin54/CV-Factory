"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/app/Toast";
import { Button, Card } from "@/components/ui";

type BackupEntry = { stamp: string; savedAt: string; bytes: number };

/**
 * Every write leaves the previous state behind in `data/.backups/`. Without a
 * way back that is only half a safety net, so this lists the versions and puts
 * one of them back. The restore is itself a write and therefore backed up too —
 * clicking the wrong row costs nothing.
 */
export function BackupPanel({ target, note }: { target: string; note?: string }) {
  const [backups, setBackups] = useState<BackupEntry[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch(`/api/backups?target=${encodeURIComponent(target)}`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Sicherungen konnten nicht gelesen werden.");
      return;
    }
    setBackups(data.backups);
  }, [target, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(stamp: string) {
    if (!confirm("Diesen Stand wiederherstellen? Der aktuelle wird vorher gesichert.")) return;
    setBusy(stamp);
    try {
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, stamp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Wiederherstellen fehlgeschlagen.");
      toast.ok("Stand wiederhergestellt.");
      await load();
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const count = backups?.length ?? 0;

  return (
    <Card
      title={`Sicherungen${count ? ` · ${count}` : ""}`}
      collapsible
      defaultOpen={false}
      actions={
        <Button size="sm" variant="ghost" onClick={() => void load()}>
          Aktualisieren
        </Button>
      }
    >
      <p className="mb-3 text-xs text-faint">
        Vor jedem Speichern wird der vorherige Stand abgelegt, die letzten 25 bleiben erhalten.
        {note ? ` ${note}` : ""}
      </p>
      {backups === null ? (
        <p className="text-[13px] text-faint">Wird geladen …</p>
      ) : backups.length === 0 ? (
        <p className="text-[13px] text-faint">Noch nichts gesichert — es gab erst einen Stand.</p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {backups.map((backup, index) => (
            <li key={backup.stamp} className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 text-[13px] text-ink">
                {formatStamp(backup.savedAt)}
                {index === 0 && (
                  <span className="ml-2 text-[11px] text-faint">zuletzt ersetzt</span>
                )}
              </span>
              <span className="text-[11px] text-faint tabular-nums">
                {(backup.bytes / 1024).toFixed(1)} kB
              </span>
              <Button
                size="sm"
                onClick={() => void restore(backup.stamp)}
                pending={busy === backup.stamp}
                disabled={busy !== null}
              >
                Wiederherstellen
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
