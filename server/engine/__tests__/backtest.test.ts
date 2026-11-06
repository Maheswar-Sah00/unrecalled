import { describe, expect, it } from "vitest";

import { BACKTEST } from "../backtest.js";

describe("BACKTEST (Theta II)", () => {
  it("loads the JSON with the contract shape", () => {
    expect(BACKTEST.name).toMatch(/Theta II/);
    expect(BACKTEST.vehicles.length).toBeGreaterThan(0);
    expect(BACKTEST.recall.campaigns).toEqual(expect.arrayContaining(["17V224000", "17V226000"]));
    expect(BACKTEST.firstComplaint.odi).toMatch(/^\d+$/);
    expect(BACKTEST.patterns.length).toBeGreaterThan(0);
    expect(BACKTEST.precisionNote.length).toBeGreaterThan(20);
  });

  it("fires before the recall with a positive lead", () => {
    expect(BACKTEST.leadMonths).toBeGreaterThan(0);
    expect(BACKTEST.signalFiredAt < BACKTEST.recall.date.slice(0, 7)).toBe(true);
    expect(BACKTEST.firstComplaint.date < BACKTEST.recall.date).toBe(true);
    expect(BACKTEST.share).toBeGreaterThan(BACKTEST.peerShare * 5);
    expect(BACKTEST.matchedBeforeRecall).toBeGreaterThanOrEqual(10);
  });

  it("monthly series is contiguous and cumulative", () => {
    const m = BACKTEST.monthly;
    expect(m.length).toBeGreaterThan(12);
    for (let i = 1; i < m.length; i++) {
      expect(m[i]!.matched).toBeGreaterThanOrEqual(m[i - 1]!.matched);
      expect(m[i]!.total).toBeGreaterThanOrEqual(m[i - 1]!.total);
    }
    expect(m.some((x) => x.month === BACKTEST.signalFiredAt)).toBe(true);
  });
});
