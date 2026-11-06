import { defineAction } from "@agent-native/core/action";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import type { ClusterResult } from "../server/engine/types.js";
import { scopeFrom } from "../server/lib/scope.js";
import { getModes, getVehicle } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Get the gap board for a scanned vehicle: every failure-mode cluster ranked by uncovered complaints, with coverage status, crash/fire/injury/death counts, early-warning signal, peer ratio, monthly trend and per-model-year coverage.",
  schema: z.object({
    vehicleId: z
      .string()
      .describe("Vehicle scan id from list-vehicles or scan-vehicle"),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ vehicleId }, ctx) => {
    const scope = scopeFrom(ctx);
    const vehicle = await getVehicle(scope, vehicleId);
    const modes = new Map((await getModes(scope)).map((m) => [m.id, m]));
    const c = schema.clusters;
    const rows = await getDb()
      .select({ data: c.data })
      .from(c)
      .where(eq(c.vehicleId, vehicleId))
      .orderBy(desc(c.uncoveredCount), desc(c.count))
      .limit(200);
    const clusters = rows.map(({ data }) => {
      const r = data as ClusterResult;
      const mode = modes.get(r.failureModeId);
      return {
        failureModeId: r.failureModeId,
        name: mode?.name ?? r.failureModeId,
        hazard: mode?.hazard ?? "",
        count: r.count,
        uncoveredCount: r.uncoveredCount,
        crashes: r.crashes,
        fires: r.fires,
        injuries: r.injuries,
        deaths: r.deaths,
        status: r.coverage.status,
        signalFired: r.signal.fired,
        signalFiredAt: r.signal.firedAt,
        ratio: r.signal.ratio,
        firstReported: r.firstReported,
        lastReported: r.lastReported,
        monthly: r.monthly,
        byYear: r.byYear,
        refs: r.coverage.refs.map((ref) => ({
          kind: ref.kind,
          id: ref.id,
          title: ref.title,
          status: ref.status,
          years: ref.years,
        })),
      };
    });
    return {
      vehicle: {
        id: vehicle.id,
        label: vehicle.label,
        make: vehicle.make,
        model: vehicle.model,
        yearFrom: vehicle.yearFrom,
        yearTo: vehicle.yearTo,
        totalComplaints: vehicle.totalComplaints,
        uncoveredModes: vehicle.uncoveredModes,
        lastScannedAt: vehicle.lastScannedAt,
        watch: vehicle.watch,
        peers: vehicle.peers as { make: string; model: string }[],
        recallCount: (vehicle.recalls as unknown[]).length,
        investigationCount: (vehicle.investigations as unknown[]).length,
        warnings: vehicle.warnings as string[],
      },
      clusters,
    };
  },
});
