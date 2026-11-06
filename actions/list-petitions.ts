import { defineAction } from "@agent-native/core/action";
import { desc } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { scoped, scopeFrom } from "../server/lib/scope.js";

export default defineAction({
  description: "List petition drafts, newest first, with status.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async (_args, ctx) => {
    const t = schema.petitions;
    const petitions = await getDb()
      .select({
        id: t.id,
        title: t.title,
        status: t.status,
        vehicleId: t.vehicleId,
        failureModeId: t.failureModeId,
        updatedAt: t.updatedAt,
      })
      .from(t)
      .where(scoped(t, scopeFrom(ctx)))
      .orderBy(desc(t.updatedAt))
      .limit(100);
    return { petitions };
  },
});
