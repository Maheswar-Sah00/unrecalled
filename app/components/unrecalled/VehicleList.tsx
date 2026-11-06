import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { IconChevronRight } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { fmtInt, fmtRelative, yearRange } from "./format";
import { SectionHeading } from "./page";
import type { ListVehiclesResult, VehicleSummary } from "./types";

export function VehicleList() {
  const { data, isLoading, error } =
    useActionQuery<ListVehiclesResult>("list-vehicles", {});
  const vehicles = data?.vehicles ?? [];

  return (
    <section className="mt-8">
      <SectionHeading>Scanned vehicles</SectionHeading>
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load scanned vehicles."}
        </p>
      ) : vehicles.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No vehicles scanned yet. Pick one above.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {vehicles.map((v) => (
            <VehicleRow key={v.id} v={v} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VehicleRow({ v }: { v: VehicleSummary }) {
  const qc = useQueryClient();
  const setWatch = useActionMutation<
    unknown,
    { vehicleId: string; watch: "true" | "false" }
  >("set-watch", {
    onMutate: async ({ vehicleId, watch: watchArg }) => {
      const watch = watchArg === "true";
      const key = ["action", "list-vehicles", {}];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ListVehiclesResult>(key);
      qc.setQueryData<ListVehiclesResult>(key, (old) =>
        old
          ? {
              vehicles: old.vehicles.map((x) =>
                x.id === vehicleId ? { ...x, watch } : x,
              ),
            }
          : old,
      );
      return { prev };
    },
    onError: (error, _vars, ctx) => {
      const prev = (ctx as { prev?: ListVehiclesResult } | undefined)?.prev;
      if (prev) qc.setQueryData(["action", "list-vehicles", {}], prev);
      toast.error(actionErrorMessage(error) ?? "Could not update watch.");
    },
  });

  const label =
    v.label || `${v.make} ${v.model} ${yearRange(v.yearFrom, v.yearTo)}`;
  const switchId = `watch-${v.id}`;
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 md:px-4">
      <Link
        to={`/gaps/${encodeURIComponent(v.id)}`}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium group-hover:underline">
            {label}
          </div>
          <div className="ur-num truncate text-xs text-muted-foreground">
            {fmtInt(v.totalComplaints)} complaints · scanned{" "}
            {fmtRelative(v.lastScannedAt)}
          </div>
        </div>
        <span
          className={cn(
            "ur-num shrink-0 text-right text-sm",
            v.uncoveredModes > 0
              ? "font-semibold text-ur-uncovered"
              : "text-muted-foreground",
          )}
        >
          {v.uncoveredModes}
          <span className="ms-1 hidden text-xs font-normal text-muted-foreground sm:inline">
            uncovered
          </span>
        </span>
        <IconChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Link>
      <div className="flex shrink-0 items-center gap-2 border-s ps-3">
        <label
          htmlFor={switchId}
          className="hidden text-xs text-muted-foreground sm:inline"
        >
          Watch
        </label>
        <Switch
          id={switchId}
          size="sm"
          checked={v.watch}
          aria-label={`Watch ${label} weekly`}
          onCheckedChange={(watch) =>
            setWatch.mutate({ vehicleId: v.id, watch: watch ? "true" : "false" })
          }
        />
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y rounded-lg border">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
