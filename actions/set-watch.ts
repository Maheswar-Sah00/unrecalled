import { defineAction } from "@agent-native/core/action";
import { resourcePutIfAbsent } from "@agent-native/core/resources";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { scoped, scopeFrom } from "../server/lib/scope.js";
import { getVehicle } from "../server/lib/unrecalled.js";

const WATCHLIST_JOB = `---
schedule: "0 9 * * 1"
enabled: true
runAs: creator
---

# Unrecalled weekly watchlist

Call the \`rescan-watchlist\` action once. Then call \`list-alerts\` and summarize any alerts created in the last 7 days: which vehicle, which failure mode, and whether an early-warning signal fired or an uncovered cluster grew. If there are none, say "No new uncovered defect signals this week." Do not draft petitions automatically.
`;

export default defineAction({
  description:
    "Add or remove a scanned vehicle from the watchlist. Watched vehicles are re-scanned weekly by rescan-watchlist, which records alerts when a signal fires or an uncovered cluster grows.",
  schema: z.object({
    vehicleId: z.string().describe("Vehicle scan id"),
    watch: z
      .enum(["true", "false"])
      .describe('"true" to watch, "false" to stop watching'),
  }),
  run: async ({ vehicleId, watch }, ctx) => {
    const scope = scopeFrom(ctx);
    await getVehicle(scope, vehicleId);
    const v = schema.vehicles;
    await getDb()
      .update(v)
      .set({ watch: watch === "true" })
      .where(and(eq(v.id, vehicleId), scoped(v, scope)));
    let automation: string | null = null;
    if (watch === "true") {
      // One weekly automation per owner drives every watched vehicle.
      const created = await resourcePutIfAbsent(
        scope.ownerEmail,
        "jobs/unrecalled-watchlist.md",
        WATCHLIST_JOB,
        "text/markdown",
      ).catch(() => null);
      automation = created ? "created" : "exists";
    }
    return { id: vehicleId, watch: watch === "true", automation };
  },
});
