// Full scan: classify -> coverage -> signal, one ClusterResult per failure mode with complaints.
import { classify } from "./classify.js";
import { coverageFor, weakest } from "./coverage.js";
import { monthOf, monthlySeries } from "./dates.js";
import { investigationsFor } from "./investigations.js";
import { computeSignal } from "./signal.js";
import type { ClusterResult, Complaint, CoverageStatus, ScanInput, SignalRule, YearCoverage } from "./types.js";

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
    });
  }
  return results.sort((a, b) => b.uncoveredCount - a.uncoveredCount || b.count - a.count);
}
