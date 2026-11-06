import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import { IconChevronDown, IconExternalLink, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { BacktestChart } from "./BacktestChart";
import "../../styles/documents.css";
import { compactYears, fmtDate, fmtInt, fmtMonth, fmtPct, fmtRatio, nhtsaComplaintUrl } from "./format";
import { Page, SectionHeading, useCrumbs } from "./page";
import { CountUp, Reveal } from "./premium";
import type { BacktestResult } from "./types";

type Backtest = BacktestResult & { notes?: string[] };

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
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

export function BacktestView() {
  useCrumbs([{ label: "Backtest" }]);
  const { data, isLoading, error } = useActionQuery<Backtest>("get-backtest", {});
  const [open, setOpen] = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);

  if (isLoading) {
    return (
      <Page wide>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-12 w-[44rem] max-w-full" />
        <Skeleton className="mt-2 h-12 w-[30rem] max-w-full" />
        <div className="mt-10 grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
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
  const subject = topic.toLowerCase().startsWith(makes.toLowerCase())
    ? topic
    : `${makes} ${topic}`;
  const subjectPlural = /failure$/i.test(subject) ? `${subject}s` : subject;
  const vehicles = data.vehicles.map((v) => ({
    name: `${titleCase(v.make)} ${titleCase(v.model)}`,
    years: compactYears(v.years),
  }));
  const ratio = data.peerShare > 0 ? data.share / data.peerShare : null;
  const recallMonth = data.recall.date.slice(0, 7);
  const earlier = earlierRecall(data.notes);
  const otherNotes = (data.notes ?? []).filter((n) => n !== earlier?.note);

  const moments = [
    {
      when: fmtDate(data.firstComplaint.date),
      title: "First owner complaint",
      body: (
        <a
          href={nhtsaComplaintUrl(data.firstComplaint.odi)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
        >
          Read it on NHTSA <IconExternalLink className="size-3" aria-hidden="true" />
        </a>
      ),
      color: "bg-foreground/40",
    },
    {
      when: fmtMonth(data.signalFiredAt),
      title: "Our signal would have fired",
      body: "Complaints about this problem ran far above similar cars.",
      color: "bg-ur-blue",
      ring: true,
    },
    {
      when: fmtDate(data.recall.date),
      title: "The recall",
      body: (
        <>
          Campaign{data.recall.campaigns.length > 1 ? "s" : ""}{" "}
          {data.recall.campaigns.map((c, i) => (
            <span key={c}>
              {i ? " and " : ""}
              <span className="ur-num whitespace-nowrap">{c.replace(/^(\d{2}V)(\d{3})\d*$/, "$1-$2")}</span>
            </span>
          ))}
        </>
      ),
      color: "bg-ur-recalled",
    },
  ];

  return (
    <Page wide>
      {/* Headline */}
      <Reveal>
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-1.5 rounded-full bg-ur-blue" aria-hidden="true" />
          Backtest · replaying a real case from the past
        </div>
        <h1 className="ur-display max-w-5xl text-[2rem] md:text-[3.25rem]">
          Our early-warning signal would have flagged the {subjectPlural}{" "}
          <span className="text-ur-blue">{data.leadMonths} months</span> before the recall.
        </h1>
        <p className="ur-lede mt-5 max-w-3xl">
          We replayed NHTSA owner complaints month by month, as if we were back in time,
          and asked one question: when would our rule have raised the alarm?
        </p>
      </Reveal>

      {/* Big number + timeline */}
      <div className="mt-10 grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Reveal delay={100} className="ur-card relative flex flex-col justify-between overflow-hidden p-7 md:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-ur-blue/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="text-sm font-medium text-muted-foreground">Early warning</div>
          <div className="mt-6">
            <div className="flex items-baseline gap-3">
              <CountUp
                value={data.leadMonths}
                className="font-display text-[5.5rem] font-semibold leading-none tracking-[-0.05em] md:text-[6.5rem]"
              />
              <span className="ur-title text-[1.75rem]">months</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              before the recall was announced in {fmtMonth(recallMonth)}.
            </p>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 border-t pt-5">
            <div>
              <dt className="text-[12.5px] text-muted-foreground">Matching complaints</dt>
              <dd className="ur-num mt-1 font-display text-[1.6rem] font-semibold tracking-tight">
                {fmtInt(data.matchedBeforeRecall)}
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-muted-foreground">Above similar cars</dt>
              <dd className="ur-num mt-1 font-display text-[1.6rem] font-semibold tracking-tight">
                {ratio != null ? fmtRatio(ratio) : "n/a"}
              </dd>
              <dd className="ur-num text-[12px] text-muted-foreground">
                {fmtPct(data.share)} vs {fmtPct(data.peerShare)} of complaints
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={180} className="ur-card p-7 md:p-8">
          <div className="text-sm font-medium text-muted-foreground">How it unfolded</div>
          <div className="relative mt-6">
            <div
              className="absolute bottom-2 left-[7px] top-2 w-px bg-border md:bottom-auto md:left-2 md:right-2 md:top-[7px] md:h-px md:w-auto"
              aria-hidden="true"
            />
            <ol className="relative grid gap-7 md:grid-cols-3 md:gap-6">
            {moments.map((m) => (
              <li key={m.title} className="relative ps-8 md:ps-0 md:pt-9">
                <span
                  className={cn(
                    "absolute left-0 top-1 size-[15px] rounded-full border-[3px] border-card md:top-0",
                    m.color,
                    m.ring && "ring-4 ring-ur-blue/20",
                  )}
                  aria-hidden="true"
                />
                <div className="ur-num text-[13px] font-medium text-muted-foreground">{m.when}</div>
                <div className="ur-title mt-1 text-[1.3rem]">{m.title}</div>
                <div className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{m.body}</div>
              </li>
            ))}
            </ol>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 border-t pt-5">
            {vehicles.map((v) => (
              <span key={v.name} className="ur-chip">
                {v.name} <span className="ur-num text-muted-foreground">{v.years}</span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Chart */}
      <Reveal delay={240} as="section" className="ur-card mt-5 p-5 md:p-8">
        <SectionHeading className="mb-1">How the alarm built up</SectionHeading>
        <p className="mb-6 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
          The red line is the share of all complaints for these vehicles that describe the
          problem. The dashed grey line is the same share for similar cars from other brands.
        </p>
        <BacktestChart data={data} />
      </Reveal>

      {/* Honest caveat */}
      {earlier ? (
        <Reveal delay={300} className="ur-panel mt-5 flex flex-col gap-4 p-6 sm:flex-row sm:items-start md:p-7">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-foreground/70 shadow-[var(--ur-shadow)]">
            <IconInfoCircle className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="ur-title text-[1.3rem]">An honest note</h2>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-foreground/80">
              {earlier.campaign && earlier.lead != null ? (
                <>
                  An earlier, narrower recall ({earlier.campaign}
                  {earlier.vehicle ? `, ${earlier.vehicle}` : ""}
                  {earlier.date ? `, ${fmtMonth(earlier.date.slice(0, 7))}` : ""}) covered the same
                  failure. It came{" "}
                  <span className="font-semibold text-foreground">{earlier.lead} months</span> after
                  our signal, so measured against that recall the head start is smaller.
                </>
              ) : (
                earlier.note
              )}
            </p>
          </div>
        </Reveal>
      ) : null}

      {/* Method */}
      <Collapsible open={open} onOpenChange={setOpen} className="mt-8">
        <CollapsibleTrigger className="ur-btn-soft h-10 px-4 text-sm">
          How we checked this
          <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="ur-card p-6">
            <h3 className="ur-title text-[1.2rem]">How accurate is the matching?</h3>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">
              {data.precisionNote}
            </p>
          </div>
          {otherNotes.length ? (
            <div className="ur-card p-6">
              <h3 className="ur-title text-[1.2rem]">Notes</h3>
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
