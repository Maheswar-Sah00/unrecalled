// Validate SEED_MODES against live NHTSA complaints.
// Usage: pnpm exec tsx scripts/validate-rules.ts [--mode death-wobble] [--n 20] [--vehicle "JEEP|WRANGLER|2021"] [--seed 1] [--full]
import { compileMode, SEED_MODES } from "../server/engine/rules.js";
import type { Complaint } from "../server/engine/types.js";
import { fetchComplaintsRaw, sample, seededRandom, snippet } from "./backtest-lib.js";

const VEHICLES: [string, string, number][] = [
  ["JEEP", "WRANGLER", 2021],
  ["TESLA", "MODEL 3", 2021],
  ["HYUNDAI", "SONATA", 2013],
  ["KIA", "OPTIMA", 2013],
  ["HYUNDAI", "IONIQ 5", 2022],
  ["CHEVROLET", "BOLT EV", 2019],
  ["FORD", "EXPLORER", 2020],
];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const onlyMode = arg("mode");
  const n = Number(arg("n") ?? 3);
  const seed = Number(arg("seed") ?? 1);
  const full = process.argv.includes("--full");
  const vehArg = arg("vehicle");
  const vehicles = vehArg
    ? [vehArg.split("|").map((x, i) => (i === 2 ? Number(x) : x)) as [string, string, number]]
    : VEHICLES;
  const modes = SEED_MODES.filter((m) => !onlyMode || m.id === onlyMode).map((m) => ({ m, c: compileMode(m) }));
  const rnd = seededRandom(seed);

  for (const [make, model, year] of vehicles) {
    const complaints: Complaint[] = await fetchComplaintsRaw(make, model, year);
    console.log(`\n=== ${make} ${model} ${year}: ${complaints.length} complaints ===`);
    const rows: { id: string; hits: Complaint[]; re: RegExp[] }[] = [];
    for (const { m, c } of modes) {
      const hits = complaints.filter(
        (x) => c.include.some((r) => r.test(x.summary)) && !c.exclude.some((r) => r.test(x.summary)),
      );
      rows.push({ id: m.id, hits, re: c.include });
    }
    rows.sort((a, b) => b.hits.length - a.hits.length);
    for (const r of rows) console.log(`  ${String(r.hits.length).padStart(5)}  ${r.id}`);
    const top = onlyMode ? rows : rows.slice(0, 3);
    for (const r of top) {
      if (!r.hits.length) continue;
      console.log(`\n  -- samples: ${r.id} --`);
      for (const h of sample(r.hits, n, rnd)) {
        const re = r.re.find((x) => x.test(h.summary))!;
        const text = full ? h.summary.replace(/\s+/g, " ") : snippet(h.summary, re);
        console.log(`  [${h.odiNumber}] (${h.components}) ${text}\n`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
