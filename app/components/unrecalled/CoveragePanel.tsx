import {
  IconExternalLink,
  IconFileAlert,
  IconGavel,
  IconSearch,
} from "@tabler/icons-react";

import { compactYears, fmtDate } from "./format";
import { StatusChip } from "./status";
import type { CoverageRef } from "./types";

const KIND_META = {
  recall: { label: "Recall", icon: IconFileAlert },
  investigation: { label: "Investigation", icon: IconSearch },
  settlement: { label: "Settlement", icon: IconGavel },
} as const;

export function CoveragePanel({ refs }: { refs: CoverageRef[] }) {
  if (!refs.length) {
    return (
      <div className="rounded-lg border border-dashed border-ur-uncovered/50 bg-ur-uncovered/5 p-4 text-sm">
        <span className="font-medium text-ur-uncovered">Nothing covers this failure mode.</span>{" "}
        <span className="text-muted-foreground">
          No recall, ODI investigation or class settlement for these model years
          matches its coverage terms.
        </span>
      </div>
    );
  }
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {refs.map((r) => {
        const kind = KIND_META[r.kind] ?? KIND_META.recall;
        const Icon = kind.icon;
        return (
          <li key={`${r.kind}-${r.id}`} className="flex gap-3 px-3 py-3 md:px-4">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-xs text-muted-foreground">{kind.label}</span>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 items-center gap-0.5 break-all font-mono text-xs font-medium hover:underline"
                  >
                    {r.id}
                    <IconExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="break-all font-mono text-xs font-medium">{r.id}</span>
                )}
                <span className="text-xs text-muted-foreground">{fmtDate(r.date)}</span>
                <StatusChip status={r.status} short className="ms-auto" />
              </div>
              <div className="mt-1 text-sm">{r.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {r.years.length ? <span className="ur-num">MY {compactYears(r.years)}</span> : null}
                {r.matchedTerms.length ? (
                  <span className="flex flex-wrap items-center gap-1">
                    matched
                    {r.matchedTerms.map((t) => (
                      <code key={t} className="break-all rounded bg-muted px-1 font-mono text-[11px] text-foreground">
                        {t}
                      </code>
                    ))}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
