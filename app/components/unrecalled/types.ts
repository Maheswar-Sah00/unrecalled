// UI-side mirror of the shapes in docs/CONTRACT.md ("Actions").
// Kept local so screens type-check independently of server/engine.

export type CoverageStatus =
  | "recalled"
  | "under_investigation"
  | "settlement"
  | "closed_no_recall"
  | "uncovered";

export interface FailureMode {
  id: string;
  name: string;
  componentHints: string[];
  include: string[];
  exclude: string[];
  coverageTerms: string[];
  hazard: string;
}

export interface YearCoverage {
  year: number;
  count: number;
  status: CoverageStatus;
  refIds: string[];
  postRecallCount?: number | undefined;
}

export interface PostRecall {
  count: number;
  recallId: string | null;
  sinceRecall: string | null;
}

export interface CoverageRef {
  kind: "recall" | "investigation" | "settlement";
  id: string;
  title: string;
  date: string | null;
  url: string | null;
  years: number[];
  status: CoverageStatus;
  matchedTerms: string[];
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface SignalResult {
  fired: boolean;
  firedAt: string | null;
  rule: string;
  share: number;
  peerShare: number | null;
  ratio: number | null;
}

export interface VehicleSummary {
  id: string;
  label: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  totalComplaints: number;
  uncoveredModes: number;
  lastScannedAt: string | null;
  watch: boolean;
}

export interface ListVehiclesResult {
  vehicles: VehicleSummary[];
}

export interface ScanVehicleResult {
  id: string;
  label: string;
  clusters: number;
  uncovered: number;
  totalComplaints: number;
  message?: string;
  warnings?: string[];
}

export interface ClusterRow {
  failureModeId: string;
  name: string;
  count: number;
  uncoveredCount: number;
  crashes: number;
  fires: number;
  injuries: number;
  deaths: number;
  status: CoverageStatus;
  signalFired: boolean;
  signalFiredAt: string | null;
  ratio: number | null;
  monthly: MonthCount[];
  byYear: YearCoverage[];
  hazard?: string;
  postRecall?: PostRecall | undefined;
  firstReported?: string | null;
  lastReported?: string | null;
  refs?: Pick<CoverageRef, "kind" | "id" | "title" | "status" | "years">[];
}

export interface GapBoardResult {
  vehicle: Partial<VehicleSummary> & {
    id: string;
    label?: string;
    peers?: { make: string; model: string }[];
    recallCount?: number;
    investigationCount?: number;
    warnings?: string[];
  };
  clusters: ClusterRow[];
}

export interface ClusterResult {
  failureModeId: string;
  count: number;
  uncoveredCount: number;
  crashes: number;
  fires: number;
  injuries: number;
  deaths: number;
  firstReported: string | null;
  lastReported: string | null;
  monthly: MonthCount[];
  byYear: YearCoverage[];
  coverage: { status: CoverageStatus; refs: CoverageRef[] };
  signal: SignalResult;
  postRecall?: PostRecall | undefined;
}

export type LabelVerdict = "include" | "exclude";

export interface ClusterComplaint {
  odiNumber: string;
  modelYear: number;
  dateReceived: string;
  components: string;
  summary: string;
  crash: boolean;
  fire: boolean;
  injuries: number;
  deaths: number;
  label: LabelVerdict | null;
  highlights: { start: number; end: number }[];
}

export interface GetClusterResult {
  mode: FailureMode;
  cluster: ClusterResult;
  refs: CoverageRef[];
  complaints: ClusterComplaint[];
  total: number;
  page?: number;
  pageSize?: number;
  vehicle?: Partial<VehicleSummary>;
}

export interface ChecklistItem {
  item: string;
  ok: boolean;
}

export interface Petition {
  id: string;
  title: string;
  markdown: string;
  checklist: ChecklistItem[];
  status: string;
  vehicleId: string;
  failureModeId: string;
  updatedAt: string;
}

export interface PetitionSummary {
  id: string;
  title: string;
  status: string;
  vehicleId?: string;
  failureModeId?: string;
  updatedAt?: string;
}

export interface BacktestResult {
  name: string;
  vehicles: { make: string; model: string; years: number[] }[];
  firstComplaint: { date: string; odi: string };
  recall: { date: string; campaigns: string[] };
  signalFiredAt: string;
  leadMonths: number;
  matchedBeforeRecall: number;
  share: number;
  peerShare: number;
  monthly: {
    month: string;
    matched: number;
    total: number;
    peerShare: number | null;
  }[];
  precisionNote: string;
  patterns: string[];
}
