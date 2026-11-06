import "../../styles/report.css";

import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import {
  IconBellRinging,
  IconCalendarEvent,
  IconCarCrash,
  IconChevronLeft,
  IconChevronRight,
  IconFirstAidKit,
  IconFlame,
  IconMessages,
  IconPinned,
  IconShieldOff,
  IconSkull,
  IconX,
} from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";

import { cn } from "@/lib/utils";

import { EmptyState } from "./board/EmptyState";
import { Frame, Msg } from "./board/Frame";
import { HowCalculated } from "./board/HowCalculated";
import { channelSlug, modelOnly, monthsBetween, splitModeName, splitVehicleLabel } from "./board/plain";
import { Shimmer } from "./board/Shimmer";
import { useMediaQuery } from "./board/useMediaQuery";
import { CoverageStrip } from "./charts-small";
import { ComplaintList } from "./ComplaintList";
import { CoveragePanel } from "./CoveragePanel";
import { DraftPetitionDialog } from "./DraftPetitionDialog";
import { compactYears, fmtDate, fmtInt, fmtMonth, fmtRatio } from "./format";
import { Mascot } from "./mascots";
import { MonthlyBars } from "./MonthlyBars";
import { useCrumbs } from "./page";
import { PostRecallNote } from "./PostRecallNote";
import { CountUp } from "./premium";
import { StatusChip, StatusLegend } from "./status";
import type { GetClusterResult } from "./types";

const PAGE_SIZE = 25;

export function ClusterDetail({ vehicleId, modeId }: { vehicleId: string; modeId: string }) {
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

  const { data, isLoading, isFetching, error } = useActionQuery<GetClusterResult>("get-cluster", query, {
    placeholderData: keepPreviousData,
  });

  const vehicleLabel = data?.vehicle?.label ?? "Vehicle";
  useCrumbs([
    { label: "Gaps", to: "/gaps" },
    { label: vehicleLabel, to: `/gaps/${encodeURIComponent(vehicleId)}` },
    { label: data?.mode.name ? splitModeName(data.mode.name).title : "…" },
  ]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  }

  const backTo = `/gaps/${encodeURIComponent(vehicleId)}`;

  if (error && !data) {
    return (
      <div className="rp-wrap">
        <EmptyState
          pose="alert"
          color="coral"
          title="We couldn’t load this problem"
          action={
            <Link to={backTo} className="ur-btn">
              Back to the report
            </Link>
          }
        >
          {actionErrorMessage(error) ?? "Something went wrong while reading the complaints."}
        </EmptyState>
      </div>
    );
  }

  if (isLoading || !data) return <DetailSkeleton />;

  const { mode, cluster, refs, complaints, total } = data;
  const pageSize = data.pageSize ?? PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const signal = cluster.signal;
  const markers =
    signal?.fired && signal.firedAt
      ? [{ month: signal.firedAt, label: "Warning", color: "hsl(var(--ur-uncovered))" }]
      : [];
  const { title, aside } = splitModeName(mode.name);
  const months = monthsBetween(cluster.firstReported, cluster.lastReported);
  const { name: carName } = splitVehicleLabel(vehicleLabel);
  const ownerLabel = modelOnly(carName, data.vehicle?.make);
  const yearStatus = Object.fromEntries(cluster.byYear.map((y) => [y.year, y.status]));
  const uncoveredYears = cluster.byYear.filter((y) => y.status === "uncovered" && y.count > 0).map((y) => y.year);
  const topYear = cluster.byYear.reduce<(typeof cluster.byYear)[number] | null>(
    (b, y) => (!b || y.count > b.count ? y : b),
    null,
  );
  const harms = [
    { n: cluster.crashes, one: "crash", many: "crashes", icon: IconCarCrash },
    { n: cluster.injuries, one: "injury", many: "injuries", icon: IconFirstAidKit },
    { n: cluster.fires, one: "fire", many: "fires", icon: IconFlame },
    { n: cluster.deaths, one: "death", many: "deaths", icon: IconSkull },
  ].filter((h) => h.n > 0);
  const span = spanParts(months);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="rp-wrap">
      <Link to={backTo} className="rp-back ur-reveal">
        <IconChevronLeft className="size-4" aria-hidden="true" />
        {vehicleLabel}
      </Link>

      {/* ---------------- hero split ---------------- */}
      <section className="mt-10 grid items-center gap-x-14 gap-y-16 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
        <div className="ur-reveal min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={cluster.coverage.status} className="h-8 px-3 text-[13px]" />
            {signal?.fired ? (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ur-uncovered px-3 text-[13px] font-semibold text-white">
                <IconBellRinging className="size-4" aria-hidden="true" />
                Early warning since {fmtMonth(signal.firedAt)}
              </span>
            ) : null}
          </div>
          <h1 className="rp-hero-title mt-7">{title}</h1>
          {aside ? (
            <p className="mt-4 font-display text-[1.35rem] leading-snug tracking-[-0.02em] text-muted-foreground md:text-[1.6rem]">
              {aside}
            </p>
          ) : null}
          {mode.hazard ? <p className="rp-lede mt-6 max-w-xl">{mode.hazard}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="rp-cta">
              <DraftPetitionDialog vehicleId={vehicleId} failureModeId={modeId} disabled={cluster.count === 0} />
            </span>
            <a href="#owners" className="ur-btn-soft">
              <IconMessages className="size-4" aria-hidden="true" />
              Read what owners say
            </a>
          </div>
          {harms.length ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {harms.map((h) => {
                const Icon = h.icon;
                return (
                  <span
                    key={h.one}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13.5px] text-muted-foreground"
                  >
                    <Icon className="size-4 text-ur-uncovered" aria-hidden="true" />
                    <span className="ur-num font-semibold text-foreground">{fmtInt(h.n)}</span>
                    {h.n === 1 ? h.one : h.many} reported
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="ur-reveal relative min-w-0 pt-20 lg:pt-24" style={{ ["--ur-delay" as string]: "160ms" }}>
          <div className="rp-glow" aria-hidden="true" />
          <Frame
            search="Complaints over time"
            channel="Complaints each month"
            sub={
              cluster.firstReported ? (
                <>
                  {fmtDate(cluster.firstReported)} – {fmtDate(cluster.lastReported)}
                </>
              ) : undefined
            }
            closable={false}
            headRight={
              <span className="ur-num shrink-0 rounded-full bg-foreground/[0.06] px-3 py-1 text-[12.5px] font-semibold text-foreground">
                {fmtInt(cluster.count)} reports
              </span>
            }
            perch={<Mascot pose="alert" color="coral" />}
          >
            <div className="px-3 pb-4 pt-6 md:px-5">
              <MonthlyBars data={cluster.monthly} markers={markers} height={isWide ? 300 : 220} />
            </div>
          </Frame>
        </div>
      </section>

      {/* ---------------- stats ---------------- */}
      <section className="mt-24 md:mt-28" aria-label="Key numbers">
        <div className="rp-stats">
          <Stat delay={60} label="In uncovered years" note={`of ${fmtInt(cluster.count)} reports come from years nothing covers`}>
            <span className={cluster.uncoveredCount > 0 ? "text-ur-uncovered" : "text-muted-foreground"}>
              <CountUp value={cluster.uncoveredCount} />
            </span>
          </Stat>
          <Stat delay={120} label="Owner reports" note="filed with the U.S. safety regulator">
            <CountUp value={cluster.count} />
          </Stat>
          <Stat
            delay={180}
            label="Reported over"
            note={cluster.firstReported ? `${fmtDate(cluster.firstReported)} – ${fmtDate(cluster.lastReported)}` : undefined}
          >
            {span ? (
              <>
                {span.n}
                <span className="text-[0.42em] tracking-[-0.02em] text-muted-foreground"> {span.unit}</span>
              </>
            ) : (
              "–"
            )}
          </Stat>
          <Stat
            delay={240}
            label="Compared with similar cars"
            note={
              signal?.fired
                ? `Warning on since ${fmtMonth(signal.firedAt)}. The alarm needs 5×.`
                : "The early-warning alarm needs at least 10 reports and 5×."
            }
          >
            {signal?.ratio != null ? (
              <span className={signal.fired ? "text-ur-uncovered" : undefined}>{fmtRatio(signal.ratio)}</span>
            ) : (
              <span className="text-muted-foreground/60">Quiet</span>
            )}
          </Stat>
        </div>
      </section>

      {/* ---------------- coverage by year ---------------- */}
      <section className="rp-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="rp-h2">Coverage by model year</h2>
            <p className="rp-lede mt-4 max-w-2xl">
              Each tile is one model year. Tap a year to read only its owners’ reports.
            </p>
          </div>
          {year ? (
            <button type="button" className="rp-tab" aria-selected="true" onClick={() => update({ year: null, page: null })}>
              Showing {year} only
              <IconX aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <CoverageStrip
          className="mt-10"
          byYear={cluster.byYear}
          refs={refs}
          size="lg"
          activeYear={year}
          onSelectYear={(y) => update({ year: y ? String(y) : null, page: null })}
        />
        <StatusLegend className="mt-6" />
        <PostRecallNote postRecall={cluster.postRecall} className="mt-6 max-w-3xl" />
      </section>

      {/* ---------------- what covers it ---------------- */}
      <section className="rp-section">
        <h2 className="rp-h2">What already covers it</h2>
        <p className="rp-lede mt-4 max-w-2xl">
          Recalls, government investigations and class settlements that match this problem.
        </p>
        <div className="mt-10">
          <CoveragePanel refs={refs} />
        </div>
      </section>

      {/* ---------------- what owners say (thread) ---------------- */}
      <section id="owners" className="rp-section scroll-mt-24">
        <h2 className="rp-h2">What owners say</h2>
        <p className="rp-lede mt-4 max-w-2xl">
          Their own words. Highlighted words are why each report was grouped under this problem.
        </p>

        <Frame
          className="mt-28 max-w-[1040px]"
          search={`Search ${fmtInt(cluster.count)} owner reports`}
          channel={`# ${channelSlug(title)}`}
          sub={`${fmtInt(cluster.count)} owner reports · ${vehicleLabel}`}
          perch={<Mascot pose="read" color="teal" />}
          perchSide="left"
        >
          <div className="border-b border-border px-4 py-3 md:px-[22px]">
            <div className="rp-tabs rp-tabs--sm" role="tablist" aria-label="Which reports">
              <button
                type="button"
                role="tab"
                className="rp-tab"
                aria-selected={scope === "all" && !year}
                onClick={() => update({ scope: null, year: null, page: null })}
              >
                <IconMessages aria-hidden="true" />
                All years
                <span className="rp-count">{fmtInt(cluster.count)}</span>
              </button>
              <button
                type="button"
                role="tab"
                className="rp-tab"
                aria-selected={scope === "uncovered"}
                onClick={() => update({ scope: scope === "uncovered" ? null : "uncovered", page: null })}
              >
                <IconShieldOff aria-hidden="true" />
                Uncovered years
                <span className="rp-count">{fmtInt(cluster.uncoveredCount)}</span>
              </button>
              {cluster.byYear
                .filter((y) => y.count > 0)
                .map((y) => (
                  <button
                    key={y.year}
                    type="button"
                    role="tab"
                    className="rp-tab"
                    aria-selected={year === y.year}
                    onClick={() => update({ year: year === y.year ? null : String(y.year), page: null })}
                  >
                    <IconCalendarEvent aria-hidden="true" />
                    <span className="ur-num">{y.year}</span>
                    <span className="rp-count">{fmtInt(y.count)}</span>
                  </button>
                ))}
            </div>
          </div>

          <Msg
            pinned
            agent
            name="Unrecalled"
            time={
              <span className="inline-flex items-center gap-1">
                <IconPinned className="size-3.5" aria-hidden="true" />
                Pinned
              </span>
            }
          >
            {cluster.uncoveredCount > 0 ? (
              <p>
                <b className="ur-num text-ur-uncovered">{fmtInt(cluster.uncoveredCount)}</b> of these{" "}
                <b className="ur-num">{fmtInt(cluster.count)}</b> reports come from{" "}
                <b className="ur-num">{compactYears(uncoveredYears)}</b>,{" "}
                {uncoveredYears.length > 1 ? "years" : "a year"} nothing covers.
                {topYear && topYear.count > 0 ? (
                  <>
                    {" "}
                    Most come from <span className="ur-num">{topYear.year}</span> owners (
                    <span className="ur-num">{fmtInt(topYear.count)}</span>).
                  </>
                ) : null}
              </p>
            ) : (
              <p>
                Every model year with reports here is covered by a recall, investigation or settlement
                {topYear && topYear.count > 0 ? (
                  <>
                    . Most come from <span className="ur-num">{topYear.year}</span> owners (
                    <span className="ur-num">{fmtInt(topYear.count)}</span>)
                  </>
                ) : null}
                .
              </p>
            )}
            <p className="mt-1.5 text-muted-foreground">
              I highlighted the words that tie each report to this problem. If one doesn’t belong, choose{" "}
              <b className="text-foreground">Exclude</b>.
            </p>
            {cluster.uncoveredCount > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ur-btn-soft rp-btn-sm"
                  onClick={() => update({ scope: scope === "uncovered" ? null : "uncovered", year: null, page: null })}
                >
                  {scope === "uncovered" ? "Show every year" : "Show only uncovered years"}
                </button>
              </div>
            ) : null}
          </Msg>

          <div className="rp-reply-line">
            <span className="ur-num">
              {total === 0
                ? "No reports"
                : `${fmtInt(total)} ${total === 1 ? "report" : "reports"}${year ? ` from ${year}` : scope === "uncovered" ? " from uncovered years" : ""}`}
            </span>
          </div>

          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            <ComplaintList
              vehicleId={vehicleId}
              failureModeId={modeId}
              complaints={complaints}
              loading={false}
              ownerLabel={ownerLabel}
              yearStatus={yearStatus}
            />
          </div>

          {total > 0 ? (
            <div className="rp-composer">
              <span className="ur-num">
                Showing {fmtInt(from)}–{fmtInt(to)} of {fmtInt(total)}
                {pages > 1 ? ` · page ${page} of ${pages}` : ""}
              </span>
              {pages > 1 ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rp-pager-btn"
                    disabled={page <= 1}
                    onClick={() => update({ page: page - 1 > 1 ? String(page - 1) : null })}
                  >
                    <IconChevronLeft className="size-4" aria-hidden="true" /> Previous
                  </button>
                  <button
                    type="button"
                    className="rp-pager-btn"
                    disabled={page >= pages}
                    onClick={() => update({ page: String(page + 1) })}
                  >
                    Next <IconChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </Frame>
      </section>

      <div className="rp-section">
        <HowCalculated compact />
      </div>
    </div>
  );
}

function spanParts(months: number | null): { n: string; unit: string } | null {
  if (months == null) return null;
  if (months < 12) return { n: String(months), unit: months === 1 ? "month" : "months" };
  const y = months / 12;
  return { n: y >= 10 ? String(Math.round(y)) : y.toFixed(1).replace(/\.0$/, ""), unit: "years" };
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

function DetailSkeleton() {
  return (
    <div className="rp-wrap" aria-busy="true" aria-label="Loading problem">
      <Shimmer className="h-8 w-44 rounded-full" />
      <div className="mt-12 grid items-center gap-x-14 gap-y-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
        <div>
          <Shimmer className="h-8 w-32 rounded-full" />
          <Shimmer className="mt-8 h-20 w-[26rem] max-w-full rounded-2xl" />
          <Shimmer className="mt-6 h-5 w-[30rem] max-w-full" />
          <Shimmer className="mt-2 h-5 w-[22rem] max-w-full" />
          <div className="mt-8 flex gap-3">
            <Shimmer className="h-11 w-40 rounded-xl" />
            <Shimmer className="h-11 w-48 rounded-xl" />
          </div>
        </div>
        <div className="rounded-[20px] bg-foreground/[0.06] p-[5px] pt-[42px]">
          <div className="rounded-[14px] bg-card p-5">
            <Shimmer className="h-5 w-44" />
            <div className="mt-6 flex h-56 items-end gap-1.5">
              {Array.from({ length: 28 }, (_, i) => (
                <Shimmer key={i} className="flex-1 rounded-sm" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
              ))}
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
      <Shimmer className="mt-24 h-12 w-[24rem] max-w-full rounded-2xl" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Shimmer key={i} className="h-44 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
