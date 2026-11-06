import { fail } from "@agent-native/core/action";
import { and, eq, isNull, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

export interface Scope {
  ownerEmail: string;
  orgId: string | null;
}

export function scopeFrom(ctx: { userEmail?: string | null; orgId?: string | null } | undefined): Scope {
  const ownerEmail =
    ctx?.userEmail ?? fail("Sign in to use Unrecalled.", { statusCode: 401 });
  return { ownerEmail, orgId: ctx?.orgId ?? null };
}

/** Team-visible inside an org; private to the owner otherwise. */
export function scoped(
  table: { ownerEmail: PgColumn; orgId: PgColumn },
  scope: Scope,
): SQL {
  return scope.orgId
    ? eq(table.orgId, scope.orgId)
    : (and(eq(table.ownerEmail, scope.ownerEmail), isNull(table.orgId)) as SQL);
}
