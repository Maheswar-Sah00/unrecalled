import { describe, expect, it } from "vitest";

import { watchAlerts, type PriorCluster } from "../alerts.js";

function result(id: string, uncoveredCount: number, fired: boolean, status = "uncovered") {
  return {
    failureModeId: id,
    uncoveredCount,
    signal: { fired, firedAt: null, rule: "", share: 0, peerShare: null, ratio: null },
    coverage: { status, refs: [] },
  } as unknown as Parameters<typeof watchAlerts>[1][number];
}

const names = new Map([["wobble", "Death wobble"]]);
const prior = (rows: PriorCluster[]) => new Map(rows.map((r) => [r.failureModeId, r]));

describe("watchAlerts", () => {
  it("records growth when an uncovered problem gains 5+ uncovered complaints", () => {
    const a = watchAlerts("Jeep Wrangler 2021", [result("wobble", 120, false)], prior([{ failureModeId: "wobble", uncoveredCount: 112, signalFired: false }]), names);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ kind: "growth", failureModeId: "wobble" });
    expect(a[0]!.message).toContain("grew by 8");
  });

  it("ignores small growth, covered problems and problems seen for the first time", () => {
    expect(watchAlerts("X", [result("wobble", 114, false)], prior([{ failureModeId: "wobble", uncoveredCount: 112, signalFired: false }]), names)).toEqual([]);
    expect(watchAlerts("X", [result("wobble", 150, false, "recalled")], prior([{ failureModeId: "wobble", uncoveredCount: 100, signalFired: false }]), names)).toEqual([]);
    expect(watchAlerts("X", [result("wobble", 150, false)], prior([]), names)).toEqual([]);
  });

  it("records a signal only when it newly fires", () => {
    const fresh = watchAlerts("X", [result("wobble", 40, true)], prior([{ failureModeId: "wobble", uncoveredCount: 40, signalFired: false }]), names);
    expect(fresh).toEqual([expect.objectContaining({ kind: "signal", failureModeId: "wobble" })]);
    const already = watchAlerts("X", [result("wobble", 60, true)], prior([{ failureModeId: "wobble", uncoveredCount: 40, signalFired: true }]), names);
    expect(already).toEqual([expect.objectContaining({ kind: "growth" })]);
  });
});
