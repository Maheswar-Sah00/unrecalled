import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import { IconAlertTriangle, IconBellRinging } from "@tabler/icons-react";
import { Link, useSearchParams } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { CoverageStrip, Sparkline } from "./charts-small";
import { fmtInt, fmtMonth, fmtRatio, HarmCounts } from "./format";
import { Page, SectionHeading, useCrumbs } from "./page";
import { StatusChip, StatusLegend } from "./status";
import type { ClusterRow, GapBoardResult } from "./types";

export function GapBoard({ vehicleId }: { vehicleId: string }) {
  const [params, setParams] = useSearchParams();
  const show = params.get("show") === "all" ? "all" : "uncovered";
  const { data, isLoading, error } = useActionQuery<GapBoardResult>(
    "get-gap-board",
    { vehicleId },
  );
  const label = data?.vehicle.label ?? "Vehicle";
  useCrumbs([{ label: "Gaps", to: "/gaps" }, { label: isLoading ? "…" : label }]);

  const all = data?.clusters ?? [];
  const uncovered = all.filter((c) => c.uncoveredCount > 0);
  const rows = show === "all" ? all : uncovered;

  return (
    <Page wide>
      {data?.vehicle.warnings?.length ? (
        <div className="mb-4 space-y-1 rounded-lg border border-ur-investigation/40 bg-ur-investigation/10 px-3 py-2 text-xs">
          {data.vehicle.warnings.map((w, i) => (
            <p key={i} className="flex gap-1.5">
              <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0 text-ur-investigation" />
              {w}
            </p>
          ))}
        </div>
      ) : null}

      {data ? (
        <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {uncovered.length} of {all.length} failure modes
          </span>{" "}
          have complaints in model years no recall, investigation or settlement
          covers
          {data.vehicle.totalComplaints != null ? (
            <>
              {" "}
              — from{" "}
              <span className="ur-num">
                {fmtInt(data.vehicle.totalComplaints)}
              </span>{" "}
              owner complaints
            </>
          ) : null}
          {data.vehicle.recallCount != null ? (
            <>
              , checked against {fmtInt(data.vehicle.recallCount)} recalls
              {data.vehicle.investigationCount != null
                ? ` and ${fmtInt(data.vehicle.investigationCount)} investigations`
                : ""}
            </>
          ) : null}
          .
        </p>
      ) : null}

      <SectionHeading
        right={
          <div className="flex flex-wrap items-center gap-3">
            <StatusLegend className="hidden lg:flex" />
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={show}
              onValueChange={(v) => {
                if (!v) return;
                const next = new URLSearchParams(params);
                if (v === "all") next.set("show", "all");
                else next.delete("show");
                setParams(next, { replace: true });
              }}
              aria-label="Filter failure modes"
            >
              <ToggleGroupItem value="uncovered" className="px-3 text-xs">
                Uncovered
              </ToggleGroupItem>
              <ToggleGroupItem value="all" className="px-3 text-xs">
                All modes
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        }
      >
        Failure modes by uncovered complaints
      </SectionHeading>

      {isLoading ? (
        <BoardSkeleton />
      ) : error ? (
        <Empty>
          {actionErrorMessage(error) ?? "Could not load this gap board."}{" "}
          <Link to="/gaps" className="underline">
            Back to vehicles
          </Link>
        </Empty>
      ) : rows.length === 0 ? (
        <Empty>
          {show === "uncovered" && all.length ? (
            <>
              Every failure mode with complaints is covered for these years.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setParams({ show: "all" }, { replace: true })}
              >
                Show all modes
              </button>
            </>
          ) : (
            "No complaints matched any failure mode."
          )}
        </Empty>
      ) : (
        <>
          <BoardTable rows={rows} vehicleId={vehicleId} />
          <ul className="space-y-2 md:hidden">
            {rows.map((c, i) => (
              <BoardCard key={c.failureModeId} c={c} rank={i + 1} vehicleId={vehicleId} />
            ))}
          </ul>
        </>
      )}
    </Page>
  );
}

function clusterPath(vehicleId: string, modeId: string) {
  return `/gaps/${encodeURIComponent(vehicleId)}/${encodeURIComponent(modeId)}`;
}

function BoardTable({ rows, vehicleId }: { rows: ClusterRow[]; vehicleId: string }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="w-10 py-2 ps-4 font-medium">#</th>
            <th className="py-2 pe-3 font-medium">Failure mode</th>
            <th className="whitespace-nowrap py-2 pe-3 text-right font-medium">
              Uncovered / all
            </th>
            <th className="py-2 pe-3 font-medium">Harm reported</th>
            <th className="py-2 pe-3 font-medium">Complaints by month</th>
            <th className="py-2 pe-3 font-medium">Coverage by model year</th>
            <th className="py-2 pe-4 font-medium">Signal</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((c, i) => {
            const to = clusterPath(vehicleId, c.failureModeId);
            return (
              <tr key={c.failureModeId} className="group relative hover:bg-accent/40">
                <td className="ur-num py-3 pe-2 ps-4 align-top text-xs text-muted-foreground">
                  {i + 1}
                </td>
                <td className="max-w-[22rem] py-3 pe-3 align-top">
                  <Link
                    to={to}
                    className="font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring group-hover:underline"
                  >
                    {c.name}
                  </Link>
                  <div className="mt-1">
                    <StatusChip status={c.status} short />
                  </div>
                </td>
                <td className="ur-num py-3 pe-3 text-right align-top">
                  <span
                    className={cn(
                      "text-base font-semibold",
                      c.uncoveredCount > 0 ? "text-ur-uncovered" : "text-muted-foreground",
                    )}
                  >
                    {fmtInt(c.uncoveredCount)}
                  </span>
                  <span className="text-muted-foreground"> / {fmtInt(c.count)}</span>
                </td>
                <td className="py-3 pe-3 align-top">
                  <HarmCounts {...c} className="relative z-10" />
                </td>
                <td className="py-3 pe-3 align-top">
                  <Sparkline data={c.monthly} width={128} height={28} />
                </td>
                <td className="relative z-10 py-3 pe-3 align-top">
                  <CoverageStrip byYear={c.byYear} refs={c.refs} />
                </td>
                <td className="py-3 pe-4 align-top">
                  <SignalBadge c={c} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BoardCard({
  c,
  rank,
  vehicleId,
}: {
  c: ClusterRow;
  rank: number;
  vehicleId: string;
}) {
  return (
    <li className="relative rounded-lg border bg-card p-3">
      <div className="flex items-start gap-2">
        <span className="ur-num pt-0.5 text-xs text-muted-foreground">{rank}</span>
        <div className="min-w-0 flex-1">
          <Link
            to={clusterPath(vehicleId, c.failureModeId)}
            className="font-medium after:absolute after:inset-0"
          >
            {c.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusChip status={c.status} short />
            <SignalBadge c={c} />
          </div>
        </div>
        <div className="ur-num text-right">
          <div
            className={cn(
              "text-lg font-semibold leading-tight",
              c.uncoveredCount > 0 ? "text-ur-uncovered" : "text-muted-foreground",
            )}
          >
            {fmtInt(c.uncoveredCount)}
          </div>
          <div className="text-xs text-muted-foreground">of {fmtInt(c.count)}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <CoverageStrip byYear={c.byYear} refs={c.refs} />
        <Sparkline data={c.monthly} width={100} height={24} />
      </div>
      <HarmCounts {...c} className="mt-2" />
    </li>
  );
}

export function SignalBadge({ c }: { c: Pick<ClusterRow, "signalFired" | "signalFiredAt" | "ratio"> }) {
  if (!c.signalFired) {
    return (
      <span className="ur-num text-xs text-muted-foreground">
        {c.ratio != null ? `${fmtRatio(c.ratio)} peer` : "–"}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative z-10 inline-flex flex-col items-start gap-0.5">
          <span className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md bg-ur-uncovered px-1.5 text-xs font-medium text-white">
            <IconBellRinging className="size-3.5" aria-hidden="true" />
            Signal {fmtMonth(c.signalFiredAt)}
          </span>
          {c.ratio != null ? (
            <span className="ur-num text-[11px] text-muted-foreground">
              {fmtRatio(c.ratio)} peer rate
            </span>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        Early-warning rule held from {fmtMonth(c.signalFiredAt)}: at least 10
        matching complaints and 5× the peer-vehicle share. See Backtest for how
        early the same rule fired on Hyundai/Kia Theta II engines.
      </TooltipContent>
    </Tooltip>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function BoardSkeleton() {
  return (
    <div className="divide-y rounded-lg border">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-3 w-4" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="hidden h-4 w-28 md:block" />
          <Skeleton className="hidden h-7 w-32 md:block" />
          <Skeleton className="hidden h-5 w-40 md:block" />
        </div>
      ))}
    </div>
  );
}
