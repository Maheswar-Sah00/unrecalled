import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import { IconBellRinging, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";

import { cn } from "@/lib/utils";

import { HowCalculated } from "./board/HowCalculated";
import { monthsBetween, spanLabel, splitModeName } from "./board/plain";
import { Shimmer, ShimmerStyles } from "./board/Shimmer";
import { StatTile } from "./board/StatTile";
import { useMediaQuery } from "./board/useMediaQuery";
import { CoverageStrip } from "./charts-small";
import { ComplaintList } from "./ComplaintList";
import { CoveragePanel } from "./CoveragePanel";
import { DraftPetitionDialog } from "./DraftPetitionDialog";
import { fmtDate, fmtInt, fmtMonth, fmtRatio } from "./format";
import { MonthlyBars } from "./MonthlyBars";
import { Page, SectionHeading, useCrumbs } from "./page";
import { PostRecallNote } from "./PostRecallNote";
import { CountUp, PageHero } from "./premium";
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
  const isWide = useMediaQuery("(min-width: 1024px)");
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
        <p className="ur-panel p-10 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load this problem."}{" "}
          <Link to={`/gaps/${encodeURIComponent(vehicleId)}`} className="underline">
            Back to the report
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
  const { title, aside } = splitModeName(mode.name);
  const months = monthsBetween(cluster.firstReported, cluster.lastReported);
  const backTo = `/gaps/${encodeURIComponent(vehicleId)}`;

  return (
    <Page wide>
      <Link
        to={backTo}
        className="ur-reveal mb-6 inline-flex items-center gap-1 rounded-full text-[13px] text-muted-foreground hover:text-foreground"
      >
        <IconChevronLeft className="size-4" aria-hidden="true" />
        {vehicleLabel}
      </Link>

      <PageHero
        className="ur-reveal"
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusChip status={cluster.coverage.status} />
            {aside ? <span>{aside}</span> : null}
          </span>
        }
        title={title}
        lede={mode.hazard || undefined}
        actions={
          <DraftPetitionDialog
            vehicleId={vehicleId}
            failureModeId={modeId}
            disabled={cluster.count === 0}
          />
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <StatTile
          delay={60}
          label="Uncovered complaints"
          note={
            <>
              of <span className="ur-num">{fmtInt(cluster.count)}</span> complaints come from model years nothing
              covers
            </>
          }
        >
          <span className={cn(cluster.uncoveredCount > 0 ? "text-ur-uncovered" : "text-muted-foreground")}>
            <CountUp value={cluster.uncoveredCount} />
          </span>
          <span className="text-[0.55em] text-muted-foreground/70"> / {fmtInt(cluster.count)}</span>
        </StatTile>
        <StatTile
          delay={120}
          label="Reported over"
          note={
            <>
              {fmtDate(cluster.firstReported)} – {fmtDate(cluster.lastReported)}
            </>
          }
        >
          {spanLabel(months) || "–"}
        </StatTile>
        <StatTile delay={180} label="Harm owners reported" note="Counted from the complaints themselves">
          <HarmGrid {...cluster} />
        </StatTile>
        <StatTile
          delay={240}
          label="Early-warning signal"
          note={
            signal?.fired ? (
              <>
                On since {fmtMonth(signal.firedAt)}: owners reported it{" "}
                {signal.ratio != null ? <span className="ur-num">{fmtRatio(signal.ratio)}</span> : "far"} as often as
                owners of similar cars.
              </>
            ) : signal ? (
              <>
                {signal.ratio != null ? (
                  <>
                    <span className="ur-num">{fmtRatio(signal.ratio)}</span> as often as similar cars.{" "}
                  </>
                ) : null}
                The alarm needs at least 10 complaints and 5×.
              </>
            ) : (
              "Not enough data yet."
            )
          }
        >
          {signal?.fired ? (
            <span className="inline-flex flex-wrap items-center gap-2 font-sans text-base tracking-normal">
              <span className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-ur-uncovered px-3 text-[13px] font-semibold text-white shadow-[0_8px_20px_-10px_hsl(var(--ur-uncovered))]">
                <IconBellRinging className="size-4" aria-hidden="true" />
                Signal {fmtMonth(signal.firedAt)}
              </span>
              {signal.ratio != null ? (
                <span className="ur-num text-[13px] text-muted-foreground">{fmtRatio(signal.ratio)} similar cars</span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground/70">Quiet</span>
          )}
        </StatTile>
      </div>

      <section className="mt-12">
        <SectionHeading
          className="mb-1"
          right={
            year ? (
              <button
                type="button"
                className="ur-chip"
                data-active="true"
                onClick={() => update({ year: null, page: null })}
              >
                Showing {year} only ×
              </button>
            ) : null
          }
        >
          Coverage by model year
        </SectionHeading>
        <p className="mb-4 text-[14px] text-muted-foreground">
          Each tile is one model year. Tap a year to read only its complaints.
        </p>
        <CoverageStrip
          byYear={cluster.byYear}
          refs={refs}
          size="lg"
          activeYear={year}
          onSelectYear={(y) => update({ year: y ? String(y) : null, page: null })}
        />
        <StatusLegend className="mt-4" />
        <PostRecallNote postRecall={cluster.postRecall} className="mt-5" />
      </section>

      <section className="mt-12">
        <SectionHeading className="mb-1">What already covers it</SectionHeading>
        <p className="mb-4 text-[14px] text-muted-foreground">
          Recalls, government investigations and settlements that match this problem.
        </p>
        <CoveragePanel refs={refs} />
      </section>

      <section className="mt-12">
        <SectionHeading className="mb-1">Complaints over time</SectionHeading>
        <p className="mb-4 text-[14px] text-muted-foreground">
          New owner complaints each month{signal?.fired ? ", with the month the warning turned on" : ""}.
        </p>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="ur-card p-4 md:p-5">
            <MonthlyBars data={cluster.monthly} markers={markers} height={isWide ? 372 : 220} />
          </div>
          <HowCalculated defaultOpen />
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          className="mb-1"
          right={
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Which complaints">
              {year ? (
                <button type="button" className="ur-chip" onClick={() => update({ year: null, page: null })}>
                  {year} ×
                </button>
              ) : null}
              <button
                type="button"
                className="ur-chip"
                data-active={scope === "all"}
                aria-pressed={scope === "all"}
                onClick={() => update({ scope: null, page: null })}
              >
                All
              </button>
              <button
                type="button"
                className="ur-chip"
                data-active={scope === "uncovered"}
                aria-pressed={scope === "uncovered"}
                onClick={() => update({ scope: "uncovered", page: null })}
              >
                Uncovered years
              </button>
            </div>
          }
        >
          What owners say · <span className="ur-num">{fmtInt(total)}</span>
        </SectionHeading>
        <p className="mb-4 text-[14px] text-muted-foreground">
          Their own words. Highlighted phrases are why each complaint was grouped under this problem.
        </p>
        <div className={cn("transition-opacity", isFetching && "opacity-60")}>
          <ComplaintList
            vehicleId={vehicleId}
            failureModeId={modeId}
            complaints={complaints}
            loading={false}
          />
        </div>
        {pages > 1 ? (
          <div className="mt-5 flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
            <span className="ur-num">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="ur-btn-soft h-9 px-3.5 text-[13px]"
                disabled={page <= 1}
                onClick={() => update({ page: page - 1 > 1 ? String(page - 1) : null })}
              >
                <IconChevronLeft className="size-4" /> Previous
              </button>
              <button
                type="button"
                className="ur-btn-soft h-9 px-3.5 text-[13px]"
                disabled={page >= pages}
                onClick={() => update({ page: String(page + 1) })}
              >
                Next <IconChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </Page>
  );
}

function HarmGrid({
  crashes,
  fires,
  injuries,
  deaths,
}: {
  crashes: number;
  fires: number;
  injuries: number;
  deaths: number;
}) {
  const items = [
    { label: "crashes", v: crashes },
    { label: "injuries", v: injuries },
    { label: "fires", v: fires },
    { label: "deaths", v: deaths },
  ];
  return (
    <span className="grid grid-cols-4 gap-2">
      {items.map((it) => (
        <span key={it.label} className="flex min-w-0 flex-col">
          <span
            className={cn(
              "ur-num text-[1.75rem] leading-none",
              it.v > 0 ? "text-foreground" : "text-muted-foreground/40",
            )}
          >
            {fmtInt(it.v)}
          </span>
          <span className="mt-1.5 font-sans text-[11.5px] tracking-normal text-muted-foreground">{it.label}</span>
        </span>
      ))}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <Page wide>
      <ShimmerStyles />
      <Shimmer className="h-4 w-40" />
      <Shimmer className="mt-8 h-6 w-32 rounded-full" />
      <Shimmer className="mt-4 h-12 w-[24rem] max-w-full rounded-2xl" />
      <Shimmer className="mt-4 h-4 w-[36rem] max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ur-card p-5">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="mt-3 h-9 w-24 rounded-xl" />
            <Shimmer className="mt-3 h-3 w-40 max-w-full" />
          </div>
        ))}
      </div>
      <Shimmer className="mt-12 h-7 w-64 rounded-xl" />
      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Shimmer key={i} className="h-[7.5rem] rounded-2xl" />
        ))}
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <Shimmer className="h-32 w-full rounded-2xl" />
          <Shimmer className="h-32 w-full rounded-2xl" />
        </div>
        <Shimmer className="h-48 w-full rounded-2xl" />
      </div>
    </Page>
  );
}
