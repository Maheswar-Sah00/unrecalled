import { describe, expect, it } from "vitest";

import { monthRange, monthlySeries, parseRecallDate, parseUsDate, parseYmd } from "../dates.js";
import { normalizeComplaint, normalizeRecall } from "../nhtsa.js";

describe("date parsing", () => {
  it("parses complaint MM/DD/YYYY", () => {
    expect(parseUsDate("11/03/2026")).toBe("2026-11-03");
    expect(parseUsDate("01/31/2021")).toBe("2021-01-31");
    expect(parseUsDate("13/01/2021")).toBeNull(); // month 13 invalid in US format
    expect(parseUsDate("")).toBeNull();
    expect(parseUsDate(null)).toBeNull();
    expect(parseUsDate("2021-05-06")).toBe("2021-05-06");
  });

  it("parses recall DD/MM/YYYY and tolerates MM/DD/YYYY", () => {
    expect(parseRecallDate("28/01/2021")).toBe("2021-01-28");
    expect(parseRecallDate("04/06/2026")).toBe("2026-06-04"); // ambiguous -> DD/MM (verified format)
    expect(parseRecallDate("01/28/2021")).toBe("2021-01-28"); // unambiguous MM/DD
    expect(parseRecallDate("31/02/2021")).toBeNull();
  });

  it("parses flat-file YYYYMMDD", () => {
    expect(parseYmd("20231029")).toBe("2023-10-29");
    expect(parseYmd("")).toBeNull();
    expect(parseYmd("  ")).toBeNull();
  });
});

describe("monthly series", () => {
  it("is contiguous and zero-filled", () => {
    const s = monthlySeries(["2021-11-02", "2022-02-10", "2021-11-30", null, ""]);
    expect(s).toEqual([
      { month: "2021-11", count: 2 },
      { month: "2021-12", count: 0 },
      { month: "2022-01", count: 0 },
      { month: "2022-02", count: 1 },
    ]);
    expect(monthlySeries([])).toEqual([]);
  });

  it("monthRange crosses year boundary", () => {
    expect(monthRange("2020-12", "2021-02")).toEqual(["2020-12", "2021-01", "2021-02"]);
    expect(monthRange("2021-02", "2021-01")).toEqual([]);
  });
});

describe("normalizers", () => {
  it("maps a raw complaint", () => {
    const c = normalizeComplaint(
      {
        odiNumber: 11775531,
        crash: false,
        fire: true,
        numberOfInjuries: 2,
        numberOfDeaths: 0,
        dateOfIncident: "10/03/2026",
        dateComplaintFiled: "11/03/2026",
        components: "ENGINE",
        summary: "x",
        products: [{ type: "Vehicle", productYear: "2021", productMake: "JEEP", productModel: "WRANGLER" }],
      },
      "jeep",
      "wrangler",
      2021,
    );
    expect(c).toMatchObject({ odiNumber: "11775531", make: "JEEP", model: "WRANGLER", modelYear: 2021, dateReceived: "2026-11-03", dateIncident: "2026-10-03", fire: true, injuries: 2 });
  });

  it("maps a raw recall with DD/MM date", () => {
    const r = normalizeRecall({ NHTSACampaignNumber: "21V028000", ReportReceivedDate: "28/01/2021", Component: "CLUTCH", ModelYear: "2021", Make: "JEEP", Model: "WRANGLER" }, "JEEP", "WRANGLER", 2021);
    expect(r).toMatchObject({ campaign: "21V028000", reportDate: "2021-01-28", modelYear: 2021, consequence: "" });
  });
});
