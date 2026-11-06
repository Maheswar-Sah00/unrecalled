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
      <path d={area} fill={color} opacity={0.1} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(peak)} cy={y(top.count)} r={2} fill={color} />
    </svg>
  );
}

/** One cell per model year, coloured by coverage status. */
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
  return (
    <div
      className={cn("flex items-stretch gap-0.5", className)}
      role="list"
      aria-label="Coverage by model year"
    >
      {byYear.map((y) => {
        const meta = statusMeta(y.status);
        const Icon = meta.icon;
        const active = activeYear === y.year;
        const cell = (
          <div
            role="listitem"
            className={cn(
              "flex flex-col items-center justify-center rounded-[3px] text-white",
              meta.fill,
              y.count === 0 && "opacity-35",
              big ? "h-12 min-w-0 flex-1 gap-0.5 px-1" : "h-5 w-7",
              onSelectYear && "cursor-pointer hover:brightness-110",
              active && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
            )}
          >
            {big ? (
              <>
                <span className="ur-num text-[11px] font-semibold leading-none">
                  {y.year}
                </span>
                <span className="ur-num inline-flex items-center gap-0.5 text-[11px] leading-none opacity-90">
                  <Icon className="size-3" aria-hidden="true" />
                  {fmtInt(y.count)}
                </span>
              </>
            ) : (
              <span className="ur-num text-[10px] font-medium leading-none">
                {String(y.year).slice(2)}
              </span>
            )}
          </div>
        );
        return (
          <Tooltip key={y.year}>
            <TooltipTrigger asChild>
              {onSelectYear ? (
                <button
                  type="button"
                  className={cn(
                    "rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    big && "flex min-w-0 flex-1",
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
                MY{y.year} · {fmtInt(y.count)} complaints
              </div>
              <div>{meta.label}</div>
              {y.postRecallCount ? (
                <div>{fmtInt(y.postRecallCount)} filed &gt;1 yr after the recall</div>
              ) : null}
              {y.refIds.length ? (
                <ul className="mt-1 space-y-0.5 opacity-90">
                  {y.refIds.map((id) => (
                    <li key={id}>
                      <span className="font-mono">{id}</span>
                      {refTitle.get(id) ? ` — ${refTitle.get(id)}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {onSelectYear ? (
                <div className="mt-1 opacity-70">
                  {active ? "Click to clear filter" : "Click to filter complaints"}
                </div>
              ) : null}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
