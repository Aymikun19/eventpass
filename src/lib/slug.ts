export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "event"}-${Math.random().toString(36).slice(2, 6)}`;
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Lagos" });

/** "2026-11-20T15:00" in Lagos time, for a datetime-local input. */
export const toLagosInput = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

export const lagosParts = (iso: string) => {
  const d = new Date(iso);
  const opt = (o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-GB", { timeZone: "Africa/Lagos", ...o });
  return { day: opt({ day: "numeric" }), month: opt({ month: "short" }).toUpperCase(), time: opt({ hour: "2-digit", minute: "2-digit" }) };
};

/** Buckets timestamps into labelled slots (Lagos time) for charts. */
export function bucketByDay(isos: string[], days: number, end: Date) {
  const key = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const out: { label: string; value: number }[] = [];
  const idx = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86_400_000);
    idx.set(key(d), out.length);
    out.push({ label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" }), value: 0 });
  }
  for (const iso of isos) {
    const i = idx.get(key(new Date(iso)));
    if (i !== undefined) out[i].value++;
  }
  return out;
}

export function bucketByHalfHour(isos: string[]) {
  if (!isos.length) return [];
  const t = isos.map((i) => new Date(i).getTime()).sort((a, b) => a - b);
  const slot = 30 * 60 * 1000;
  const start = Math.floor(t[0] / slot) * slot;
  const n = Math.min(24, Math.floor((t[t.length - 1] - start) / slot) + 1);
  const out = Array.from({ length: n }, (_, i) => ({
    label: new Date(start + i * slot).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }),
    value: 0,
  }));
  for (const x of t) {
    const i = Math.floor((x - start) / slot);
    if (i < n) out[i].value++;
  }
  return out;
}
