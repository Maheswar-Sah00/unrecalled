// NHTSA data access: complaints, recalls, VIN decode. Investigations live in
// investigations.ts and are re-exported here so callers can import from one place.
import { cachedJson, safeKey } from "./cache.js";
import { parseRecallDate, parseUsDate } from "./dates.js";
import type { Complaint, Recall } from "./types.js";

export { loadInvestigations, investigationsFor, parseInvestigationLines, investigationOutcome, fetchInvestigationDocs, withInvestigationUrls } from "./investigations.js";

const API = "https://api.nhtsa.gov";
const TIMEOUT_MS = 20_000;

export interface FetchOpts {
  /** When set, responses are cached as JSON under cacheDir/{complaints|recalls}/MAKE_MODEL_YEAR.json */
  cacheDir?: string;
  maxAgeHours?: number; // default 24
}

class HttpStatusError extends Error {
  constructor(public status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
  }
}

/** GET JSON with a 20 s timeout; retries once on network error or 5xx. 4xx throws HttpStatusError immediately. */
export async function getJson<T>(url: string, timeoutMs = TIMEOUT_MS): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: "application/json" } });
      if (res.status >= 400 && res.status < 500) throw new HttpStatusError(res.status, url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof HttpStatusError) throw err;
      lastErr = err;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 750));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

const up = (s: unknown) => String(s ?? "").trim().toUpperCase();
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

interface RawComplaint {
  odiNumber?: number | string;
  crash?: boolean | string;
  fire?: boolean | string;
  numberOfInjuries?: number;
  numberOfDeaths?: number;
  dateOfIncident?: string;
  dateComplaintFiled?: string;
  components?: string;
  summary?: string;
  products?: { type?: string; productYear?: string; productMake?: string; productModel?: string }[];
}

const truthy = (v: unknown) => v === true || up(v) === "TRUE" || up(v) === "Y" || up(v) === "YES";

/** Map one raw API complaint to the engine shape (exported for tests). */
export function normalizeComplaint(r: RawComplaint, make: string, model: string, year: number): Complaint {
  const product = (r.products ?? []).find(
    (p) => up(p.productMake) === up(make) && up(p.productModel) === up(model) && num(p.productYear) === year,
  );
  return {
    odiNumber: String(r.odiNumber ?? ""),
    make: product ? up(product.productMake) : up(make),
    model: product ? up(product.productModel) : up(model),
    modelYear: year,
    dateReceived: parseUsDate(r.dateComplaintFiled) ?? "",
    dateIncident: parseUsDate(r.dateOfIncident),
    components: String(r.components ?? ""),
    summary: String(r.summary ?? ""),
    crash: truthy(r.crash),
    fire: truthy(r.fire),
    injuries: num(r.numberOfInjuries),
    deaths: num(r.numberOfDeaths),
  };
}

interface RawRecall {
  NHTSACampaignNumber?: string;
  ReportReceivedDate?: string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
  ModelYear?: string;
  Make?: string;
  Model?: string;
}

export function normalizeRecall(r: RawRecall, make: string, model: string, year: number): Recall {
  return {
    campaign: String(r.NHTSACampaignNumber ?? "").trim(),
    make: up(r.Make) || up(make),
    model: up(r.Model) || up(model),
    modelYear: num(r.ModelYear) || year,
    component: String(r.Component ?? ""),
    summary: String(r.Summary ?? ""),
    consequence: String(r.Consequence ?? ""),
    remedy: String(r.Remedy ?? ""),
    reportDate: parseRecallDate(r.ReportReceivedDate) ?? "",
  };
}

function vehicleQuery(make: string, model: string, year: number): string {
  return `make=${encodeURIComponent(make.trim())}&model=${encodeURIComponent(model.trim())}&modelYear=${year}`;
}

/** Fetch raw list; HTTP 4xx (NHTSA returns 400 for some model/year combos) -> [] with a warning. */
async function fetchList<T>(url: string, key: "results"): Promise<T[]> {
  try {
    const j = await getJson<Record<string, unknown>>(url);
    const list = j[key];
    return Array.isArray(list) ? (list as T[]) : [];
  } catch (err) {
    if (err instanceof HttpStatusError) {
      console.warn(`[unrecalled] ${err.message} - treating as no results`);
      return [];
    }
    throw err;
  }
}

/** Complaints for one make/model/year. Network failures throw (and are not cached); HTTP 400 -> []. */
export async function fetchComplaints(make: string, model: string, year: number, opts: FetchOpts = {}): Promise<Complaint[]> {
  const rel = `complaints/${safeKey(make)}_${safeKey(model)}_${year}.json`;
  return cachedJson(opts.cacheDir, rel, opts.maxAgeHours ?? 24, async () => {
    const raw = await fetchList<RawComplaint>(`${API}/complaints/complaintsByVehicle?${vehicleQuery(make, model, year)}`, "results");
    const seen = new Set<string>();
    const out: Complaint[] = [];
    for (const r of raw) {
      const c = normalizeComplaint(r, make, model, year);
      if (!c.odiNumber || seen.has(c.odiNumber)) continue;
      seen.add(c.odiNumber);
      out.push(c);
    }
    return out;
  });
}

/** Recalls for one make/model/year (ReportReceivedDate DD/MM/YYYY -> ISO). HTTP 400 -> []. */
export async function fetchRecalls(make: string, model: string, year: number, opts: FetchOpts = {}): Promise<Recall[]> {
  const rel = `recalls/${safeKey(make)}_${safeKey(model)}_${year}.json`;
  return cachedJson(opts.cacheDir, rel, opts.maxAgeHours ?? 24, async () => {
    const raw = await fetchList<RawRecall>(`${API}/recalls/recallsByVehicle?${vehicleQuery(make, model, year)}`, "results");
    return raw.map((r) => normalizeRecall(r, make, model, year)).filter((r) => r.campaign);
  });
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx] as T);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Convenience: complaints for several years (3 concurrent requests). */
export async function fetchComplaintsForYears(make: string, model: string, years: number[], opts: FetchOpts = {}): Promise<Complaint[]> {
  return (await mapLimit(years, 3, (y) => fetchComplaints(make, model, y, opts))).flat();
}

/** Convenience: recalls for several years (3 concurrent requests). */
export async function fetchRecallsForYears(make: string, model: string, years: number[], opts: FetchOpts = {}): Promise<Recall[]> {
  return (await mapLimit(years, 3, (y) => fetchRecalls(make, model, y, opts))).flat();
}

/** vPIC VIN decode -> uppercase make/model + model year. Throws if the VIN can't be decoded. */
export async function decodeVin(vin: string): Promise<{ make: string; model: string; modelYear: number }> {
  const clean = vin.trim().toUpperCase();
  const j = await getJson<{ Results?: { Make?: string; Model?: string; ModelYear?: string }[] }>(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(clean)}?format=json`,
  );
  const r = j.Results?.[0];
  const make = up(r?.Make);
  const model = up(r?.Model);
  const modelYear = num(r?.ModelYear);
  if (!make || !model || !modelYear) throw new Error(`Could not decode VIN ${clean}`);
  return { make, model, modelYear };
}
