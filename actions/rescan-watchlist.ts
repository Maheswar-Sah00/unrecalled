import { defineAction } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { scoped, scopeFrom } from "../server/lib/scope.js";
import { scanVehicle } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Re-scan every watched vehicle against fresh NHTSA data and record alerts for newly fired signals or uncovered clusters that grew. Run by the weekly watchlist automation; safe to run by hand.",
  schema: z.object({}),
  run: async (_args, ctx) => {
    const scope = scopeFrom(ctx);
    const v = schema.vehicles;
    const watched = await getDb()
      .select({
        id: v.id,
        label: v.label,
        make: v.make,
        model: v.model,
        yearFrom: v.yearFrom,
        yearTo: v.yearTo,
      })
      .from(v)
      .where(and(scoped(v, scope), eq(v.watch, true)))
      .limit(20);
    const results = [];
    for (const w of watched) {
      try {
        const r = await scanVehicle(scope, w);
        results.push({ id: w.id, label: w.label, ok: true, uncovered: r.uncovered });
      } catch (e) {
        results.push({ id: w.id, label: w.label, ok: false, error: (e as Error).message });
      }
    }
    return {
      rescanned: results.length,
      results,
      message: `Re-scanned ${results.length} watched vehicle(s).`,
    };
  },
});
