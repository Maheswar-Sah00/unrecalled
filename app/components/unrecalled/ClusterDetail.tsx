import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { CoverageStrip } from "./charts-small";
import { ComplaintList } from "./ComplaintList";
import { CoveragePanel } from "./CoveragePanel";
import { DraftPetitionDialog } from "./DraftPetitionDialog";
import { fmtDate, fmtInt, fmtMonth, fmtPct, fmtRatio, HarmCounts } from "./format";
import { SignalBadge } from "./GapBoard";
import { MonthlyBars } from "./MonthlyBars";
import { Page, SectionHeading, useCrumbs } from "./page";
import { PostRecallNote } from "./PostRecallNote";
import { StatusChip, StatusLegend } from "./status";
import type { GetClusterResult } from "./types";

const PAGE_SIZE = 25;

export function ClusterDetail({
  vehicleId,
  modeId,
}: {
  vehicleId: string;
  modeId: string;
}) {
  const [params, setParams] = useSearchParams();
  const yearParam = params.get("year");
  const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const scope = params.get("scope") === "uncovered" ? "uncovered" : "all";

  const query: Record<string, unknown> = {
    vehicleId,
    failureModeId: modeId,
    page,
    pageSize: PAGE_SIZE,
  };
  if (year) query.year = year;
  if (scope === "uncovered") query.uncoveredOnly = "true";

  const { data, isLoading, isFetching, error } = useActionQuery<GetClusterResult>(
    "get-cluster",
    query,
    { placeholderData: keepPreviousData },
  );

  const vehicleLabel = data?.vehicle?.label ?? "Vehicle";
  useCrumbs([
    { label: "Gaps", to: "/gaps" },
    { label: vehicleLabel, to: `/gaps/${encodeURIComponent(vehicleId)}` },
    { label: data?.mode.name ?? "…" },
  ]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  }

  if (error && !data) {
    return (
      <Page>
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load this failure mode."}{" "}
          <Link to={`/gaps/${encodeURIComponent(vehicleId)}`} className="underline">
            Back to the board
          </Link>
        </p>
      </Page>
    );
  }

  if (isLoading || !data) return <DetailSkeleton />;

  const { mode, cluster, refs, complaints, total } = data;
  const pages = Math.max(1, Math.ceil(total / (data.pageSize ?? PAGE_SIZE)));
  const signal = cluster.signal;
  const markers = signal?.fired && signal.firedAt
    ? [{ month: signal.firedAt, label: "Signal", color: "hsl(var(--ur-uncovered))" }]
    : [];

  return (
    <Page wide>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{mode.name}</h1>
            <StatusChip status={cluster.coverage.status} />
          </div>
          {mode.hazard ? (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{mode.hazard}</p>
          ) : null}
        </div>
        <DraftPetitionDialog
          vehicleId={vehicleId}
          failureModeId={modeId}
          disabled={cluster.count === 0}
        />
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-y py-3 text-sm">
        <Fact label="Uncovered complaints">
          <span className={cn("font-semibold", cluster.uncoveredCount > 0 && "text-ur-uncovered")}>
            {fmtInt(cluster.uncoveredCount)}
          </span>
          <span className="text-muted-foreground"> of {fmtInt(cluster.count)}</span>
        </Fact>
        <Fact label="Reported">
          {fmtDate(cluster.firstReported)} – {fmtDate(cluster.lastReported)}
        </Fact>
        <Fact label="Harm">
          <HarmCounts {...cluster} />
        </Fact>
        <Fact label="Signal">
          {signal ? (
            <span className="inline-flex items-center gap-2">
              <SignalBadge
                c={{ signalFired: signal.fired, signalFiredAt: signal.firedAt, ratio: signal.ratio }}
              />
              {!signal.fired ? (
                <span className="text-xs text-muted-foreground">
                  share {fmtPct(signal.share)} vs peer {fmtPct(signal.peerShare)}
                </span>
              ) : null}
            </span>
          ) : (
            "–"
          )}
        </Fact>
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="min-w-0">
          <SectionHeading right={<StatusLegend className="hidden xl:flex" />}>
            Coverage by model year
          </SectionHeading>
          <CoverageStrip
            byYear={cluster.byYear}
            refs={refs}
            size="lg"
            activeYear={year}
            onSelectYear={(y) => update({ year: y ? String(y) : null, page: null })}
          />
          <PostRecallNote postRecall={cluster.postRecall} className="mt-4" />
          <div className="mt-4">
            <CoveragePanel refs={refs} />
          </div>
        </section>
        <section className="min-w-0">
          <SectionHeading>Complaints per month</SectionHeading>
          <div className="rounded-lg border bg-card p-3">
            <MonthlyBars data={cluster.monthly} markers={markers} />
          </div>
          {signal?.rule ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Signal rule: {signal.rule}
              {signal.fired ? ` — held from ${fmtMonth(signal.firedAt)}` : ""}
              {signal.ratio != null ? ` (${fmtRatio(signal.ratio)} peer share)` : ""}.
            </p>
          ) : null}
        </section>
      </div>

      <section className="mt-8">
        <SectionHeading
          right={
            <div className="flex flex-wrap items-center gap-2">
              {year ? (
                <Button size="xs" variant="outline" onClick={() => update({ year: null, page: null })}>
                  MY{year} ×
                </Button>
              ) : null}
              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                value={scope}
                onValueChange={(v) => v && update({ scope: v === "all" ? null : v, page: null })}
                aria-label="Complaint scope"
              >
                <ToggleGroupItem value="all" className="px-3 text-xs">All</ToggleGroupItem>
                <ToggleGroupItem value="uncovered" className="px-3 text-xs">Uncovered years</ToggleGroupItem>
              </ToggleGroup>
            </div>
          }
        >
          Complaints · <span className="ur-num">{fmtInt(total)}</span>
        </SectionHeading>
        <div className={cn("transition-opacity", isFetching && "opacity-60")}>
          <ComplaintList
            vehicleId={vehicleId}
            failureModeId={modeId}
            complaints={complaints}
            loading={false}
          />
        </div>
        {pages > 1 ? (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="ur-num">
              Page {page} of {pages}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => update({ page: page - 1 > 1 ? String(page - 1) : null })}
              >
                <IconChevronLeft className="size-4" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages}
                onClick={() => update({ page: String(page + 1) })}
              >
                Next <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </Page>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="ur-num mt-0.5">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <Page wide>
      <Skeleton className="h-7 w-80" />
      <Skeleton className="mt-2 h-4 w-[28rem] max-w-full" />
      <div className="mt-4 flex gap-8 border-y py-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="mt-8 space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </Page>
  );
}
