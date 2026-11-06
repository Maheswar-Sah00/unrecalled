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
}

export const STATUS_META: Record<CoverageStatus, StatusMeta> = {
  uncovered: {
    label: "Uncovered",
    short: "Uncovered",
    icon: IconAlertTriangleFilled,
    text: "text-ur-uncovered",
    fill: "bg-ur-uncovered",
    tint: "bg-ur-uncovered/12 border-ur-uncovered/30",
    color: "hsl(var(--ur-uncovered))",
  },
  under_investigation: {
    label: "Under investigation",
    short: "Investigation",
    icon: IconSearch,
    text: "text-ur-investigation",
    fill: "bg-ur-investigation",
    tint: "bg-ur-investigation/12 border-ur-investigation/30",
    color: "hsl(var(--ur-investigation))",
  },
  settlement: {
    label: "Class settlement",
    short: "Settlement",
    icon: IconScale,
    text: "text-ur-settlement",
    fill: "bg-ur-settlement",
    tint: "bg-ur-settlement/12 border-ur-settlement/30",
    color: "hsl(var(--ur-settlement))",
  },
  recalled: {
    label: "Recalled",
    short: "Recalled",
    icon: IconCircleCheckFilled,
    text: "text-ur-recalled",
    fill: "bg-ur-recalled",
    tint: "bg-ur-recalled/12 border-ur-recalled/30",
    color: "hsl(var(--ur-recalled))",
  },
  closed_no_recall: {
    label: "Investigated – closed, no recall",
    short: "Closed, no recall",
    icon: IconCircleMinus,
    text: "text-ur-closed",
    fill: "bg-ur-closed",
    tint: "bg-ur-closed/12 border-ur-closed/30",
    color: "hsl(var(--ur-closed))",
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
        "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 text-xs font-medium",
        meta.tint,
        meta.text,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="text-foreground/90">
        {short ? meta.short : meta.label}
      </span>
    </span>
  );
}

export function StatusLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {STATUS_ORDER.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span
            className={cn("size-2.5 rounded-[3px]", STATUS_META[s].fill)}
            aria-hidden="true"
          />
          {STATUS_META[s].short}
        </span>
      ))}
    </div>
  );
}
