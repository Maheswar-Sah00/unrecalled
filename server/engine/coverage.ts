// Coverage: which recalls / investigations / settlements address a failure mode, per model year.
import { compilePattern } from "./classify.js";
import type { CoverageRef, CoverageResult, CoverageStatus, FailureMode, Investigation, Recall, Settlement } from "./types.js";

/** Strongest first. */
export const STATUS_ORDER: CoverageStatus[] = ["recalled", "under_investigation", "settlement", "closed_no_recall", "uncovered"];
const rank = (s: CoverageStatus) => STATUS_ORDER.indexOf(s);

export function strongest(statuses: CoverageStatus[]): CoverageStatus {
  let best: CoverageStatus = "uncovered";
  for (const s of statuses) if (rank(s) < rank(best)) best = s;
  return best;
}

export function weakest(statuses: CoverageStatus[]): CoverageStatus {
  let worst: CoverageStatus = "recalled";
  if (statuses.length === 0) return "uncovered";
  for (const s of statuses) if (rank(s) > rank(worst)) worst = s;
  return worst;
}

/** Which coverageTerms match the text (deduped, in mode order). */
export function matchedTerms(mode: FailureMode, text: string): string[] {
  return mode.coverageTerms.filter((t) => compilePattern(t)?.test(text) ?? false);
}

export function investigationStatus(inv: Investigation): CoverageStatus {
  if (inv.status === "open") return "under_investigation";
  return inv.outcome === "recall" ? "recalled" : "closed_no_recall";
}

/** "25V274000" / "25V-274" / "25v 274" -> "25V274". */
export function recallKey(id: string): string | null {
  const m = /(\d{2})\s*V\s*-?\s*(\d{3})/i.exec(id);
  return m ? `${m[1]}V${m[2]}` : null;
}

/** Normalised recall numbers cited in a piece of text. */
export function citedRecalls(text: string): string[] {
  return [...new Set([...text.matchAll(/\b(\d{2})V[-\s]?(\d{3})\b/gi)].map((m) => `${m[1]}V${m[2]}`.toUpperCase()))];
}

function rangeYears(from: number, to: number, years: number[]): number[] {
  return years.filter((y) => y >= from && y <= to);
}

/**
 * Coverage of one mode across the scan years.
 * - recall: about the mode when any coverageTerm matches summary+consequence+remedy; covers its modelYear
 * - investigation: about the mode when any coverageTerm matches subject+summary, or when it cites a recall
 *   that already matched this mode (remedy-effectiveness probes, e.g. EA26005 on recall 25V-274); covers yearFrom..yearTo
 * The NHTSA component label is NOT matched (labels like "FORWARD COLLISION AVOIDANCE: WARNINGS" caused false coverage).
 * - settlement: covers yearFrom..yearTo when its failureModeId === mode.id
 * Inputs are assumed already filtered to the vehicle (make/model); scan() does that.
 * Refs with the same kind+id are merged (years unioned).
 */
export function coverageFor(
  mode: FailureMode,
  years: number[],
  recalls: Recall[],
  investigations: Investigation[],
  settlements: Settlement[],
): CoverageResult {
  const refs = new Map<string, CoverageRef>();
  const addRef = (ref: CoverageRef) => {
    if (ref.years.length === 0) return;
    const key = `${ref.kind}:${ref.id}`;
    const prev = refs.get(key);
    if (!prev) {
      refs.set(key, ref);
      return;
    }
    prev.years = [...new Set([...prev.years, ...ref.years])].sort((a, b) => a - b);
    prev.matchedTerms = [...new Set([...prev.matchedTerms, ...ref.matchedTerms])];
    if (rank(ref.status) < rank(prev.status)) prev.status = ref.status;
  };

  for (const r of recalls) {
    const terms = matchedTerms(mode, [r.summary, r.consequence, r.remedy].join("\n"));
    if (terms.length === 0) continue;
    addRef({
      kind: "recall",
      id: r.campaign,
      title: `${r.campaign}: ${r.component}`.trim(),
      date: r.reportDate || null,
      url: r.campaign ? `https://www.nhtsa.gov/recalls?nhtsaId=${encodeURIComponent(r.campaign)}` : null,
      years: years.includes(r.modelYear) ? [r.modelYear] : [],
      status: "recalled",
      matchedTerms: terms,
    });
  }

  const matchedRecalls = new Set(
    [...refs.values()]
      .filter((r) => r.kind === "recall")
      .map((r) => recallKey(r.id))
      .filter((k): k is string => !!k),
  );
  for (const inv of investigations) {
    const text = [inv.subject, inv.summary].join("\n");
    let terms = matchedTerms(mode, text);
    if (terms.length === 0) {
      terms = citedRecalls(text)
        .filter((k) => matchedRecalls.has(k))
        .map((k) => `cites recall ${k.slice(0, 3)}-${k.slice(3)}`);
    }
    if (terms.length === 0) continue;
    addRef({
      kind: "investigation",
      id: inv.actionNumber,
      title: `${inv.actionNumber}: ${inv.subject}`.trim(),
      date: inv.status === "closed" ? inv.closeDate : inv.openDate,
      url: inv.url,
      years: rangeYears(inv.yearFrom, inv.yearTo, years),
      status: investigationStatus(inv),
      matchedTerms: terms,
    });
  }

  for (const s of settlements) {
    if (s.failureModeId !== mode.id) continue;
    addRef({
      kind: "settlement",
      id: s.id,
      title: s.name,
      date: null,
      url: s.url || null,
      years: rangeYears(s.yearFrom, s.yearTo, years),
      status: "settlement",
      matchedTerms: [],
    });
  }

  const refList = [...refs.values()].sort((a, b) => rank(a.status) - rank(b.status) || a.id.localeCompare(b.id));
  const byYear = [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const covering = refList.filter((r) => r.years.includes(year));
      return { year, status: strongest(covering.map((r) => r.status)), refIds: covering.map((r) => r.id) };
    });
  return { byYear, refs: refList };
}
