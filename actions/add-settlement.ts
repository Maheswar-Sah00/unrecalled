import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import type { Settlement } from "../server/engine/types.js";
import { scopeFrom } from "../server/lib/scope.js";
import { getMode, recomputeAll } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Record a class settlement or extended warranty that covers a failure mode for some model years, so those years stop counting as uncovered. Always give a source URL.",
  schema: z.object({
    name: z.string().min(1).describe('Short name, e.g. "Reynolds v. FCA"'),
    make: z.string().min(1).describe("NHTSA make"),
    model: z.string().min(1).describe("NHTSA model"),
    yearFrom: z.coerce.number().int().describe("First covered model year"),
    yearTo: z.coerce.number().int().describe("Last covered model year"),
    failureModeId: z.string().describe("Failure mode the settlement covers"),
    url: z.string().url().describe("Source URL for the settlement"),
    summary: z.string().default("").describe("What it covers; defaults to empty"),
  }),
  run: async (args, ctx) => {
    const scope = scopeFrom(ctx);
    await getMode(scope, args.failureModeId);
    const s: Settlement = {
      ...args,
      id: crypto.randomUUID(),
      make: args.make.toUpperCase(),
      model: args.model.toUpperCase(),
    };
    await getDb().insert(schema.settlements).values({
      id: s.id,
      data: s,
      ownerEmail: scope.ownerEmail,
      orgId: scope.orgId,
    });
    const vehicles = await recomputeAll(scope);
    return { id: s.id, recomputedVehicles: vehicles };
  },
});
