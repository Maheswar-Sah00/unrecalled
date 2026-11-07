// Draft a defect petition under 49 U.S.C. 30162 and 49 CFR Part 552.
// §552.4: each petition must (a) be written in English; (b) have, preceding its text, a heading
// that includes the word "Petition"; (c) set forth facts which it is claimed establish that an
// order is necessary; (d) set forth a brief description of the substance of the order which it is
// claimed should be issued; and (e) contain the name and address of the petitioner.
// Pure TS, no framework imports.
import type { ClusterResult, Complaint, CoverageRef, CoverageStatus, FailureMode, Iso } from "./types.js";

export interface PetitionInput {
  petitioner: { name: string; address: string; email?: string | undefined };
  vehicle: { make: string; model: string; years: number[] };
  mode: FailureMode;
  cluster: ClusterResult;
  sample: Complaint[];
  generatedOn: Iso;
  narrative?: string | undefined;
}

export interface PetitionOutput {
  title: string;
  markdown: string;
  checklist: { item: string; ok: boolean }[];
}

export const PART_552_URL = "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-552";
export const USC_30162_URL = "https://www.law.cornell.edu/uscode/text/49/30162";
const MAX_SAMPLE = 25;
const EXCERPT_CHARS = 240;

const STATUS_TEXT: Record<CoverageStatus, string> = {
  recalled: "Recalled",
  under_investigation: "Open ODI investigation",
  settlement: "Class settlement (not a recall)",
  closed_no_recall: "Investigation closed without recall",
  uncovered: "No recall, investigation or settlement",
};

const title = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

function yearRange(years: number[]): string {
  const ys = [...new Set(years)].sort((a, b) => a - b);
  if (!ys.length) return "";
  const contiguous = ys.every((y, i) => i === 0 || y === ys[i - 1]! + 1);
  if (ys.length === 1) return String(ys[0]!);
  return contiguous ? `${ys[0]!}–${ys[ys.length - 1]!}` : ys.join(", ");
}

function cell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function excerpt(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > EXCERPT_CHARS ? t.slice(0, EXCERPT_CHARS).replace(/\s+\S*$/, "") + " …" : t;
}

function fmtMonth(m: string | null): string {
  if (!m) return "n/a";
  const [y, mo] = m.split("-").map(Number);
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${names[(mo ?? 1) - 1]} ${y}`;
}

function pct(x: number | null): string {
  return x == null ? "n/a" : `${(x * 100).toFixed(1)}%`;
}

function refWhyNot(ref: CoverageRef, uncoveredYears: number[]): string {
  const covered = ref.years.length ? `covers MY ${yearRange(ref.years)}` : "covers none of the scanned model years";
  const gap = uncoveredYears.length ? `; does not cover MY ${yearRange(uncoveredYears)}` : "";
  // Only plain-language reasons here; the exact matching rules are listed once in Appendix B.
  const cites = ref.matchedTerms.filter((t) => t.startsWith("cites recall"));
  const terms = cites.length ? ` Follows up on ${cites.map((t) => t.replace("cites ", "")).join(", ")}.` : "";
  return `${covered}${gap}.${terms}`;
}

export function buildPetition(input: PetitionInput): PetitionOutput {
  const { petitioner, vehicle, mode, cluster, generatedOn } = input;
  const make = title(vehicle.make);
  const model = vehicle.model.toUpperCase() === vehicle.model ? title(vehicle.model) : vehicle.model;
  const yrs = yearRange(vehicle.years);
  const vehicleLabel = `${yrs} ${make} ${model}`;
  const sample = input.sample.slice(0, MAX_SAMPLE);
  const byYear = [...cluster.byYear].sort((a, b) => a.year - b.year);
  const uncoveredYears = byYear.filter((y) => y.status === "uncovered" && y.count > 0).map((y) => y.year);
  const targetYears = uncoveredYears.length ? uncoveredYears : byYear.filter((y) => y.count > 0).map((y) => y.year);
  const name = petitioner.name?.trim() ?? "";
  const address = petitioner.address?.trim() ?? "";

  const docTitle = `Petition for a Defect Investigation: ${vehicleLabel}, ${mode.name}`;
  const L: string[] = [];

  // §552.4(b): heading containing the word "Petition", preceding the text.
  L.push(`# ${docTitle}`, "");
  L.push(`**Date:** ${generatedOn}`, "");
  L.push(
    // 552.4 still prints the old 400 Seventh St address; 552.5(a) treats a petition
    // sent elsewhere as properly filed, so the document uses today's headquarters.
    // The "How to send it" panel quotes the regulation text.
    "**To:** Administrator, National Highway Traffic Safety Administration, 1200 New Jersey Avenue, S.E., Washington, DC 20590",
    "",
  );
  // §552.4(e)
  L.push("**Petitioner:**", "");
  L.push(`${name || "[PETITIONER NAME REQUIRED]"}  `);
  for (const line of (address || "[MAILING ADDRESS REQUIRED]").split(/\r?\n/)) L.push(`${line.trim()}  `);
  if (petitioner.email) L.push(`${petitioner.email}  `);
  L.push("");

  L.push("## 1. Request", "");
  L.push(
    `Under 49 U.S.C. 30162(a)(2) and 49 CFR Part 552, the petitioner asks the Administrator to begin a proceeding to decide whether to issue an order under 49 U.S.C. 30118(b) concerning a defect related to motor vehicle safety in ${vehicleLabel} vehicles: ${mode.name.toLowerCase()}. ` +
      `This is a petition for a defect investigation.`,
    "",
  );

  // §552.4(d)
  L.push("## 2. Substance of the order requested", "");
  L.push(
    `The petitioner asks NHTSA to open a defect investigation into ${mode.name.toLowerCase()} in ${make} ${model} vehicles of model year${targetYears.length > 1 ? "s" : ""} ${yearRange(targetYears) || yrs}` +
      (uncoveredYears.length ? ", which no recall, open investigation or class settlement currently addresses" : "") +
      `, and, if the investigation finds a safety-related defect, to order the manufacturer to notify owners and remedy the defect under 49 U.S.C. 30118–30120.`,
    "",
  );
  L.push(`**Safety consequence.** ${mode.hazard}`, "");

  // §552.4(c)
  L.push("## 3. Facts", "");
  L.push(
    `Owners have filed ${cluster.count} complaints with NHTSA's Office of Defects Investigation (ODI) for ${vehicleLabel} vehicles that describe this failure. ` +
      `The first was received ${cluster.firstReported ?? "n/a"} and the most recent ${cluster.lastReported ?? "n/a"}. ` +
      `${cluster.uncoveredCount} of them concern model years that no recall, open investigation or settlement covers.`,
    "",
  );
  L.push(
    `Reported outcomes across these complaints: ${cluster.crashes} crash${cluster.crashes === 1 ? "" : "es"}, ${cluster.fires} fire${cluster.fires === 1 ? "" : "s"}, ` +
      `${cluster.injuries} injur${cluster.injuries === 1 ? "y" : "ies"} and ${cluster.deaths} death${cluster.deaths === 1 ? "" : "s"}.`,
    "",
  );
  if (input.narrative?.trim()) L.push("**Petitioner's statement.** " + input.narrative.trim(), "");

  L.push("### 3.1 Complaints and coverage by model year", "");
  L.push("| Model year | Complaints | Coverage status | References |", "|---|---:|---|---|");
  for (const y of byYear) {
    L.push(`| ${y.year} | ${y.count} | ${STATUS_TEXT[y.status]} | ${y.refIds.length ? y.refIds.map(cell).join(", ") : "none"} |`);
  }
  L.push("");

  L.push("### 3.2 Existing recalls, investigations and settlements", "");
  const refs = cluster.coverage.refs;
  if (!refs.length) {
    L.push("No recall, ODI investigation or class settlement matching this failure mode was found for the scanned model years.", "");
  } else {
    L.push("| Kind | ID | Title | Date | Status | Why it does not cover the uncovered years |", "|---|---|---|---|---|---|");
    for (const r of refs) {
      const id = r.url ? `[${cell(r.id)}](${r.url})` : cell(r.id);
      L.push(`| ${r.kind} | ${id} | ${cell(r.title)} | ${r.date ?? "n/a"} | ${STATUS_TEXT[r.status]} | ${cell(refWhyNot(r, uncoveredYears))} |`);
    }
    L.push("");
    L.push(
      "A class-settlement warranty extension is not a safety recall: it does not require owner notification under 49 U.S.C. 30118–30119, " +
        "and an investigation closed without a recall does not remedy the condition.",
      "",
    );
  }
  const pr = cluster.postRecall;
  if (pr && pr.count > 0 && pr.recallId) {
    L.push(
      `**Complaints after the recall.** ${pr.count} of these complaints were received more than one year after recall ${cell(pr.recallId)} ` +
        `(report date ${pr.sinceRecall ?? "n/a"}). Some may come from vehicles that never received the remedy; the rest suggest the remedy ` +
        "did not resolve the condition or that the recall population was too narrow. Either question warrants review.",
      "",
    );
  }

  L.push("### 3.3 Complaint trend", "");
  const s = cluster.signal;
  if (s.fired) {
    L.push(
      `The early-warning rule (${s.rule}) first held in ${fmtMonth(s.firedAt)}. ` +
        `At that point ${pct(s.share)} of complaints for this vehicle described this failure, against ${pct(s.peerShare)} for peer vehicles` +
        (s.ratio != null ? ` (${s.ratio.toFixed(1)} times the peer rate).` : "."),
      "",
    );
  } else {
    L.push(
      `The early-warning rule (${s.rule}) has not fired. Share of complaints describing this failure: ${pct(s.share)}; peer share: ${pct(s.peerShare)}.`,
      "",
    );
  }
  const recent = cluster.monthly.slice(-24).filter((m) => m.count > 0);
  if (recent.length) {
    L.push("Complaints received per month (last 24 months with any complaints):", "");
    L.push("| Month | Complaints |", "|---|---:|");
    for (const m of recent) L.push(`| ${m.month} | ${m.count} |`);
    L.push("");
  }

  L.push("## 4. Reasons the order should be issued", "");
  L.push(
    `1. The complaints describe a recurring failure with a direct safety consequence: ${mode.hazard.charAt(0).toLowerCase()}${mode.hazard.slice(1)}`,
  );
  L.push(
    `2. ${cluster.count} owner reports, received from ${cluster.firstReported ?? "n/a"} to ${cluster.lastReported ?? "n/a"}, show the condition is not isolated.`,
  );
  if (uncoveredYears.length) {
    L.push(
      `3. Model year${uncoveredYears.length > 1 ? "s" : ""} ${yearRange(uncoveredYears)} ${uncoveredYears.length > 1 ? "have" : "has"} no recall, open investigation or settlement for this failure, so owners have no remedy and receive no notice.`,
    );
  } else {
    L.push("3. Existing actions do not provide a recall remedy for every affected vehicle (see section 3.2).");
  }
  if (s.fired) L.push(`4. The complaint rate for this failure exceeds the peer-vehicle rate (section 3.3).`);
  L.push("");

  L.push("## 5. Method and limitations", "");
  L.push(
    "- Complaints were retrieved from NHTSA's public complaints API (api.nhtsa.gov) by make, model and model year.",
    "- Each narrative was classified with published regular-expression rules for this failure mode (Appendix B). A person reviewed matches; labels they set override the rules.",
    "- Recalls (recallsByVehicle API), ODI investigations (NHTSA investigations flat file) and class settlements were matched to the failure mode by keyword terms against their component, subject, summary and remedy text.",
    "- Complaints are unverified owner reports. Some narratives may describe a different condition, and some relevant complaints may not match the rules. Counts are a lower bound on reporting, not a measure of the failure rate.",
    "- The peer comparison uses complaints for same-segment vehicles and is indicative only.",
    "",
  );

  L.push("## Appendix A. Cited complaints", "");
  if (sample.length) {
    L.push(`Sample of ${sample.length} of ${cluster.count} matching complaints. ODI numbers can be looked up at https://www.nhtsa.gov/recalls.`, "");
    L.push("| ODI number | MY | Received | Crash | Fire | Injuries | Excerpt |", "|---|---|---|---|---|---:|---|");
    for (const c of sample) {
      L.push(
        `| ${c.odiNumber} | ${c.modelYear} | ${c.dateReceived} | ${c.crash ? "Yes" : "No"} | ${c.fire ? "Yes" : "No"} | ${c.injuries} | ${cell(excerpt(c.summary))} |`,
      );
    }
  } else {
    L.push("No complaints were selected for citation.");
  }
  L.push("");

  L.push("## Appendix B. Classification rules", "");
  L.push(`Failure mode \`${mode.id}\`: ${mode.name}. A complaint matches if any include pattern matches and no exclude pattern matches (case-insensitive).`, "");
  L.push("Include:", "");
  for (const p of mode.include) L.push(`- \`${p}\``);
  L.push("", "Exclude:", "");
  if (mode.exclude.length) for (const p of mode.exclude) L.push(`- \`${p}\``);
  else L.push("- (none)");
  L.push("");
  L.push(`Legal basis: 49 U.S.C. 30162 (${USC_30162_URL}); 49 CFR Part 552 (${PART_552_URL}).`, "");
  L.push("Signed,", "", name || "[PETITIONER NAME REQUIRED]", "");

  const markdown = L.join("\n");
  const checklist = [
    { item: "§552.4(a) Written in the English language", ok: true },
    { item: "§552.4(b) Heading preceding the text includes the word \"Petition\"", ok: /^# .*\bPetition\b/m.test(markdown) },
    { item: "§552.4(c) Sets forth facts claimed to establish that an order is necessary", ok: cluster.count > 0 && sample.length > 0 },
    { item: "§552.4(d) Brief description of the substance of the order requested", ok: true },
    { item: "§552.4(e) Petitioner's name", ok: name.length > 0 },
    { item: "§552.4(e) Petitioner's address", ok: address.length > 0 },
    { item: "Cites 49 U.S.C. 30162 as the basis for the petition", ok: markdown.includes("30162") },
    { item: "Identifies the vehicles (make, model, model years)", ok: !!vehicle.make && !!vehicle.model && vehicle.years.length > 0 },
    { item: "Cites complaints by ODI number", ok: sample.length > 0 },
    { item: "States method and limitations (complaints are unverified owner reports)", ok: true },
  ];
  return { title: docTitle, markdown, checklist };
}
