// Validate SEED_MODES coverageTerms against real recalls and ODI investigations.
// Recalls: matched on summary + consequence + remedy. Investigations: subject + summary.
// (Same fields the engine's coverage.ts uses; NHTSA component labels are deliberately ignored.)
// Usage: pnpm exec tsx scripts/validate-coverage.ts [--mode death-wobble] [--no-inv]
import { investigationsFor, loadInvestigations } from "../server/engine/index.js";
import { compileMode, SEED_MODES } from "../server/engine/rules.js";
import { fetchRecallsRaw, type RawRecall } from "./backtest-lib.js";

const SET: [string, string, number, number][] = [
  ["JEEP", "WRANGLER", 2018, 2023],
  ["JEEP", "GLADIATOR", 2020, 2023],
  ["TESLA", "MODEL 3", 2018, 2023],
  ["TESLA", "MODEL Y", 2020, 2023],
  ["HYUNDAI", "SONATA", 2011, 2015],
  ["KIA", "OPTIMA", 2011, 2014],
  ["HYUNDAI", "IONIQ 5", 2022, 2024],
  ["CHEVROLET", "BOLT EV", 2017, 2022],
  ["FORD", "EXPLORER", 2020, 2022],
  ["HONDA", "CR-V", 2017, 2020],
];

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const one = (s: string, n = 150) =>
  s
    .replace(/\s+/g, " ")
    .replace(/^[^.]*?\bis recalling [^.]*\.\s*/i, "")
    .trim()
    .slice(0, n);

async function main() {
  const only = arg("mode");
  const modes = SEED_MODES.filter((m) => !only || m.id === only).map((m) => ({ m, c: compileMode(m) }));

  // Unique campaigns across the set.
  const recalls = new Map<string, RawRecall & { vehicles: Set<string> }>();
  for (const [mk, md, a, b] of SET) {
    for (let y = a; y <= b; y++) {
      for (const r of await fetchRecallsRaw(mk, md, y)) {
        const e = recalls.get(r.campaign) ?? { ...r, vehicles: new Set<string>() };
        e.vehicles.add(`${md} ${y}`);
        recalls.set(r.campaign, e);
      }
    }
  }
  console.log(`${recalls.size} unique recall campaigns`);

  let invs: { id: string; text: string; label: string }[] = [];
  if (!process.argv.includes("--no-inv")) {
    const all = await loadInvestigations({ cacheDir: "data/cache" });
    const seen = new Set<string>();
    for (const [mk, md, a, b] of SET) {
      const years = Array.from({ length: b - a + 1 }, (_, i) => a + i);
      for (const inv of investigationsFor(all, mk, md, years)) {
        if (seen.has(inv.actionNumber)) continue;
        seen.add(inv.actionNumber);
        invs.push({
          id: inv.actionNumber,
          text: [inv.subject, inv.summary].join("\n"),
          label: `${inv.make} ${inv.model} ${inv.yearFrom}-${inv.yearTo}: ${one(inv.subject, 80)} | ${one(inv.summary, 120)}`,
        });
      }
    }
    console.log(`${invs.length} unique investigations`);
  }

  const unmatched = new Set(recalls.keys());
  for (const { m, c } of modes) {
    console.log(`\n=== ${m.id} ===`);
    for (const r of recalls.values()) {
      const text = [r.summary, r.consequence, r.remedy].join("\n");
      const hit = c.coverage.filter((re) => re.test(text));
      if (!hit.length) continue;
      unmatched.delete(r.campaign);
      console.log(`  R ${r.campaign} [${[...r.vehicles][0]}…] ${one(r.summary)} :: ${hit.map((h) => h.source.slice(0, 40)).join(" ; ")}`);
    }
    for (const i of invs) {
      const hit = c.coverage.filter((re) => re.test(i.text));
      if (hit.length) console.log(`  I ${i.id} ${i.label} :: ${hit.map((h) => h.source.slice(0, 40)).join(" ; ")}`);
    }
  }
  if (!only) {
    console.log(`\n=== recalls matching no mode (${unmatched.size}) ===`);
    for (const id of unmatched) console.log(`  ${id} ${one(recalls.get(id)!.summary, 170)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
