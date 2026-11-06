import { describe, expect, it } from "vitest";

import { classify, explainMatch } from "../classify.js";
import type { FailureMode } from "../types.js";
import { FUEL, WOBBLE, complaint } from "./fixtures/make.js";

describe("classify", () => {
  const a = complaint({ odiNumber: "1", summary: "Hit a bump at 55 mph and got the DEATH WOBBLE again" });
  const b = complaint({ odiNumber: "2", summary: "Vehicle began to violently shake after a pothole" });
  const c = complaint({ odiNumber: "3", summary: "Front end shaking fixed by tire balancing" }); // exclude hits
  const d = complaint({ odiNumber: "4", summary: "Radio stopped working" });
  const e = complaint({ odiNumber: "5", summary: "Fuel pump died; also front end wobble on highway" });

  it("matches include patterns case-insensitively and drops excludes", () => {
    const m = classify([a, b, c, d, e], [WOBBLE, FUEL], []);
    expect(m.get("death-wobble")!.map((x) => x.odiNumber)).toEqual(["1", "2", "5"]);
    expect(m.get("fuel-pump")!.map((x) => x.odiNumber)).toEqual(["5"]);
  });

  it("labels override regex both ways", () => {
    const m = classify([a, b, c, d], [WOBBLE], [
      { odiNumber: "1", failureModeId: "death-wobble", verdict: "exclude" },
      { odiNumber: "4", failureModeId: "death-wobble", verdict: "include" },
      { odiNumber: "3", failureModeId: "death-wobble", verdict: "include" }, // overrides exclude regex
      { odiNumber: "2", failureModeId: "other-mode", verdict: "exclude" }, // other mode: no effect
    ]);
    expect(m.get("death-wobble")!.map((x) => x.odiNumber).sort()).toEqual(["2", "3", "4"]);
  });

  it("returns an entry for every mode, empty when nothing matches", () => {
    const m = classify([d], [WOBBLE, FUEL], []);
    expect(m.get("death-wobble")).toEqual([]);
    expect(m.get("fuel-pump")).toEqual([]);
  });

  it("skips invalid regexes instead of throwing", () => {
    const bad: FailureMode = { ...WOBBLE, id: "bad", include: ["(unclosed", "radio"], exclude: ["[bad"] };
    const m = classify([d], [bad], []);
    expect(m.get("bad")!.length).toBe(1);
  });
});

describe("explainMatch", () => {
  it("returns sorted spans for every include hit", () => {
    const c = complaint({ summary: "death wobble then violently shaking, death  wobble again" });
    const spans = explainMatch(c, WOBBLE);
    expect(spans.map((s) => c.summary.slice(s.start, s.end))).toEqual(["death wobble", "violently shak", "death  wobble"]);
    expect(spans[0]).toEqual({ pattern: WOBBLE.include[0], start: 0, end: 12 });
    // repeatable (global regex state reset)
    expect(explainMatch(c, WOBBLE)).toEqual(spans);
  });

  it("returns [] when nothing matches", () => {
    expect(explainMatch(complaint({ summary: "nothing" }), WOBBLE)).toEqual([]);
  });
});
