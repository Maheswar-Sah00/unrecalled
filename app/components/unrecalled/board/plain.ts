// Plain-language helpers for the board + detail screens (no jargon on screen).

/** "Death wobble (violent front-end shake)" -> { title: "Death wobble", aside: "Violent front-end shake" } */
export function splitModeName(name: string): { title: string; aside: string | null } {
  const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(name);
  if (!m || !m[1]) return { title: name, aside: null };
  const aside = m[2]!.trim();
  return { title: m[1].trim(), aside: aside.charAt(0).toUpperCase() + aside.slice(1) };
}

/** Why a recall / investigation / settlement counts as covering this problem. */
export function whyItCounts(matchedTerms: string[]): string {
  const cites = matchedTerms.find((t) => /^cites recall/i.test(t));
  if (cites) {
    const id = cites.replace(/^cites recall\s*/i, "").trim();
    return id ? `Follows up on recall ${id}` : "Follows up on an earlier recall";
  }
  return "Its summary mentions this problem";
}

/** Recall ids like "25V274000" -> "25V-274". Other ids are returned unchanged. */
export function prettyRefId(kind: string, id: string): string {
  if (kind === "recall") {
    const m = /^(\d{2}[A-Z])(\d{3})(?:000)?$/.exec(id);
    if (m) return `${m[1]}-${m[2]}`;
  }
  return id;
}

/** Months between two ISO dates, rounded. */
export function monthsBetween(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null;
  return Math.max(0, Math.round((tb - ta) / (30.44 * 864e5)));
}

export function spanLabel(months: number | null): string {
  if (months == null) return "";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const y = months / 12;
  return `${y >= 10 ? Math.round(y) : y.toFixed(1).replace(/\.0$/, "")} years`;
}
