import { describe, expect, it } from "vitest";

import { coverageFor } from "../coverage.js";
import { investigationOutcome, investigationsFor, parseInvestigationLines } from "../investigations.js";
import { WOBBLE, investigation, recall, settlement } from "./fixtures/make.js";

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023];
const statusOf = (r: ReturnType<typeof coverageFor>) => Object.fromEntries(r.byYear.map((y) => [y.year, y.status]));

describe("coverageFor", () => {
  it("is uncovered with nothing relevant", () => {
    const r = coverageFor(WOBBLE, YEARS, [recall({ summary: "Clutch may overheat" })], [], []);
    expect(r.refs).toEqual([]);
    expect(r.byYear.every((y) => y.status === "uncovered")).toBe(true);
  });

  it("applies precedence recalled > under_investigation > settlement > closed_no_recall > uncovered", () => {
    const r = coverageFor(
      WOBBLE,
      YEARS,
      [recall({ campaign: "22V001000", modelYear: 2022, remedy: "replace the steering damper" })],
      [
        investigation({ actionNumber: "PE19012", yearFrom: 2018, yearTo: 2019, status: "closed", closeDate: "2023-10-29", outcome: "no_recall", summary: "steering wobble or shimmy" }),
        investigation({ actionNumber: "PE24001", yearFrom: 2019, yearTo: 2019, status: "open", subject: "Steering shimmy" }),
        investigation({ actionNumber: "EA25001", yearFrom: 2022, yearTo: 2022, status: "open", subject: "wobble" }),
      ],
      [settlement({ yearFrom: 2018, yearTo: 2020 })],
    );
    expect(statusOf(r)).toEqual({
      2018: "settlement", // settlement beats closed_no_recall
      2019: "under_investigation", // open investigation beats settlement
      2020: "settlement",
      2021: "uncovered",
      2022: "recalled", // recall beats open investigation
      2023: "uncovered",
    });
    const y2018 = r.byYear.find((y) => y.year === 2018)!;
    expect(y2018.refIds.sort()).toEqual(["PE19012", "reynolds-v-fca"]);
    const pe = r.refs.find((x) => x.id === "PE19012")!;
    expect(pe).toMatchObject({ kind: "investigation", status: "closed_no_recall", years: [2018, 2019] });
    expect(pe.matchedTerms).toEqual(["wobble", "shimmy"]);
    expect(r.refs[0]!.status).toBe("recalled"); // refs sorted strongest first
  });

  it("closed investigation with recall outcome counts as recalled", () => {
    const r = coverageFor(WOBBLE, [2021], [], [investigation({ yearFrom: 2021, yearTo: 2021, status: "closed", outcome: "recall", closeDate: "2022-01-01" })], []);
    expect(r.byYear[0]!.status).toBe("recalled");
  });

  it("settlement only applies to its failure mode", () => {
    const r = coverageFor(WOBBLE, [2019], [], [], [settlement({ failureModeId: "fuel-pump" })]);
    expect(r.byYear[0]!.status).toBe("uncovered");
  });

  it("recall only covers its own model year and merges duplicate campaigns", () => {
    const r = coverageFor(WOBBLE, [2020, 2021], [recall({ modelYear: 2021, summary: "wobble" }), recall({ modelYear: 2020, summary: "wobble" }), recall({ modelYear: 2017, summary: "wobble" })], [], []);
    expect(r.refs).toHaveLength(1);
    expect(r.refs[0]!.years).toEqual([2020, 2021]);
  });
});

describe("investigations flat-file parsing", () => {
  const row = (a: string, make: string, model: string, year: string, comp: string, close: string, camp: string, subj: string, summ: string) =>
    [a, make, model, year, comp, "MFR", "20190916", close, camp, subj, summ].join("\t");
  const lines = [
    row("PE19012", "JEEP", "WRANGLER", "2018", "STEERING", "20231029", "", "Frame weld deficiencies", "Addressed via recall 18V-675. Steering wobble or shimmy... closed."),
    row("PE19012", "JEEP", "WRANGLER", "2019", "STRUCTURE:FRAME", "20231029", "", "Frame weld deficiencies", "same"),
    row("PE19012", "JEEP", "GLADIATOR", "2020", "STEERING", "20231029", "", "Frame weld deficiencies", "same"),
    row("RQ20001", "FORD", "F-150", "2015", "BRAKES", "20210101", "21V123000", "Brake", "x"),
    row("PE26001", "TESLA", "MODEL 3", "2024", "BRAKES", "", "", "Open one", "x"),
  ];
  const all = parseInvestigationLines(lines);

  it("merges rows per action+make+model with year ranges", () => {
    const w = all.find((i) => i.actionNumber === "PE19012" && i.model === "WRANGLER")!;
    expect(w).toMatchObject({ yearFrom: 2018, yearTo: 2019, status: "closed", outcome: "no_recall", closeDate: "2023-10-29", type: "PE", component: "STEERING; STRUCTURE:FRAME" });
    expect(all.filter((i) => i.actionNumber === "PE19012")).toHaveLength(2);
    expect(all.find((i) => i.actionNumber === "RQ20001")!.outcome).toBe("recall");
    expect(all.find((i) => i.actionNumber === "PE26001")).toMatchObject({ status: "open", outcome: "unknown", closeDate: null });
  });

  it("investigationsFor filters make/model/years", () => {
    expect(investigationsFor(all, "jeep", "wrangler", [2019]).map((i) => i.actionNumber)).toEqual(["PE19012"]);
    expect(investigationsFor(all, "JEEP", "WRANGLER", [2021])).toEqual([]);
    expect(investigationsFor(all, "JEEP", "GLADIATOR", [2020])).toHaveLength(1);
  });

  it("outcome heuristic ignores bare/negated recall mentions", () => {
    expect(investigationOutcome("2023-10-29", "", "ODI reviewed recall 18V-675 and Recall 21V846.")).toBe("no_recall");
    expect(investigationOutcome("2023-10-29", "", "PORSCHE HAS NOT ISSUED A RECALL CAMPAIGN")).toBe("no_recall");
    expect(investigationOutcome("2023-10-29", "", "On Nov 12, FCA filed vehicle recall 21V-880.")).toBe("recall");
    expect(investigationOutcome(null, "21V001000", "x")).toBe("unknown");
  });
});

describe("coverage ignores NHTSA component labels", () => {
  const PHANTOM = { ...WOBBLE, id: "phantom-braking", coverageTerms: ["forward\\s+collision", "phantom\\s+brak"] };

  it("a component-only match no longer covers (recall)", () => {
    const r = coverageFor(
      PHANTOM,
      [2021],
      [recall({ campaign: "24V153000", modelYear: 2021, component: "FORWARD COLLISION AVOIDANCE: WARNINGS", summary: "Pedestrian warning sound may not meet requirements.", consequence: "Pedestrians may not hear the vehicle.", remedy: "Software update." })],
      [],
      [],
    );
    expect(r.refs).toEqual([]);
    expect(r.byYear[0]!.status).toBe("uncovered");
  });

  it("a component-only match no longer covers (investigation)", () => {
    const r = coverageFor(PHANTOM, [2021], [], [investigation({ yearFrom: 2021, yearTo: 2021, component: "FORWARD COLLISION AVOIDANCE", subject: "Door latch", summary: "Doors open." })], []);
    expect(r.refs).toEqual([]);
  });

  it("text match still covers", () => {
    const r = coverageFor(PHANTOM, [2021], [recall({ modelYear: 2021, component: "BRAKES", summary: "Phantom braking may occur." })], [], []);
    expect(r.byYear[0]!.status).toBe("recalled");
  });
});
