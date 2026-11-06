// Shared engine types. Owned by the engine agent; other areas import from here.
// Pure TypeScript, no framework imports.

export type Iso = string; // "YYYY-MM-DD"

export interface Complaint {
  odiNumber: string; // e.g. "11423456"
  make: string;
  model: string;
  modelYear: number; // uppercase make/model as NHTSA returns
  dateReceived: Iso; // complaint received/filed date (API "dateComplaintFiled", MM/DD/YYYY -> ISO)
  dateIncident: Iso | null;
  components: string; // NHTSA component string, e.g. "STEERING,SUSPENSION"
  summary: string; // narrative
  crash: boolean;
  fire: boolean;
  injuries: number;
  deaths: number;
}

export interface Recall {
  campaign: string; // "26V363000" as returned (NHTSACampaignNumber)
  make: string;
  model: string;
  modelYear: number;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportDate: Iso; // API "ReportReceivedDate" is DD/MM/YYYY -> ISO
}

export type InvestigationType = "PE" | "EA" | "RQ" | "DP" | "AQ" | "RP" | string;
export interface Investigation {
  actionNumber: string; // "PE22002"
  type: InvestigationType;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  component: string;
  subject: string;
  summary: string;
  openDate: Iso | null;
  closeDate: Iso | null;
  status: "open" | "closed";
  outcome: "recall" | "no_recall" | "unknown"; // closed with a recall vs closed without
  url: string | null; // static.nhtsa.gov document if derivable, else null
}

export interface Settlement {
  id: string;
  name: string; // "Reynolds v. FCA (death wobble)"
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  failureModeId: string;
  url: string;
  summary: string;
}

export interface FailureMode {
  id: string; // slug, e.g. "death-wobble"
  name: string; // "Death wobble (violent front-end shake)"
  componentHints: string[]; // NHTSA component words that boost/limit, e.g. ["STEERING","SUSPENSION"]
  include: string[]; // regex sources, case-insensitive; a complaint matches if ANY include matches
  exclude: string[]; // regex sources; matched complaints are dropped if ANY exclude matches
  coverageTerms: string[]; // regex sources matched against recall/investigation component+summary+subject+remedy
  hazard: string; // one-line safety consequence for petition text
}

export interface ComplaintLabel {
  odiNumber: string;
  failureModeId: string;
  verdict: "include" | "exclude";
}

export type CoverageStatus =
  | "recalled"
  | "under_investigation"
  | "settlement"
  | "closed_no_recall"
  | "uncovered";
// Per-year precedence (strongest first): recalled > under_investigation > settlement > closed_no_recall > uncovered

export interface CoverageRef {
  kind: "recall" | "investigation" | "settlement";
  id: string; // campaign / actionNumber / settlement id
  title: string;
  date: Iso | null;
  url: string | null;
  years: number[]; // model years this ref covers (intersected with the scan)
  status: CoverageStatus; // what this ref contributes
  matchedTerms: string[]; // which coverageTerms matched (explainability)
}

export interface YearCoverage {
  year: number;
  count: number;
  status: CoverageStatus;
  refIds: string[];
}

export interface SignalResult {
  fired: boolean;
  firedAt: string | null; // "YYYY-MM" of first month the rule held
  rule: string; // human text: ">=10 matching complaints and >=5x peer share"
  share: number;
  peerShare: number | null;
  ratio: number | null;
}

export interface ClusterResult {
  failureModeId: string;
  complaintIds: string[]; // all matched (after labels applied)
  count: number;
  uncoveredCount: number; // uncoveredCount = complaints in years whose status is "uncovered"
  crashes: number;
  fires: number;
  injuries: number;
  deaths: number;
  firstReported: Iso | null;
  lastReported: Iso | null;
  monthly: { month: string; count: number }[]; // "YYYY-MM", contiguous, zero-filled
  byYear: YearCoverage[];
  coverage: { status: CoverageStatus; refs: CoverageRef[] }; // "uncovered" if any year with count>0 is uncovered, else the weakest status among years with complaints
  signal: SignalResult;
}

export interface ScanInput {
  make: string;
  model: string;
  years: number[];
  complaints: Complaint[];
  recalls: Recall[];
  investigations: Investigation[];
  settlements: Settlement[];
  modes: FailureMode[];
  labels: ComplaintLabel[];
  peerComplaints?: Complaint[] | undefined; // peer-vehicle complaints for the baseline
}

// ---- Engine helper types (additions beyond the contract; additive only) ----

export interface MonthCount {
  month: string; // "YYYY-MM"
  count: number;
}

export interface SignalRule {
  minCount: number;
  minRatio: number;
}

export interface MatchSpan {
  pattern: string;
  start: number;
  end: number;
}

export interface CoverageResult {
  byYear: { year: number; status: CoverageStatus; refIds: string[] }[];
  refs: CoverageRef[];
}
