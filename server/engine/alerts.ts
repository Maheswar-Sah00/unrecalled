import type { ClusterResult } from "./types.js";

/** Minimum growth in uncovered complaints between two scans that is worth an alert. */
export const GROWTH_ALERT_MIN = 5;

export interface PriorCluster {
  failureModeId: string;
  uncoveredCount: number;
  signalFired: boolean;
}

export interface WatchAlert {
  kind: "signal" | "growth";
  failureModeId: string;
  message: string;
}

/**
 * Compare a fresh scan with the previous one for the same vehicle and return
 * the alerts a watcher should see: an early-warning signal that newly fired,
 * or an uncovered problem whose uncovered complaints grew by GROWTH_ALERT_MIN+.
 */
export function watchAlerts(
  vehicleLabel: string,
  results: Pick<ClusterResult, "failureModeId" | "uncoveredCount" | "signal" | "coverage">[],
  prior: Map<string, PriorCluster>,
  modeName: Map<string, string>,
): WatchAlert[] {
  const out: WatchAlert[] = [];
  for (const r of results) {
    const p = prior.get(r.failureModeId);
    const name = modeName.get(r.failureModeId) ?? r.failureModeId;
    if (r.signal.fired && !p?.signalFired) {
      out.push({
        kind: "signal",
        failureModeId: r.failureModeId,
        message: `${vehicleLabel}: early-warning signal fired for "${name}" (${r.uncoveredCount} uncovered complaints).`,
      });
    } else if (r.coverage.status === "uncovered" && p && r.uncoveredCount - p.uncoveredCount >= GROWTH_ALERT_MIN) {
      out.push({
        kind: "growth",
        failureModeId: r.failureModeId,
        message: `${vehicleLabel}: "${name}" grew by ${r.uncoveredCount - p.uncoveredCount} uncovered complaints since the last scan.`,
      });
    }
  }
  return out;
}
