// Shared pieces for the document pages (petitions, backtest, rules).
import "../../../styles/documents.css";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Mascot, type MascotColor, type MascotPose } from "../mascots";

/* ---------- OpenTag-style building blocks ---------- */

export interface PillTab<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

/** Row of pill tabs (ink when active, outlined otherwise). Scrolls inside itself on phones. */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: PillTab<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("ur-tabs", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          className="ur-tab"
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          {t.label}
          {t.count != null ? <span className="ur-tab__count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export type Tone = "meadow" | "steel" | "peach" | "sage" | "dusk" | "ocean" | "rose" | "sand";

/** Soft photographic gradient tile with a white line icon. */
export function GradientTile({
  tone,
  icon,
  className,
  style,
  float,
  children,
}: {
  tone: Tone;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  float?: boolean;
}) {
  return (
    <div
      data-tone={tone}
      aria-hidden="true"
      className={cn("ur-gtile", float && "ur-float", className)}
      style={style}
    >
      {icon}
      {children}
    </div>
  );
}

/** Wraps a window/card so a mascot sits on its top edge. */
export function Perch({
  pose,
  color = "blue",
  side = "right",
  size = 104,
  children,
  className,
}: {
  pose: MascotPose;
  color?: MascotColor;
  side?: "left" | "right";
  size?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ur-perch", className)} style={{ marginTop: size - 14 }}>
      <div
        className="ur-perch__mascot ur-float"
        style={{
          [side]: "clamp(16px, 6%, 64px)",
          width: size,
          height: size,
          ["--ur-dur" as string]: "6s",
        }}
      >
        <Mascot pose={pose} color={color} className="size-full" />
      </div>
      {children}
    </div>
  );
}

/** Title pill shown in a Window's chrome bar. */
export function WindowTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="ur-wtitle">
      {icon}
      <span>{children}</span>
    </span>
  );
}

/** Mini paper sheet (petition card art), with a status seal when ready/filed. */
export function PaperSheet({ status, className }: { status?: string | null; className?: string }) {
  const s = docStatus(status);
  return (
    <div className={cn("ur-sheet", className)} aria-hidden="true">
      <div className="ur-sheet__kicker">Petition</div>
      <div className="ur-sheet__l" style={{ width: "92%" }} />
      <div className="ur-sheet__l" style={{ width: "100%" }} />
      <div className="ur-sheet__l" style={{ width: "64%" }} />
      <div className="ur-sheet__table">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="ur-sheet__l" style={{ width: "96%" }} />
      <div className="ur-sheet__l" style={{ width: "80%" }} />
      <div className="ur-sheet__l" style={{ width: "88%" }} />
      {s !== "draft" ? (
        <span
          className="ur-sheet__seal"
          style={{ background: s === "filed" ? "hsl(var(--ur-blue))" : "hsl(var(--ur-recalled))" }}
        >
          {s === "filed" ? "Filed" : "Ready"}
        </span>
      ) : null}
    </div>
  );
}

/** Pulls "1202 complaints" / "380 of them" out of a drafted petition's markdown. */
export function petitionFacts(markdown: string): { complaints: number | null; uncovered: number | null } {
  const c = markdown.match(/filed\s+([\d,]+)\s+complaints/i)?.[1];
  const u = markdown.match(/([\d,]+)\s+of them concern/i)?.[1];
  const n = (v?: string) => (v ? Number(v.replace(/,/g, "")) : null);
  return { complaints: n(c), uncovered: n(u) };
}

/** "Petition for a Defect Investigation: 2018–2023 Jeep Wrangler, Death wobble (…)"
 *  -> { issue: "Death wobble (…)", vehicle: "2018–2023 Jeep Wrangler" } */
export function splitPetitionTitle(title: string): { issue: string; vehicle: string | null } {
  const after = title.includes(":") ? title.slice(title.indexOf(":") + 1).trim() : title;
  const comma = after.indexOf(", ");
  if (comma > 0 && /\d{4}/.test(after.slice(0, comma))) {
    const issue = after.slice(comma + 2).trim();
    return { issue: issue.charAt(0).toUpperCase() + issue.slice(1), vehicle: after.slice(0, comma).trim() };
  }
  return { issue: after || title, vehicle: null };
}

export type DocStatus = "draft" | "ready" | "filed";

export function docStatus(status: string | null | undefined): DocStatus {
  return status === "filed" ? "filed" : status === "ready" ? "ready" : "draft";
}

const PILL: Record<DocStatus, { label: string; cls: string; dot: string }> = {
  draft: {
    label: "Draft",
    cls: "bg-foreground/[0.06] text-foreground/75",
    dot: "bg-foreground/35",
  },
  ready: {
    label: "Ready",
    cls: "bg-ur-recalled/12 text-ur-recalled",
    dot: "bg-ur-recalled",
  },
  filed: {
    label: "Filed",
    cls: "bg-ur-blue/12 text-ur-blue",
    dot: "bg-ur-blue",
  },
};

export function StatusPill({
  status,
  label,
  className,
}: {
  status: string | null | undefined;
  label?: string;
  className?: string;
}) {
  const s = PILL[docStatus(status)];
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium",
        s.cls,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden="true" />
      {label ?? s.label}
    </span>
  );
}

/** Circular progress ring with the count in the middle. */
export function ProgressRing({
  value,
  total,
  size = 76,
  stroke = 7,
  className,
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = total > 0 ? value / total : 0;
  const done = total > 0 && value >= total;
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="ur-ring__track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={done ? "hsl(var(--ur-recalled))" : "hsl(var(--ur-blue))"}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          className="ur-ring__value"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="ur-num font-display text-[1.35rem] font-semibold tracking-tight">{value}</span>
        <span className="ur-num mt-0.5 text-[10.5px] text-muted-foreground">of {total}</span>
      </div>
    </div>
  );
}

/** Small paper-sheet illustration. */
export function PaperThumb({ className, lines = 6 }: { className?: string; lines?: number }) {
  const widths = ["100%", "92%", "96%", "60%", "88%", "75%", "94%", "50%"];
  return (
    <div className={cn("ur-thumb", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <i key={i} style={i ? { width: widths[i % widths.length] } : undefined} />
      ))}
    </div>
  );
}

/** Plain-English labels for the 49 CFR 552.4 checklist items. */
export function plainChecklistLabel(item: string): string {
  const t = item.toLowerCase();
  if (t.includes("english")) return "Written in English";
  if (t.includes("heading")) return "Titled clearly as a petition";
  if (t.includes("facts")) return "Lays out the facts behind the request";
  if (t.includes("substance")) return "Says what you are asking NHTSA to do";
  if (t.includes("name")) return "Your name";
  if (t.includes("address")) return "Your mailing address";
  if (t.includes("30162")) return "Names the law that lets you ask";
  if (t.includes("identifies the vehicles")) return "Names the vehicles and model years";
  if (t.includes("odi")) return "Points to real owner complaints";
  if (t.includes("method")) return "Explains how the evidence was gathered";
  return item.replace(/^§\s*552\.4\([a-z]\)\s*/i, "");
}
