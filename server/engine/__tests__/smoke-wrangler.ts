// Full live scan smoke test: JEEP WRANGLER 2018-2023, death-wobble mode + Reynolds settlement stub.
// Run: pnpm exec tsx server/engine/__tests__/smoke-wrangler.ts [cacheDir]
import os from "node:os";
import path from "node:path";

import { fetchComplaintsForYears, investigationsFor, fetchRecallsForYears, loadInvestigations, scan, withInvestigationUrls } from "../index.js";
import type { FailureMode, Settlement } from "../types.js";

const cacheDir = process.argv[2] ?? path.join(os.tmpdir(), "unrecalled-engine-live");
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023];

const WOBBLE: FailureMode = {
  id: "death-wobble",
  name: "Death wobble (violent front-end shake)",
  componentHints: ["STEERING", "SUSPENSION"],
  include: ["death\\s*wobble", "violent(ly)?\\s+(shak|wobbl|vibrat)", "front\\s*end\\s+(shake|shaking|wobble)"],
  exclude: [],
  coverageTerms: ["wobble", "shimmy", "steering\\s+damper"],
  hazard: "Violent front-end oscillation at speed can cause loss of steering control.",
};

const REYNOLDS: Settlement = {
  id: "reynolds-v-fca",
  name: "Reynolds v. FCA (death wobble)",
  make: "JEEP",
  model: "WRANGLER",
  yearFrom: 2018,
  yearTo: 2020,
  failureModeId: "death-wobble",
  url: "https://thedrive.com/news/jeep-agrees-to-settlement-over-wrangler-gladiator-death-wobble",
  summary: "8-yr/90k-mile steering damper warranty (stub).",
};

const t0 = Date.now();
const [complaints, recalls, invAll] = await Promise.all([
  fetchComplaintsForYears("JEEP", "WRANGLER", YEARS, { cacheDir }),
  fetchRecallsForYears("JEEP", "WRANGLER", YEARS, { cacheDir }),
  loadInvestigations({ cacheDir, onProgress: (m) => console.log(`  ${m}`) }),
]);
console.log(`fetched ${complaints.length} complaints, ${recalls.length} recall rows, ${invAll.length} investigation entries in ${Date.now() - t0} ms`);

const investigations = await withInvestigationUrls(investigationsFor(invAll, "JEEP", "WRANGLER", YEARS), { cacheDir });
const [cluster] = scan({
  make: "JEEP",
  model: "WRANGLER",
  years: YEARS,
  complaints,
  recalls,
  investigations,
  settlements: [REYNOLDS],
  modes: [WOBBLE],
  labels: [],
});
if (!cluster) throw new Error("no death-wobble cluster");

console.log(`\ndeath-wobble: count=${cluster.count} uncoveredCount=${cluster.uncoveredCount} overall=${cluster.coverage.status}`);
console.log(`crashes=${cluster.crashes} fires=${cluster.fires} injuries=${cluster.injuries} deaths=${cluster.deaths} first=${cluster.firstReported} last=${cluster.lastReported}`);
console.table(cluster.byYear.map((y) => ({ year: y.year, count: y.count, status: y.status, refs: y.refIds.join(", ") })));
for (const r of cluster.coverage.refs) console.log(`  ref ${r.kind} ${r.id} [${r.status}] years=${r.years.join(",")} terms=${r.matchedTerms.join("|")} url=${r.url ?? "-"} :: ${r.title}`);
console.log(`signal: fired=${cluster.signal.fired} at=${cluster.signal.firedAt} share=${cluster.signal.share.toFixed(3)} rule="${cluster.signal.rule}"`);
console.log(`monthly points: ${cluster.monthly.length} (${cluster.monthly[0]?.month} .. ${cluster.monthly[cluster.monthly.length - 1]?.month})`);
