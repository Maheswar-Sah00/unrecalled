// Date helpers. NHTSA uses three formats:
//   complaints  MM/DD/YYYY
//   recalls     DD/MM/YYYY (verified live 2026-11-05: "28/01/2021" for 21V028000)
//   flat files  YYYYMMDD
import type { Iso, MonthCount } from "./types.js";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function validYmd(y: number, m: number, d: number): Iso | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Accepts already-ISO ("YYYY-MM-DD", optionally with a time part) or "YYYYMMDD". */
function parseIsoish(s: string): Iso | null {
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return validYmd(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  if (m) return validYmd(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

function slashParts(s: string): [number, number, number] | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** MM/DD/YYYY -> ISO (complaints). Also passes through ISO / YYYYMMDD. */
export function parseUsDate(s: string | null | undefined): Iso | null {
  if (!s) return null;
  const t = String(s).trim();
  const p = slashParts(t);
  if (!p) return parseIsoish(t);
  return validYmd(p[2], p[0], p[1]);
}

/**
 * DD/MM/YYYY -> ISO (recalls). Handles both orders: if the first part is > 12
 * it must be the day; if the second part is > 12 it must be the day (MM/DD);
 * ambiguous values are read as DD/MM (the verified recall format).
 */
export function parseRecallDate(s: string | null | undefined): Iso | null {
  if (!s) return null;
  const t = String(s).trim();
  const p = slashParts(t);
  if (!p) return parseIsoish(t);
  const [a, b, y] = p;
  if (b > 12 && a <= 12) return validYmd(y, a, b); // MM/DD/YYYY
  return validYmd(y, b, a); // DD/MM/YYYY
}

/** "YYYYMMDD" -> ISO (flat files); empty -> null. */
export function parseYmd(s: string | null | undefined): Iso | null {
  if (!s) return null;
  const t = String(s).trim();
  if (!t) return null;
  return parseIsoish(t);
}

export function monthOf(iso: Iso | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}/.test(iso)) return null;
  return iso.slice(0, 7);
}

export function nextMonth(month: string): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return m === 12 ? `${y + 1}-01` : `${y}-${pad2(m + 1)}`;
}

/** Inclusive list of "YYYY-MM" months from `from` to `to`. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  if (from > to) return out;
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = nextMonth(cur);
  }
  return out;
}

/** Bucket ISO dates by month into a contiguous, zero-filled series (first..last month present). */
export function monthlySeries(dates: (Iso | null | undefined)[], range?: { from: string; to: string }): MonthCount[] {
  const counts = new Map<string, number>();
  for (const d of dates) {
    const m = monthOf(d);
    if (!m) continue;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  const keys = [...counts.keys()].sort();
  const from = range?.from ?? keys[0];
  const to = range?.to ?? keys[keys.length - 1];
  if (!from || !to) return [];
  return monthRange(from, to).map((month) => ({ month, count: counts.get(month) ?? 0 }));
}
