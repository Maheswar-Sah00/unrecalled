import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { getPetitionRow } from "../server/lib/petitions.js";
import { scopeFrom } from "../server/lib/scope.js";

export default defineAction({
  description:
    "Get a petition draft: title, full markdown, the 49 CFR 552.4 checklist, status (draft / ready / filed), petitioner and the cluster it came from.",
  schema: z.object({ id: z.string().describe("Petition id") }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => {
    const p = await getPetitionRow(scopeFrom(ctx), id);
    return {
      id: p.id,
      title: p.title,
      markdown: p.markdown,
      checklist: p.checklist as { item: string; ok: boolean }[],
      petitioner: p.petitioner as {
        name: string;
        address: string;
        email?: string;
      },
      status: p.status as "draft" | "ready" | "filed",
      vehicleId: p.vehicleId,
      failureModeId: p.failureModeId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  },
});
