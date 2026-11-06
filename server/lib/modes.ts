import { fail } from "@agent-native/core/action";
import { z } from "zod";

const regexList = z
  .array(z.string())
  .describe("Regex sources, case-insensitive, one per entry");

export const modePatchSchema = z.object({
  name: z.string().min(1).optional().describe("Display name"),
  hazard: z.string().optional().describe("One-line safety consequence"),
  componentHints: z
    .array(z.string())
    .optional()
    .describe('NHTSA component words, e.g. ["STEERING"]'),
  include: regexList.optional(),
  exclude: regexList.optional(),
  coverageTerms: regexList.optional(),
});

export function validateRegexes(list: string[] | undefined, field: string) {
  for (const src of list ?? []) {
    try {
      new RegExp(src, "i");
    } catch (e) {
      fail(`Invalid regex in ${field}: ${src} (${(e as Error).message})`, {
        statusCode: 400,
        errorCode: "invalid_regex",
      });
    }
  }
}
