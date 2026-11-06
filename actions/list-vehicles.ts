import { defineAction } from "@agent-native/core/action";
import { desc } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { scoped, scopeFrom } from "../server/lib/scope.js";

export default defineAction({
  description:
    "List scanned vehicles with complaint totals, number of uncovered failure modes, last scan time and watch status.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async (_args, ctx) => {
    const v = schema.vehicles;
    const vehicles = await getDb()
      .select({
        id: v.id,
        label: v.label,
        make: v.make,
        model: v.model,
        yearFrom: v.yearFrom,
        yearTo: v.yearTo,
        totalComplaints: v.totalComplaints,
        uncoveredModes: v.uncoveredModes,
        lastScannedAt: v.lastScannedAt,
        watch: v.watch,
      })
      .from(v)
      .where(scoped(v, scopeFrom(ctx)))
      .orderBy(desc(v.lastScannedAt))
      .limit(100);
    return { vehicles };
  },
});
