// Live NHTSA integration tests. Run with LIVE=1 (skipped otherwise).
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { classify } from "../classify.js";
import { investigationsFor, loadInvestigations } from "../investigations.js";
import { decodeVin, fetchComplaints, fetchRecalls } from "../nhtsa.js";
import type { FailureMode } from "../types.js";

const LIVE = process.env.LIVE === "1";
const cacheDir = process.env.UNRECALLED_CACHE ?? path.join(os.tmpdir(), "unrecalled-engine-live");

const WOBBLE: FailureMode = {
  id: "death-wobble",
  name: "Death wobble",
  componentHints: [],
  include: ["death\\s*wobble", "violent(ly)?\\s+(shak|wobbl|vibrat)", "front\\s*end\\s+(shake|shaking|wobble)"],
  exclude: [],
  coverageTerms: ["wobble", "shimmy"],
  hazard: "",
};

describe.skipIf(!LIVE)("live NHTSA", () => {
  it("2021 Jeep Wrangler complaints (~961) and wobble matches (~214)", async () => {
    const c = await fetchComplaints("JEEP", "WRANGLER", 2021);
    console.log(`[live] complaints 2021 Wrangler: ${c.length}`);
    expect(c.length).toBeGreaterThan(961 * 0.9);
    expect(c.length).toBeLessThan(961 * 1.1 + 50);
    expect(c.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.dateReceived))).toBe(true);
    expect(c.every((x) => x.modelYear === 2021 && x.make === "JEEP")).toBe(true);
    const wob = classify(c, [WOBBLE], []).get("death-wobble")!;
    console.log(`[live] death-wobble matches 2021 Wrangler: ${wob.length}`);
    expect(wob.length).toBeGreaterThan(150);
    expect(wob.length).toBeLessThan(300);
  }, 60_000);

  it("uses the file cache on the second call", async () => {
    const a = await fetchComplaints("JEEP", "WRANGLER", 2021, { cacheDir });
    const t = Date.now();
    const b = await fetchComplaints("JEEP", "WRANGLER", 2021, { cacheDir });
    expect(b.length).toBe(a.length);
    expect(Date.now() - t).toBeLessThan(1000);
  }, 60_000);

  it("2021 Jeep Wrangler recalls (~15) with DD/MM dates parsed", async () => {
    const r = await fetchRecalls("JEEP", "WRANGLER", 2021);
    console.log(`[live] recalls 2021 Wrangler: ${r.length}`);
    expect(r.length).toBeGreaterThanOrEqual(13);
    const clutch = r.find((x) => x.campaign === "21V028000");
    expect(clutch?.reportDate).toBe("2021-01-28");
    expect(r.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.reportDate))).toBe(true);
  }, 60_000);

  it("HTTP 400 model/years return [] instead of throwing", async () => {
    const r = await fetchComplaints("NOSUCHMAKE", "NOSUCHMODEL", 1901);
    expect(Array.isArray(r)).toBe(true);
  }, 60_000);

  it("loads investigations (PE19012, PE22002) under 30 s", async () => {
    const t = Date.now();
    const all = await loadInvestigations({ cacheDir });
    const ms = Date.now() - t;
    console.log(`[live] investigations entries=${all.length} actions=${new Set(all.map((i) => i.actionNumber)).size} load=${ms}ms`);
    expect(ms).toBeLessThan(30_000);
    expect(all.length).toBeGreaterThan(5000);

    const pe19 = investigationsFor(all, "JEEP", "WRANGLER", [2018, 2019]).find((i) => i.actionNumber === "PE19012");
    expect(pe19).toMatchObject({ status: "closed", outcome: "no_recall", yearFrom: 2018, yearTo: 2019, closeDate: "2023-10-29" });
    expect(investigationsFor(all, "JEEP", "WRANGLER", [2021, 2022, 2023]).some((i) => i.actionNumber === "PE19012")).toBe(false);

    const pe22 = investigationsFor(all, "TESLA", "MODEL 3", [2021]).find((i) => i.actionNumber === "PE22002");
    expect(pe22).toMatchObject({ status: "closed", outcome: "no_recall", closeDate: "2026-06-29" });
  }, 120_000);

  it("decodes a VIN via vPIC", async () => {
    const v = await decodeVin("1C4HJXDG5MW123456");
    console.log(`[live] vin -> ${JSON.stringify(v)}`);
    expect(v.make).toBe("JEEP");
    expect(v.modelYear).toBe(2021);
  }, 60_000);
});
