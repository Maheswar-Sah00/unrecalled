// ODI investigations from the FLAT_INV.zip flat file (one row per action/make/model/year/component).
// Field spec (INV.txt): 1 ACTION 2 MAKE 3 MODEL 4 YEAR 5 COMPNAME 6 MFR 7 ODATE 8 CDATE 9 CAMPNO 10 SUBJECT 11 SUMMARY
// Tab-delimited, dates YYYYMMDD, ~391 MB unzipped. We stream-inflate (node:zlib) and never hold the full text.
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { StringDecoder } from "node:string_decoder";
import { createInflateRaw } from "node:zlib";

import { cachedJson, readJsonIfFresh, writeJson } from "./cache.js";
import { parseYmd } from "./dates.js";
import type { Investigation } from "./types.js";

export const FLAT_INV_URL = "https://static.nhtsa.gov/odi/ffdd/inv/FLAT_INV.zip";
const CACHE_VERSION = 2;

/** Per-action fields (shared by all its make/model entries). */
type ActionRow = [type: string, subject: string, summary: string, openDate: string | null, closeDate: string | null, campno: string];
/** Per action+make+model entry. */
type EntryRow = [action: string, make: string, model: string, yearFrom: number, yearTo: number, component: string];

interface CompactCache {
  version: number;
  builtAt: string;
  actions: Record<string, ActionRow>;
  entries: EntryRow[];
}

// Phrases that say the manufacturer launched a recall as a result. Bare mentions of a
// recall number are NOT enough: PE19-012 cites the earlier recall 18V-675 and PE22-002
// cites 21V-846, yet both closed without a recall.
const RECALL_OUTCOME_RE = [
  /\b(submitted|filed|initiated|issued|announced|launched|conducted|undertook|undertaken)\s+(?:an?\s+|its\s+|the\s+)?(?:\w+\s+){0,3}(?:safety\s+)?recalls?\b/i,
  /\bclosed\b[^.]{0,80}\b(based on|in view of|as a result of|due to|following)\b[^.]{0,40}\brecall/i,
  /\brecall(?:ed)?\b[^.]{0,60}\b(addresses|addressed|remedies|remedied|resolves|resolved)\b[^.]{0,40}\b(the\s+)?(alleged\s+)?(defect|issue|condition|problem)\b[^.]{0,80}\b(closed|investigation)\b/i,
  /\bdecided to (conduct|initiate|issue|launch) a (safety )?recall\b/i,
];

/** Derive outcome: open -> unknown; CAMPNO present -> recall; closing text says a recall was filed -> recall; else no_recall. */
export function investigationOutcome(closeDate: string | null, campno: string, summary: string): Investigation["outcome"] {
  if (!closeDate) return "unknown";
  if (campno.trim()) return "recall";
  for (const re of RECALL_OUTCOME_RE) {
    const m = re.exec(summary);
    if (!m) continue;
    const before = summary.slice(Math.max(0, m.index - 30), m.index);
    if (/\b(not|never|no|yet to|declined to|refused to)\s*(yet\s*)?$/i.test(before)) continue; // "has not issued a recall"
    return "recall";
  }
  return "no_recall";
}

class Builder {
  actions: Record<string, ActionRow> = {};
  entries = new Map<string, { action: string; make: string; model: string; yearFrom: number; yearTo: number; comps: Set<string> }>();
  rows = 0;

  add(line: string) {
    if (!line) return;
    const f = line.split("\t");
    if (f.length < 10) return;
    const action = (f[0] ?? "").trim();
    if (!action) return;
    this.rows++;
    const make = (f[1] ?? "").trim().toUpperCase();
    const model = (f[2] ?? "").trim().toUpperCase();
    const year = Number((f[3] ?? "").trim());
    const comp = (f[4] ?? "").trim();
    const campno = (f[8] ?? "").trim();
    const a = this.actions[action];
    if (!a) {
      const type = (/^[A-Z]+/.exec(action) ?? [""])[0];
      this.actions[action] = [type, (f[9] ?? "").trim(), (f[10] ?? "").trim(), parseYmd(f[6]), parseYmd(f[7]), campno];
    } else if (campno && !a[5]) {
      a[5] = campno;
    }
    const key = `${action}\u0001${make}\u0001${model}`;
    let e = this.entries.get(key);
    if (!e) {
      e = { action, make, model, yearFrom: Infinity, yearTo: -Infinity, comps: new Set() };
      this.entries.set(key, e);
    }
    if (Number.isFinite(year) && year > 1900 && year !== 9999) {
      if (year < e.yearFrom) e.yearFrom = year;
      if (year > e.yearTo) e.yearTo = year;
    }
    if (comp) e.comps.add(comp);
  }

  compact(): CompactCache {
    const entries: EntryRow[] = [];
    for (const e of this.entries.values()) {
      const unknown = !Number.isFinite(e.yearFrom);
      entries.push([e.action, e.make, e.model, unknown ? 9999 : e.yearFrom, unknown ? 9999 : e.yearTo, [...e.comps].join("; ")]);
    }
    return { version: CACHE_VERSION, builtAt: new Date().toISOString(), actions: this.actions, entries };
  }
}

/** Parse flat-file lines (for tests/fixtures) into merged investigations. */
export function parseInvestigationLines(lines: Iterable<string>): Investigation[] {
  const b = new Builder();
  for (const l of lines) b.add(l.replace(/\r$/, ""));
  return expand(b.compact());
}

function expand(c: CompactCache): Investigation[] {
  const out: Investigation[] = [];
  for (const [action, make, model, yearFrom, yearTo, component] of c.entries) {
    const a = c.actions[action];
    if (!a) continue;
    const [type, subject, summary, openDate, closeDate, campno] = a;
    out.push({
      actionNumber: action,
      type,
      make,
      model,
      yearFrom,
      yearTo,
      component,
      subject,
      summary,
      openDate,
      closeDate,
      status: closeDate ? "closed" : "open",
      outcome: investigationOutcome(closeDate, campno, summary),
      url: null,
    });
  }
  return out;
}

/** Locate the first .txt entry in a ZIP buffer via the central directory; return its raw deflate slice. */
function zipEntry(buf: Buffer): { method: number; data: Buffer } {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("FLAT_INV.zip: end of central directory not found");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("FLAT_INV.zip: bad central directory");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!/\.txt$/i.test(name)) continue;
    if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error("FLAT_INV.zip: bad local header");
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const end = compSize === 0xffffffff ? buf.length : start + compSize;
    return { method, data: buf.subarray(start, end) };
  }
  throw new Error("FLAT_INV.zip: no .txt entry");
}

/** Stream-inflate the zip's text entry and feed lines into a Builder. */
async function parseZip(buf: Buffer): Promise<CompactCache> {
  const { method, data } = zipEntry(buf);
  const b = new Builder();
  const decoder = new StringDecoder("utf8");
  let carry = "";
  const source = Readable.from(chunks(data, 1 << 20));
  const stream = method === 0 ? source : source.pipe(createInflateRaw());
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    const text = carry + decoder.write(chunk);
    let start = 0;
    let nl: number;
    while ((nl = text.indexOf("\n", start)) !== -1) {
      const end = nl > start && text.charCodeAt(nl - 1) === 13 ? nl - 1 : nl;
      b.add(text.slice(start, end));
      start = nl + 1;
    }
    carry = text.slice(start);
  }
  carry += decoder.end();
  if (carry.trim()) b.add(carry.replace(/\r$/, ""));
  return b.compact();
}

function* chunks(buf: Buffer, size: number): Generator<Buffer> {
  for (let i = 0; i < buf.length; i += size) yield buf.subarray(i, Math.min(buf.length, i + size));
}

export interface LoadInvestigationsOpts {
  cacheDir: string;
  maxAgeHours?: number; // default 168 (7 days)
  /** Override the download (tests). */
  zipUrl?: string;
  onProgress?: (msg: string) => void;
}

const inMemory = new Map<string, { at: number; data: Investigation[] }>();

/**
 * All ODI investigations, merged to one entry per action number + make + model with yearFrom..yearTo.
 * Caches FLAT_INV.zip and a compact investigations.json in cacheDir; reuses both while younger than maxAgeHours.
 */
export async function loadInvestigations(opts: LoadInvestigationsOpts): Promise<Investigation[]> {
  const maxAge = opts.maxAgeHours ?? 168;
  const log = opts.onProgress ?? (() => {});
  const memo = inMemory.get(opts.cacheDir);
  if (memo && Date.now() - memo.at < maxAge * 3600_000) return memo.data;

  const jsonFile = path.join(opts.cacheDir, "investigations.json");
  const cached = await readJsonIfFresh<CompactCache>(jsonFile, maxAge);
  if (cached && cached.version === CACHE_VERSION) {
    const data = expand(cached);
    inMemory.set(opts.cacheDir, { at: Date.now(), data });
    return data;
  }

  const zipFile = path.join(opts.cacheDir, "FLAT_INV.zip");
  let zip: Buffer | null = null;
  try {
    const st = await fs.stat(zipFile);
    if (Date.now() - st.mtimeMs < maxAge * 3600_000) zip = await fs.readFile(zipFile);
  } catch {
    /* not cached */
  }
  if (!zip) {
    log(`downloading ${opts.zipUrl ?? FLAT_INV_URL}`);
    const res = await fetch(opts.zipUrl ?? FLAT_INV_URL, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`FLAT_INV.zip download failed: HTTP ${res.status}`);
    zip = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(opts.cacheDir, { recursive: true });
    await fs.writeFile(zipFile, zip);
  }
  log("parsing investigations");
  const compact = await parseZip(zip);
  await writeJson(jsonFile, compact);
  const data = expand(compact);
  inMemory.set(opts.cacheDir, { at: Date.now(), data });
  return data;
}

function modelMatches(invModel: string, model: string): boolean {
  const a = invModel.trim().toUpperCase();
  const b = model.trim().toUpperCase();
  return a === b || a.startsWith(`${b} `);
}

/** Investigations for a make/model whose yearFrom..yearTo overlaps any of `years` (empty years = any). */
export function investigationsFor(all: Investigation[], make: string, model: string, years: number[]): Investigation[] {
  const mk = make.trim().toUpperCase();
  return all.filter(
    (i) =>
      i.make === mk &&
      modelMatches(i.model, model) &&
      (years.length === 0 || years.some((y) => y >= i.yearFrom && y <= i.yearTo)),
  );
}

// ---- Optional: document URLs via the safetyIssues API (one call per action; cached) ----

export interface InvestigationDoc {
  fileName: string;
  summary: string;
  url: string;
}

/** Documents for one investigation (opening/closing resumes etc.). Returns [] on any failure. */
export async function fetchInvestigationDocs(actionNumber: string, opts: { cacheDir?: string } = {}): Promise<InvestigationDoc[]> {
  try {
    return await cachedJson(opts.cacheDir, `invdocs/${actionNumber}.json`, 168, async () => {
      const res = await fetch(
        `https://api.nhtsa.gov/safetyIssues/byNhtsaId?nhtsaId=${encodeURIComponent(actionNumber)}&issueType=investigation`,
        { signal: AbortSignal.timeout(20_000) },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as {
        results?: { investigations?: { associatedDocuments?: { fileName?: string; summary?: string; url?: string }[] }[] }[];
      };
      const docs = j.results?.[0]?.investigations?.[0]?.associatedDocuments ?? [];
      return docs
        .filter((d) => d.url)
        .map((d) => ({ fileName: String(d.fileName ?? ""), summary: String(d.summary ?? ""), url: String(d.url) }));
    });
  } catch {
    return [];
  }
}

/** Fill `url` (closing resume INCLA preferred, else opening resume INOA) for a small list of investigations. */
export async function withInvestigationUrls(invs: Investigation[], opts: { cacheDir?: string } = {}): Promise<Investigation[]> {
  const ids = [...new Set(invs.map((i) => i.actionNumber))];
  const urls = new Map<string, string | null>();
  await Promise.all(
    ids.map(async (id) => {
      const docs = await fetchInvestigationDocs(id, opts);
      const pick = docs.find((d) => /^INCLA-/i.test(d.fileName)) ?? docs.find((d) => /^INOA-/i.test(d.fileName));
      urls.set(id, pick?.url ?? null);
    }),
  );
  return invs.map((i) => ({ ...i, url: i.url ?? urls.get(i.actionNumber) ?? null }));
}
