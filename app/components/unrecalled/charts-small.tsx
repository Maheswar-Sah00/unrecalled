import "../../styles/report.css";

import { useId } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { fmtInt, fmtMonth } from "./format";
import { statusMeta } from "./status";
import type { CoverageRef, MonthCount, YearCoverage } from "./types";

/** Monthly complaint sparkline (area + line), one series. */
export function Sparkline({
  data,
  width = 120,
  height = 28,
  className,
  color = "hsl(var(--ur-ink))",
}: {
  data: MonthCount[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}) {
  const gid = `ur-spark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (!data.length) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line
          x1={0}
          x2={width}
          y1={height - 1}
          y2={height - 1}
          stroke="hsl(var(--border))"
        />
      </svg>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.count));
  const n = data.length;
  const pad = 1.5;
  const x = (i: number) => (n === 1 ? width / 2 : (i / (n - 1)) * width);
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const line = data
    .map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`)
    .join("");
  const area = `${line}L${x(n - 1).toFixed(1)},${height}L${x(0).toFixed(1)},${height}Z`;
  let peak = 0;
  data.forEach((d, i) => {
    if (d.count > (data[peak]?.count ?? 0)) peak = i;
  });
  const first = data[0]!;
  const last = data[n - 1]!;
  const top = data[peak]!;
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={`${fmtInt(total)} complaints ${fmtMonth(first.month)} to ${fmtMonth(last.month)}, peak ${top.count} in ${fmtMonth(top.month)}`}
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(peak)} cy={y(top.count)} r={2.5} fill="hsl(var(--ur-uncovered))" stroke="hsl(var(--card))" strokeWidth={1.5} />
    </svg>
  );
}

/** One cell per model year, coloured by coverage status.
 *  `sm`: compact pills for board rows. `lg`: animated year tiles. */
export function CoverageStrip({
  byYear,
  refs,
  size = "sm",
  activeYear,
  onSelectYear,
  className,
}: {
  byYear: YearCoverage[];
  refs?: Pick<CoverageRef, "id" | "title" | "kind">[] | undefined;
  size?: "sm" | "lg";
  activeYear?: number | null;
  onSelectYear?: (year: number | null) => void;
  className?: string;
}) {
  const refTitle = new Map((refs ?? []).map((r) => [r.id, r.title]));
  const big = size === "lg";
  const maxCount = Math.max(1, ...byYear.map((y) => y.count));
  return (
    <div
      className={cn(
        big
          ? "grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]"
          : "flex flex-wrap items-center gap-[3px]",
        className,
      )}
      style={big ? { maxWidth: `${Math.max(2, byYear.length) * 13}rem` } : undefined}
      role="list"
      aria-label="Coverage by model year"
    >
      {byYear.map((y, idx) => {
        const meta = statusMeta(y.status);
        const Icon = meta.icon;
        const active = activeYear === y.year;
        const dim = activeYear != null && !active;
        const cell = big ? (
          <div
            role="listitem"
            data-status={y.status}
            data-active={active}
            data-dim={dim}
            className={cn("rp-ytile ur-pop", y.count === 0 && "opacity-60", onSelectYear && "cursor-pointer")}
            style={{ ["--ur-delay" as string]: `${100 + idx * 70}ms` }}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="rp-ytile__year ur-num">{y.year}</span>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", meta.tint, meta.text)}>
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
            </span>
            <span className={cn("rp-ytile__count", y.status === "uncovered" && y.count > 0 ? "text-ur-uncovered" : "text-foreground")}>
              {fmtInt(y.count)}
            </span>
            <span className="mt-1 text-[12px] text-muted-foreground">owner reports</span>
            <span className="rp-ytile__bar" aria-hidden="true">
              <i
                className={meta.fill}
                style={{
                  width: `${Math.max(y.count ? 4 : 0, (y.count / maxCount) * 100)}%`,
                  ["--ur-delay" as string]: `${300 + idx * 70}ms`,
                }}
              />
            </span>
            <span className={cn("mt-3 truncate text-[12.5px] font-semibold", meta.text)}>{meta.short}</span>
          </div>
        ) : (
          <div
            role="listitem"
            className={cn(
              "flex h-[22px] w-[30px] items-center justify-center rounded-full text-white shadow-[inset_0_-1px_0_rgb(0_0_0/0.12)] dark:shadow-none",
              meta.pillDark,
              meta.fill,
              y.count === 0 && "opacity-35",
              onSelectYear && "cursor-pointer hover:brightness-110",
              active && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
            )}
          >
            <span className="ur-num text-[10.5px] font-semibold leading-none">
              ’{String(y.year).slice(2)}
            </span>
          </div>
        );
        return (
          <Tooltip key={y.year}>
            <TooltipTrigger asChild>
              {onSelectYear ? (
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    big && "flex min-w-0",
                  )}
                  aria-pressed={active}
                  aria-label={`${y.year}: ${y.count} complaints, ${meta.label}`}
                  onClick={() => onSelectYear(active ? null : y.year)}
                >
                  {cell}
                </button>
              ) : (
                cell
              )}
            </TooltipTrigger>
            <TooltipContent className="max-w-72">
              <div className="font-medium">
                {y.year} model year · {fmtInt(y.count)} complaints
              </div>
              <div>{meta.label}</div>
              {y.postRecallCount ? (
                <div>{fmtInt(y.postRecallCount)} filed more than a year after the recall</div>
              ) : null}
              {y.refIds.length ? (
                <ul className="mt-1 space-y-0.5 opacity-90">
                  {y.refIds.map((id) => (
                    <li key={id}>Covered by: {refTitle.get(id) ?? id}</li>
                  ))}
                </ul>
              ) : null}
              {onSelectYear ? (
                <div className="mt-1 opacity-70">
                  {active ? "Click to show every year" : "Click to read this year’s complaints"}
                </div>
              ) : null}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
