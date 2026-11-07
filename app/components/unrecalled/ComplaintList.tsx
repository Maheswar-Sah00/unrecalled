import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import {
  IconCarCrash,
  IconFirstAidKit,
  IconFlame,
  IconSkull,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Shimmer, ShimmerStyles } from "./board/Shimmer";
import { fmtDate } from "./format";
import { statusMeta } from "./status";
import type { ClusterComplaint, GetClusterResult, LabelVerdict } from "./types";

type Verdict = LabelVerdict | "clear";

interface LabelVars {
  vehicleId: string;
  odiNumber: string;
  failureModeId: string;
  verdict: Verdict;
}

/** Wraps regex match spans in <mark>; merges overlaps and clamps to bounds. */
export function highlightText(
  text: string,
  spans: { start: number; end: number }[],
): ReactNode[] {
  const clean = spans
    .map((s) => ({
      start: Math.max(0, Math.min(text.length, s.start)),
      end: Math.max(0, Math.min(text.length, s.end)),
    }))
    .filter((s) => s.end > s.start)
    .flatMap((s) => tightenSpan(text, s))
    .sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const s of clean) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end) last.end = Math.max(last.end, s.end);
    else merged.push({ ...s });
  }
  const out: ReactNode[] = [];
  let pos = 0;
  merged.forEach((s, i) => {
    if (s.start > pos) out.push(text.slice(pos, s.start));
    out.push(
      <mark key={i} className="ur-mark">
        {text.slice(s.start, s.end)}
      </mark>,
    );
    pos = s.end;
  });
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}

// Long matches (whole clauses) read as noise; inside them only mark the symptom words.
const LONG_SPAN = 32;
const SYMPTOM_WORD =
  /\b(?:wobbl|wabbl|shak|shook|shimm|oscillat|vibrat|violent|uncontroll|bump|pothole|damper|steering|brak|stall|fire|smoke|airbag|seiz|knock|accelerat|shudder|jerk|slip|leak|crack|explod|burn|overheat|blackout|reboot|freez|surg|lurch|deploy)\w*/gi;

function tightenSpan(text: string, s: { start: number; end: number }): { start: number; end: number }[] {
  if (s.end - s.start <= LONG_SPAN) return [s];
  const slice = text.slice(s.start, s.end);
  const out: { start: number; end: number }[] = [];
  for (const m of slice.matchAll(SYMPTOM_WORD)) {
    if (m.index == null) continue;
    out.push({ start: s.start + m.index, end: s.start + m.index + m[0].length });
  }
  if (out.length) return out;
  // No symptom word inside: keep a short lead-in rather than the whole clause.
  const cut = slice.slice(0, LONG_SPAN).replace(/\s+\S*$/, "");
  return [{ start: s.start, end: s.start + (cut.length || LONG_SPAN) }];
}

export function ComplaintList({
  vehicleId,
  failureModeId,
  complaints,
  loading,
  ownerLabel,
  yearStatus,
}: {
  vehicleId: string;
  failureModeId: string;
  complaints: ClusterComplaint[];
  loading: boolean;
  /** e.g. "Wrangler" -> "2022 Wrangler owner" */
  ownerLabel?: string;
  /** coverage status per model year, used to colour the avatars */
  yearStatus?: Record<number, string>;
}) {
  const qc = useQueryClient();
  const label = useActionMutation<unknown, LabelVars>("label-complaint", {
    onMutate: async (vars) => {
      const filter = { queryKey: ["action", "get-cluster"] };
      await qc.cancelQueries(filter);
      const snapshot = qc.getQueriesData<GetClusterResult>(filter);
      qc.setQueriesData<GetClusterResult>(filter, (old) =>
        old
          ? {
              ...old,
              complaints: old.complaints.map((c) =>
                c.odiNumber === vars.odiNumber
                  ? { ...c, label: vars.verdict === "clear" ? null : vars.verdict }
                  : c,
              ),
            }
          : old,
      );
      return { snapshot };
    },
    onError: (error, _vars, ctx) => {
      const snap = (ctx as { snapshot?: [unknown, unknown][] } | undefined)
        ?.snapshot;
      for (const [key, value] of snap ?? []) {
        qc.setQueryData(key as readonly unknown[], value);
      }
      toast.error(actionErrorMessage(error) ?? "Could not save that label.");
    },
  });

  if (loading) {
    return (
      <ul className="grid gap-1 py-2" aria-busy="true">
        <ShimmerStyles />
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="rp-msg">
            <Shimmer className="size-[38px] rounded-full" />
            <div className="space-y-2.5">
              <Shimmer className="h-3.5 w-48" />
              <Shimmer className="h-3 w-full" />
              <Shimmer className="h-3 w-4/5" />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  if (!complaints.length) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <p className=" text-[15px] font-medium text-foreground">No owner reports match this filter.</p>
        <p className="mt-1 text-[13.5px] text-muted-foreground">Try another model year, or show every year.</p>
      </div>
    );
  }
  return (
    <ul className="py-2">
      {complaints.map((c, i) => (
        <ComplaintItem
          key={c.odiNumber}
          index={i}
          c={c}
          ownerLabel={ownerLabel}
          status={yearStatus?.[c.modelYear]}
          onLabel={(verdict) =>
            label.mutate({
              vehicleId,
              odiNumber: c.odiNumber,
              failureModeId,
              verdict,
            })
          }
        />
      ))}
    </ul>
  );
}

function ComplaintItem({
  c,
  index,
  ownerLabel,
  status,
  onLabel,
}: {
  c: ClusterComplaint;
  index: number;
  ownerLabel?: string | undefined;
  status?: string | undefined;
  onLabel: (v: Verdict) => void;
}) {
  const [open, setOpen] = useState(false);
  const long = c.summary.length > 420;
  const excluded = c.label === "exclude";
  const included = c.label === "include";
  const fill = status
    ? `${statusMeta(status).fill} ${statusMeta(status).pillDark}`
    : "bg-ur-ink dark:bg-foreground/10 dark:text-foreground";
  return (
    <li
      className={cn("rp-msg ur-reveal", excluded && "opacity-60")}
      style={{ ["--ur-delay" as string]: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="pt-0.5">
        <span className={cn("rp-avatar", fill)} title={`${c.modelYear} model year`} aria-hidden="true">
          {String(c.modelYear).slice(2)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="rp-msg__name">
          <b>
            {c.modelYear} {ownerLabel ?? "model"} owner
          </b>
          <time className="rp-time" dateTime={c.dateReceived}>
            {fmtDate(c.dateReceived)}
          </time>
          {c.crash ? <Flag icon={IconCarCrash} label="Crash" /> : null}
          {c.fire ? <Flag icon={IconFlame} label="Fire" /> : null}
          {c.injuries > 0 ? <Flag icon={IconFirstAidKit} label={`${c.injuries} injured`} /> : null}
          {c.deaths > 0 ? <Flag icon={IconSkull} label={`${c.deaths} died`} /> : null}
          {excluded ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              Excluded
            </span>
          ) : included ? (
            <span className="rounded-full bg-ur-recalled/12 px-2 py-0.5 text-[11px] font-semibold text-ur-recalled">
              Confirmed
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "rp-msg__text",
            excluded && "text-muted-foreground line-through decoration-muted-foreground/40",
            !open && long && "line-clamp-4",
          )}
        >
          {highlightText(sentenceCase(c.summary), c.highlights ?? [])}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          {long ? (
            <button
              type="button"
              className="font-semibold text-ur-blue underline-offset-2 hover:underline"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Show less" : "Read the full report"}
            </button>
          ) : null}
          <span className="text-muted-foreground" title="The number NHTSA gave this complaint">
            NHTSA report <span className="ur-num">#{c.odiNumber}</span>
          </span>
        </div>
      </div>
    </li>
  );
}

/** NHTSA narratives are often ALL CAPS; soften them without moving characters (highlights use offsets). */
function sentenceCase(text: string): string {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (!letters || letters.replace(/[^A-Z]/g, "").length / letters.length < 0.7) return text;
  let cap = true;
  let out = "";
  for (const ch of text) {
    if (/[A-Za-z]/.test(ch)) {
      out += cap ? ch.toUpperCase() : ch.toLowerCase();
      cap = false;
    } else {
      out += ch;
      if (/[.!?]/.test(ch)) cap = true;
    }
  }
  return out.replace(/\bi\b/g, "I");
}

function Flag({
  icon: Icon,
  label,
}: {
  icon: typeof IconFlame;
  label: string;
}) {
  return (
    <span className="inline-flex h-5 items-center gap-1 self-center rounded-full bg-ur-uncovered/10 px-2 text-[11px] font-semibold text-ur-uncovered">
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}
