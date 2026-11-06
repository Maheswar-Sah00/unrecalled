import { defineAction } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { z } from "zod";

import { scopeFrom } from "../server/lib/scope.js";
import { scanVehicle } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Scan a vehicle (make, model, model-year range) against live NHTSA data: pull owner complaints, recalls and ODI investigations, cluster complaints into failure modes, and mark each mode recalled / under investigation / settlement / closed without recall / uncovered. Re-scanning the same vehicle refreshes it. Takes 5-30 s.",
  schema: z.object({
    make: z.string().min(1).describe('NHTSA make, e.g. "JEEP", "TESLA", "HYUNDAI"'),
    model: z
      .string()
      .min(1)
      .describe('NHTSA model name, e.g. "WRANGLER", "MODEL 3", "IONIQ 5"'),
    yearFrom: z.coerce.number().int().describe("First model year, e.g. 2018"),
    yearTo: z.coerce
      .number()
      .int()
      .describe("Last model year, inclusive; at most 8 years after yearFrom"),
  }),
  link: ({ result }) => ({
    url: buildDeepLink({
      view: "gaps",
      to: `/gaps/${encodeURIComponent(result.id)}`,
      params: { vehicleId: result.id },
    }),
    label: `Open ${result.label}`,
  }),
  run: async (args, ctx) => {
    const r = await scanVehicle(scopeFrom(ctx), args);
    return {
      ...r,
      message: `${r.label}: ${r.totalComplaints} complaints, ${r.clusters} failure modes, ${r.uncovered} uncovered.`,
    };
  },
});
