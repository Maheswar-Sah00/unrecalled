import {
  IconArrowUpRight,
  IconCircleCheck,
  IconFileAlert,
  IconGavel,
  IconSearch,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

import { prettyRefId, whyItCounts } from "./board/plain";
import { compactYears, fmtDate } from "./format";
import { StatusChip, statusMeta } from "./status";
import type { CoverageRef } from "./types";

const KIND_META = {
  recall: { label: "Recall", icon: IconFileAlert, link: "View recall" },
  investigation: { label: "Government investigation", icon: IconSearch, link: "View investigation" },
  settlement: { label: "Class settlement", icon: IconGavel, link: "View settlement" },
} as const;

export function CoveragePanel({ refs }: { refs: CoverageRef[] }) {
  if (!refs.length) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-ur-uncovered/40 bg-ur-uncovered/[0.06] p-4 text-sm">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ur-uncovered/12 text-ur-uncovered">
          <IconFileAlert className="size-4" aria-hidden="true" />
        </span>
        <p className="leading-relaxed">
          <span className="font-semibold text-foreground">Nothing covers this problem.</span>{" "}
          <span className="text-muted-foreground">
            No recall, government investigation or class settlement for these model years mentions it.
          </span>
        </p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {refs.map((r, i) => {
        const kind = KIND_META[r.kind] ?? KIND_META.recall;
        const Icon = kind.icon;
        const meta = statusMeta(r.status);
        const showId = r.kind !== "settlement";
        return (
          <li
            key={`${r.kind}-${r.id}`}
            className="ur-card ur-reveal flex h-full gap-3 p-4"
            style={{ ["--ur-delay" as string]: `${200 + i * 60}ms` }}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl border",
                meta.tint,
                meta.text,
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px] text-muted-foreground">
                <span className="w-full font-medium text-foreground/80">{kind.label}</span>
                {showId ? <span className="ur-num">{prettyRefId(r.kind, r.id)}</span> : null}
                {r.date ? <span>{showId ? "· " : ""}{fmtDate(r.date)}</span> : null}
              </div>
              <div className="mt-1 text-[15px] font-semibold leading-snug text-foreground">
                {cleanTitle(r.title, r.id)}
              </div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{plainLine(r.kind, r.status)}</p>
              <div className="mb-3.5 mt-2.5 flex flex-wrap items-center gap-2">
                <StatusChip status={r.status} short />
                {r.years.length ? (
                  <span className="ur-num text-[12.5px] text-muted-foreground">
                    Model years {compactYears(r.years)}
                  </span>
                ) : null}
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t pt-3 text-[13px]">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <IconCircleCheck className="size-4 shrink-0 text-ur-recalled" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-foreground/80">Why it counts:</span>{" "}
                    {r.kind === "settlement" && !r.matchedTerms.length ? "The settlement is about this exact problem" : whyItCounts(r.matchedTerms)}
                  </span>
                </span>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-ur-blue hover:underline"
                  >
                    {kind.link}
                    <IconArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** "DP18004: Frame Weld Deficiencies" -> "Frame weld deficiencies" (the id is shown separately). */
function cleanTitle(title: string, id: string): string {
  const t = title.startsWith(`${id}:`) ? title.slice(id.length + 1).trim() : title;
  if (t && t === t.replace(/\b([a-z])/g, (m) => m.toUpperCase()) && /\s/.test(t)) {
    // Title Case -> Sentence case for calmer reading.
    return t
      .split(" ")
      .map((w, i) => (i === 0 || /^[A-Z0-9/-]{2,}$/.test(w) ? w : w.toLowerCase()))
      .join(" ");
  }
  return t || title;
}

/** One plain sentence saying what this kind of action means for owners. */
function plainLine(kind: CoverageRef["kind"], status: string): string {
  if (kind === "settlement") return "A court settlement: owners of these years can claim repairs or money.";
  if (kind === "recall") return "The maker must fix this for free on the listed model years.";
  if (status === "under_investigation") return "The government is still looking into this problem.";
  if (status === "closed_no_recall") return "The government looked into it and closed the case without ordering a fix.";
  if (status === "recalled") return "The government looked into it, and it led to a recall.";
  return "A government safety investigation.";
}
