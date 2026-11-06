import { defineAction } from "@agent-native/core/action";
import { desc } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { scoped, scopeFrom } from "../server/lib/scope.js";

export default defineAction({
  description:
    "List watchlist alerts (newest first): early-warning signals that fired and uncovered clusters that grew since the previous scan.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async (_args, ctx) => {
    const t = schema.alerts;
    const alerts = await getDb()
      .select({
        id: t.id,
        vehicleId: t.vehicleId,
        failureModeId: t.failureModeId,
        kind: t.kind,
        message: t.message,
        createdAt: t.createdAt,
        seen: t.seen,
      })
      .from(t)
      .where(scoped(t, scopeFrom(ctx)))
      .orderBy(desc(t.createdAt))
      .limit(50);
    return { alerts };
  },
});
