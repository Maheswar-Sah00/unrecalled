# Unrecalled — build contract

**One line:** Owners report defects to NHTSA every day. Unrecalled clusters those complaints into failure modes, checks each mode against every recall, ODI investigation and class settlement, flags the modes nothing covers ("uncovered"), fires an early-warning signal using a rule backtested on Hyundai/Kia Theta II (fires 27 months before the recall), and drafts a 49 CFR Part 552 defect petition with complaint-ID citations.

Demo vehicle: 2021–2023 Jeep Wrangler "death wobble" (about 407 uncovered complaints MY2021–23; MY2018–19 covered by investigation PE19-012; MY2018–20 covered by Reynolds v. FCA settlement warranty). Second example: Tesla Model 3 2021 phantom braking — PE22-002 "closed without recall" (29 Jun 2026).

Research and sources: `../research/unrecalled-sources.md`. Respect "Claims to fix or avoid" at the bottom of that file.

## Stack
- `@agent-native/core@0.224.0` (pinned, do not upgrade), chat template, React Router 8, Drizzle over PGlite (`data/pglite`), Tailwind 4, Tabler icons, shadcn re-exports in `app/components/ui/`.
- Node 22.23.4 is on PATH. Package manager pnpm. Tests: vitest (`pnpm test`).
- Read `AGENTS.md` and `.agents/skills/*/SKILL.md` for framework rules. Use local docs only: `pnpm action docs-search --query "<topic>"`, `pnpm action source-search --query "<pattern>"`.
- Do NOT add npm dependencies without the integrator's OK (pure TS + fetch + built-ins). `node:zlib`/`fflate`-style needs: check `node_modules` first; ask before adding.

## File ownership (do not edit files you don't own)
| Area | Owner | Paths |
|---|---|---|
| Engine (pure TS, no framework imports) | engine agent | `server/engine/**` (except `rules.ts`, `petition.ts`, `backtest.ts`), `server/engine/__tests__/**` |
| Seed failure-mode rules, petition builder, backtest | rules agent | `server/engine/rules.ts`, `server/engine/petition.ts`, `server/engine/backtest.ts`, `server/engine/backtest-data/**`, `scripts/backtest-*.ts`, their tests |
| DB, actions, plugins, jobs, AGENTS.md | integrator | `server/db/**`, `server/plugins/**`, `actions/**`, `AGENTS.md` |
| UI | ui agent | `app/routes/<new files>`, `app/components/unrecalled/**`, `app/components/layout/Sidebar.tsx`, `app/hooks/use-navigation-state.ts`, new `app/components/ui/*` re-exports, `app/global.css` (additive) |

Shared types live in `server/engine/types.ts` (engine agent owns; others import). If you need a change there, say so in your report rather than editing.

## Engine types (`server/engine/types.ts`)
```ts
export type Iso = string; // "YYYY-MM-DD"

export interface Complaint {
  odiNumber: string;          // e.g. "11423456"
  make: string; model: string; modelYear: number;  // uppercase make/model as NHTSA returns
  dateReceived: Iso;          // complaint received/filed date (API "dateComplaintFiled", MM/DD/YYYY -> ISO)
  dateIncident: Iso | null;
  components: string;         // NHTSA component string, e.g. "STEERING,SUSPENSION"
  summary: string;            // narrative
  crash: boolean; fire: boolean; injuries: number; deaths: number;
}

export interface Recall {
  campaign: string;           // "26V363000" as returned (NHTSACampaignNumber)
  make: string; model: string; modelYear: number;
  component: string; summary: string; consequence: string; remedy: string;
  reportDate: Iso;            // API "ReportReceivedDate" is DD/MM/YYYY -> ISO
}

export type InvestigationType = "PE" | "EA" | "RQ" | "DP" | "AQ" | "RP" | string;
export interface Investigation {
  actionNumber: string;       // "PE22002"
  type: InvestigationType;
  make: string; model: string; yearFrom: number; yearTo: number;
  component: string; subject: string; summary: string;
  openDate: Iso | null; closeDate: Iso | null;
  status: "open" | "closed";
  outcome: "recall" | "no_recall" | "unknown";  // closed with a recall vs closed without
  url: string | null;         // static.nhtsa.gov document if derivable, else null
}

export interface Settlement {
  id: string; name: string;   // "Reynolds v. FCA (death wobble)"
  make: string; model: string; yearFrom: number; yearTo: number;
  failureModeId: string; url: string; summary: string;
}

export interface FailureMode {
  id: string;                 // slug, e.g. "death-wobble"
  name: string;               // "Death wobble (violent front-end shake)"
  componentHints: string[];   // NHTSA component words that boost/limit, e.g. ["STEERING","SUSPENSION"]
  include: string[];          // regex sources, case-insensitive; a complaint matches if ANY include matches
  exclude: string[];          // regex sources; matched complaints are dropped if ANY exclude matches
  coverageTerms: string[];    // regex sources matched against recall/investigation component+summary+subject+remedy
  hazard: string;             // one-line safety consequence for petition text
}

export interface ComplaintLabel { odiNumber: string; failureModeId: string; verdict: "include" | "exclude" }

export type CoverageStatus = "recalled" | "under_investigation" | "settlement" | "closed_no_recall" | "uncovered";
// Per-year precedence (strongest first): recalled > under_investigation > settlement > closed_no_recall > uncovered

export interface CoverageRef {
  kind: "recall" | "investigation" | "settlement";
  id: string;                 // campaign / actionNumber / settlement id
  title: string; date: Iso | null; url: string | null;
  years: number[];            // model years this ref covers (intersected with the scan)
  status: CoverageStatus;     // what this ref contributes
  matchedTerms: string[];     // which coverageTerms matched (explainability)
}

export interface YearCoverage { year: number; count: number; status: CoverageStatus; refIds: string[] }

export interface SignalResult {
  fired: boolean; firedAt: string | null;   // "YYYY-MM" of first month the rule held
  rule: string;                              // human text: ">=10 matching complaints and >=5x peer share"
  share: number; peerShare: number | null; ratio: number | null;
}

export interface ClusterResult {
  failureModeId: string;
  complaintIds: string[];                    // all matched (after labels applied)
  count: number; uncoveredCount: number;     // uncoveredCount = complaints in years whose status is "uncovered"
  crashes: number; fires: number; injuries: number; deaths: number;
  firstReported: Iso | null; lastReported: Iso | null;
  monthly: { month: string; count: number }[];  // "YYYY-MM", contiguous, zero-filled
  byYear: YearCoverage[];
  coverage: { status: CoverageStatus; refs: CoverageRef[] };  // overall = weakest-covered year with complaints? NO: overall = "uncovered" if any year with count>0 is uncovered, else strongest-common
  signal: SignalResult;
}

export interface ScanInput {
  make: string; model: string; years: number[];
  complaints: Complaint[]; recalls: Recall[]; investigations: Investigation[];
  settlements: Settlement[]; modes: FailureMode[]; labels: ComplaintLabel[];
  peerComplaints?: Complaint[];              // peer-vehicle complaints for the baseline
}
```

## Engine API (engine agent)
- `server/engine/nhtsa.ts`
  - `fetchComplaints(make, model, year): Promise<Complaint[]>` — `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=&model=&modelYear=`; normalize dates; retry once; 20 s timeout.
  - `fetchRecalls(make, model, year): Promise<Recall[]>` — recallsByVehicle; DD/MM/YYYY dates.
  - `loadInvestigations(opts:{cacheDir:string, maxAgeHours?:number}): Promise<Investigation[]>` — download `https://static.nhtsa.gov/odi/ffdd/inv/FLAT_INV.zip` (spec `INV.txt`), cache zip + a compact parsed JSON (`investigations.json`) in cacheDir; stream-parse (391 MB unzipped — never hold the whole text). Return all rows merged per action number (the flat file has one row per make/model/year).
  - `investigationsFor(all, make, model, years): Investigation[]`
  - `decodeVin(vin): Promise<{make, model, modelYear}>` (vPIC).
  - File cache helper so repeated scans don't refetch within 24 h (`cacheDir/complaints/<make>_<model>_<year>.json`).
- `server/engine/classify.ts` — `classify(complaints, modes, labels): Map<modeId, Complaint[]>` (labels override regex: include forces in, exclude forces out). Also `explainMatch(complaint, mode): {pattern, start, end}[]` for UI highlighting.
- `server/engine/coverage.ts` — `coverageFor(mode, years, recalls, investigations, settlements): {byYear status, refs}`.
- `server/engine/signal.ts` — `computeSignal(matchedByMonth, totalByMonth, peerShare, rule={minCount:10, minRatio:5})` — cumulative; fires first month where cumulative matches ≥ minCount and share ≥ minRatio × peerShare (if peerShare null → share-only threshold ≥ 5%).
- `server/engine/scan.ts` — `scan(input: ScanInput): ClusterResult[]` sorted by uncoveredCount desc, then count.

## Rules / petition / backtest API (rules agent)
- `server/engine/rules.ts` — `SEED_MODES: FailureMode[]` (≥ 20 modes, regexes validated on real complaints) and `SEED_SETTLEMENTS: Settlement[]` (at least Reynolds v. FCA, Jeep 2018–20 Wrangler + 2020 Gladiator, death-wobble) and `DEFAULT_PEERS: Record<string, {make:string, model:string}[]>` keyed `"MAKE|MODEL"`.
- `server/engine/petition.ts` — `buildPetition(input: PetitionInput): { title: string; markdown: string; checklist: {item:string; ok:boolean}[] }` implementing 49 CFR 552.4 elements; cites ODI numbers.
  ```ts
  interface PetitionInput { petitioner:{name:string; address:string; email?:string}; vehicle:{make:string; model:string; years:number[]};
    mode: FailureMode; cluster: ClusterResult; sample: Complaint[]; generatedOn: Iso; narrative?: string }
  ```
- `server/engine/backtest.ts` — `BACKTEST: BacktestResult` loaded from `server/engine/backtest-data/theta2.json` produced by `scripts/backtest-theta2.ts` (real API data).
  ```ts
  interface BacktestResult { name:string; vehicles:{make,model,years:number[]}[]; firstComplaint:{date:Iso; odi:string}; recall:{date:Iso; campaigns:string[]};
    signalFiredAt:string; leadMonths:number; matchedBeforeRecall:number; share:number; peerShare:number;
    monthly:{month:string; matched:number; total:number; peerShare:number|null}[]; precisionNote:string; patterns:string[] }
  ```

## Actions (integrator) — names and return shapes the UI codes against
All reads `GET`, readOnly. Return plain objects.
- `scan-vehicle` {make, model, yearFrom, yearTo} → `{ id, label, clusters: number, uncovered: number, totalComplaints: number }` (persists vehicle + clusters)
- `list-vehicles` {} → `{ vehicles: {id,label,make,model,yearFrom,yearTo,totalComplaints,uncoveredModes,lastScannedAt,watch:boolean}[] }`
- `get-gap-board` {vehicleId} → `{ vehicle:{...}, clusters: ClusterRow[] }` where `ClusterRow = { failureModeId, name, count, uncoveredCount, crashes, fires, injuries, deaths, status: CoverageStatus, signalFired:boolean, signalFiredAt:string|null, ratio:number|null, monthly:{month,count}[], byYear: YearCoverage[] }`
- `get-cluster` {vehicleId, failureModeId, page?=1, pageSize?=25, year?} → `{ mode: FailureMode, cluster: ClusterResult (without complaintIds), refs: CoverageRef[], complaints: {odiNumber, modelYear, dateReceived, components, summary, crash, fire, injuries, deaths, label: "include"|"exclude"|null, highlights:{start,end}[]}[], total }`
- `label-complaint` {odiNumber, failureModeId, verdict: include|exclude|clear} → `{ ok, count }` (rescan of cluster)
- `list-failure-modes` {} → `{ modes: FailureMode[] }`; `update-failure-mode` {id, patch} ; `create-failure-mode` {...}
- `draft-petition` {vehicleId, failureModeId, petitionerName, petitionerAddress} → `{ id, title }`; `get-petition` {id} → `{ id, title, markdown, checklist, status, vehicleId, failureModeId, updatedAt }`; `update-petition` {id, markdown?, status?}; `list-petitions` {}
- `get-backtest` {} → `BacktestResult`
- `set-watch` {vehicleId, watch} ; recurring job `rescan-watchlist` (weekly) records `alerts`; `list-alerts` {}

## Routes (ui agent)
- `/gaps` — vehicle picker/scan form + list of scanned vehicles (home; `app.homePath`)
- `/gaps/:vehicleId` — gap board: clusters ranked, status chips, sparkline, per-year coverage strip
- `/gaps/:vehicleId/:modeId` — cluster detail: coverage refs, complaints with highlighted matches, include/exclude buttons, "Draft petition"
- `/petitions/:id` — petition editor (markdown) with 552.4 checklist + export
- `/backtest` — Theta II backtest chart
- `/rules` — failure-mode rules editor
Navigation state fields: `view`, `vehicleId`, `modeId`, `petitionId`.
