import { describe, expect, it } from "vitest";

import { keepStoredWhenShorter } from "../merge.js";
import type { Complaint } from "../types.js";

const c = (odi: string, year: number): Complaint => ({
  odiNumber: odi,
  make: "JEEP",
  model: "WRANGLER",
  modelYear: year,
  dateReceived: "2024-01-01",
  dateIncident: null,
  components: "",
  summary: "",
  crash: false,
  fire: false,
  injuries: 0,
  deaths: 0,
});

describe("keepStoredWhenShorter", () => {
  it("keeps fresh data when every year is the same size or larger", () => {
    const fresh = [c("1", 2021), c("2", 2021), c("3", 2022)];
    const r = keepStoredWhenShorter(fresh, [c("1", 2021), c("3", 2022)]);
    expect(r.kept).toEqual([]);
    expect(r.complaints).toBe(fresh);
  });

  it("keeps the stored complaints for a year that came back empty or short", () => {
    const stored = [c("1", 2021), c("2", 2021), c("3", 2022), c("4", 2022)];
    const fresh = [c("3", 2022), c("4", 2022), c("5", 2022), c("1", 2021)];
    const r = keepStoredWhenShorter(fresh, stored);
    expect(r.kept).toEqual(["JEEP|WRANGLER|2021"]);
    expect(r.complaints.map((x) => x.odiNumber).sort()).toEqual(["1", "2", "3", "4", "5"]);
    expect(keepStoredWhenShorter([], stored).complaints).toHaveLength(4);
  });
});
