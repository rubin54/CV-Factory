/** "2021-03" -> "03/2021". Alles andere kommt unverändert zurück. */
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

/** Entfernt das Protokoll für die Anzeige, behält es aber im href. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function withProtocol(url: string): string {
  return /^[a-z]+:/i.test(url) ? url : `https://${url}`;
}
