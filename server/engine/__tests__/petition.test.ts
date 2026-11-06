import { describe, expect, it } from "vitest";

import { buildPetition, type PetitionInput } from "../petition.js";
import { SEED_MODES } from "../rules.js";
import type { ClusterResult, Complaint } from "../types.js";

const mode = SEED_MODES.find((m) => m.id === "death-wobble")!;

const complaint = (odi: string, year: number, summary: string): Complaint => ({
  odiNumber: odi,
  make: "JEEP",
  model: "WRANGLER",
  modelYear: year,
  dateReceived: "2023-05-01",
  dateIncident: null,
  components: "STEERING,SUSPENSION",
  summary,
  crash: false,
  fire: false,
  injuries: 0,
  deaths: 0,
});

const sample = [
  complaint("11505033", 2021, "Hit a pothole at 70 mph and the vehicle started shaking violently | had to slow to 30."),
  complaint("11610132", 2021, "DEATH WOBBLE at highway speed."),
];

const cluster: ClusterResult = {
  failureModeId: "death-wobble",
  complaintIds: sample.map((c) => c.odiNumber),
  count: 246,
  uncoveredCount: 246,
  crashes: 3,
  fires: 0,
  injuries: 2,
  deaths: 0,
  firstReported: "2021-02-03",
  lastReported: "2026-10-20",
  monthly: [
    { month: "2026-09", count: 4 },
    { month: "2026-10", count: 2 },
  ],
  byYear: [
    { year: 2020, count: 120, status: "settlement", refIds: ["reynolds-v-fca-wrangler"] },
    { year: 2021, count: 246, status: "uncovered", refIds: [] },
  ],
  coverage: {
    status: "uncovered",
    refs: [
      {
        kind: "settlement",
        id: "reynolds-v-fca-wrangler",
        title: "Reynolds v. FCA (death wobble)",
        date: null,
        url: "https://thedrive.com/news/jeep-agrees-to-settlement-over-wrangler-gladiator-death-wobble",
        years: [2020],
        status: "settlement",
        matchedTerms: [],
      },
    ],
  },
  signal: { fired: true, firedAt: "2021-08", rule: ">=10 matching complaints and >=5x peer share", share: 0.25, peerShare: 0.02, ratio: 12.5 },
};

const base: PetitionInput = {
  petitioner: { name: "Jane Owner", address: "12 Main St\nSpringfield, IL 62701", email: "jane@example.com" },
  vehicle: { make: "JEEP", model: "WRANGLER", years: [2020, 2021] },
  mode,
  cluster,
  sample,
  generatedOn: "2026-11-06",
};

describe("buildPetition", () => {
  const out = buildPetition(base);

  it("has a heading with the word Petition before the text (552.4(b))", () => {
    expect(out.markdown.split("\n")[0]).toMatch(/^# .*Petition/);
    expect(out.title).toContain("Petition");
  });

  it("contains every 552.4 element and the statutory basis", () => {
    const md = out.markdown;
    expect(md).toContain("49 U.S.C. 30162");
    expect(md).toContain("49 CFR Part 552");
    expect(md).toContain("petition for a defect investigation");
    expect(md).toContain("Jane Owner"); // (e) name
    expect(md).toContain("Springfield, IL 62701"); // (e) address
    expect(md).toMatch(/## 2\. Substance of the order requested/); // (d)
    expect(md).toMatch(/## 3\. Facts/); // (c)
    expect(md).toMatch(/## 4\. Reasons the order should be issued/);
    expect(md).toContain("Administrator, National Highway Traffic Safety Administration");
  });

  it("includes evidence: counts, outcomes, coverage table, signal, limitations", () => {
    const md = out.markdown;
    expect(md).toContain("246 complaints");
    expect(md).toMatch(/3 crashes, 0 fires, 2 injuries and 0 deaths/);
    expect(md).toContain("| 2021 | 246 | No recall, investigation or settlement | none |");
    expect(md).toContain("reynolds-v-fca-wrangler");
    expect(md).toContain("August 2021");
    expect(md).toContain("unverified owner reports");
    expect(md).toContain("MY 2021");
  });

  it("cites ODI numbers in the appendix and escapes table pipes", () => {
    expect(out.markdown).toContain("| 11505033 | 2021 |");
    expect(out.markdown).toContain("| 11610132 | 2021 |");
    expect(out.markdown).toContain("shaking violently \\| had to slow");
  });

  it("caps the cited sample at 25", () => {
    const many = Array.from({ length: 40 }, (_, i) => complaint(String(11000000 + i), 2021, "death wobble"));
    const md = buildPetition({ ...base, sample: many }).markdown;
    expect(md).toContain("Sample of 25 of 246");
    expect(md).not.toContain("11000030");
  });

  it("checklist is all ok for a complete input", () => {
    expect(out.checklist.length).toBeGreaterThanOrEqual(6);
    expect(out.checklist.every((c) => c.ok)).toBe(true);
  });

  it("checklist flags a missing address and name", () => {
    const r = buildPetition({ ...base, petitioner: { name: "", address: "  " } });
    const addr = r.checklist.find((c) => /address/i.test(c.item))!;
    const name = r.checklist.find((c) => /name/i.test(c.item))!;
    expect(addr.ok).toBe(false);
    expect(name.ok).toBe(false);
    expect(r.markdown).toContain("[MAILING ADDRESS REQUIRED]");
  });

  it("checklist flags missing facts when there is no sample", () => {
    const r = buildPetition({ ...base, sample: [] });
    expect(r.checklist.find((c) => c.item.startsWith("§552.4(c)"))!.ok).toBe(false);
  });
});
