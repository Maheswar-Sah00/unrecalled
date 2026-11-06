import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { getPetitionRow } from "../server/lib/petitions.js";
import { scopeFrom } from "../server/lib/scope.js";

export default defineAction({
  description:
    'Edit a petition: replace its markdown, title, petitioner address, or status. Status "ready" means reviewed and ready to send to NHTSA; "filed" records that the person actually submitted it (needs human approval). Unfilled checklist items block "ready" and "filed".',
  schema: z.object({
    id: z.string().describe("Petition id"),
    markdown: z.string().optional().describe("Full replacement markdown"),
    title: z.string().optional().describe("New title"),
    petitionerAddress: z
      .string()
      .optional()
      .describe("Petitioner's mailing address"),
    status: z
      .enum(["draft", "ready", "filed"])
      .optional()
      .describe('"draft", "ready", or "filed"'),
  }),
  needsApproval: (args) => args.status === "filed",
  mcpAnnotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  run: async (args, ctx) => {
    const scope = scopeFrom(ctx);
    const p = await getPetitionRow(scope, args.id);
    const petitioner = {
      ...(p.petitioner as { name: string; address: string; email?: string }),
    };
    let checklist = p.checklist as { item: string; ok: boolean }[];
    if (args.petitionerAddress !== undefined) {
      petitioner.address = args.petitionerAddress.trim();
    }
    checklist = checklist.map((c) =>
      /address/i.test(c.item) ? { ...c, ok: !!petitioner.address } : c,
    );
    let markdown = args.markdown ?? p.markdown;
    if (args.petitionerAddress !== undefined && petitioner.address) {
      markdown = markdown.replace(
        /\[(?:mailing )?address[^\]]*\]/gi,
        petitioner.address,
      );
    }
    if (args.status && args.status !== "draft") {
      const missing = checklist.filter((c) => !c.ok).map((c) => c.item);
      if (missing.length)
        fail(
          `Cannot mark as ${args.status}: missing ${missing.join("; ")}.`,
          { statusCode: 409, errorCode: "checklist_incomplete" },
        );
    }
    const updatedAt = new Date().toISOString();
    await getDb()
      .update(schema.petitions)
      .set({
        markdown,
        title: args.title ?? p.title,
        petitioner,
        checklist,
        status: args.status ?? p.status,
        updatedAt,
      })
      .where(eq(schema.petitions.id, p.id));
    return {
      id: p.id,
      status: args.status ?? p.status,
      updatedAt,
      checklist,
      message: "Petition saved.",
    };
  },
});
