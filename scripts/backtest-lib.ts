// Shared helpers for scripts/backtest-theta2.ts and scripts/validate-rules.ts.
// Minimal NHTSA fetch with an on-disk cache (os tmpdir), independent of server/engine/nhtsa.ts.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { Complaint, Iso } from "../server/engine/types.js";

const CACHE_DIR = path.join(os.tmpdir(), "unrecalled-rules-cache");
const MAX_AGE_MS = 24 * 3600 * 1000;

function mdyToIso(s: string | null | undefined): Iso | null {
  if (!s) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  return `${m[3]}-${m[1]!.padStart(2, "0")}-${m[2]!.padStart(2, "0")}`;
}

function dmyToIso(s: string | null | undefined): Iso | null {
  if (!s) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
}

async function getJson(url: string, cacheKey: string): Promise<any> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, cacheKey.replace(/[^A-Za-z0-9_.-]+/g, "_") + ".json");
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < MAX_AGE_MS) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.status === 400 || res.status === 404) {
        const empty = { count: 0, results: [] };
        fs.writeFileSync(file, JSON.stringify(empty));
        return empty;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const j = await res.json();
      fs.writeFileSync(file, JSON.stringify(j));
      return j;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export async function fetchComplaintsRaw(make: string, model: string, year: number): Promise<Complaint[]> {
  const url =
    `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}` +
    `&model=${encodeURIComponent(model)}&modelYear=${year}`;
  const j = await getJson(url, `cmpl_${make}_${model}_${year}`);
  const out: Complaint[] = [];
  for (const r of j.results ?? []) {
    const received = mdyToIso(r.dateComplaintFiled);
    if (!received) continue;
    out.push({
      odiNumber: String(r.odiNumber),
      make: make.toUpperCase(),
      model: model.toUpperCase(),
      modelYear: year,
      dateReceived: received,
      dateIncident: mdyToIso(r.dateOfIncident),
      components: String(r.components ?? ""),
      summary: String(r.summary ?? ""),
      crash: !!r.crash,
      fire: !!r.fire,
      injuries: Number(r.numberOfInjuries ?? 0),
      deaths: Number(r.numberOfDeaths ?? 0),
    });
  }
  return out;
}

export interface RawRecall {
  campaign: string;
  make: string;
  model: string;
  modelYear: number;
  reportDate: Iso | null;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
}

export async function fetchRecallsRaw(make: string, model: string, year: number): Promise<RawRecall[]> {
  const url =
    `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}` +
    `&model=${encodeURIComponent(model)}&modelYear=${year}`;
  const j = await getJson(url, `rcl_${make}_${model}_${year}`);
  return (j.results ?? []).map((r: any) => ({
    campaign: String(r.NHTSACampaignNumber),
    make: String(r.Make),
    model: String(r.Model),
    modelYear: Number(r.ModelYear),
    reportDate: dmyToIso(r.ReportReceivedDate),
    component: String(r.Component ?? ""),
    summary: String(r.Summary ?? ""),
    consequence: String(r.Consequence ?? ""),
    remedy: String(r.Remedy ?? ""),
  }));
}

export async function fetchCampaign(campaign: string): Promise<RawRecall[]> {
  const url = `https://api.nhtsa.gov/recalls/campaignNumber?campaignNumber=${campaign}`;
  const j = await getJson(url, `campaign_${campaign}`);
  return (j.results ?? []).map((r: any) => ({
    campaign: String(r.NHTSACampaignNumber),
    make: String(r.Make),
    model: String(r.Model),
    modelYear: Number(r.ModelYear),
    reportDate: dmyToIso(r.ReportReceivedDate),
    component: String(r.Component ?? ""),
    summary: String(r.Summary ?? ""),
    consequence: String(r.Consequence ?? ""),
    remedy: String(r.Remedy ?? ""),
  }));
}

/** Deterministic PRNG so sampled snippets are reproducible. */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sample<T>(arr: T[], n: number, rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = a[i]!; a[i] = a[j]!; a[j] = t;
  }
  return a.slice(0, n);
}

/** Return a ~width-char window around the first include hit. */
export function snippet(text: string, re: RegExp, width = 220): string {
  const m = re.exec(text);
  if (!m) return text.slice(0, width);
  const start = Math.max(0, m.index - Math.floor(width / 2));
  return (start > 0 ? "…" : "") + text.slice(start, start + width).replace(/\s+/g, " ") + "…";
}
