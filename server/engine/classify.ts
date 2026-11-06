// Regex failure-mode classifier with human label overrides.
import type { Complaint, ComplaintLabel, FailureMode, MatchSpan } from "./types.js";

const regexCache = new Map<string, RegExp | null>();

/** Compile a user-supplied regex source (case-insensitive). Invalid patterns return null and are skipped. */
export function compilePattern(source: string, global = false): RegExp | null {
  const key = `${global ? "g" : ""}\u0001${source}`;
  if (regexCache.has(key)) {
    const r = regexCache.get(key) ?? null;
    if (r) r.lastIndex = 0;
    return r;
  }
  let re: RegExp | null = null;
  try {
    re = new RegExp(source, global ? "gi" : "i");
  } catch {
    console.warn(`[unrecalled] invalid regex skipped: ${source}`);
  }
  regexCache.set(key, re);
  return re;
}

/** Text a complaint is matched against. */
export function complaintText(c: Complaint): string {
  return c.summary ?? "";
}

/** Pure regex verdict (no labels): any include matches and no exclude matches. */
export function matchesMode(c: Complaint, mode: FailureMode): boolean {
  const text = complaintText(c);
  if (!text) return false;
  const inc = mode.include.some((s) => compilePattern(s)?.test(text) ?? false);
  if (!inc) return false;
  return !mode.exclude.some((s) => compilePattern(s)?.test(text) ?? false);
}

/**
 * Classify complaints into failure modes. A complaint can match several modes.
 * Labels override the regexes: verdict "include" forces the complaint into that mode,
 * "exclude" forces it out. Result has an entry (possibly empty) for every mode.
 * componentHints are informational only (NHTSA component coding is unreliable).
 */
export function classify(complaints: Complaint[], modes: FailureMode[], labels: ComplaintLabel[]): Map<string, Complaint[]> {
  const labelMap = new Map<string, ComplaintLabel["verdict"]>();
  for (const l of labels) labelMap.set(`${l.failureModeId}\u0001${l.odiNumber}`, l.verdict);
  const out = new Map<string, Complaint[]>();
  for (const mode of modes) {
    const list: Complaint[] = [];
    for (const c of complaints) {
      const verdict = labelMap.get(`${mode.id}\u0001${c.odiNumber}`);
      if (verdict === "exclude") continue;
      if (verdict === "include" || matchesMode(c, mode)) list.push(c);
    }
    out.set(mode.id, list);
  }
  return out;
}

/** Spans of the complaint summary matched by the mode's include patterns (for UI highlighting), sorted by start. */
export function explainMatch(complaint: Complaint, mode: FailureMode): MatchSpan[] {
  const text = complaintText(complaint);
  const spans: MatchSpan[] = [];
  for (const pattern of mode.include) {
    const re = compilePattern(pattern, true);
    if (!re) continue;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      spans.push({ pattern, start: m.index, end: m.index + m[0].length });
    }
  }
  return spans.sort((a, b) => a.start - b.start || b.end - a.end);
}
