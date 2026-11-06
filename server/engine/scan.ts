// Full scan: classify -> coverage -> signal, one ClusterResult per failure mode with complaints.
import { classify } from "./classify.js";
import { coverageFor, weakest } from "./coverage.js";
import { monthOf, monthlySeries } from "./dates.js";
import { investigationsFor } from "./investigations.js";
import { computeSignal } from "./signal.js";
import type { ClusterResult, Complaint, CoverageRef, CoverageStatus, PostRecall, ScanInput, SignalRule, YearCoverage } from "./types.js";

const up = (s: string) => s.trim().toUpperCase();

function dedupe(complaints: Complaint[]): Complaint[] {
  const seen = new Set<string>();
  const out: Complaint[] = [];
  for (const c of complaints) {
    if (seen.has(c.odiNumber)) continue;
    seen.add(c.odiNumber);
    out.push(c);
  }
  return out;
}

function monthCounts(complaints: Complaint[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of complaints) {
    const k = monthOf(c.dateReceived);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

const POST_RECALL_DAYS = 365;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Informational post-recall evidence (does not change statuses). For each "recalled" year, take the
 * earliest matching recall ref covering it and count that year's complaints received more than 365 days
 * after the recall report date (sets byYear[].postRecallCount). count sums all recalled years;
 * recallId/sinceRecall name the recall that yields the most post-recall complaints.
 */
export function computePostRecall(matched: Complaint[], byYear: YearCoverage[], refs: CoverageRef[]): PostRecall {
  const perRecall = new Map<string, { date: string; count: number }>();
  let total = 0;
  for (const y of byYear) {
    if (y.status !== "recalled") continue;
    const recall = refs
      .filter((r) => r.kind === "recall" && r.date && r.years.includes(y.year))
      .sort((a, b) => (a.date as string).localeCompare(b.date as string))[0];
    if (!recall || !recall.date) {
      y.postRecallCount = 0;
      continue;
    }
    const cutoff = addDays(recall.date, POST_RECALL_DAYS); // strictly after recall + 365 days
    const n = matched.filter((c) => c.modelYear === y.year && !!c.dateReceived && c.dateReceived > cutoff).length;
    y.postRecallCount = n;
    total += n;
    const prev = perRecall.get(recall.id);
    perRecall.set(recall.id, { date: recall.date, count: (prev?.count ?? 0) + n });
  }
  let best: { id: string; date: string; count: number } | null = null;
  for (const [id, v] of perRecall) if (!best || v.count > best.count) best = { id, ...v };
  return { count: total, sinceRecall: best?.date ?? null, recallId: best?.id ?? null };
}

/**
 * Scan one vehicle (make/model/years). Complaints/recalls are filtered to the scan years;
 * investigations and settlements are filtered to make/model + overlapping years here, so
 * callers may pass the full loadInvestigations() list.
 * peerShare per mode = matched peer complaints / all peer complaints (null without peers).
 * Returns modes with count > 0, sorted by uncoveredCount desc, then count desc.
 */
export function scan(input: ScanInput, rule?: SignalRule): ClusterResult[] {
  const years = [...new Set(input.years)].sort((a, b) => a - b);
  const yearSet = new Set(years);
  const complaints = dedupe(input.complaints.filter((c) => yearSet.has(c.modelYear)));
  const recalls = input.recalls.filter((r) => yearSet.has(r.modelYear));
  const investigations = investigationsFor(input.investigations, input.make, input.model, years);
  const settlements = input.settlements.filter((s) => up(s.make) === up(input.make) && up(s.model) === up(input.model));

  const classified = classify(complaints, input.modes, input.labels);
  const peers = dedupe(input.peerComplaints ?? []);
  const peerClassified = peers.length ? classify(peers, input.modes, input.labels) : null;
  const totalByMonth = monthCounts(complaints);

  const results: ClusterResult[] = [];
  for (const mode of input.modes) {
    const matched = classified.get(mode.id) ?? [];
    if (matched.length === 0) continue;

    const cov = coverageFor(mode, years, recalls, investigations, settlements);
    const countByYear = new Map<number, number>();
    for (const c of matched) countByYear.set(c.modelYear, (countByYear.get(c.modelYear) ?? 0) + 1);
    const byYear: YearCoverage[] = cov.byYear.map((y) => ({ ...y, count: countByYear.get(y.year) ?? 0 }));
    const postRecall = computePostRecall(matched, byYear, cov.refs);
    const withComplaints = byYear.filter((y) => y.count > 0);
    const uncoveredCount = withComplaints.filter((y) => y.status === "uncovered").reduce((s, y) => s + y.count, 0);
    const overall: CoverageStatus = withComplaints.some((y) => y.status === "uncovered")
      ? "uncovered"
      : weakest(withComplaints.map((y) => y.status));

    const dates = matched.map((c) => c.dateReceived).filter((d) => !!d).sort();
    const peerMatched = peerClassified?.get(mode.id)?.length ?? 0;
    const peerShare = peers.length ? peerMatched / peers.length : null;

    results.push({
      failureModeId: mode.id,
      complaintIds: matched.map((c) => c.odiNumber),
      count: matched.length,
      uncoveredCount,
      crashes: matched.filter((c) => c.crash).length,
      fires: matched.filter((c) => c.fire).length,
      injuries: matched.reduce((s, c) => s + (c.injuries || 0), 0),
      deaths: matched.reduce((s, c) => s + (c.deaths || 0), 0),
      firstReported: dates[0] ?? null,
      lastReported: dates[dates.length - 1] ?? null,
      monthly: monthlySeries(dates),
      byYear,
      coverage: { status: overall, refs: cov.refs },
      signal: computeSignal(monthCounts(matched), totalByMonth, peerShare, rule),
      postRecall,
    });
  }
  return results.sort((a, b) => b.uncoveredCount - a.uncoveredCount || b.count - a.count);
}
