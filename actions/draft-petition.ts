import { defineAction } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { buildPetition } from "../server/engine/petition.js";
import { scopeFrom } from "../server/lib/scope.js";
import {
  complaintsByIds,
  getClusterRow,
  getMode,
  getVehicle,
} from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Draft a 49 CFR Part 552 defect-investigation petition for one uncovered failure-mode cluster, citing ODI complaint numbers, the coverage analysis and the early-warning signal. Saves an editable draft and returns its id. The agent may then refine the narrative with update-petition.",
  schema: z.object({
    vehicleId: z.string().describe("Vehicle scan id"),
    failureModeId: z.string().describe("Failure mode id of the cluster"),
    petitionerName: z
      .string()
      .min(1)
      .describe("Petitioner's full name or organization"),
    petitionerAddress: z
      .string()
      .default("")
      .describe(
        "Petitioner's mailing address (required by 49 CFR 552.4 before filing); may be empty for a draft",
      ),
    petitionerEmail: z
      .string()
      .optional()
      .describe("Optional contact email"),
  }),
  link: ({ result }) => ({
    url: buildDeepLink({
      view: "petition",
      to: `/petitions/${encodeURIComponent(result.id)}`,
      params: { petitionId: result.id },
    }),
    label: "Open petition draft",
  }),
  run: async (args, ctx) => {
    const scope = scopeFrom(ctx);
    const vehicle = await getVehicle(scope, args.vehicleId);
    const [mode, cluster] = await Promise.all([
      getMode(scope, args.failureModeId),
      getClusterRow(scope, args.vehicleId, args.failureModeId),
    ]);
    const uncoveredYears = new Set(
      cluster.byYear.filter((y) => y.status === "uncovered").map((y) => y.year),
    );
    const complaints = await complaintsByIds(
      args.vehicleId,
      cluster.complaintIds,
    );
    // Sample: uncovered years first, then most severe, then most recent.
    const severity = (c: (typeof complaints)[number]) =>
      c.deaths * 100 + c.injuries * 10 + (c.crash ? 5 : 0) + (c.fire ? 5 : 0);
    const sample = [...complaints]
      .sort(
        (a, b) =>
          Number(uncoveredYears.has(b.modelYear)) -
            Number(uncoveredYears.has(a.modelYear)) ||
          severity(b) - severity(a) ||
          b.dateReceived.localeCompare(a.dateReceived),
      )
      .slice(0, 25);
    const years = Array.from(
      { length: vehicle.yearTo - vehicle.yearFrom + 1 },
      (_, i) => vehicle.yearFrom + i,
    );
    const petitioner = {
      name: args.petitionerName,
      address: args.petitionerAddress,
      email: args.petitionerEmail,
    };
    const built = buildPetition({
      petitioner,
      vehicle: { make: vehicle.make, model: vehicle.model, years },
      mode,
      cluster,
      sample,
      generatedOn: new Date().toISOString().slice(0, 10),
    });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await getDb().insert(schema.petitions).values({
      id,
      vehicleId: vehicle.id,
      failureModeId: mode.id,
      title: built.title,
      markdown: built.markdown,
      checklist: built.checklist,
      petitioner,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      ownerEmail: scope.ownerEmail,
      orgId: scope.orgId,
    });
    return {
      id,
      title: built.title,
      missing: built.checklist.filter((c) => !c.ok).map((c) => c.item),
      message: `Drafted "${built.title}" citing ${sample.length} complaints.`,
    };
  },
});
