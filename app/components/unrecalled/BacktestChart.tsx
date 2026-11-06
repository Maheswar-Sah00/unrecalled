import { useMemo, useState } from "react";

import { fmtInt, fmtMonth, fmtPct } from "./format";
import { niceCeil } from "./MonthlyBars";
import type { BacktestResult } from "./types";
import { useWidth } from "./use-width";

const SERIES = "hsl(var(--ur-uncovered))";
const PEER = "hsl(var(--ur-peer))";
const SIGNAL = "hsl(var(--ur-investigation))";
const RECALL = "hsl(var(--ur-recalled))";

/**
 * Two panels on one time axis (no dual y-axis):
 *  top    cumulative share of complaints matching the mode vs peer share
 *  bottom matched complaints per month
 * Vertical markers for "signal fired" and "recall" span both.
 */
export function BacktestChart({ data }: { data: BacktestResult }) {
  const [ref, width] = useWidth(900);
  const [hover, setHover] = useState<number | null>(null);

  const rows = useMemo(() => {
    let cm = 0;
    let ct = 0;
    return data.monthly.map((m) => {
      cm += m.matched;
      ct += m.total;
      return {
        ...m,
        cumMatched: cm,
        cumShare: ct > 0 ? cm / ct : 0,
        peer: m.peerShare ?? data.peerShare ?? null,
      };
    });
  }, [data]);

  const n = rows.length;
  const padL = 44;
  const padR = 12;
  const topH = 170;
  const gap = 26;
  const botH = 90;
  const padT = 22;
  const padB = 22;
  const height = padT + topH + gap + botH + padB;
  const innerW = Math.max(10, width - padL - padR);
  const step = n ? innerW / n : innerW;
  const xc = (i: number) => padL + i * step + step / 2;

  const shareMax = niceCeil(
    Math.max(0.01, ...rows.map((r) => Math.max(r.cumShare, r.peer ?? 0))) * 100,
  ) / 100;
  const yTop = (v: number) => padT + topH - (v / shareMax) * topH;
  const barMax = niceCeil(Math.max(1, ...rows.map((r) => r.matched)));
  const botTop = padT + topH + gap;
  const yBot = (v: number) => botTop + botH - (v / barMax) * botH;
  const barW = Math.max(1, Math.min(10, step - 1.5));

  const sharePath = rows
    .map((r, i) => `${i ? "L" : "M"}${xc(i).toFixed(1)},${yTop(r.cumShare).toFixed(1)}`)
    .join("");
  const peerPath = rows
    .map((r, i) =>
      r.peer == null
        ? ""
        : `${i && rows[i - 1]?.peer != null ? "L" : "M"}${xc(i).toFixed(1)},${yTop(r.peer).toFixed(1)}`,
    )
    .join("");

  const recallMonth = data.recall.date.slice(0, 7);
  const idx = new Map(rows.map((r, i) => [r.month, i]));
  const markers = [
    { month: data.signalFiredAt, label: `Signal fired ${fmtMonth(data.signalFiredAt)}`, color: SIGNAL },
    { month: recallMonth, label: `Recall ${fmtMonth(recallMonth)}`, color: RECALL },
  ];

  const years = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.month.endsWith("-01"));
  const yearEvery = Math.max(1, Math.ceil(years.length / (innerW / 44)));
  const h = hover != null ? rows[hover] : null;
  const shareTicks = [0, shareMax / 2, shareMax];

  return (
    <div ref={ref} className="relative w-full">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <LegendSwatch color={SERIES} label="Cumulative share matching the mode" />
        <LegendSwatch color={PEER} label="Peer-vehicle share" dashed />
        <LegendSwatch color={SIGNAL} label="Signal fired" dashed />
        <LegendSwatch color={RECALL} label="Recall" dashed />
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Backtest: signal fired ${fmtMonth(data.signalFiredAt)}, recall ${fmtMonth(recallMonth)}, ${data.leadMonths} months lead`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const i = Math.floor((e.clientX - rect.left - padL) / step);
          setHover(i >= 0 && i < n ? i : null);
        }}
      >
        {/* top panel grid */}
        {shareTicks.map((t) => (
          <g key={`s${t}`}>
            <line x1={padL} x2={width - padR} y1={yTop(t)} y2={yTop(t)} stroke="hsl(var(--border))" strokeDasharray={t ? "2 3" : undefined} />
            <text x={padL - 6} y={yTop(t)} dy="0.32em" textAnchor="end" className="ur-num fill-muted-foreground text-[10px]">
              {fmtPct(t, t < 0.1 ? 1 : 0)}
            </text>
          </g>
        ))}
        <text x={padL} y={padT - 8} className="fill-muted-foreground text-[10px]">
          Cumulative share of all complaints
        </text>
        {peerPath ? (
          <path d={peerPath} fill="none" stroke={PEER} strokeWidth={1.5} strokeDasharray="4 3" />
        ) : null}
        <path d={sharePath} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" />

        {/* bottom panel */}
        {[0, barMax].map((t) => (
          <g key={`b${t}`}>
            <line x1={padL} x2={width - padR} y1={yBot(t)} y2={yBot(t)} stroke="hsl(var(--border))" strokeDasharray={t ? "2 3" : undefined} />
            <text x={padL - 6} y={yBot(t)} dy="0.32em" textAnchor="end" className="ur-num fill-muted-foreground text-[10px]">
              {fmtInt(t)}
            </text>
          </g>
        ))}
        <text x={padL} y={botTop - 8} className="fill-muted-foreground text-[10px]">
          Matching complaints per month
        </text>
        {rows.map((r, i) =>
          r.matched > 0 ? (
            <rect
              key={r.month}
              x={xc(i) - barW / 2}
              y={yBot(r.matched)}
              width={barW}
              height={Math.max(1, botTop + botH - yBot(r.matched))}
              rx={Math.min(2, barW / 2)}
              fill="hsl(var(--ur-ink))"
              opacity={hover == null || hover === i ? 0.8 : 0.35}
            />
          ) : null,
        )}

        {/* x axis years */}
        {years
          .filter((_, k) => k % yearEvery === 0)
          .map(({ r, i }) => (
            <text key={r.month} x={padL + i * step} y={height - 6} className="ur-num fill-muted-foreground text-[10px]">
              {r.month.slice(0, 4)}
            </text>
          ))}

        {/* markers */}
        {markers.map((m, k) => {
          const i = idx.get(m.month);
          if (i == null) return null;
          const x = xc(i);
          const right = x > width - 170;
          return (
            <g key={m.label}>
              <line x1={x} x2={x} y1={padT} y2={botTop + botH} stroke={m.color} strokeWidth={1.5} strokeDasharray="4 3" />
              <text
                x={right ? x - 5 : x + 5}
                y={padT + 12 + k * 14}
                textAnchor={right ? "end" : "start"}
                className="text-[11px] font-semibold"
                fill={m.color}
                stroke="hsl(var(--background))"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {m.label}
              </text>
            </g>
          );
        })}

        {/* crosshair */}
        {h && hover != null ? (
          <g pointerEvents="none">
            <line x1={xc(hover)} x2={xc(hover)} y1={padT} y2={botTop + botH} stroke="hsl(var(--foreground))" strokeOpacity={0.25} />
            <circle cx={xc(hover)} cy={yTop(h.cumShare)} r={4} fill={SERIES} stroke="hsl(var(--background))" strokeWidth={2} />
            {h.peer != null ? (
              <circle cx={xc(hover)} cy={yTop(h.peer)} r={4} fill={PEER} stroke="hsl(var(--background))" strokeWidth={2} />
            ) : null}
          </g>
        ) : null}
      </svg>
      {h && hover != null ? (
        <div
          className="pointer-events-none absolute z-10 w-52 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            top: 40,
            left: Math.min(width - 216, Math.max(0, xc(hover) + 12)),
          }}
        >
          <div className="mb-1 font-medium">{fmtMonth(h.month)}</div>
          <Row label="Matched this month" value={fmtInt(h.matched)} />
          <Row label="All complaints" value={fmtInt(h.total)} />
          <Row label="Matched to date" value={fmtInt(h.cumMatched)} />
          <Row label="Cumulative share" value={fmtPct(h.cumShare)} />
          <Row label="Peer share" value={fmtPct(h.peer)} />
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="ur-num font-medium">{value}</span>
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width={16} height={8} aria-hidden="true">
        <line x1={0} x2={16} y1={4} y2={4} stroke={color} strokeWidth={2} strokeDasharray={dashed ? "4 3" : undefined} />
      </svg>
      {label}
    </span>
  );
}
