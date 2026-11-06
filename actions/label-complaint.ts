import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { scoped, scopeFrom } from "../server/lib/scope.js";
import { getMode, getVehicle, recompute } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Review a complaint's membership in a failure-mode cluster: include (force in), exclude (false positive) or clear the label. Labels carry over to every future scan; the vehicle's clusters are recomputed.",
  schema: z.object({
    vehicleId: z.string().describe("Vehicle scan id whose clusters to recompute"),
    odiNumber: z.string().describe("NHTSA ODI complaint number"),
    failureModeId: z.string().describe("Failure mode id"),
    verdict: z
      .enum(["include", "exclude", "clear"])
      .describe('"include", "exclude", or "clear" to remove the label'),
  }),
  run: async ({ vehicleId, odiNumber, failureModeId, verdict }, ctx) => {
    const scope = scopeFrom(ctx);
    await getVehicle(scope, vehicleId);
    await getMode(scope, failureModeId);
    const db = getDb();
    const cp = schema.complaints;
    const [complaint] = await db
      .select({ odi: cp.odiNumber })
      .from(cp)
      .where(
        and(
          eq(cp.vehicleId, vehicleId),
          eq(cp.odiNumber, odiNumber),
          eq(cp.isPeer, false),
        ),
      )
      .limit(1);
    if (!complaint)
      fail(`Complaint ${odiNumber} is not part of this vehicle scan.`, {
        statusCode: 404,
        errorCode: "complaint_not_found",
      });
    const t = schema.complaintLabels;
    await db
      .delete(t)
      .where(
        and(
          scoped(t, scope),
          eq(t.odiNumber, odiNumber),
          eq(t.failureModeId, failureModeId),
        ),
      );
    if (verdict !== "clear") {
      await db.insert(t).values({
        id: crypto.randomUUID(),
        odiNumber,
        failureModeId,
        verdict,
        ownerEmail: scope.ownerEmail,
        orgId: scope.orgId,
      });
    }
    const results = await recompute(scope, vehicleId);
    const cluster = results.find((r) => r.failureModeId === failureModeId);
    return {
      ok: true,
      id: odiNumber,
      verdict,
      count: cluster?.count ?? 0,
      uncoveredCount: cluster?.uncoveredCount ?? 0,
      message: `Complaint ${odiNumber}: ${verdict === "clear" ? "label cleared" : verdict + "d"}; cluster now has ${cluster?.count ?? 0} complaints.`,
    };
  },
});
