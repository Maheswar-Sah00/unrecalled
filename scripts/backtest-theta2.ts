// Backtest: would the "uncovered cluster" rule have flagged Hyundai/Kia Theta II engine failures
// before the 2017 recalls? Real data from api.nhtsa.gov (complaints + recalls).
// Usage: pnpm exec tsx scripts/backtest-theta2.ts [--samples 20] [--seed 1]
// Writes server/engine/backtest-data/theta2.json (BacktestResult).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { BacktestResult } from "../server/engine/backtest.js";
import { compileMode, SEED_MODES } from "../server/engine/rules.js";
import type { Complaint } from "../server/engine/types.js";
import { fetchCampaign, fetchComplaintsRaw, sample, seededRandom } from "./backtest-lib.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "server", "engine", "backtest-data", "theta2.json");

const CAMPAIGNS = ["17V224000", "17V226000"]; // Kia, Hyundai — Theta II bearing wear, 31 Mar 2017
const EARLIER_CAMPAIGN = "15V568000"; // Hyundai Sonata 2011–2012 (same failure, earlier, Sep 2015)
const PEERS: [string, string][] = [
  ["TOYOTA", "CAMRY"],
  ["HONDA", "ACCORD"],
  ["FORD", "FUSION"],
];
const PEER_YEARS = [2011, 2012, 2013, 2014];
const RULE = { minCount: 10, minRatio: 5 };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const month = (iso: string) => iso.slice(0, 7);
function months(from: string, to: string): string[] {
  const out: string[] = [];
  let [y = 0, m = 0] = from.split("-").map(Number);
  const [ty = 0, tm = 0] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}
const monthDiff = (a: string, b: string) => {
  const [ay = 0, am = 0] = a.split("-").map(Number);
  const [by = 0, bm = 0] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
};

async function main() {
  const nSamples = Number(arg("samples") ?? 20);
  const rnd = seededRandom(Number(arg("seed") ?? 1));
  const mode = SEED_MODES.find((m) => m.id === "engine-seizure")!;
  const c = compileMode(mode);
  const isMatch = (x: Complaint) =>
    c.include.some((r) => r.test(x.summary)) && !c.exclude.some((r) => r.test(x.summary));

  // 1. Recall population and date, from the recalls API.
  const rows = (await Promise.all(CAMPAIGNS.map(fetchCampaign))).flat();
  const population = new Map<string, { make: string; model: string; years: number[] }>();
  for (const r of rows) {
    const key = `${r.make}|${r.model}`;
    const v = population.get(key) ?? { make: r.make, model: r.model, years: [] };
    if (!v.years.includes(r.modelYear)) v.years.push(r.modelYear);
    population.set(key, v);
  }
  const vehicles = [...population.values()].map((v) => ({ ...v, years: v.years.sort() }));
  const recallDate = rows.map((r) => r.reportDate!).sort()[0]!;
  const earlier = await fetchCampaign(EARLIER_CAMPAIGN);
  const earlierDate = earlier.map((r) => r.reportDate!).sort()[0]!;
  console.log("Population:", vehicles.map((v) => `${v.make} ${v.model} ${v.years.join("/")}`).join("; "));
  console.log("Recall date (17V-224/226):", recallDate, " earlier 15V-568:", earlierDate);

  // 2. Complaints.
  const pop: Complaint[] = [];
  for (const v of vehicles) for (const y of v.years) pop.push(...(await fetchComplaintsRaw(v.make, v.model, y)));
  const peer: Complaint[] = [];
  for (const [mk, md] of PEERS) for (const y of PEER_YEARS) peer.push(...(await fetchComplaintsRaw(mk, md, y)));
  console.log(`Complaints: population ${pop.length}, peers ${peer.length}`);

  const popM = pop.filter(isMatch).sort((a, b) => a.dateReceived.localeCompare(b.dateReceived));
  const first = popM[0]!;
  const beforeRecall = popM.filter((x) => x.dateReceived < recallDate);
  const popBefore = pop.filter((x) => x.dateReceived < recallDate);
  const peerBefore = peer.filter((x) => x.dateReceived < recallDate);
  const peerMBefore = peerBefore.filter(isMatch);

  // 3. Monthly cumulative series and rule.
  const startMonth = month([...pop, ...peer].map((x) => x.dateReceived).sort()[0]!);
  const endMonth = month(recallDate);
  const series = months(startMonth, endMonth);
  const count = (arr: Complaint[]) => {
    const m = new Map<string, number>();
    for (const x of arr) m.set(month(x.dateReceived), (m.get(month(x.dateReceived)) ?? 0) + 1);
    return m;
  };
  const [pm, pt, qm, qt] = [count(popM), count(pop), count(peer.filter(isMatch)), count(peer)];
  let cm = 0, ct = 0, cqm = 0, cqt = 0;
  let fired: string | null = null;
  let firedShare = 0, firedPeer = 0;
  const monthly: BacktestResult["monthly"] = [];
  for (const mo of series) {
    cm += pm.get(mo) ?? 0;
    ct += pt.get(mo) ?? 0;
    cqm += qm.get(mo) ?? 0;
    cqt += qt.get(mo) ?? 0;
    const share = ct ? cm / ct : 0;
    const peerShare = cqt ? cqm / cqt : null;
    monthly.push({ month: mo, matched: cm, total: ct, peerShare });
    const ok =
      cm >= RULE.minCount &&
      (peerShare && peerShare > 0 ? share >= RULE.minRatio * peerShare : share >= 0.05);
    if (ok && !fired) {
      fired = mo;
      firedShare = share;
      firedPeer = peerShare ?? 0;
    }
  }
  if (!fired) throw new Error("rule never fired before the recall");
  const lead = monthDiff(fired, month(recallDate));
  const share = beforeRecall.length / popBefore.length;
  const peerShare = peerMBefore.length / peerBefore.length;
  console.log(`First matching complaint: ${first.dateReceived} ODI ${first.odiNumber} (${first.make} ${first.model} ${first.modelYear})`);
  console.log(`Matched before recall: ${beforeRecall.length} / ${popBefore.length} = ${(share * 100).toFixed(1)}%`);
  console.log(`Peers before recall: ${peerMBefore.length} / ${peerBefore.length} = ${(peerShare * 100).toFixed(2)}%`);
  console.log(`Rule fired: ${fired} (cum share ${(firedShare * 100).toFixed(1)}% vs peer ${(firedPeer * 100).toFixed(2)}%), lead ${lead} months before ${recallDate}`);
  console.log(`Lead vs earlier 15V-568 (${earlierDate}, Sonata 2011–12, not in this population): ${monthDiff(fired, month(earlierDate))} months`);

  // 4. Samples for the precision spot check (printed; judged by hand, then recorded in PRECISION_NOTE).
  console.log(`\n--- ${nSamples} random matched complaints before the recall (for hand review) ---`);
  for (const x of sample(beforeRecall, nSamples, rnd)) {
    console.log(`[${x.odiNumber}] ${x.dateReceived} ${x.make} ${x.model} ${x.modelYear}: ${x.summary.replace(/\s+/g, " ").slice(0, 400)}\n`);
  }

  const out: BacktestResult = {
    name: "Hyundai/Kia Theta II engine failure (recalls 17V-224 and 17V-226)",
    vehicles,
    firstComplaint: { date: first.dateReceived, odi: first.odiNumber },
    recall: { date: recallDate, campaigns: CAMPAIGNS },
    signalFiredAt: fired,
    leadMonths: lead,
    matchedBeforeRecall: beforeRecall.length,
    share: Number(share.toFixed(4)),
    peerShare: Number(peerShare.toFixed(4)),
    monthly,
    // guard:allow-env-credential — offline script input (precision note text), not a credential
    precisionNote: process.env.PRECISION_NOTE ?? readPrevious()?.precisionNote ?? "Precision not yet spot-checked.",
    patterns: mode.include.concat(mode.exclude.map((p) => `EXCLUDE: ${p}`)),
    notes: [
      `Population and recall date taken from the NHTSA recalls API for campaigns ${CAMPAIGNS.join(", ")} (report date ${recallDate}).`,
      `Hyundai Sonata 2011–2012 is excluded: it was recalled earlier for the same bearing failure under 15V-568 (report date ${earlierDate}). Measured against that earlier recall, the rule's lead would be ${monthDiff(fired, month(earlierDate))} months.`,
      `Peers: ${PEERS.map((p) => p.join(" ")).join(", ")}, model years ${PEER_YEARS[0]}–${PEER_YEARS[PEER_YEARS.length - 1]}. Shares use complaints received before the recall date.`,
      `Rule: cumulative matches >= ${RULE.minCount} and cumulative share >= ${RULE.minRatio}x cumulative peer share, evaluated monthly on complaint received dates.`,
      `Data fetched ${new Date().toISOString().slice(0, 10)}; NHTSA adds late-filed complaints, so counts can drift slightly.`,
    ],
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log("\nWrote", OUT);
}

function readPrevious(): BacktestResult | null {
  try {
    return JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    return null;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
