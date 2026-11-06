import { fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";

import { getDb, schema } from "../db/index.js";
import { scoped, type Scope } from "./scope.js";

export async function getPetitionRow(scope: Scope, id: string) {
  const t = schema.petitions;
  const [row] = await getDb()
    .select()
    .from(t)
    .where(and(eq(t.id, id), scoped(t, scope)))
    .limit(1);
  return (
    row ??
    fail("Petition not found.", {
      statusCode: 404,
      errorCode: "petition_not_found",
    })
  );
}
