import { describe, expect, it } from "vitest";

import { scan } from "../scan.js";
import { computeSignal } from "../signal.js";
import { FUEL, WOBBLE, complaint, investigation, settlement } from "./fixtures/make.js";

describe("computeSignal", () => {
  it("fires at the first month both count and peer ratio hold", () => {
    // total 20/month; matched 4/month -> share 0.2 every month; peerShare 0.02 -> ratio 10
    const months = ["2021-01", "2021-02", "2021-03", "2021-04"];
    const matched = months.map((month) => ({ month, count: 4 }));
    const total = months.map((month) => ({ month, count: 20 }));
    const s = computeSignal(matched, total, 0.02);
    expect(s.firedAt).toBe("2021-03"); // cumulative 4, 8, 12 -> first >=10 in March
    expect(s.fired).toBe(true);
    expect(s.share).toBeCloseTo(0.2);
    expect(s.ratio).toBeCloseTo(10);
    expect(s.rule).toBe(">=10 matching complaints and >=5x peer share");
  });

  it("does not fire when ratio is too low", () => {
    const s = computeSignal([{ month: "2021-01", count: 50 }], [{ month: "2021-01", count: 500 }], 0.05); // share 0.1 = 2x
    expect(s.fired).toBe(false);
    expect(s.firedAt).toBeNull();
    expect(s.ratio).toBeCloseTo(2);
  });

  it("uses a 5% share threshold without a peer baseline, and handles gaps", () => {
    const s = computeSignal(
      new Map([["2021-01", 5], ["2021-04", 6]]),
      { "2021-01": 200, "2021-02": 10, "2021-04": 10 },
      null,
    );
    // Jan: 5/200; Apr: 11/220 = 0.05 -> fires in April
    expect(s.firedAt).toBe("2021-04");
    expect(s.ratio).toBeNull();
    expect(s.rule).toContain("5%");
  });

  it("respects a custom rule", () => {
    const s = computeSignal([{ month: "2021-01", count: 3 }], [{ month: "2021-01", count: 3 }], 0.1, { minCount: 3, minRatio: 2 });
    expect(s.firedAt).toBe("2021-01");
  });
});

describe("scan", () => {
  const wob = (year: number, date: string, extra = {}) => complaint({ modelYear: year, dateReceived: date, summary: "death wobble at 60 mph", ...extra });
  const complaints = [
    wob(2018, "2019-01-10", { crash: true, injuries: 1 }),
    wob(2019, "2019-03-02"),
    wob(2020, "2020-05-02"),
    wob(2021, "2021-06-01"),
    wob(2021, "2021-08-20"),
    wob(2022, "2022-01-05", { fire: true }),
    complaint({ modelYear: 2021, dateReceived: "2021-06-02", summary: "fuel pump failed" }),
    complaint({ modelYear: 2021, dateReceived: "2021-07-02", summary: "radio" }),
    wob(2017, "2017-01-01"), // outside scan years
  ];
  const result = scan({
    make: "JEEP",
    model: "WRANGLER",
    years: [2018, 2019, 2020, 2021, 2022],
    complaints: [...complaints, complaints[0]!], // duplicate odi dropped
    recalls: [],
    investigations: [
      investigation({ actionNumber: "PE19012", yearFrom: 2018, yearTo: 2019, status: "closed", outcome: "no_recall", closeDate: "2023-10-29" }),
      investigation({ actionNumber: "PE00001", make: "FORD", model: "F-150", yearFrom: 2021, yearTo: 2021 }), // other vehicle
    ],
    settlements: [settlement({ yearFrom: 2020, yearTo: 2020 }), settlement({ id: "other", model: "GLADIATOR", yearFrom: 2021, yearTo: 2022 })],
    modes: [FUEL, WOBBLE],
    labels: [],
    peerComplaints: [complaint({ summary: "death wobble" }), ...Array.from({ length: 99 }, () => complaint({ summary: "radio" }))],
  });

  it("returns clusters sorted by uncoveredCount then count", () => {
    expect(result.map((r) => r.failureModeId)).toEqual(["death-wobble", "fuel-pump"]);
  });

  it("computes counts, per-year coverage and overall status", () => {
    const w = result[0]!;
    expect(w.count).toBe(6);
    expect(w.uncoveredCount).toBe(3);
    expect(w).toMatchObject({ crashes: 1, fires: 1, injuries: 1, deaths: 0, firstReported: "2019-01-10", lastReported: "2022-01-05" });
    expect(w.byYear).toEqual([
      { year: 2018, count: 1, status: "closed_no_recall", refIds: ["PE19012"] },
      { year: 2019, count: 1, status: "closed_no_recall", refIds: ["PE19012"] },
      { year: 2020, count: 1, status: "settlement", refIds: ["reynolds-v-fca"] },
      { year: 2021, count: 2, status: "uncovered", refIds: [] },
      { year: 2022, count: 1, status: "uncovered", refIds: [] },
    ]);
    expect(w.coverage.status).toBe("uncovered");
    expect(w.coverage.refs.map((r) => r.id).sort()).toEqual(["PE19012", "reynolds-v-fca"]);
    expect(w.monthly[0]).toEqual({ month: "2019-01", count: 1 });
    expect(w.monthly[w.monthly.length - 1]).toEqual({ month: "2022-01", count: 1 });
    expect(w.monthly).toHaveLength(37);
    expect(w.signal.peerShare).toBeCloseTo(0.01);
  });

  it("overall status is the weakest covered status when nothing is uncovered", () => {
    const r = scan({
      make: "JEEP", model: "WRANGLER", years: [2019, 2020],
      complaints: [wob(2019, "2019-01-01"), wob(2020, "2020-01-01")],
      recalls: [], investigations: [investigation({ yearFrom: 2019, yearTo: 2019, status: "open" })],
      settlements: [settlement()], modes: [WOBBLE], labels: [],
    });
    expect(r[0]!.byYear.map((y) => y.status)).toEqual(["under_investigation", "settlement"]);
    expect(r[0]!.coverage.status).toBe("settlement");
    expect(r[0]!.uncoveredCount).toBe(0);
    expect(r[0]!.signal.peerShare).toBeNull();
  });

  it("omits modes with no matches", () => {
    const r = scan({ make: "JEEP", model: "WRANGLER", years: [2021], complaints: [complaint({ summary: "radio" })], recalls: [], investigations: [], settlements: [], modes: [WOBBLE], labels: [] });
    expect(r).toEqual([]);
  });
});

describe("postRecall evidence", () => {
  const wob = (year: number, date: string) => complaint({ modelYear: year, dateReceived: date, summary: "death wobble" });
  const rc = (campaign: string, year: number, date: string) => ({
    campaign, make: "JEEP", model: "WRANGLER", modelYear: year, component: "STEERING",
    summary: "steering damper wobble", consequence: "", remedy: "", reportDate: date,
  });

  it("counts complaints more than 365 days after the earliest matching recall per recalled year", () => {
    const [w] = scan({
      make: "JEEP", model: "WRANGLER", years: [2020, 2021, 2022],
      complaints: [
        wob(2020, "2020-06-01"), // before recall
        wob(2020, "2021-03-01"), // exactly recall + 365 days -> not counted
        wob(2020, "2021-03-02"), // recall + 366 days -> counted
        wob(2020, "2023-01-01"), // counted
        wob(2021, "2024-01-01"), // counted against 22V002 (2022-05-01) -> after 2023-05-01
        wob(2021, "2023-04-30"), // not counted
        wob(2022, "2025-01-01"), // year uncovered -> ignored
      ],
      recalls: [rc("21V001000", 2020, "2020-03-01"), rc("22V009000", 2020, "2022-07-01"), rc("22V002000", 2021, "2022-05-01")],
      investigations: [], settlements: [], modes: [WOBBLE], labels: [],
    });
    expect(w!.postRecall).toEqual({ count: 3, sinceRecall: "2020-03-01", recallId: "21V001000" });
    expect(w!.byYear.map((y) => [y.year, y.status, y.postRecallCount])).toEqual([
      [2020, "recalled", 2],
      [2021, "recalled", 1],
      [2022, "uncovered", undefined],
    ]);
  });

  it("is zero/null when nothing is recalled", () => {
    const [w] = scan({ make: "JEEP", model: "WRANGLER", years: [2021], complaints: [wob(2021, "2021-01-01")], recalls: [], investigations: [], settlements: [], modes: [WOBBLE], labels: [] });
    expect(w!.postRecall).toEqual({ count: 0, sinceRecall: null, recallId: null });
  });
});
