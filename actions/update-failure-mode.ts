import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import type { FailureMode } from "../server/engine/types.js";
import { modePatchSchema, validateRegexes } from "../server/lib/modes.js";
import { scoped, scopeFrom } from "../server/lib/scope.js";
import { getModes, recomputeAll } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Edit a failure-mode rule (name, hazard, include/exclude regexes, coverageTerms). Every scanned vehicle is re-clustered with the new rule.",
  schema: z.object({
    id: z.string().describe('Failure mode id, e.g. "death-wobble"'),
    patch: modePatchSchema.describe(
      "Fields to change; omitted fields stay as they are",
    ),
  }),
  run: async ({ id, patch }, ctx) => {
    const scope = scopeFrom(ctx);
    validateRegexes(patch.include, "include");
    validateRegexes(patch.exclude, "exclude");
    validateRegexes(patch.coverageTerms, "coverageTerms");
    if (patch.include && patch.include.length === 0)
      fail("A failure mode needs at least one include pattern.", {
        statusCode: 400,
        errorCode: "empty_include",
      });
    const modes = await getModes(scope);
    const current =
      modes.find((m) => m.id === id) ??
      fail(`Unknown failure mode "${id}".`, {
        statusCode: 404,
        errorCode: "mode_not_found",
      });
    const defined = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    ) as Partial<FailureMode>;
    const next: FailureMode = { ...current, ...defined, id };
    const t = schema.failureModes;
    await getDb()
      .update(t)
      .set({ data: next, isSeed: false, updatedAt: new Date().toISOString() })
      .where(and(scoped(t, scope), eq(t.id, id)));
    const vehicles = await recomputeAll(scope);
    return {
      id,
      mode: next,
      recomputedVehicles: vehicles,
      message: `Updated "${next.name}" and re-clustered ${vehicles} vehicle(s).`,
    };
  },
});
