import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import type { FailureMode } from "../server/engine/types.js";
import { validateRegexes } from "../server/lib/modes.js";
import { scopeFrom } from "../server/lib/scope.js";
import { getModes, recomputeAll } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Create a new failure-mode rule from regexes, then re-cluster every scanned vehicle. Use when owners describe a defect no existing mode captures.",
  schema: z.object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .describe('Slug id, lowercase with dashes, e.g. "hood-flies-open"'),
    name: z.string().min(1).describe("Display name"),
    hazard: z.string().min(1).describe("One-line safety consequence"),
    include: z
      .array(z.string())
      .min(1)
      .describe("Regex sources; a complaint matches if any matches"),
    exclude: z
      .array(z.string())
      .default([])
      .describe("Regex sources that drop a match; defaults to none"),
    coverageTerms: z
      .array(z.string())
      .min(1)
      .describe("Regex sources matched against recall/investigation text"),
    componentHints: z
      .array(z.string())
      .default([])
      .describe("NHTSA component words; defaults to none"),
  }),
  run: async (args, ctx) => {
    const scope = scopeFrom(ctx);
    validateRegexes(args.include, "include");
    validateRegexes(args.exclude, "exclude");
    validateRegexes(args.coverageTerms, "coverageTerms");
    const modes = await getModes(scope);
    if (modes.some((m) => m.id === args.id))
      fail(`Failure mode "${args.id}" already exists.`, {
        statusCode: 409,
        errorCode: "mode_exists",
      });
    const mode: FailureMode = { ...args };
    await getDb().insert(schema.failureModes).values({
      pk: crypto.randomUUID(),
      id: mode.id,
      data: mode,
      isSeed: false,
      ownerEmail: scope.ownerEmail,
      orgId: scope.orgId,
    });
    const vehicles = await recomputeAll(scope);
    return { id: mode.id, mode, recomputedVehicles: vehicles };
  },
});
