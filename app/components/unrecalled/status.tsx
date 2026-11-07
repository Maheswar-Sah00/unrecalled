import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconCircleMinus,
  IconScale,
  IconSearch,
  type Icon,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

import type { CoverageStatus } from "./types";

interface StatusMeta {
  label: string;
  short: string;
  icon: Icon;
  /** text colour class */
  text: string;
  /** solid fill class */
  fill: string;
  /** tinted chip background */
  tint: string;
  /** css colour for svg */
  color: string;
  /** dark-mode treatment for small solid pills: tinted glass + coloured text */
  pillDark: string;
}

export const STATUS_META: Record<CoverageStatus, StatusMeta> = {
  uncovered: {
    label: "Uncovered",
    short: "Uncovered",
    icon: IconAlertTriangleFilled,
    text: "text-ur-uncovered",
    fill: "bg-ur-uncovered",
    tint: "bg-ur-uncovered/10 border-ur-uncovered/25",
    color: "hsl(var(--ur-uncovered))",
    pillDark: "dark:bg-ur-uncovered/20 dark:text-ur-uncovered dark:ring-1 dark:ring-inset dark:ring-ur-uncovered/25",
  },
  under_investigation: {
    label: "Under investigation",
    short: "Investigation",
    icon: IconSearch,
    text: "text-ur-investigation",
    fill: "bg-ur-investigation",
    tint: "bg-ur-investigation/12 border-ur-investigation/30",
    color: "hsl(var(--ur-investigation))",
    pillDark: "dark:bg-ur-investigation/20 dark:text-ur-investigation dark:ring-1 dark:ring-inset dark:ring-ur-investigation/25",
  },
  settlement: {
    label: "Class settlement",
    short: "Settlement",
    icon: IconScale,
    text: "text-ur-settlement",
    fill: "bg-ur-settlement",
    tint: "bg-ur-settlement/12 border-ur-settlement/30",
    color: "hsl(var(--ur-settlement))",
    pillDark: "dark:bg-ur-settlement/20 dark:text-ur-settlement dark:ring-1 dark:ring-inset dark:ring-ur-settlement/25",
  },
  recalled: {
    label: "Recalled",
    short: "Recalled",
    icon: IconCircleCheckFilled,
    text: "text-ur-recalled",
    fill: "bg-ur-recalled",
    tint: "bg-ur-recalled/12 border-ur-recalled/30",
    color: "hsl(var(--ur-recalled))",
    pillDark: "dark:bg-ur-recalled/20 dark:text-ur-recalled dark:ring-1 dark:ring-inset dark:ring-ur-recalled/25",
  },
  closed_no_recall: {
    label: "Investigated – closed, no recall",
    short: "Closed, no recall",
    icon: IconCircleMinus,
    text: "text-ur-closed",
    fill: "bg-ur-closed",
    tint: "bg-ur-closed/12 border-ur-closed/30",
    color: "hsl(var(--ur-closed))",
    pillDark: "dark:bg-ur-closed/20 dark:text-ur-closed dark:ring-1 dark:ring-inset dark:ring-ur-closed/25",
  },
};

export const STATUS_ORDER: CoverageStatus[] = [
  "uncovered",
  "under_investigation",
  "settlement",
  "closed_no_recall",
  "recalled",
];

export function statusMeta(status: string | null | undefined): StatusMeta {
  return (
    STATUS_META[(status ?? "uncovered") as CoverageStatus] ??
    STATUS_META.uncovered
  );
}

export function StatusChip({
  status,
  short,
  className,
}: {
  status: CoverageStatus | string;
  short?: boolean;
  className?: string;
}) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-medium",
        meta.tint,
        className,
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", meta.text)} aria-hidden="true" />
      <span className="text-foreground/90">
        {short ? meta.short : meta.label}
      </span>
    </span>
  );
}

const LEGEND_HINT: Record<CoverageStatus, string> = {
  uncovered: "nothing covers it",
  under_investigation: "being looked into",
  settlement: "owners compensated",
  closed_no_recall: "looked into, no fix",
  recalled: "fix issued",
};

export function StatusLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground",
        className,
      )}
    >
      {STATUS_ORDER.map((s) => (
        <span key={s} className="inline-flex items-center gap-2">
          <span
            className={cn("h-2.5 w-4 rounded-full", STATUS_META[s].fill)}
            aria-hidden="true"
          />
          <span>
            <span className="font-medium text-foreground">{STATUS_META[s].short}</span>
            <span className="hidden sm:inline"> · {LEGEND_HINT[s]}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
