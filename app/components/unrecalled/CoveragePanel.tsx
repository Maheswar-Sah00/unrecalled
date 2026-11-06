import "../../styles/report.css";

import {
  IconArrowUpRight,
  IconCircleCheck,
  IconFileAlert,
  IconGavel,
  IconSearch,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

import { Mascot } from "./mascots";

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
      <div className="ur-reveal flex flex-col items-center gap-6 rounded-[24px] border border-dashed border-ur-uncovered/40 bg-ur-uncovered/[0.05] px-6 py-10 text-center sm:flex-row sm:text-left">
        <Mascot pose="alert" color="coral" className="ur-float h-auto w-24 shrink-0" />
        <div>
          <h3 className="rp-h3">Nothing covers this problem</h3>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            No recall, government investigation or class settlement for these model years mentions it. That is
            exactly the kind of gap a petition can ask NHTSA to look into.
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {refs.map((r, i) => {
        const kind = KIND_META[r.kind] ?? KIND_META.recall;
        const Icon = kind.icon;
        const meta = statusMeta(r.status);
        const showId = r.kind !== "settlement";
        return (
          <li
            key={`${r.kind}-${r.id}`}
            className="ur-reveal group flex h-full flex-col overflow-hidden rounded-[18px] border border-border bg-card shadow-[var(--ur-shadow)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--ur-shadow-lg)]"
            style={{ ["--ur-delay" as string]: `${120 + i * 70}ms` }}
          >
            <div className="flex h-9 items-center gap-2.5 border-b border-border bg-foreground/[0.035] px-3.5 text-[12px] text-muted-foreground">
              <span className="flex gap-1.5" aria-hidden="true">
                <i className="block size-2.5 rounded-full bg-[#ff5f57]" />
                <i className="block size-2.5 rounded-full bg-[#febc2e]" />
                <i className="block size-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="min-w-0 truncate font-medium">
                {kind.label}
                {showId ? <span className="ur-num"> · {prettyRefId(r.kind, r.id)}</span> : null}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start gap-3">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl border", meta.tint, meta.text)}>
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-[1.15rem] leading-snug tracking-[-0.02em] text-foreground">
                    {cleanTitle(r.title, r.id)}
                  </div>
                  {r.date ? <div className="mt-0.5 text-[12.5px] text-muted-foreground">{fmtDate(r.date)}</div> : null}
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{plainLine(r.kind, r.status)}</p>
              <div className="mb-4 mt-3 flex flex-wrap items-center gap-2">
                <StatusChip status={r.status} short />
                {r.years.length ? (
                  <span className="ur-num rounded-full bg-foreground/[0.05] px-2.5 py-0.5 text-[12.5px] text-foreground/75">
                    {compactYears(r.years)}
                  </span>
                ) : null}
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t pt-3.5 text-[13px]">
                <span className="inline-flex min-w-0 items-start gap-1.5 text-muted-foreground">
                  <IconCircleCheck className="mt-0.5 size-4 shrink-0 text-ur-recalled" aria-hidden="true" />
                  <span>
                    {r.kind === "settlement" && !r.matchedTerms.length
                      ? "The settlement is about this exact problem"
                      : whyItCounts(r.matchedTerms)}
                  </span>
                </span>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold text-ur-blue hover:underline"
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
