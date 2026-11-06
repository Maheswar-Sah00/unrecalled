// Early-warning signal: cumulative matched share vs a peer baseline.
import { monthRange } from "./dates.js";
import type { MonthCount, SignalResult, SignalRule } from "./types.js";

export const DEFAULT_RULE: SignalRule = { minCount: 10, minRatio: 5 };
/** Share threshold used when there is no peer baseline. */
export const NO_PEER_MIN_SHARE = 0.05;

export function ruleText(rule: SignalRule, peerShare: number | null): string {
  return peerShare != null
    ? `>=${rule.minCount} matching complaints and >=${rule.minRatio}x peer share`
    : `>=${rule.minCount} matching complaints and >=${Math.round(NO_PEER_MIN_SHARE * 100)}% of all complaints (no peer baseline)`;
}

type Series = MonthCount[] | Map<string, number> | Record<string, number>;

function toMap(s: Series): Map<string, number> {
  if (s instanceof Map) return s;
  if (Array.isArray(s)) {
    const m = new Map<string, number>();
    for (const { month, count } of s) m.set(month, (m.get(month) ?? 0) + count);
    return m;
  }
  return new Map(Object.entries(s));
}

/**
 * Walk months in order accumulating matched and total complaints.
 * share = cumulative matched / cumulative total (for the scanned vehicle).
 * Fires at the first month where cumulative matched >= minCount and
 *   share >= minRatio * peerShare   (peerShare != null), or
 *   share >= 5%                      (peerShare == null).
 * Returned share / ratio are the latest (end-of-series) values; firedAt is the first month the rule held.
 */
export function computeSignal(
  matchedByMonth: Series,
  totalByMonth: Series,
  peerShare: number | null,
  rule: SignalRule = DEFAULT_RULE,
): SignalResult {
  const matched = toMap(matchedByMonth);
  const total = toMap(totalByMonth);
  const keys = [...new Set([...matched.keys(), ...total.keys()])].filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
  const months = keys.length ? monthRange(keys[0] as string, keys[keys.length - 1] as string) : [];

  let cumMatched = 0;
  let cumTotal = 0;
  let firedAt: string | null = null;
  for (const m of months) {
    cumMatched += matched.get(m) ?? 0;
    cumTotal += total.get(m) ?? 0;
    if (firedAt) continue;
    const share = cumTotal > 0 ? cumMatched / cumTotal : 0;
    const holds =
      cumMatched >= rule.minCount &&
      (peerShare != null ? share >= rule.minRatio * peerShare : share >= NO_PEER_MIN_SHARE);
    if (holds) firedAt = m;
  }
  const share = cumTotal > 0 ? cumMatched / cumTotal : 0;
  const ratio = peerShare != null && peerShare > 0 ? share / peerShare : null;
  return { fired: firedAt !== null, firedAt, rule: ruleText(rule, peerShare), share, peerShare, ratio };
}
