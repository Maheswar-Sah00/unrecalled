import { useId, useMemo, useState } from "react";

import { fmtInt, fmtMonth, fmtPct } from "./format";
import { niceCeil } from "./MonthlyBars";
import type { BacktestResult } from "./types";
import { useWidth } from "./use-width";

const SERIES = "hsl(var(--ur-uncovered))";
const PEER = "hsl(var(--ur-peer))";
const SIGNAL = "hsl(var(--ur-blue))";
const RECALL = "hsl(var(--ur-recalled))";

/**
 * Two panels on one time axis (no dual y-axis):
 *  top    cumulative share of complaints describing the problem vs similar cars
 *  bottom matching complaints per month
 * The span between "our signal" and "the recall" is shaded and labelled.
 */
export function BacktestChart({ data }: { data: BacktestResult }) {
  const [ref, width] = useWidth(900);
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");

  const rows = useMemo(() => {
    let cm = 0;
    let ct = 0;
    // Start six months before the first matching complaint: earlier months
    // carry only a handful of complaints, so their shares are noise.
    const firstIdx = data.monthly.findIndex((m) => m.matched > 0);
    const start = Math.max(0, firstIdx - 6);
    const skipped = data.monthly.slice(0, start);
    for (const m of skipped) {
      cm += m.matched;
      ct += m.total;
    }
    return data.monthly.slice(start).map((m) => {
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

  const narrow = width < 560;
  const n = rows.length;
  const padL = narrow ? 34 : 44;
  const padR = narrow ? 8 : 16;
  const padT = 58;
  const topH = narrow ? 150 : 200;
  const gap = 46;
  const botH = narrow ? 70 : 90;
  const padB = 26;
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
  const barW = Math.max(1, Math.min(8, step - 1.5));

  const sharePath = rows
    .map((r, i) => `${i ? "L" : "M"}${xc(i).toFixed(1)},${yTop(r.cumShare).toFixed(1)}`)
    .join("");
  const shareArea = n
    ? `${sharePath}L${xc(n - 1).toFixed(1)},${yTop(0).toFixed(1)}L${xc(0).toFixed(1)},${yTop(0).toFixed(1)}Z`
    : "";
  const peerPath = rows
    .map((r, i) =>
      r.peer == null
        ? ""
        : `${i && rows[i - 1]?.peer != null ? "L" : "M"}${xc(i).toFixed(1)},${yTop(r.peer).toFixed(1)}`,
    )
    .join("");

  const recallMonth = data.recall.date.slice(0, 7);
  const idx = new Map(rows.map((r, i) => [r.month, i]));
  const sigI = idx.get(data.signalFiredAt);
  const recI = idx.get(recallMonth);

  const years = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.month.endsWith("-01"));
  const yearEvery = Math.max(1, Math.ceil(years.length / (innerW / (narrow ? 40 : 52))));
  const h = hover != null ? rows[hover] : null;
  const shareTicks = [0, shareMax / 2, shareMax];
  const fs = narrow ? 10 : 11;

  return (
    <div ref={ref} className="relative w-full">
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
        <LegendSwatch color={SERIES} label="These vehicles" />
        <LegendSwatch color={PEER} label="Similar cars from other brands" dashed />
        <LegendDot color={SIGNAL} label="Our signal" />
        <LegendDot color={RECALL} label="The recall" />
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Our signal flagged the problem in ${fmtMonth(data.signalFiredAt)}; the recall came in ${fmtMonth(recallMonth)}, ${data.leadMonths} months later`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const i = Math.floor((e.clientX - rect.left - padL) / step);
          setHover(i >= 0 && i < n ? i : null);
        }}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* lead-time band */}
        {sigI != null && recI != null ? (
          <g>
            <rect
              x={xc(sigI)}
              y={padT - 30}
              width={Math.max(0, xc(recI) - xc(sigI))}
              height={botTop + botH - (padT - 30)}
              fill={SIGNAL}
              opacity={0.07}
            />
            <line x1={xc(sigI)} x2={xc(recI)} y1={padT - 22} y2={padT - 22} stroke={SIGNAL} strokeWidth={1} opacity={0.6} />
            <text
              x={(xc(sigI) + xc(recI)) / 2}
              y={padT - 27}
              textAnchor="middle"
              className="ur-num"
              fontSize={fs + 1}
              fontWeight={600}
              fill={SIGNAL}
              stroke="hsl(var(--card))"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {data.leadMonths} months of warning
            </text>
          </g>
        ) : null}

        {/* top panel grid */}
        {shareTicks.map((t) => (
          <g key={`s${t}`}>
            <line
              x1={padL}
              x2={width - padR}
              y1={yTop(t)}
              y2={yTop(t)}
              stroke="hsl(var(--foreground))"
              strokeOpacity={t ? 0.07 : 0.14}
            />
            <text x={padL - 8} y={yTop(t)} dy="0.32em" textAnchor="end" fontSize={fs} className="ur-num fill-muted-foreground">
              {t === 0 ? "0%" : fmtPct(t, t < 0.1 ? 1 : 0)}
            </text>
          </g>
        ))}
        <text x={padL} y={padT - 6} fontSize={fs} className="fill-muted-foreground">
          {narrow ? "Share of complaints about this" : "Share of all complaints describing this problem"}
        </text>
        {shareArea ? <path d={shareArea} fill={`url(#area-${gid})`} /> : null}
        {peerPath ? (
          <path d={peerPath} fill="none" stroke={PEER} strokeWidth={1.5} strokeDasharray="4 4" />
        ) : null}
        <path d={sharePath} fill="none" stroke={SERIES} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />

        {/* bottom panel */}
        <line x1={padL} x2={width - padR} y1={yBot(0)} y2={yBot(0)} stroke="hsl(var(--foreground))" strokeOpacity={0.14} />
        <text x={padL - 8} y={yBot(barMax)} dy="0.32em" textAnchor="end" fontSize={fs} className="ur-num fill-muted-foreground">
          {fmtInt(barMax)}
        </text>
        <text x={padL} y={botTop - 10} fontSize={fs} className="fill-muted-foreground">
          {narrow ? "Complaints per month" : "Complaints per month describing this problem"}
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
              fill="hsl(var(--foreground))"
              opacity={hover == null || hover === i ? 0.55 : 0.2}
            />
          ) : null,
        )}

        {/* x axis years */}
        {years
          .filter((_, k) => k % yearEvery === 0)
          .map(({ r, i }) => (
            <text key={r.month} x={padL + i * step} y={height - 6} fontSize={fs} className="ur-num fill-muted-foreground">
              {r.month.slice(0, 4)}
            </text>
          ))}

        {/* markers */}
        {[
          { i: sigI, label: "Our signal", sub: fmtMonth(data.signalFiredAt), color: SIGNAL, y: yTop(rows[sigI ?? 0]?.cumShare ?? 0) },
          { i: recI, label: "Recall", sub: fmtMonth(recallMonth), color: RECALL, y: yTop(rows[recI ?? 0]?.cumShare ?? 0) },
        ].map((m, k) => {
          if (m.i == null) return null;
          const x = xc(m.i);
          const right = x > width - 120;
          const tx = right ? x - 8 : x + 8;
          const anchor = right ? "end" : "start";
          return (
            <g key={m.label}>
              <line x1={x} x2={x} y1={padT} y2={botTop + botH} stroke={m.color} strokeWidth={1.5} strokeOpacity={0.9} />
              <circle cx={x} cy={m.y} r={5.5} fill={m.color} stroke="hsl(var(--card))" strokeWidth={2.5} />
              <text
                x={tx}
                y={padT + 14 + k * 0}
                textAnchor={anchor}
                fontSize={fs + 1}
                fontWeight={650}
                fill={m.color}
                stroke="hsl(var(--card))"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {m.label}
              </text>
              <text
                x={tx}
                y={padT + 29}
                textAnchor={anchor}
                fontSize={fs}
                className="ur-num fill-muted-foreground"
                stroke="hsl(var(--card))"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {m.sub}
              </text>
            </g>
          );
        })}

        {/* crosshair */}
        {h && hover != null ? (
          <g pointerEvents="none">
            <line x1={xc(hover)} x2={xc(hover)} y1={padT} y2={botTop + botH} stroke="hsl(var(--foreground))" strokeOpacity={0.25} />
            <circle cx={xc(hover)} cy={yTop(h.cumShare)} r={4} fill={SERIES} stroke="hsl(var(--card))" strokeWidth={2} />
            {h.peer != null ? (
              <circle cx={xc(hover)} cy={yTop(h.peer)} r={4} fill={PEER} stroke="hsl(var(--card))" strokeWidth={2} />
            ) : null}
          </g>
        ) : null}
      </svg>
      {h && hover != null ? (
        <div
          className="pointer-events-none absolute z-10 w-56 rounded-xl border bg-popover px-3 py-2.5 text-xs shadow-[var(--ur-shadow-lg)]"
          style={{
            top: 70,
            left: Math.min(width - 232, Math.max(0, xc(hover) + 14)),
          }}
        >
          <div className="mb-1.5 font-display text-[15px] font-semibold">{fmtMonth(h.month)}</div>
          <Row label="Matching this month" value={fmtInt(h.matched)} />
          <Row label="All complaints" value={fmtInt(h.total)} />
          <Row label="Matching so far" value={fmtInt(h.cumMatched)} />
          <Row label="Share so far" value={fmtPct(h.cumShare)} />
          <Row label="Similar cars" value={fmtPct(h.peer)} />
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
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
    <span className="inline-flex items-center gap-2">
      <svg width={18} height={8} aria-hidden="true">
        <line x1={1} x2={17} y1={4} y2={4} stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeDasharray={dashed ? "4 4" : undefined} />
      </svg>
      {label}
    </span>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}
