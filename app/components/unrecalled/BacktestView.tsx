import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import { IconChevronDown, IconExternalLink } from "@tabler/icons-react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { BacktestChart } from "./BacktestChart";
import { compactYears, fmtDate, fmtInt, fmtMonth, fmtPct, fmtRatio, nhtsaComplaintUrl } from "./format";
import { Page, SectionHeading, useCrumbs } from "./page";
import type { BacktestResult } from "./types";

export function BacktestView() {
  useCrumbs([{ label: "Backtest" }]);
  const { data, isLoading, error } = useActionQuery<BacktestResult>("get-backtest", {});
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Page wide>
        <Skeleton className="h-7 w-[32rem] max-w-full" />
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-80 w-full" />
      </Page>
    );
  }
  if (error || !data) {
    return (
      <Page>
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Backtest data is not available."}
        </p>
      </Page>
    );
  }

  const vehicles = data.vehicles
    .map((v) => `${v.make} ${v.model} ${compactYears(v.years)}`)
    .join(" · ");
  const ratio = data.peerShare > 0 ? data.share / data.peerShare : null;

  return (
    <Page wide>
      <h1 className="max-w-4xl text-xl font-semibold leading-snug tracking-tight">
        {data.name}: the signal fired{" "}
        <span className="text-ur-uncovered">{data.leadMonths} months</span> before
        the recall.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{vehicles}</p>

      <dl className="mt-5 grid gap-x-8 gap-y-4 border-y py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Def label="First matching complaint">
          {fmtDate(data.firstComplaint.date)} ·{" "}
          <a
            href={nhtsaComplaintUrl(data.firstComplaint.odi)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 font-mono hover:underline"
          >
            ODI {data.firstComplaint.odi}
            <IconExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
          </a>
        </Def>
        <Def label="Signal fired">
          <span className="font-semibold text-ur-investigation">{fmtMonth(data.signalFiredAt)}</span>
        </Def>
        <Def label="Recall">
          <span className="font-semibold text-ur-recalled">{fmtDate(data.recall.date)}</span>
          <span className="block font-mono text-xs text-muted-foreground">
            {data.recall.campaigns.join(", ")}
          </span>
        </Def>
        <Def label="Before the recall">
          {fmtInt(data.matchedBeforeRecall)} matching complaints · share{" "}
          {fmtPct(data.share)} vs peer {fmtPct(data.peerShare)}
          {ratio != null ? ` (${fmtRatio(ratio)})` : ""}
        </Def>
      </dl>

      <section className="mt-6">
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <BacktestChart data={data} />
        </div>
      </section>

      <Collapsible open={open} onOpenChange={setOpen} className="mt-6">
        <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium hover:underline">
          <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          Method, precision and match patterns
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 grid gap-6 md:grid-cols-2">
          <div>
            <SectionHeading>Precision</SectionHeading>
            <p className="whitespace-pre-line text-sm leading-relaxed">{data.precisionNote}</p>
          </div>
          <div>
            <SectionHeading>Patterns ({data.patterns.length})</SectionHeading>
            <ul className="space-y-1">
              {data.patterns.map((p) => (
                <li key={p}>
                  <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{p}</code>
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Page>
  );
}

function Def({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="ur-num mt-0.5">{children}</dd>
    </div>
  );
}
