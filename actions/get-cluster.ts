import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { explainMatch } from "../server/engine/index.js";
import { scopeFrom } from "../server/lib/scope.js";
import {
  complaintsByIds,
  getClusterRow,
  getLabels,
  getMode,
  getVehicle,
} from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Get one failure-mode cluster for a vehicle: the rule, coverage references (recalls, investigations, settlements) with the terms that matched, per-year coverage, and a page of matching owner complaints (ODI numbers, narratives, highlighted matches, review labels).",
  schema: z.object({
    vehicleId: z.string().describe("Vehicle scan id"),
    failureModeId: z
      .string()
      .describe('Failure mode id, e.g. "death-wobble"'),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1)
      .describe("1-based page; defaults to 1"),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25)
      .describe("Complaints per page (1-100); defaults to 25"),
    year: z.coerce
      .number()
      .int()
      .optional()
      .describe("Only complaints for this model year; omit for all years"),
    uncoveredOnly: z
      .enum(["true", "false"])
      .default("false")
      .describe(
        '"true" lists only complaints from model years nothing covers; defaults to "false"',
      ),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async (
    { vehicleId, failureModeId, page, pageSize, year, uncoveredOnly },
    ctx,
  ) => {
    const scope = scopeFrom(ctx);
    const vehicle = await getVehicle(scope, vehicleId);
    const [mode, cluster, labels] = await Promise.all([
      getMode(scope, failureModeId),
      getClusterRow(scope, vehicleId, failureModeId),
      getLabels(scope),
    ]);
    const labelMap = new Map(
      labels
        .filter((l) => l.failureModeId === failureModeId)
        .map((l) => [l.odiNumber, l.verdict]),
    );
    // Excluded complaints stay visible so a reviewer can undo the exclusion.
    const excludedIds = [...labelMap.entries()]
      .filter(([, v]) => v === "exclude")
      .map(([k]) => k);
    let all = await complaintsByIds(vehicleId, [
      ...new Set([...cluster.complaintIds, ...excludedIds]),
    ]);
    const uncoveredYears = new Set(
      cluster.byYear.filter((y) => y.status === "uncovered").map((y) => y.year),
    );
    if (year) all = all.filter((c) => c.modelYear === year);
    if (uncoveredOnly === "true")
      all = all.filter((c) => uncoveredYears.has(c.modelYear));
    all.sort((a, b) => b.dateReceived.localeCompare(a.dateReceived));
    const total = all.length;
    const slice = all.slice((page - 1) * pageSize, page * pageSize);
    const { complaintIds: _ids, ...clusterNoIds } = cluster;
    return {
      vehicle: {
        id: vehicle.id,
        label: vehicle.label,
        make: vehicle.make,
        model: vehicle.model,
        yearFrom: vehicle.yearFrom,
        yearTo: vehicle.yearTo,
      },
      mode,
      cluster: clusterNoIds,
      refs: cluster.coverage.refs,
      complaints: slice.map((c) => ({
        odiNumber: c.odiNumber,
        modelYear: c.modelYear,
        dateReceived: c.dateReceived,
        components: c.components,
        summary: c.summary,
        crash: c.crash,
        fire: c.fire,
        injuries: c.injuries,
        deaths: c.deaths,
        label: (labelMap.get(c.odiNumber) ?? null) as
          | "include"
          | "exclude"
          | null,
        highlights: explainMatch(c, mode).map((h) => ({
          start: h.start,
          end: h.end,
        })),
      })),
      total,
      page,
      pageSize,
    };
  },
});
