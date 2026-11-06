import {
  IconCarCrash,
  IconFirstAidKit,
  IconFlame,
  IconSkull,
} from "@tabler/icons-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return n.toLocaleString("en-US");
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return `${(n * 100).toFixed(digits)}%`;
}

export function fmtRatio(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return `${n >= 10 ? Math.round(n) : n.toFixed(1)}×`;
}

/** "2015-01" -> "Jan 2015" */
export function fmtMonth(m: string | null | undefined): string {
  if (!m) return "–";
  const [y, mo] = m.split("-");
  const idx = Number(mo) - 1;
  if (!y || !(idx >= 0 && idx < 12)) return m;
  return `${MONTHS[idx]} ${y}`;
}

/** "2019-03-14" -> "14 Mar 2019" */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "–";
  const [y, mo, day] = d.slice(0, 10).split("-");
  const idx = Number(mo) - 1;
  if (!y || !(idx >= 0 && idx < 12)) return d;
  return day ? `${Number(day)} ${MONTHS[idx]} ${y}` : `${MONTHS[idx]} ${y}`;
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "never";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return fmtDate(new Date(t).toISOString());
}

export function yearRange(from?: number, to?: number): string {
  if (!from) return "";
  if (!to || to === from) return String(from);
  return `${from}–${to}`;
}

export function compactYears(years: number[]): string {
  if (!years.length) return "";
  const sorted = [...years].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0]!;
  let prev = sorted[0]!;
  for (let i = 1; i <= sorted.length; i++) {
    const y = sorted[i];
    if (y !== undefined && y === prev + 1) {
      prev = y;
      continue;
    }
    parts.push(start === prev ? String(start) : `${start}–${prev}`);
    if (y === undefined) break;
    start = y;
    prev = y;
  }
  return parts.join(", ");
}

export function nhtsaComplaintUrl(odi: string): string {
  return `https://www.nhtsa.gov/?nhtsaId=${encodeURIComponent(odi)}`;
}

const HARMS = [
  { key: "crashes", label: "crashes", icon: IconCarCrash },
  { key: "fires", label: "fires", icon: IconFlame },
  { key: "injuries", label: "injuries", icon: IconFirstAidKit },
  { key: "deaths", label: "deaths", icon: IconSkull },
] as const;

export function HarmCounts({
  crashes,
  fires,
  injuries,
  deaths,
  className,
}: {
  crashes: number;
  fires: number;
  injuries: number;
  deaths: number;
  className?: string;
}) {
  const values = { crashes, fires, injuries, deaths };
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {HARMS.map(({ key, label, icon: Icon }) => {
        const v = values[key] ?? 0;
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "ur-num inline-flex items-center gap-0.5 text-xs",
                  v > 0
                    ? key === "deaths" || key === "fires"
                      ? "font-semibold text-foreground"
                      : "text-foreground"
                    : "text-muted-foreground/50",
                )}
                aria-label={`${v} ${label}`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {v}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {fmtInt(v)} {label} reported
            </TooltipContent>
          </Tooltip>
        );
      })}
    </span>
  );
}
