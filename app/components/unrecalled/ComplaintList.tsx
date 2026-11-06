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

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
      <ul className="divide-y rounded-lg border">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="space-y-2 p-4">
            <Skeleton className="h-3.5 w-52" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </li>
        ))}
      </ul>
    );
  }
  if (!complaints.length) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No complaints for this filter.
      </p>
    );
  }
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {complaints.map((c) => (
        <ComplaintItem
          key={c.odiNumber}
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
  onLabel,
}: {
  c: ClusterComplaint;
  onLabel: (v: Verdict) => void;
}) {
  const [open, setOpen] = useState(false);
  const long = c.summary.length > 420;
  const excluded = c.label === "exclude";
  const included = c.label === "include";
  return (
    <li className={cn("px-3 py-3 md:px-4", excluded && "bg-muted/40")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <a
          href={nhtsaComplaintUrl(c.odiNumber)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 font-mono font-medium text-foreground hover:underline"
          title="Open on nhtsa.gov"
        >
          ODI {c.odiNumber}
          <IconExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
        </a>
        <span className="ur-num text-muted-foreground">MY{c.modelYear}</span>
        <span className="text-muted-foreground">{fmtDate(c.dateReceived)}</span>
        <span className="min-w-0 truncate text-muted-foreground">
          {c.components}
        </span>
        <span className="flex items-center gap-1">
          {c.crash ? <Flag icon={IconCarCrash} label="Crash" /> : null}
          {c.fire ? <Flag icon={IconFlame} label="Fire" /> : null}
          {c.injuries > 0 ? (
            <Flag icon={IconFirstAidKit} label={`${c.injuries} injured`} />
          ) : null}
          {c.deaths > 0 ? <Flag icon={IconSkull} label={`${c.deaths} died`} /> : null}
        </span>
        <span className="ms-auto flex items-center gap-1">
          {excluded ? (
            <span className="me-1 text-muted-foreground">Excluded</span>
          ) : included ? (
            <span className="me-1 text-ur-recalled">Confirmed</span>
          ) : null}
          <Button
            type="button"
            size="xs"
            variant={included ? "secondary" : "ghost"}
            aria-pressed={included}
            onClick={() => onLabel(included ? "clear" : "include")}
            title={included ? "Clear label" : "Confirm this complaint belongs to the mode"}
          >
            <IconCircleCheck className="size-3.5" />
            <span className="hidden sm:inline">Include</span>
          </Button>
          <Button
            type="button"
            size="xs"
            variant={excluded ? "secondary" : "ghost"}
            aria-pressed={excluded}
            onClick={() => onLabel(excluded ? "clear" : "exclude")}
            title={excluded ? "Undo exclude" : "Not this failure mode — exclude"}
          >
            <IconCircleX className="size-3.5" />
            <span className="hidden sm:inline">{excluded ? "Undo" : "Exclude"}</span>
          </Button>
        </span>
      </div>
      <p
        className={cn(
          "mt-1.5 text-sm leading-relaxed",
          excluded && "text-muted-foreground line-through decoration-muted-foreground/40",
          !open && long && "line-clamp-4",
        )}
      >
        {highlightText(c.summary, c.highlights ?? [])}
      </p>
      {long ? (
        <button
          type="button"
          className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Show less" : "Show full narrative"}
        </button>
      ) : null}
    </li>
  );
}

function Flag({
  icon: Icon,
  label,
}: {
  icon: typeof IconFlame;
  label: string;
}) {
  return (
    <span className="inline-flex h-5 items-center gap-0.5 rounded bg-ur-uncovered/12 px-1 text-[11px] font-medium text-foreground">
      <Icon className="size-3 text-ur-uncovered" aria-hidden="true" />
      {label}
    </span>
  );
}
