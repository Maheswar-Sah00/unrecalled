import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { fmtInt, fmtRelative, yearRange } from "./format";
import { SectionHeading } from "./page";
import { BrandMark, CountUp } from "./premium";
import type { ListVehiclesResult, VehicleSummary } from "./types";

export function VehicleList() {
  const { data, isLoading, error } =
    useActionQuery<ListVehiclesResult>("list-vehicles", {});
  const vehicles = data?.vehicles ?? [];

  return (
    <section className="mt-4">
      <SectionHeading
        right={
          vehicles.length > 0 ? (
            <span className="ur-num text-sm text-muted-foreground">
              {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"}
            </span>
          ) : null
        }
      >
        Scanned vehicles
      </SectionHeading>
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <p className="ur-panel mt-2 p-6 text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load scanned vehicles."}
        </p>
      ) : vehicles.length === 0 ? (
        <div className="ur-panel mt-2 flex flex-col items-center px-6 py-10 text-center">
          <BrandMark className="ur-float size-10" />
          <p className="ur-title mt-4 text-[1.25rem]">Nothing scanned yet</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Pick a car above and Unrecalled will read what owners are
            reporting about it.
          </p>
        </div>
      ) : (
        <ul className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v, i) => (
            <VehicleRow key={v.id} v={v} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VehicleRow({ v, index }: { v: VehicleSummary; index: number }) {
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
  const name = titleCase(`${v.make} ${v.model}`.trim()) || label;
  const uncovered = v.uncoveredModes > 0;
  return (
    <li
      className="ur-card ur-reveal group relative flex flex-col p-5 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--ur-shadow-lg)] focus-within:ring-2 focus-within:ring-ring"
      style={{ ["--ur-delay" as string]: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/gaps/${encodeURIComponent(v.id)}`}
            className="ur-title line-clamp-2 block text-[1.375rem] after:absolute after:inset-0 after:rounded-[18px] after:content-[''] focus-visible:outline-none"
          >
            {name}
          </Link>
          <div className="ur-num mt-1 text-[13px] text-muted-foreground">
            {yearRange(v.yearFrom, v.yearTo)} · {fmtInt(v.totalComplaints)}{" "}
            complaints
          </div>
        </div>
        <IconArrowUpRight
          className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </div>

      <div className="mt-6 flex items-end gap-3">
        <CountUp
          value={v.uncoveredModes}
          className={cn(
            "font-display text-[3rem] font-semibold leading-none tracking-tight",
            uncovered ? "text-ur-uncovered" : "text-muted-foreground",
          )}
        />
        <span className="mb-1 text-[13px] leading-snug text-muted-foreground">
          {v.uncoveredModes === 1 ? "problem" : "problems"} nothing
          <br />
          covers yet
        </span>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-3.5">
        <span className="truncate text-xs text-muted-foreground">
          Scanned {fmtRelative(v.lastScannedAt)}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <label
            htmlFor={switchId}
            className="cursor-pointer text-xs text-muted-foreground"
          >
            Watch weekly
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
      </div>
    </li>
  );
}

/** "JEEP WRANGLER" -> "Jeep Wrangler"; keeps short acronyms like BMW / GMC. */
function titleCase(s: string): string {
  return s.replace(/[A-Za-z]+/g, (w) =>
    w === w.toUpperCase() && w.length > 3
      ? w[0] + w.slice(1).toLowerCase()
      : w,
  );
}

function ListSkeleton() {
  return (
    <ul className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="ur-card space-y-3 p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="mt-6 h-12 w-16" />
          <Skeleton className="mt-4 h-4 w-full" />
        </li>
      ))}
    </ul>
  );
}
