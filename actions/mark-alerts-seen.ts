import { defineAction } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { scoped, scopeFrom } from "../server/lib/scope.js";

export default defineAction({
  description:
    "Mark a watched vehicle's watchlist alerts as seen (called when the owner opens the car report).",
  schema: z.object({
    vehicleId: z.string().describe("Vehicle scan id"),
  }),
  run: async ({ vehicleId }, ctx) => {
    const t = schema.alerts;
    await getDb()
      .update(t)
      .set({ seen: true })
      .where(and(scoped(t, scopeFrom(ctx)), eq(t.vehicleId, vehicleId), eq(t.seen, false)));
    return { vehicleId, seen: true };
  },
});
