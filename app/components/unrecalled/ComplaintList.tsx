import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import {
  IconCarCrash,
  IconCircleCheck,
  IconCircleX,
  IconExternalLink,
  IconFirstAidKit,
  IconFlame,
  IconSkull,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Shimmer, ShimmerStyles } from "./board/Shimmer";
import { fmtDate, nhtsaComplaintUrl } from "./format";
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
}: {
  vehicleId: string;
  failureModeId: string;
  complaints: ClusterComplaint[];
  loading: boolean;
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
      <ul className="grid gap-3">
        <ShimmerStyles />
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="ur-card space-y-3 p-5">
            <Shimmer className="h-3.5 w-48" />
            <Shimmer className="h-3 w-full" />
            <Shimmer className="h-3 w-4/5" />
          </li>
        ))}
      </ul>
    );
  }
  if (!complaints.length) {
    return (
      <p className="ur-panel p-8 text-center text-sm text-muted-foreground">
        No complaints match this filter.
      </p>
    );
  }
  return (
    <ul className="grid gap-3">
      {complaints.map((c, i) => (
        <ComplaintItem
          key={c.odiNumber}
          index={i}
          c={c}
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
  onLabel,
}: {
  c: ClusterComplaint;
  index: number;
  onLabel: (v: Verdict) => void;
}) {
  const [open, setOpen] = useState(false);
  const long = c.summary.length > 420;
  const excluded = c.label === "exclude";
  const included = c.label === "include";
  return (
    <li
      className={cn(
        "ur-card ur-reveal relative overflow-hidden p-4 md:p-5",
        excluded && "opacity-70",
        included && "border-ur-recalled/40",
      )}
      style={{ ["--ur-delay" as string]: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px] text-muted-foreground">
        <span className="ur-num inline-flex h-6 items-center rounded-full bg-foreground/[0.06] px-2.5 font-semibold text-foreground">
          {c.modelYear} model
        </span>
        <span>Reported {fmtDate(c.dateReceived)}</span>
        {c.crash || c.fire || c.injuries > 0 || c.deaths > 0 ? (
          <span className="flex flex-wrap items-center gap-1">
            {c.crash ? <Flag icon={IconCarCrash} label="Crash" /> : null}
            {c.fire ? <Flag icon={IconFlame} label="Fire" /> : null}
            {c.injuries > 0 ? (
              <Flag icon={IconFirstAidKit} label={`${c.injuries} injured`} />
            ) : null}
            {c.deaths > 0 ? <Flag icon={IconSkull} label={`${c.deaths} died`} /> : null}
          </span>
        ) : null}
        {excluded ? (
          <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-medium">Excluded</span>
        ) : included ? (
          <span className="ms-auto rounded-full bg-ur-recalled/12 px-2 py-0.5 text-[11.5px] font-medium text-ur-recalled">
            Confirmed
          </span>
        ) : null}
      </div>
      <blockquote
        className={cn(
          "relative mt-3 border-l-2 border-foreground/10 ps-4 text-[15px] leading-[1.7] text-foreground/90",
          excluded && "text-muted-foreground line-through decoration-muted-foreground/40",
          !open && long && "line-clamp-4",
        )}
      >
        {highlightText(sentenceCase(c.summary), c.highlights ?? [])}
      </blockquote>
      {long ? (
        <button
          type="button"
          className="mt-1.5 ps-4 text-[13px] font-medium text-ur-blue underline-offset-2 hover:underline"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Show less" : "Read the full complaint"}
        </button>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <a
          href={nhtsaComplaintUrl(c.odiNumber)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-[12px] text-muted-foreground hover:text-foreground hover:underline"
          title="Open on nhtsa.gov"
        >
          NHTSA complaint <span className="ur-num">#{c.odiNumber}</span>
          <IconExternalLink className="size-3" aria-hidden="true" />
        </a>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={included}
            onClick={() => onLabel(included ? "clear" : "include")}
            title={included ? "Clear label" : "Confirm this complaint is about this problem"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
              included
                ? "border-ur-recalled/40 bg-ur-recalled/12 text-ur-recalled"
                : "border-border bg-card text-foreground/80 hover:bg-foreground/[0.04]",
            )}
          >
            <IconCircleCheck className="size-4" aria-hidden="true" />
            Include
          </button>
          <button
            type="button"
            aria-pressed={excluded}
            onClick={() => onLabel(excluded ? "clear" : "exclude")}
            title={excluded ? "Undo exclude" : "Not about this problem — exclude"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
              excluded
                ? "border-foreground/20 bg-foreground/[0.08] text-foreground"
                : "border-border bg-card text-foreground/80 hover:bg-foreground/[0.04]",
            )}
          >
            <IconCircleX className="size-4" aria-hidden="true" />
            {excluded ? "Undo" : "Exclude"}
          </button>
        </span>
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
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-ur-uncovered/10 px-2 text-[11.5px] font-medium text-foreground">
      <Icon className="size-3.5 text-ur-uncovered" aria-hidden="true" />
      {label}
    </span>
  );
}
