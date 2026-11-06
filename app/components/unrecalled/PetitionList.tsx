import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import { IconChevronRight } from "@tabler/icons-react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { fmtRelative } from "./format";
import { Page, useCrumbs } from "./page";
import { isReady, statusLabel } from "./PetitionEditor";
import type { PetitionSummary } from "./types";

export function PetitionList() {
  useCrumbs([{ label: "Petitions" }]);
  const { data, isLoading, error } = useActionQuery<
    { petitions: PetitionSummary[] } | PetitionSummary[]
  >("list-petitions", {});
  const petitions = Array.isArray(data) ? data : (data?.petitions ?? []);

  return (
    <Page>
      {isLoading ? (
        <ul className="divide-y rounded-lg border">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-16" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <Empty>{actionErrorMessage(error) ?? "Could not load petitions."}</Empty>
      ) : petitions.length === 0 ? (
        <Empty>
          No petitions yet. Open an uncovered failure mode on a{" "}
          <Link to="/gaps" className="underline">gap board</Link> and choose
          “Draft 552 petition”.
        </Empty>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {petitions.map((p) => (
            <li key={p.id}>
              <Link
                to={`/petitions/${encodeURIComponent(p.id)}`}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium group-hover:underline">{p.title}</div>
                  {p.updatedAt ? (
                    <div className="text-xs text-muted-foreground">
                      Edited {fmtRelative(p.updatedAt)}
                    </div>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "inline-flex h-6 shrink-0 items-center rounded-md border px-2 text-xs font-medium",
                    isReady(p.status)
                      ? "border-ur-recalled/40 bg-ur-recalled/12 text-ur-recalled"
                      : "text-muted-foreground",
                  )}
                >
                  {statusLabel(p.status)}
                </span>
                <IconChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
