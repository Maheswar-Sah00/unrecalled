import path from "node:path";

import { fail } from "@agent-native/core/action";
import { and, eq, inArray } from "drizzle-orm";

import {
  decodeVin,
  fetchComplaints,
  fetchRecalls,
  investigationsFor,
  loadInvestigations,
  scan,
  withInvestigationUrls,
} from "../engine/index.js";
import { DEFAULT_PEERS, SEED_MODES, SEED_SETTLEMENTS } from "../engine/rules.js";
import type {
  ClusterResult,
  Complaint,
  ComplaintLabel,
  FailureMode,
  Investigation,
  Recall,
  Settlement,
} from "../engine/types.js";
import { getDb, schema } from "../db/index.js";
import { scoped, type Scope } from "./scope.js";

export const CACHE_DIR = path.resolve(process.cwd(), "data", "cache");

const CURRENT_YEAR = new Date().getUTCFullYear();
export const MAX_YEARS = 8;

async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!);
    }
  });
  await Promise.all(workers);
  return out;
}

function dedupe(list: Complaint[]): Complaint[] {
  const seen = new Map<string, Complaint>();
  for (const c of list) if (!seen.has(c.odiNumber)) seen.set(c.odiNumber, c);
  return [...seen.values()];
}

export function vehicleLabel(make: string, model: string, from: number, to: number) {
  const title = (s: string) =>
    s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
  const years = from === to ? `${from}` : `${from}–${to}`;
  return `${title(make)} ${title(model)} ${years}`;
}

// ---------- failure modes, labels, settlements ----------

export async function getModes(scope: Scope): Promise<FailureMode[]> {
  const db = getDb();
  const t = schema.failureModes;
  const rows = await db.select({ id: t.id, data: t.data }).from(t).where(scoped(t, scope)).limit(500);
  const have = new Set(rows.map((r) => r.id));
  const missing = SEED_MODES.filter((m) => !have.has(m.id));
  if (missing.length) {
    await db.insert(t).values(
      missing.map((m) => ({
        pk: crypto.randomUUID(),
        id: m.id,
        data: m,
        isSeed: true,
        ownerEmail: scope.ownerEmail,
        orgId: scope.orgId,
      })),
    );
  }
  return [...rows.map((r) => r.data as FailureMode), ...missing];
}

export async function getMode(scope: Scope, id: string): Promise<FailureMode> {
  const modes = await getModes(scope);
  return modes.find((m) => m.id === id) ?? fail(`Unknown failure mode "${id}".`, { statusCode: 404, errorCode: "mode_not_found" });
}

export async function getLabels(scope: Scope): Promise<ComplaintLabel[]> {
  const t = schema.complaintLabels;
  const rows = await getDb()
    .select({ odiNumber: t.odiNumber, failureModeId: t.failureModeId, verdict: t.verdict })
    .from(t)
    .where(scoped(t, scope))
    .limit(20000);
  return rows as ComplaintLabel[];
}

export async function getSettlements(scope: Scope): Promise<Settlement[]> {
  const t = schema.settlements;
  const rows = await getDb().select({ data: t.data }).from(t).where(scoped(t, scope)).limit(500);
  return [...SEED_SETTLEMENTS, ...rows.map((r) => r.data as Settlement)];
}

// ---------- vehicles ----------

export async function getVehicle(scope: Scope, id: string) {
  const t = schema.vehicles;
  const [row] = await getDb().select().from(t).where(and(eq(t.id, id), scoped(t, scope))).limit(1);
  return row ?? fail("Vehicle scan not found.", { statusCode: 404, errorCode: "vehicle_not_found" });
}

export interface ScanArgs {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
}

export function normalizeScanArgs(args: ScanArgs): ScanArgs {
  const make = args.make.trim().toUpperCase();
  const model = args.model.trim().toUpperCase();
  if (!make || !model) fail("Make and model are required.", { statusCode: 400, errorCode: "invalid_vehicle" });
  if (args.yearFrom > args.yearTo)
    fail("yearFrom must be ≤ yearTo.", { statusCode: 400, errorCode: "invalid_years" });
  if (args.yearFrom < 1990 || args.yearTo > CURRENT_YEAR + 1)
    fail(`Model years must be between 1990 and ${CURRENT_YEAR + 1}.`, { statusCode: 400, errorCode: "invalid_years" });
  if (args.yearTo - args.yearFrom + 1 > MAX_YEARS)
    fail(`Scan at most ${MAX_YEARS} model years at once.`, { statusCode: 400, errorCode: "too_many_years" });
  return { make, model, yearFrom: args.yearFrom, yearTo: args.yearTo };
}

export async function scanVehicle(scope: Scope, raw: ScanArgs) {
  const { make, model, yearFrom, yearTo } = normalizeScanArgs(raw);
  const years = Array.from({ length: yearTo - yearFrom + 1 }, (_, i) => yearFrom + i);
  const peers = DEFAULT_PEERS[`${make}|${model}`] ?? [];
  const warnings: string[] = [];

  const ownJobs = years.map((y) => ({ make, model, year: y }));
  const peerJobs = peers.flatMap((p) => years.map((y) => ({ make: p.make, model: p.model, year: y })));

  const [own, recallLists, peerLists, allInv] = await Promise.all([
    pool(ownJobs, 6, (j) => fetchComplaints(j.make, j.model, j.year, { cacheDir: CACHE_DIR })),
    pool(years, 6, (y) => fetchRecalls(make, model, y, { cacheDir: CACHE_DIR })),
    pool(peerJobs, 6, (j) => fetchComplaints(j.make, j.model, j.year, { cacheDir: CACHE_DIR }).catch(() => [] as Complaint[])),
    loadInvestigations({ cacheDir: CACHE_DIR }),
  ]);

  const complaints = dedupe(own.flat());
  const peerComplaints = dedupe(peerLists.flat());
  const recalls: Recall[] = recallLists.flat();
  const investigations: Investigation[] = await withInvestigationUrls(
    investigationsFor(allInv, make, model, years),
    { cacheDir: CACHE_DIR },
  ).catch(() => investigationsFor(allInv, make, model, years));
  years.forEach((y, i) => {
    if ((own[i] ?? []).length === 0) warnings.push(`No complaints returned for ${y} ${make} ${model}.`);
  });
  if (complaints.length === 0)
    fail(`NHTSA returned no complaints for ${make} ${model} ${yearFrom}–${yearTo}. Check the make/model spelling (NHTSA names, e.g. "MODEL 3", "F-150").`, {
      statusCode: 404,
      errorCode: "no_complaints",
    });

  const db = getDb();
  const v = schema.vehicles;
  const [existing] = await db
    .select({ id: v.id })
    .from(v)
    .where(and(scoped(v, scope), eq(v.make, make), eq(v.model, model), eq(v.yearFrom, yearFrom), eq(v.yearTo, yearTo)))
    .limit(1);
  const id = existing?.id ?? crypto.randomUUID();
  const label = vehicleLabel(make, model, yearFrom, yearTo);
  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(v)
        .set({ recalls, investigations, peers, warnings, lastScannedAt: now })
        .where(eq(v.id, id));
    } else {
      await tx.insert(v).values({
        id,
        label,
        make,
        model,
        yearFrom,
        yearTo,
        peers,
        recalls,
        investigations,
        warnings,
        lastScannedAt: now,
        ownerEmail: scope.ownerEmail,
        orgId: scope.orgId,
      });
    }
    await tx.delete(schema.complaints).where(eq(schema.complaints.vehicleId, id));
    const rows = [
      ...complaints.map((c) => ({ ...c, isPeer: false })),
      ...peerComplaints.map((c) => ({ ...c, isPeer: true })),
    ].map((c) => ({
      vehicleId: id,
      odiNumber: c.odiNumber,
      isPeer: c.isPeer,
      make: c.make,
      model: c.model,
      modelYear: c.modelYear,
      dateReceived: c.dateReceived,
      dateIncident: c.dateIncident,
      components: c.components ?? "",
      summary: c.summary ?? "",
      crash: !!c.crash,
      fire: !!c.fire,
      injuries: c.injuries ?? 0,
      deaths: c.deaths ?? 0,
      ownerEmail: scope.ownerEmail,
      orgId: scope.orgId,
    }));
    for (let i = 0; i < rows.length; i += 400) {
      await tx.insert(schema.complaints).values(rows.slice(i, i + 400));
    }
  });

  const results = await recompute(scope, id, { alert: !!existing });
  return {
    id,
    label,
    clusters: results.length,
    uncovered: results.filter((r) => r.coverage.status === "uncovered").length,
    totalComplaints: complaints.length,
    peerComplaints: peerComplaints.length,
    recalls: recalls.length,
    investigations: investigations.length,
    warnings,
  };
}

export async function loadComplaints(vehicleId: string, isPeer: boolean): Promise<Complaint[]> {
  const t = schema.complaints;
  const rows = await getDb()
    .select({
      odiNumber: t.odiNumber,
      make: t.make,
      model: t.model,
      modelYear: t.modelYear,
      dateReceived: t.dateReceived,
      dateIncident: t.dateIncident,
      components: t.components,
      summary: t.summary,
      crash: t.crash,
      fire: t.fire,
      injuries: t.injuries,
      deaths: t.deaths,
    })
    .from(t)
    .where(and(eq(t.vehicleId, vehicleId), eq(t.isPeer, isPeer)))
    .limit(50000);
  return rows;
}

/** Re-run clustering + coverage from stored data (after a label or rule change). */
export async function recompute(scope: Scope, vehicleId: string, opts: { alert?: boolean } = {}): Promise<ClusterResult[]> {
  const vehicle = await getVehicle(scope, vehicleId);
  const years = Array.from({ length: vehicle.yearTo - vehicle.yearFrom + 1 }, (_, i) => vehicle.yearFrom + i);
  const [complaints, peerComplaints, modes, labels, settlements] = await Promise.all([
    loadComplaints(vehicleId, false),
    loadComplaints(vehicleId, true),
    getModes(scope),
    getLabels(scope),
    getSettlements(scope),
  ]);
  const results = scan({
    make: vehicle.make,
    model: vehicle.model,
    years,
    complaints,
    recalls: vehicle.recalls as Recall[],
    investigations: vehicle.investigations as Investigation[],
    settlements,
    modes,
    labels,
    peerComplaints: peerComplaints.length ? peerComplaints : undefined,
  });

  const db = getDb();
  const c = schema.clusters;
  const before = await db
    .select({ failureModeId: c.failureModeId, uncoveredCount: c.uncoveredCount, signalFired: c.signalFired })
    .from(c)
    .where(eq(c.vehicleId, vehicleId));
  const prior = new Map(before.map((b) => [b.failureModeId, b]));
  const now = new Date().toISOString();
  const modeName = new Map(modes.map((m) => [m.id, m.name]));

  await db.transaction(async (tx) => {
    await tx.delete(c).where(eq(c.vehicleId, vehicleId));
    if (results.length) {
      await tx.insert(c).values(
        results.map((r) => ({
          id: crypto.randomUUID(),
          vehicleId,
          failureModeId: r.failureModeId,
          count: r.count,
          uncoveredCount: r.uncoveredCount,
          status: r.coverage.status,
          signalFired: r.signal.fired,
          data: r,
          updatedAt: now,
          ownerEmail: scope.ownerEmail,
          orgId: scope.orgId,
        })),
      );
    }
    await tx
      .update(schema.vehicles)
      .set({
        totalComplaints: complaints.length,
        uncoveredModes: results.filter((r) => r.coverage.status === "uncovered").length,
      })
      .where(eq(schema.vehicles.id, vehicleId));

    if (opts.alert) {
      const alerts = [];
      for (const r of results) {
        const p = prior.get(r.failureModeId);
        const name = modeName.get(r.failureModeId) ?? r.failureModeId;
        if (r.signal.fired && !p?.signalFired) {
          alerts.push({ kind: "signal", message: `${vehicle.label}: early-warning signal fired for "${name}" (${r.uncoveredCount} uncovered complaints).`, failureModeId: r.failureModeId });
        } else if (r.coverage.status === "uncovered" && p && r.uncoveredCount - p.uncoveredCount >= 5) {
          alerts.push({ kind: "growth", message: `${vehicle.label}: "${name}" grew by ${r.uncoveredCount - p.uncoveredCount} uncovered complaints since the last scan.`, failureModeId: r.failureModeId });
        }
      }
      if (alerts.length) {
        await tx.insert(schema.alerts).values(
          alerts.map((a) => ({ id: crypto.randomUUID(), vehicleId, ...a, ownerEmail: scope.ownerEmail, orgId: scope.orgId })),
        );
      }
    }
  });
  return results;
}

/** Recompute every vehicle in scope (after a rule edit). */
export async function recomputeAll(scope: Scope): Promise<number> {
  const v = schema.vehicles;
  const rows = await getDb().select({ id: v.id }).from(v).where(scoped(v, scope)).limit(100);
  for (const r of rows) await recompute(scope, r.id);
  return rows.length;
}

export async function getClusterRow(scope: Scope, vehicleId: string, failureModeId: string): Promise<ClusterResult> {
  await getVehicle(scope, vehicleId);
  const c = schema.clusters;
  const [row] = await getDb()
    .select({ data: c.data })
    .from(c)
    .where(and(eq(c.vehicleId, vehicleId), eq(c.failureModeId, failureModeId)))
    .limit(1);
  return (row?.data as ClusterResult) ?? fail("No complaints match that failure mode for this vehicle.", { statusCode: 404, errorCode: "cluster_not_found" });
}

export async function complaintsByIds(vehicleId: string, ids: string[]): Promise<Complaint[]> {
  if (!ids.length) return [];
  const t = schema.complaints;
  const out: Complaint[] = [];
  for (let i = 0; i < ids.length; i += 500) {
    const rows = await getDb()
      .select({
        odiNumber: t.odiNumber,
        make: t.make,
        model: t.model,
        modelYear: t.modelYear,
        dateReceived: t.dateReceived,
        dateIncident: t.dateIncident,
        components: t.components,
        summary: t.summary,
        crash: t.crash,
        fire: t.fire,
        injuries: t.injuries,
        deaths: t.deaths,
      })
      .from(t)
      .where(and(eq(t.vehicleId, vehicleId), eq(t.isPeer, false), inArray(t.odiNumber, ids.slice(i, i + 500))));
    out.push(...rows);
  }
  return out;
}

export { decodeVin };
