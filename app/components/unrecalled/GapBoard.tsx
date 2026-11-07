import "../../styles/report.css";

import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBellRinging,
  IconChevronDown,
  IconLayoutList,
  IconRepeat,
  IconShieldOff,
} from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { EmptyState } from "./board/EmptyState";
import { Frame, Msg } from "./board/Frame";
import { HowCalculated } from "./board/HowCalculated";
import { splitModeName, splitVehicleLabel } from "./board/plain";
import { Shimmer } from "./board/Shimmer";
import { CoverageStrip, Sparkline } from "./charts-small";
import { DraftPetitionDialog } from "./DraftPetitionDialog";
import { compactYears, fmtInt, fmtMonth, fmtRatio, fmtRelative } from "./format";
import { useCrumbs, useDocTitle } from "./page";
import { PostRecallNote } from "./PostRecallNote";
import { CountUp } from "./premium";
import { StatusChip, StatusLegend } from "./status";
import type { ClusterRow, GapBoardResult } from "./types";

const PREVIEW = 12;

type Show = "uncovered" | "all" | "signal" | "after";

const TABS: { id: Show; label: string; icon: typeof IconAlertTriangle; blurb: string }[] = [
  {
    id: "uncovered",
    label: "Open gaps",
    icon: IconShieldOff,
    blurb: "Problems with at least one model year that no recall, investigation or settlement covers.",
  },
  {
    id: "all",
    label: "All problems",
    icon: IconLayoutList,
    blurb: "Every problem owners report for this car, covered or not.",
  },
  {
    id: "signal",
    label: "Early warnings",
    icon: IconBellRinging,
    blurb: "Problems owners report far more often than owners of similar cars.",
  },
  {
    id: "after",
    label: "After a recall",
    icon: IconRepeat,
    blurb: "Problems owners kept reporting more than a year after a recall was supposed to fix them.",
  },
];

function parseShow(v: string | null): Show {
  return v === "all" || v === "signal" || v === "after" ? v : "uncovered";
}

export function GapBoard({ vehicleId }: { vehicleId: string }) {
  const [params, setParams] = useSearchParams();
  const show = parseShow(params.get("show"));
  const { data, isLoading, error } = useActionQuery<GapBoardResult>("get-gap-board", { vehicleId });
  const label = data?.vehicle.label ?? "Vehicle";
  useCrumbs([{ label: "Home", to: "/" }, { label: isLoading ? "…" : label }]);
  useDocTitle(data?.vehicle.label);
  const [expanded, setExpanded] = useState(false);

  const all = data?.clusters ?? [];
  const lists: Record<Show, ClusterRow[]> = {
    uncovered: all.filter((c) => c.uncoveredCount > 0),
    all,
    signal: all.filter((c) => c.signalFired),
    after: all.filter((c) => (c.postRecall?.count ?? 0) > 0),
  };
  const uncovered = lists.uncovered;
  const rows = lists[show];
  const visible = expanded ? rows : rows.slice(0, PREVIEW);

  function setShow(v: Show) {
    setExpanded(false);
    const next = new URLSearchParams(params);
    if (v === "uncovered") next.delete("show");
    else next.set("show", v);
    setParams(next, { replace: true });
  }

  if (isLoading) return <BoardSkeleton />;

  if (error || !data) {
    return (
      <div className="rp-wrap">
        <EmptyState
          title={(error as { status?: number } | null)?.status === 404 ? "We couldn’t find this report" : "We couldn’t load this report"}
          action={
            <Link to="/#scan" className="ur-btn">
              Scan a car
            </Link>
          }
        >
          {(error as { status?: number } | null)?.status === 404
            ? "The link may be old, or the car was scanned on another account. Scan it again; it only takes a few seconds."
            : (actionErrorMessage(error) ?? "Something went wrong while reading the complaints. Refresh the page to try again.")}
        </EmptyState>
      </div>
    );
  }

  const v = data.vehicle;
  const { name: carName, years: carYears } = splitVehicleLabel(label);
  const biggest = uncovered.reduce<ClusterRow | null>(
    (best, c) => (!best || c.uncoveredCount > best.uncoveredCount ? c : best),
    null,
  );
  const uncoveredComplaints = all.reduce((s, c) => s + c.uncoveredCount, 0);
  const tab = TABS.find((t) => t.id === show)!;

  return (
    <div className="rp-wrap">
      {v.warnings?.length ? (
        <div className="mb-8 flex gap-2.5 rounded-2xl border border-ur-investigation/30 bg-ur-investigation/[0.08] px-4 py-3 text-[14px]">
          <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-ur-investigation" aria-hidden="true" />
          <p>{plainWarnings(v.warnings)}</p>
        </div>
      ) : null}

      {/* ---------------- hero ---------------- */}
      <section className="relative grid items-center gap-x-14 gap-y-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <div className="ur-reveal min-w-0">
          <span className="rp-eyebrow">
            <span className="ur-live-dot" aria-hidden="true" />
            Safety gap report
            {v.lastScannedAt ? (
              <>
                <span className="rp-sep" aria-hidden="true" />
                <span className="rp-dim">Updated {fmtRelative(v.lastScannedAt)}</span>
              </>
            ) : null}
          </span>
          <h1 className="rp-hero-title mt-7">
            {carName}
            {carYears ? <span className="rp-hero-sub ur-num">{carYears}</span> : null}
          </h1>
          <p className="rp-lede mt-7 max-w-xl">
            <strong>
              {uncovered.length} of {all.length} problems
            </strong>{" "}
            owners report have model years nothing covers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#problems" className="ur-btn">
              See the problems
              <IconArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a href="#how" className="ur-btn-soft">
              How we calculated this
            </a>
          </div>
        </div>

        <div className="ur-reveal relative min-w-0" style={{ ["--ur-delay" as string]: "160ms" }}>
          <div className="rp-glow" aria-hidden="true" />
          <AgentSummary
            vehicleId={vehicleId}
            carName={carName}
            label={label}
            total={v.totalComplaints ?? null}
            recalls={v.recallCount ?? null}
            investigations={v.investigationCount ?? null}
            updated={v.lastScannedAt ?? null}
            uncoveredCount={uncovered.length}
            allCount={all.length}
            biggest={biggest}
          />
        </div>
      </section>

      {/* ---------------- stats ---------------- */}
      <section className="mt-24 md:mt-28" aria-label="Key numbers">
        <div className="rp-stats">
          <Stat
            delay={80}
            label="Problems with uncovered years"
            note={`out of ${fmtInt(all.length)} problems owners report`}
          >
            <span className="text-ur-uncovered">
              <CountUp value={uncovered.length} />
            </span>
            <span className="text-[0.5em] text-muted-foreground/70"> / {fmtInt(all.length)}</span>
          </Stat>
          <Stat delay={140} label="Owner complaints read" note="filed with the U.S. safety regulator">
            {v.totalComplaints != null ? <CountUp value={v.totalComplaints} /> : "–"}
          </Stat>
          <Stat delay={200} label="In uncovered years" note="complaints no recall or case covers">
            <span className="text-ur-uncovered">
              <CountUp value={uncoveredComplaints} />
            </span>
          </Stat>
          <Stat
            delay={260}
            label="Recalls & investigations"
            note={`${fmtInt(v.recallCount ?? 0)} recalls · ${fmtInt(v.investigationCount ?? 0)} investigations checked`}
          >
            <CountUp value={(v.recallCount ?? 0) + (v.investigationCount ?? 0)} />
          </Stat>
        </div>
      </section>

      {/* ---------------- problems ---------------- */}
      <section id="problems" className="rp-section scroll-mt-24">
        <h2 className="rp-h2 max-w-3xl">Problems owners report</h2>
        <p className="rp-lede mt-4 max-w-2xl">
          Each problem is a group of complaints that describe the same thing. Colored pills show what covers each
          model year.
        </p>

        <div className="mt-10">
          <div className="rp-tabs" role="tablist" aria-label="Filter problems">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  className="rp-tab"
                  aria-selected={show === t.id}
                  onClick={() => setShow(t.id)}
                >
                  <Icon aria-hidden="true" />
                  {t.label}
                  <span className="rp-count">{lists[t.id].length}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <p key={show} className="ur-reveal max-w-xl text-[15px] text-muted-foreground">
            {tab.blurb}
          </p>
          <StatusLegend className="text-[12.5px]" />
        </div>

        <div className="mt-6" role="tabpanel" aria-label={tab.label}>
          {rows.length === 0 ? (
            <EmptyState
              title={
                show === "uncovered"
                  ? "Every problem is covered"
                  : show === "signal"
                    ? "No early warnings right now"
                    : show === "after"
                      ? "Nothing came back after a recall"
                      : "No complaints matched a known problem"
              }
              action={
                show !== "all" && all.length ? (
                  <button type="button" className="ur-btn-soft" onClick={() => setShow("all")}>
                    Show all problems
                  </button>
                ) : null
              }
            >
              {show === "uncovered"
                ? "For every problem owners report, each model year has a recall, investigation or settlement."
                : show === "signal"
                  ? "No problem is being reported unusually often compared with similar cars."
                  : show === "after"
                    ? "No problem kept getting reported more than a year after its recall."
                    : "We could not group any complaints for this car yet."}
            </EmptyState>
          ) : (
            <>
              <div className="mb-3 hidden px-6 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground xl:grid xl:grid-cols-[2rem_minmax(0,1fr)_7rem_12.5rem_7.5rem_9.5rem_2.25rem] xl:gap-x-5">
                <span>#</span>
                <span>Problem</span>
                <span className="text-right">Uncovered</span>
                <span>Model years</span>
                <span>Trend</span>
                <span>Warning</span>
                <span />
              </div>
              <ul className="grid gap-3">
                {visible.map((c, i) => (
                  <BoardRow key={c.failureModeId} c={c} rank={i + 1} vehicleId={vehicleId} />
                ))}
              </ul>
              {rows.length > PREVIEW ? (
                <div className="mt-8 flex justify-center">
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
        </div>
      </section>

      {biggest ? (
        <section className="rp-section" aria-labelledby="rp-next">
          <div className="ur-reveal flex flex-col items-start gap-6 rounded-[24px] border border-border bg-card px-6 py-8 shadow-[var(--ur-shadow)] md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Your next step</p>
              <h2 id="rp-next" className="rp-h3 mt-2">
                Ask NHTSA to look into {splitModeName(biggest.name).title.toLowerCase()}.
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Open a problem to read what owners say, then let the agent draft a formal petition. You review it
                and send it yourself; it takes about two minutes.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to={clusterPath(vehicleId, biggest.failureModeId)} className="ur-btn-soft">
                Open this problem
              </Link>
              <span className="rp-cta">
                <DraftPetitionDialog vehicleId={vehicleId} failureModeId={biggest.failureModeId} />
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <div id="how" className="rp-section scroll-mt-24">
        <HowCalculated />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AgentSummary({
  vehicleId,
  carName,
  label,
  total,
  recalls,
  investigations,
  updated,
  uncoveredCount,
  allCount,
  biggest,
}: {
  vehicleId: string;
  carName: string;
  label: string;
  total: number | null;
  recalls: number | null;
  investigations: number | null;
  updated: string | null;
  uncoveredCount: number;
  allCount: number;
  biggest: ClusterRow | null;
}) {
  const gapYears = biggest
    ? compactYears(biggest.byYear.filter((y) => y.status === "uncovered" && y.count > 0).map((y) => y.year))
    : "";
  const bigTitle = biggest ? splitModeName(biggest.name).title : "";
  return (
    <Frame
      search={`Search ${carName}`}
      channel={carName}
      sub="Safety gap report"
    >
      <div className="py-3">
        <Msg agent name="Unrecalled" time={updated ? fmtRelative(updated) : undefined}>
          <p>
            I read <b className="ur-num">{fmtInt(total)}</b> owner complaints about the {label}
            {recalls != null ? (
              <>
                {" "}
                and checked them against <b className="ur-num">{fmtInt(recalls)}</b> recalls
                {investigations != null ? (
                  <>
                    {" "}
                    and <b className="ur-num">{fmtInt(investigations)}</b> government investigations
                  </>
                ) : null}
              </>
            ) : null}
            .
          </p>
          {biggest ? (
            <p className="mt-2">
              <b className="ur-num">
                {uncoveredCount} of {allCount}
              </b>{" "}
              problems still have model years nothing covers. The biggest gap is{" "}
              <b>{bigTitle.toLowerCase()}</b>:{" "}
              <b className="ur-num text-ur-uncovered">{fmtInt(biggest.uncoveredCount)}</b> reports come from{" "}
              {gapYears || "years"} and nothing covers {gapYears.includes("–") || gapYears.includes(",") ? "those years" : "that year"}.
            </p>
          ) : (
            <p className="mt-2">Good news: every problem owners report is covered for every model year.</p>
          )}

          {biggest ? (
            <div className="rp-unfurl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-[1.2rem] leading-tight tracking-[-0.02em] text-foreground">
                    {bigTitle}
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">
                    <span className="ur-num">{fmtInt(biggest.count)}</span> owner reports ·{" "}
                    <span className="ur-num font-semibold text-ur-uncovered">{fmtInt(biggest.uncoveredCount)}</span>{" "}
                    uncovered
                  </div>
                </div>
                <Sparkline data={biggest.monthly} width={84} height={30} className="hidden shrink-0 sm:block" />
              </div>
              <CoverageStrip byYear={biggest.byYear} refs={biggest.refs} className="mt-3" />
            </div>
          ) : null}

          {biggest ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                to={`/gaps/${encodeURIComponent(vehicleId)}/${encodeURIComponent(biggest.failureModeId)}`}
                className="ur-btn-soft rp-btn-sm"
              >
                Open the biggest gap
                <IconArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <span className="rp-cta rp-cta--sm">
                <DraftPetitionDialog vehicleId={vehicleId} failureModeId={biggest.failureModeId} />
              </span>
            </div>
          ) : null}
        </Msg>
      </div>
    </Frame>
  );
}

function Stat({
  label,
  note,
  children,
  delay = 0,
}: {
  label: ReactNode;
  note?: ReactNode;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <div className="rp-stat ur-reveal" style={{ ["--ur-delay" as string]: `${delay}ms` }}>
      <div className="rp-stat__num">{children}</div>
      <div className="rp-stat__label">{label}</div>
      {note ? <div className="rp-stat__note">{note}</div> : null}
    </div>
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
  const hot = c.uncoveredCount > 0;
  return (
    <li className="rp-row ur-reveal group" style={{ ["--ur-delay" as string]: `${Math.min(rank - 1, 10) * 45}ms` }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 p-4 sm:p-5 xl:grid-cols-[2rem_minmax(0,1fr)_7rem_12.5rem_7.5rem_9.5rem_2.25rem] xl:gap-x-5 xl:px-6 xl:py-5">
        <span className="rp-rank hidden xl:block">{String(rank).padStart(2, "0")}</span>

        <div className="min-w-0">
          <Link
            to={clusterPath(vehicleId, c.failureModeId)}
            title={c.name}
            className="block min-w-0 font-display text-[1.3rem] leading-[1.15] tracking-[-0.025em] text-foreground after:absolute after:inset-0 after:rounded-[22px] focus-visible:outline-none md:text-[1.4rem]"
          >
            {title}
          </Link>
          {aside ? <p className="mt-1 line-clamp-1 text-[13.5px] text-muted-foreground">{aside}</p> : null}
          <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <StatusChip status={c.status} short />
            {harm ? <span className="text-[12.5px] font-medium text-foreground/70">{harm}</span> : null}
            <PostRecallNote postRecall={c.postRecall} compact className="shrink-0" />
          </div>
        </div>

        <div className="self-start text-right xl:self-center">
          <div className={cn("rp-bignum", hot ? "text-ur-uncovered" : "text-muted-foreground/45")}>
            {fmtInt(c.uncoveredCount)}
          </div>
          <div className="mt-1.5 whitespace-nowrap text-[12px] text-muted-foreground">
            <span className="xl:hidden">uncovered </span>of <span className="ur-num">{fmtInt(c.count)}</span>
          </div>
        </div>

        <div className="relative z-10 col-span-2 min-w-0 xl:col-span-1">
          <CoverageStrip byYear={c.byYear} refs={c.refs} />
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border/70 pt-3 xl:contents">
          <div className="min-w-0">
            <Sparkline
              data={c.monthly}
              width={116}
              height={32}
            />
          </div>
          <div className="min-w-0">
            <SignalBadge c={c} />
          </div>
        </div>

        <span className="rp-row__go hidden xl:grid" aria-hidden="true">
          <IconArrowRight className="size-4" />
        </span>
      </div>
    </li>
  );
}

export function SignalBadge({ c }: { c: Pick<ClusterRow, "signalFired" | "signalFiredAt" | "ratio"> }) {
  if (!c.signalFired) {
    return (
      <span className="inline-flex flex-col items-start gap-0.5 text-[12.5px] text-muted-foreground">
        <span className="font-medium text-foreground/60">No warning</span>
        {c.ratio != null ? <span className="ur-num text-[12px]">{fmtRatio(c.ratio)} similar cars</span> : null}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative z-10 inline-flex flex-col items-start gap-1">
          <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-ur-uncovered px-2.5 text-[12.5px] font-semibold text-white dark:bg-ur-uncovered/15 dark:text-ur-uncovered dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-ur-uncovered/30 shadow-[0_6px_16px_-8px_hsl(var(--ur-uncovered))]">
            <IconBellRinging className="size-3.5" aria-hidden="true" />
            Since {fmtMonth(c.signalFiredAt)}
          </span>
          {c.ratio != null ? (
            <span className="ur-num ps-1 text-[12px] text-muted-foreground">{fmtRatio(c.ratio)} similar cars</span>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        Early warning since {fmtMonth(c.signalFiredAt)}: at least 10 complaints, and this problem showed up{" "}
        {c.ratio != null ? fmtRatio(c.ratio) : "5×"} as often as in similar cars (the alarm needs 5×).
      </TooltipContent>
    </Tooltip>
  );
}

function BoardSkeleton() {
  return (
    <div className="rp-wrap" aria-busy="true" aria-label="Loading report">
      <div className="grid items-center gap-x-14 gap-y-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <div>
          <Shimmer className="h-9 w-56 rounded-full" />
          <Shimmer className="mt-8 h-20 w-[30rem] max-w-full rounded-2xl" />
          <Shimmer className="mt-3 h-12 w-56 rounded-2xl" />
          <Shimmer className="mt-8 h-5 w-[28rem] max-w-full" />
          <div className="mt-8 flex gap-3">
            <Shimmer className="h-11 w-44 rounded-xl" />
            <Shimmer className="h-11 w-48 rounded-xl" />
          </div>
        </div>
        <div className="rounded-[20px] bg-foreground/[0.06] p-[5px] pt-[42px]">
          <div className="space-y-3 rounded-[14px] bg-card p-5">
            <Shimmer className="h-5 w-40" />
            <div className="flex gap-3 pt-3">
              <Shimmer className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2.5">
                <Shimmer className="h-3.5 w-32" />
                <Shimmer className="h-3.5 w-full" />
                <Shimmer className="h-3.5 w-11/12" />
                <Shimmer className="h-3.5 w-3/4" />
                <Shimmer className="mt-4 h-20 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-24 grid grid-cols-2 gap-8 border-t pt-7 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Shimmer className="h-12 w-28 rounded-xl" />
            <Shimmer className="mt-4 h-4 w-40 max-w-full" />
          </div>
        ))}
      </div>
      <Shimmer className="mt-24 h-12 w-[26rem] max-w-full rounded-2xl" />
      <div className="mt-8 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Shimmer key={i} className="h-12 w-36 rounded-full" />
        ))}
      </div>
      <div className="mt-8 grid gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rp-row flex items-center gap-5 p-5" style={{ opacity: 1 - i * 0.15 }}>
            <div className="min-w-0 flex-1 space-y-2.5">
              <Shimmer className="h-6 w-60 max-w-full rounded-lg" />
              <Shimmer className="h-6 w-28 rounded-full" />
            </div>
            <Shimmer className="hidden h-6 w-48 rounded-full md:block" />
            <Shimmer className="h-10 w-16 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** "No complaints returned for 2026 JEEP WRANGLER." x N -> one plain sentence. */
function plainWarnings(warnings: string[]): string {
  const years: string[] = [];
  const other: string[] = [];
  for (const w of warnings) {
    const m = /^No complaints returned for (\d{4})/.exec(w);
    if (m) years.push(m[1]!);
    else other.push(w);
  }
  const parts: string[] = [];
  if (years.length) {
    parts.push(
      `NHTSA has no owner complaints for the ${compactYears(years.map(Number))} model ${years.length === 1 ? "year" : "years"} yet, so ${years.length === 1 ? "it is" : "they are"} not part of this report.`,
    );
  }
  return [...parts, ...other].join(" ");
}
