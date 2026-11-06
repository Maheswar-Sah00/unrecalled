// Shared pieces for the document pages (petitions, backtest, rules).
import "../../../styles/documents.css";

import { cn } from "@/lib/utils";

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
