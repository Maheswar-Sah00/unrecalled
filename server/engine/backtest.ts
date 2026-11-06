// Theta II backtest result, produced from live NHTSA data by scripts/backtest-theta2.ts.
// Static JSON import so it works under tsx, vitest and the Vite SSR/production bundle.
import data from "./backtest-data/theta2.json" with { type: "json" };
import type { Iso } from "./types.js";

export interface BacktestResult {
  name: string;
  vehicles: { make: string; model: string; years: number[] }[];
  firstComplaint: { date: Iso; odi: string };
  recall: { date: Iso; campaigns: string[] };
  signalFiredAt: string; // "YYYY-MM"
  leadMonths: number;
  matchedBeforeRecall: number;
  share: number; // matched / all complaints for the recall population, received before the recall
  peerShare: number; // same for peer vehicles
  monthly: { month: string; matched: number; total: number; peerShare: number | null }[]; // cumulative
  precisionNote: string;
  patterns: string[];
  notes?: string[]; // additive: provenance and caveats
}

export const BACKTEST: BacktestResult = data as BacktestResult;
