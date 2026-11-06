import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { scopeFrom } from "../server/lib/scope.js";
import { getModes } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "List the failure-mode rules: id, name, include/exclude regexes used to classify complaints, coverageTerms regexes matched against recall and investigation text, and hazard.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async (_args, ctx) => ({ modes: await getModes(scopeFrom(ctx)) }),
});
