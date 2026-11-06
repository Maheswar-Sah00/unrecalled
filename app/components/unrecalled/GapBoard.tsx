import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import { IconAlertTriangle, IconArrowRight, IconBellRinging, IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { HowCalculated } from "./board/HowCalculated";
import { splitModeName } from "./board/plain";
import { Shimmer, ShimmerStyles } from "./board/Shimmer";
import { StatTile } from "./board/StatTile";
import { CoverageStrip, Sparkline } from "./charts-small";
import { fmtInt, fmtMonth, fmtRatio } from "./format";
import { Page, SectionHeading, useCrumbs } from "./page";
import { PostRecallNote } from "./PostRecallNote";
import { CountUp, PageHero } from "./premium";
import { StatusChip, StatusLegend } from "./status";
import type { ClusterRow, GapBoardResult } from "./types";

const PREVIEW = 12;

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
  // "Open gaps" = problems with at least one model year nothing covers.
  const openGaps = uncovered;
  const rows = show === "all" ? all : openGaps;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, PREVIEW);

  function setShow(v: "all" | "uncovered") {
    setExpanded(false);
    const next = new URLSearchParams(params);
    if (v === "all") next.set("show", "all");
    else next.delete("show");
    setParams(next, { replace: true });
  }

  if (isLoading) return <BoardSkeleton />;

  const v = data?.vehicle;
  return (
    <Page wide>
      {v?.warnings?.length ? (
        <div className="mb-6 space-y-1 rounded-2xl border border-ur-investigation/30 bg-ur-investigation/[0.08] px-4 py-3 text-[13px]">
          {v.warnings.map((w, i) => (
            <p key={i} className="flex gap-2">
              <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-ur-investigation" />
              {w}
            </p>
          ))}
        </div>
      ) : null}

      {data ? (
        <>
          <PageHero
            className="ur-reveal mb-8"
            eyebrow={
              <span className="inline-flex items-center gap-2">
                <span className="ur-live-dot" aria-hidden="true" />
                Safety gap report
              </span>
            }
            title={label}
            lede={
              <>
                <span className="font-semibold text-foreground">
                  {uncovered.length} of {all.length} problems
                </span>{" "}
                owners report have model years nothing covers
                {v?.totalComplaints != null ? (
                  <> — from {fmtInt(v.totalComplaints)} owner complaints</>
                ) : null}
                {v?.recallCount != null ? (
                  <>
                    , checked against {fmtInt(v.recallCount)} recalls
                    {v.investigationCount != null
                      ? ` and ${fmtInt(v.investigationCount)} investigations`
                      : ""}
                  </>
                ) : null}
                .
              </>
            }
          />

          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <StatTile
              delay={80}
              label="Problems with uncovered years"
              note={`out of ${fmtInt(all.length)} problems owners report`}
            >
              <span className="text-ur-uncovered">
                <CountUp value={uncovered.length} />
              </span>
              <span className="text-muted-foreground/60 text-[0.6em]"> / {fmtInt(all.length)}</span>
            </StatTile>
            <StatTile delay={140} label="Owner complaints read" note="filed with the U.S. safety regulator">
              {v?.totalComplaints != null ? <CountUp value={v.totalComplaints} /> : "–"}
            </StatTile>
            <StatTile delay={200} label="Recalls checked" note="official repair campaigns">
              {v?.recallCount != null ? <CountUp value={v.recallCount} /> : "–"}
            </StatTile>
            <StatTile delay={260} label="Investigations checked" note="opened by the government">
              {v?.investigationCount != null ? <CountUp value={v.investigationCount} /> : "–"}
            </StatTile>
          </div>
        </>
      ) : null}

      <section className="mt-12">
        <SectionHeading
          className="mb-4"
          right={
            <div className="flex items-center gap-1.5" role="group" aria-label="Filter problems">
              <button
                type="button"
                className="ur-chip"
                data-active={show === "uncovered"}
                aria-pressed={show === "uncovered"}
                onClick={() => setShow("uncovered")}
              >
                Open gaps
                {data ? <span className="ur-num opacity-70">{openGaps.length}</span> : null}
              </button>
              <button
                type="button"
                className="ur-chip"
                data-active={show === "all"}
                aria-pressed={show === "all"}
                onClick={() => setShow("all")}
              >
                All problems
                {data ? <span className="ur-num opacity-70">{all.length}</span> : null}
              </button>
            </div>
          }
        >
          Problems owners report
        </SectionHeading>

        <div className="ur-panel mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <span className="text-[13px] font-medium text-muted-foreground">Each model year is colored by what covers it:</span>
          <StatusLegend />
        </div>

        {error ? (
          <Empty>
            {actionErrorMessage(error) ?? "Could not load this report."}{" "}
            <Link to="/gaps" className="underline">
              Back to vehicles
            </Link>
          </Empty>
        ) : rows.length === 0 ? (
          <Empty>
            {show === "uncovered" && all.length ? (
              <>
                Every problem with complaints is covered for these years.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setParams({ show: "all" }, { replace: true })}
                >
                  Show all problems
                </button>
              </>
            ) : (
              "No complaints matched any known problem."
            )}
          </Empty>
        ) : (
          <>
            <div className="mb-2 hidden px-5 text-[12px] font-medium text-muted-foreground xl:grid xl:grid-cols-[1.25rem_minmax(0,1fr)_5.5rem_12.25rem_7rem_9.5rem] xl:gap-x-5">
              <span>#</span>
              <span>Problem</span>
              <span className="text-right">Uncovered</span>
              <span>Model years</span>
              <span>Trend</span>
              <span>Early warning</span>
            </div>
            <ul className="grid gap-2.5">
              {visible.map((c, i) => (
                <BoardRow key={c.failureModeId} c={c} rank={i + 1} vehicleId={vehicleId} />
              ))}
            </ul>
            {rows.length > PREVIEW ? (
              <div className="mt-5 flex justify-center">
                <button type="button" className="ur-btn-soft" onClick={() => setExpanded((e) => !e)}>
                  {expanded ? "Show fewer" : `Show all ${fmtInt(rows.length)} problems`}
                  <IconChevronDown
                    className={cn("size-4 transition-transform", expanded && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>
              </div>
            ) : null}
          </>
        )}

        <HowCalculated className="mt-8 max-w-3xl" />
      </section>
    </Page>
  );
}

function clusterPath(vehicleId: string, modeId: string) {
  return `/gaps/${encodeURIComponent(vehicleId)}/${encodeURIComponent(modeId)}`;
}

export function harmText(c: { crashes: number; fires: number; injuries: number; deaths: number }): string {
  const parts: string[] = [];
  const add = (n: number, one: string, many: string) => {
    if (n > 0) parts.push(`${fmtInt(n)} ${n === 1 ? one : many}`);
  };
  add(c.deaths, "death", "deaths");
  add(c.injuries, "injury", "injuries");
  add(c.crashes, "crash", "crashes");
  add(c.fires, "fire", "fires");
  return parts.join(" · ");
}

function BoardRow({ c, rank, vehicleId }: { c: ClusterRow; rank: number; vehicleId: string }) {
  const { title, aside } = splitModeName(c.name);
  const harm = harmText(c);
  return (
    <li
      className="ur-card ur-reveal group relative px-4 py-3.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--ur-shadow-lg)] xl:px-5 xl:py-3"
      style={{ ["--ur-delay" as string]: `${Math.min(rank - 1, 10) * 40}ms` }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 xl:grid-cols-[1.25rem_minmax(0,1fr)_5.5rem_12.25rem_7rem_9.5rem] xl:gap-x-5">
        <span className="ur-num hidden text-sm text-muted-foreground xl:block">{rank}</span>

        <div className="min-w-0">
          <div className="flex min-w-0 items-baseline gap-2">
            <Link
              to={clusterPath(vehicleId, c.failureModeId)}
              title={c.name}
              className="min-w-0 font-display text-[1.125rem] leading-snug tracking-[-0.01em] text-foreground after:absolute after:inset-0 after:rounded-[18px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring xl:line-clamp-1 xl:text-[1.15rem]"
            >
              {title}
            </Link>
            {aside ? (
              <span className="hidden min-w-0 truncate text-[13px] text-muted-foreground 2xl:inline">{aside}</span>
            ) : null}
            <IconArrowRight
              className="hidden size-4 shrink-0 self-center -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 xl:block"
              aria-hidden="true"
            />
          </div>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <StatusChip status={c.status} short />
            {harm ? <span className="text-[12.5px] text-muted-foreground">{harm}</span> : null}
            <PostRecallNote postRecall={c.postRecall} compact className="shrink-0" />
          </div>
        </div>

        <div className="self-start text-right xl:self-center">
          <div
            className={cn(
              "ur-num font-display text-[1.75rem] leading-none tracking-[-0.03em]",
              c.uncoveredCount > 0 ? "text-ur-uncovered" : "text-muted-foreground/60",
            )}
          >
            {fmtInt(c.uncoveredCount)}
          </div>
          <div className="mt-1 whitespace-nowrap text-[12px] text-muted-foreground">
            <span className="xl:hidden">uncovered </span>of {fmtInt(c.count)}
          </div>
        </div>

        <div className="relative z-10 col-span-2 min-w-0 xl:col-span-1">
          <CoverageStrip byYear={c.byYear} refs={c.refs} />
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 xl:contents">
          <div className="min-w-0">
            <Sparkline data={c.monthly} width={112} height={28} />
          </div>
          <div className="min-w-0">
            <SignalBadge c={c} />
          </div>
        </div>
      </div>
    </li>
  );
}

export function SignalBadge({ c }: { c: Pick<ClusterRow, "signalFired" | "signalFiredAt" | "ratio"> }) {
  if (!c.signalFired) {
    return (
      <span className="inline-flex flex-col items-start gap-0.5 text-[12.5px] text-muted-foreground">
        <span className="font-medium text-foreground/70">No warning</span>
        {c.ratio != null ? (
          <span className="ur-num text-[12px]">{fmtRatio(c.ratio)} similar cars</span>
        ) : null}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative z-10 inline-flex flex-col items-start gap-1 xl:items-start">
          <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-ur-uncovered px-2.5 text-[12.5px] font-semibold text-white shadow-[0_6px_16px_-8px_hsl(var(--ur-uncovered))]">
            <IconBellRinging className="size-3.5" aria-hidden="true" />
            Signal {fmtMonth(c.signalFiredAt)}
          </span>
          {c.ratio != null ? (
            <span className="ur-num ps-1 text-[12px] text-muted-foreground">
              {fmtRatio(c.ratio)} similar cars
            </span>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        Early warning since {fmtMonth(c.signalFiredAt)}: at least 10 complaints, and this
        problem showed up {c.ratio != null ? fmtRatio(c.ratio) : "5×"} as often as in similar
        cars (the alarm needs 5×).
      </TooltipContent>
    </Tooltip>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="ur-panel p-10 text-center text-sm text-muted-foreground">{children}</p>;
}

function BoardSkeleton() {
  return (
    <Page wide>
      <ShimmerStyles />
      <div className="mb-8 max-w-3xl">
        <Shimmer className="h-4 w-36" />
        <Shimmer className="mt-4 h-12 w-[26rem] max-w-full rounded-2xl" />
        <Shimmer className="mt-4 h-4 w-[34rem] max-w-full" />
        <Shimmer className="mt-2 h-4 w-[22rem] max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ur-card p-5">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="mt-3 h-9 w-20 rounded-xl" />
            <Shimmer className="mt-3 h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>
      <Shimmer className="mt-12 h-7 w-64 rounded-xl" />
      <div className="mt-5 grid gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="ur-card flex items-center gap-5 p-5" style={{ opacity: 1 - i * 0.14 }}>
            <div className="min-w-0 flex-1 space-y-2.5">
              <Shimmer className="h-5 w-56 max-w-full rounded-lg" />
              <Shimmer className="h-6 w-28 rounded-full" />
            </div>
            <Shimmer className="hidden h-6 w-48 rounded-full md:block" />
            <Shimmer className="hidden h-7 w-28 md:block" />
            <Shimmer className="h-9 w-14 rounded-xl" />
          </div>
        ))}
      </div>
    </Page>
  );
}
