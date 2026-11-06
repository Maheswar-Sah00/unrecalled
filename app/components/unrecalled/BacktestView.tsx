import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import {
  IconAlertTriangle,
  IconBell,
  IconCalendarEvent,
  IconCar,
  IconChartLine,
  IconChevronDown,
  IconEngine,
  IconExternalLink,
  IconFileText,
  IconInfoCircle,
  IconMessage2,
} from "@tabler/icons-react";
import { Fragment, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { BacktestChart } from "./BacktestChart";
import { GradientTile, Perch, WindowTitle } from "./docs/shared";
import { compactYears, fmtDate, fmtInt, fmtMonth, fmtPct, fmtRatio, nhtsaComplaintUrl } from "./format";
import { Mascot } from "./mascots";
import { Page, useCrumbs } from "./page";
import { AgentMessage, CountUp, Reveal, Window } from "./premium";
import type { BacktestResult } from "./types";

type Backtest = BacktestResult & { notes?: string[] };

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Whole months from one "YYYY-MM[-DD]" to another. */
function monthsBetween(a: string, b: string) {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by! - ay!) * 12 + (bm! - am!);
}

/** Pulls the "earlier, narrower recall" caveat out of the backtest notes, if present. */
function earlierRecall(notes: string[] | undefined) {
  const note = notes?.find((n) => /recalled earlier/i.test(n) || /\b\d{2}V-\d{3}\b/.test(n));
  if (!note) return null;
  const campaign = note.match(/\b(\d{2}V-\d{3})\b/)?.[1] ?? null;
  const lead = Number(note.match(/lead would be (\d+) months/i)?.[1] ?? NaN);
  const date = note.match(/report date (\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
  const vehicle = note.match(/^(.+?) is excluded/i)?.[1] ?? null;
  return { note, campaign, lead: Number.isFinite(lead) ? lead : null, date, vehicle };
}

/** Floating gradient tiles around the hero (desktop only). */
const FLOATS = [
  { tone: "steel", icon: <IconEngine />, cls: "left-[2%] top-[6%] size-[132px]", dur: "9s", rot: "-4deg", delay: "0s" },
  { tone: "peach", icon: <IconBell />, cls: "left-[11%] top-[56%] size-[92px]", dur: "7s", rot: "5deg", delay: "0.8s" },
  { tone: "meadow", icon: <IconChartLine />, cls: "right-[3%] top-[2%] size-[150px]", dur: "8s", rot: "3deg", delay: "0.3s" },
  { tone: "dusk", icon: <IconCalendarEvent />, cls: "right-[12%] top-[60%] size-[96px]", dur: "10s", rot: "-6deg", delay: "1.2s" },
] as const;

export function BacktestView() {
  useCrumbs([{ label: "Backtest" }]);
  const { data, isLoading, error } = useActionQuery<Backtest>("get-backtest", {});
  const [open, setOpen] = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);

  if (isLoading) {
    return (
      <Page wide className="max-w-[1240px]">
        <div className="flex flex-col items-center pt-14">
          <Skeleton className="size-28 rounded-full" />
          <Skeleton className="mt-6 h-16 w-[44rem] max-w-full" />
          <Skeleton className="mt-3 h-16 w-[30rem] max-w-full" />
          <Skeleton className="mt-6 h-5 w-[36rem] max-w-full" />
        </div>
        <div className="mt-20 grid gap-5 md:grid-cols-3">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </Page>
    );
  }
  if (error || !data) {
    return (
      <Page>
        <div className="ur-panel p-10 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Backtest data is not available."}
        </div>
      </Page>
    );
  }

  const makes = [...new Set(data.vehicles.map((v) => titleCase(v.make)))].sort().join("/");
  const topic = data.name.replace(/\s*\(.*\)\s*$/, "").trim();
  const subject = topic.toLowerCase().startsWith(makes.toLowerCase()) ? topic : `${makes} ${topic}`;
  const subjectPlural = /failure$/i.test(subject) ? `${subject}s` : subject;
  const vehicles = data.vehicles.map((v) => ({
    name: `${titleCase(v.make)} ${titleCase(v.model)}`,
    years: compactYears(v.years),
  }));
  const allYears = data.vehicles.flatMap((v) => v.years);
  const yearSpan = allYears.length ? `${Math.min(...allYears)}–${Math.max(...allYears)}` : "";
  const ratio = data.peerShare > 0 ? data.share / data.peerShare : null;
  const recallMonth = data.recall.date.slice(0, 7);
  const earlier = earlierRecall(data.notes);
  const otherNotes = (data.notes ?? []).filter((n) => n !== earlier?.note);
  const toSignal = monthsBetween(data.firstComplaint.date, data.signalFiredAt);
  const campaigns = data.recall.campaigns.map((c) => c.replace(/^(\d{2}V)(\d{3})\d*$/, "$1-$2"));

  const milestones = [
    {
      key: false,
      when: fmtDate(data.firstComplaint.date),
      tone: "steel" as const,
      icon: <IconMessage2 />,
      title: "First owner complaint",
      body: (
        <>
          An owner tells NHTSA their engine failed. One report on its own proves nothing.{" "}
          <a
            href={nhtsaComplaintUrl(data.firstComplaint.odi)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Read it <IconExternalLink className="size-3" aria-hidden="true" />
          </a>
        </>
      ),
    },
    {
      key: true,
      when: fmtMonth(data.signalFiredAt),
      tone: "ocean" as const,
      icon: <IconBell />,
      title: "Our signal fires",
      body: (
        <AgentMessage time={fmtMonth(data.signalFiredAt)} className="mt-1 rounded-xl bg-ur-blue/[0.06] p-3">
          <p className="mt-0.5 text-[14px] leading-relaxed">
            Engine-failure complaints for these cars are running{" "}
            <b className="ur-num">{ratio != null ? fmtRatio(ratio) : "far"}</b> above similar cars.
            Worth an investigation.
          </p>
        </AgentMessage>
      ),
    },
    {
      key: false,
      when: fmtDate(data.recall.date),
      tone: "sage" as const,
      icon: <IconFileText />,
      title: "The recall",
      body: (
        <>
          The makers recall the engines under campaign{campaigns.length > 1 ? "s" : ""}{" "}
          {campaigns.map((c, i) => (
            <span key={c}>
              {i ? " and " : ""}
              <span className="ur-num whitespace-nowrap font-medium text-foreground">{c}</span>
            </span>
          ))}
          .
        </>
      ),
    },
  ];
  const gaps = [`${toSignal} months later`, `${data.leadMonths} months later`];

  return (
    <Page wide className="max-w-[1240px]">
      {/* Hero */}
      <section className="relative pb-16 pt-4 text-center md:pb-24 md:pt-12">
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
          {FLOATS.map((f, i) => (
            <GradientTile
              key={i}
              tone={f.tone}
              icon={f.icon}
              float
              className={cn("absolute", f.cls)}
              style={{ ["--ur-dur" as string]: f.dur, ["--ur-rot" as string]: f.rot, ["--ur-delay" as string]: f.delay }}
            />
          ))}
        </div>
        <div className="relative">
          <Reveal>
            <span className="ur-chip h-9 px-4 text-[13.5px]">
              <span className="ur-live-dot" aria-hidden="true" />
              Backtest · replaying a real case
            </span>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="ur-display ur-hero-lg mx-auto mt-8 max-w-[21ch]">
              Flagged
              <Mascot pose="alert" color="amber" className="ur-hero-mascot ur-float [--ur-dur:5s]" />
              <span className="ur-hl">{data.leadMonths} months</span> before the recall
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="ur-lede mx-auto mt-7 max-w-2xl text-[1.125rem] md:text-[1.25rem]">
              We replayed real NHTSA owner complaints month by month. Our early-warning signal would
              have flagged the {subjectPlural} in {fmtMonth(data.signalFiredAt)}. The recall came in{" "}
              {fmtMonth(recallMonth)}.
            </p>
          </Reveal>
          <Reveal delay={180} className="mt-9">
            <div className="ur-trust">
              <span>
                <b className="ur-num font-semibold">
                  <CountUp value={data.matchedBeforeRecall} />
                </b>{" "}
                complaints before the recall
              </span>
              <i aria-hidden="true" />
              <span>
                <b className="ur-num font-semibold">{ratio != null ? fmtRatio(ratio) : "n/a"}</b> more often than similar cars
              </span>
              <i aria-hidden="true" />
              <span>
                <b className="ur-num font-semibold">{data.vehicles.length}</b> models, {yearSpan}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Timeline */}
      <section aria-labelledby="bt-timeline">
        <Reveal>
          <h2 id="bt-timeline" className="ur-display ur-section-title">
            How it unfolded
          </h2>
          <p className="ur-lede mt-4 max-w-2xl">
            Three moments, in order. The gap between the last two is the head start owners could
            have had.
          </p>
        </Reveal>
        <ol className="relative mt-12 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch md:gap-3">
          {milestones.map((m, i) => (
            <Fragment key={m.title}>
              <Reveal as="li" delay={80 + i * 120} className="min-w-0">
                <div className="ur-milestone" data-key={m.key}>
                  <div className="flex items-center gap-3">
                    <GradientTile tone={m.tone} icon={m.icon} className="size-11 rounded-xl" />
                    <div className="ur-num text-[13.5px] font-medium text-muted-foreground">{m.when}</div>
                  </div>
                  <h3 className="ur-title mt-5 text-[1.6rem]">{m.title}</h3>
                  <div className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{m.body}</div>
                </div>
              </Reveal>
              {i < gaps.length ? (
                <li aria-hidden="true" className="flex items-center justify-center md:w-[124px]">
                  <span className="relative flex w-full items-center justify-center py-1 md:py-0">
                    <span className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-foreground/20 md:inset-x-0 md:inset-y-auto md:left-0 md:top-1/2 md:h-px md:w-auto md:border-l-0 md:border-t" />
                    <span className="ur-gap-badge relative" data-key={i === 1}>
                      {gaps[i]}
                    </span>
                  </span>
                </li>
              ) : null}
            </Fragment>
          ))}
        </ol>
      </section>

      {/* Chart */}
      <section aria-labelledby="bt-chart" className="mt-24 md:mt-32">
        <Reveal>
          <h2 id="bt-chart" className="ur-display ur-section-title">
            Watch the alarm build
          </h2>
          <p className="ur-lede mt-4 max-w-2xl">
            The red line is the share of all complaints for these cars that describe engine failure.
            The dashed grey line is the same share for similar cars from other brands.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <Perch pose="watch" color="teal" size={100} className="mt-4">
            <Window
              title={
                <WindowTitle icon={<IconChartLine className="size-3.5 shrink-0" />}>
                  {subject} · complaints over time
                </WindowTitle>
              }
              bodyClassName="p-4 md:p-8"
            >
              <BacktestChart data={data} />
            </Window>
          </Perch>
        </Reveal>
        <Reveal delay={140} className="mt-6 flex flex-wrap items-center gap-2">
          <span className="me-1 inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
            <IconCar className="size-4" aria-hidden="true" /> Cars in this replay
          </span>
          {vehicles.map((v) => (
            <span key={v.name} className="ur-chip h-8">
              {v.name} <span className="ur-num text-muted-foreground">{v.years}</span>
            </span>
          ))}
        </Reveal>
      </section>

      {/* Honest caveat */}
      {earlier ? (
        <Reveal as="section" className="ur-note mt-20 flex flex-col gap-5 p-6 sm:flex-row sm:items-start md:p-9">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ur-investigation/15 text-ur-investigation">
            <IconInfoCircle className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="ur-title text-[1.75rem] md:text-[2rem]">An honest note</h2>
            <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-foreground/80">
              {earlier.campaign && earlier.lead != null ? (
                <>
                  An earlier, narrower recall ({earlier.campaign}
                  {earlier.vehicle ? `, ${earlier.vehicle}` : ""}
                  {earlier.date ? `, ${fmtMonth(earlier.date.slice(0, 7))}` : ""}) covered the same failure. It
                  came <span className="font-semibold text-foreground">{earlier.lead} months</span> after our
                  signal, so measured against that recall the head start is smaller.
                </>
              ) : (
                earlier.note
              )}
            </p>
          </div>
        </Reveal>
      ) : null}

      {/* Method */}
      <Collapsible open={open} onOpenChange={setOpen} className="mt-10">
        <CollapsibleTrigger className="ur-btn-soft">
          <IconAlertTriangle className="size-4 opacity-70" aria-hidden="true" />
          How we checked this
          <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="ur-card p-6 md:p-7">
            <h3 className="ur-title text-[1.35rem]">How accurate is the matching?</h3>
            <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-muted-foreground">
              {data.precisionNote}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-5">
              <div>
                <dt className="text-[12.5px] text-muted-foreground">Matching complaints</dt>
                <dd className="ur-num mt-1 font-display text-[1.6rem] font-semibold tracking-tight">
                  {fmtInt(data.matchedBeforeRecall)}
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-muted-foreground">Share vs similar cars</dt>
                <dd className="ur-num mt-1 font-display text-[1.6rem] font-semibold tracking-tight">
                  {fmtPct(data.share)} <span className="text-[1rem] text-muted-foreground">vs {fmtPct(data.peerShare)}</span>
                </dd>
              </div>
            </dl>
          </div>
          {otherNotes.length ? (
            <div className="ur-card p-6 md:p-7">
              <h3 className="ur-title text-[1.35rem]">Notes</h3>
              <ul className="mt-2 space-y-2 text-[14px] leading-relaxed text-muted-foreground">
                {otherNotes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/30" aria-hidden="true" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setShowPatterns((v) => !v)}
              aria-expanded={showPatterns}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              <IconChevronDown className={cn("size-4 transition-transform", showPatterns && "rotate-180")} />
              Advanced: matching words ({data.patterns.length})
            </button>
            {showPatterns ? (
              <ul className="mt-3 space-y-1.5">
                {data.patterns.map((p) => (
                  <li key={p}>
                    <code className="break-all rounded-md bg-foreground/[0.05] px-2 py-1 font-mono text-[11.5px]">{p}</code>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Page>
  );
}
