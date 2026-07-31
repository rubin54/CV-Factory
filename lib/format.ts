import type { CallUsage } from "./cv-schema";

/** "2021-03" -> "03/2021". Anything else is returned unchanged. */
export function formatMonth(value: string | null, fallback = ""): string {
  if (!value) return fallback;
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  return match ? `${match[2]}/${match[1]}` : value;
}

/** "03/2021 – heute" */
export function formatRange(start: string | null, end: string | null): string {
  const from = formatMonth(start);
  const to = formatMonth(end, "heute");
  if (!from) return to === "heute" ? "" : to;
  return `${from} – ${to}`;
}

/** Strips the protocol for display; the href keeps it. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function withProtocol(url: string): string {
  return /^[a-z]+:/i.test(url) ? url : `https://${url}`;
}

/* --- What a Claude call cost ----------------------------------------------- */

/** 1240 -> "1,2k". The exact count is noise; the order of magnitude is not. */
export function formatTokens(count: number): string {
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(1).replace(".", ",")}k`;
}

/** Below a cent an exact figure is misleading — the estimate is not that good. */
export function formatUsd(amount: number): string {
  if (amount === 0) return "$0";
  if (amount < 0.01) return "<$0,01";
  return `$${amount.toFixed(2).replace(".", ",")}`;
}

/** 94_300 -> "1:34 min". Calls run for minutes, so seconds alone read badly. */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")} min` : `${seconds} s`;
}

export const USAGE_LABELS: Record<CallUsage["kind"], string> = {
  extract: "Notizen eingearbeitet",
  import: "Lebenslauf importiert",
  tailor: "Zugeschnitten",
  "cover-letter": "Anschreiben",
};

/** What an application has cost in total so far. */
export function totalCost(usage: CallUsage[]): number {
  return usage.reduce((sum, entry) => sum + entry.costUsd, 0);
}

/** One line for a toast: "12,4k → 3,1k Tokens · 1:47 min · $0,31" */
export function summarizeUsage(usage: CallUsage): string {
  if (usage.fixture) return "aus Fixture — kein API-Aufruf";
  const inputTotal = usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
  return [
    `${formatTokens(inputTotal)} → ${formatTokens(usage.outputTokens)} Tokens`,
    formatDuration(usage.ms),
    formatUsd(usage.costUsd),
  ].join(" · ");
}
