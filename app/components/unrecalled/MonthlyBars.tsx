import { useState } from "react";

import { fmtInt, fmtMonth } from "./format";
import type { MonthCount } from "./types";
import { useWidth } from "./use-width";

/** Monthly complaint counts as thin bars with a hover readout. */
export function MonthlyBars({
  data,
  height = 140,
  markers = [],
}: {
  data: MonthCount[];
  height?: number;
  markers?: { month: string; label: string; color: string }[];
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 32;
  const padR = 8;
  const padT = 14;
  const padB = 20;
  const innerW = Math.max(10, width - padL - padR);
  const innerH = height - padT - padB;
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.count));
  const niceMax = niceCeil(max);
  const step = n ? innerW / n : innerW;
  const barW = Math.max(1, Math.min(14, step - 2));
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;
  const ticks = [0, niceMax / 2, niceMax];
  const yearTicks = data
    .map((d, i) => ({ i, d }))
    .filter(({ d }) => d.month.endsWith("-01"));
  const yearEvery = Math.max(1, Math.ceil(yearTicks.length / (innerW / 48)));
  const idxOf = new Map(data.map((d, i) => [d.month, i]));
  const h = hover != null ? data[hover] : null;

  return (
    <div ref={ref} className="relative w-full">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Monthly complaints, ${n} months, peak ${fmtInt(max)}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const i = Math.floor((e.clientX - rect.left - padL) / step);
          setHover(i >= 0 && i < n ? i : null);
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={width - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="hsl(var(--border))"
              strokeDasharray={t === 0 ? undefined : "2 3"}
            />
            <text
              x={padL - 6}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="ur-num fill-muted-foreground text-[10px]"
            >
              {fmtInt(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const top = y(d.count);
          const hgt = padT + innerH - top;
          if (d.count <= 0) return null;
          return (
            <rect
              key={d.month}
              x={padL + i * step + (step - barW) / 2}
              y={top}
              width={barW}
              height={Math.max(1, hgt)}
              rx={Math.min(2, barW / 2)}
              fill="hsl(var(--ur-ink))"
              opacity={hover == null || hover === i ? 0.85 : 0.35}
            />
          );
        })}
        {yearTicks
          .filter((_, k) => k % yearEvery === 0)
          .map(({ i, d }) => (
            <text
              key={d.month}
              x={padL + i * step}
              y={height - 6}
              className="ur-num fill-muted-foreground text-[10px]"
            >
              {d.month.slice(0, 4)}
            </text>
          ))}
        {markers.map((m) => {
          const i = idxOf.get(m.month);
          if (i == null) return null;
          const x = padL + i * step + step / 2;
          return (
            <g key={m.label}>
              <line
                x1={x}
                x2={x}
                y1={padT - 4}
                y2={padT + innerH}
                stroke={m.color}
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
              <text
                x={x + 4}
                y={padT + 4}
                className="text-[10px] font-medium"
                fill={m.color}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      {h ? (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border bg-popover px-2 py-1 text-xs shadow-sm"
          style={{
            left: Math.min(
              width - 120,
              Math.max(0, padL + (hover ?? 0) * step - 40),
            ),
          }}
        >
          <span className="text-muted-foreground">{fmtMonth(h.month)}</span>{" "}
          <span className="ur-num font-medium">{fmtInt(h.count)}</span>
        </div>
      ) : null}
    </div>
  );
}

export function niceCeil(v: number): number {
  if (v <= 1) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * p;
}
