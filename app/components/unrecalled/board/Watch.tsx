import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { IconArrowRight, IconBell, IconBellRinging, IconCheck, IconLoader2, IconRadar } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import { fmtInt, fmtRelative } from "../format";
import type { AlertRow, ClusterRow, ListAlertsResult } from "../types";
import { splitModeName } from "./plain";

const PREVIEW = 3;

interface RescanResult {
  rescanned: number;
  results: { id: string; ok: boolean; error?: string }[];
}

/**
 * "Watch this car" toggle, a "Check now" re-scan and this car's updates.
 * The weekly automation calls rescan-watchlist; "Check now" runs it by hand.
 */
export function WatchCar({
  vehicleId,
  watching,
  clusters,
}: {
  vehicleId: string;
  watching: boolean;
  clusters: ClusterRow[];
}) {
  const qc = useQueryClient();
  const [on, setOn] = useState(watching);
  useEffect(() => setOn(watching), [watching]);
  const [checked, setChecked] = useState<{ failed: boolean } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: alertData } = useActionQuery<ListAlertsResult>("list-alerts", {});
  const alerts = (alertData?.alerts ?? []).filter((a) => a.vehicleId === vehicleId);

  // Remember which updates were unseen when the report opened, then mark them seen.
  const unseenAtOpen = useRef<Set<string> | null>(null);
  if (alertData && unseenAtOpen.current === null) {
    unseenAtOpen.current = new Set(alerts.filter((a) => !a.seen).map((a) => a.id));
  }
  const markSeen = useActionMutation<unknown, { vehicleId: string }>("mark-alerts-seen", {
    skipActionQueryInvalidation: true,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["action", "list-alerts"] }),
  });
  const hasUnseen = alerts.some((a) => !a.seen);
  useEffect(() => {
    if (hasUnseen && !markSeen.isPending) markSeen.mutate({ vehicleId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnseen, vehicleId]);

  const setWatch = useActionMutation<{ watch: boolean }, { vehicleId: string; watch: "true" | "false" }>("set-watch", {
    onMutate: (vars) => setOn(vars.watch === "true"),
    onError: () => setOn(watching),
  });

  const beforeIds = useRef<Set<string>>(new Set());
  const rescan = useActionMutation<RescanResult, Record<string, never>>("rescan-watchlist", {
    timeoutMs: 180_000,
    onMutate: () => {
      setChecked(null);
      beforeIds.current = new Set(alerts.map((a) => a.id));
    },
    // Success refreshes list-alerts; updates not in beforeIds are the new ones.
    onSuccess: async (res) => {
      await qc.refetchQueries({ queryKey: ["action", "list-alerts"] }).catch(() => {});
      const mine = res.results.find((r) => r.id === vehicleId);
      setChecked({ failed: !!mine && !mine.ok });
    },
    onError: () => setChecked({ failed: true }),
  });

  const names = new Map(clusters.map((c) => [c.failureModeId, c.name]));
  const busy = rescan.isPending;
  const fresh = checked ? alerts.filter((a) => !beforeIds.current.has(a.id)) : [];
  const isNew = (id: string) => !!unseenAtOpen.current?.has(id) || fresh.some((a) => a.id === id);

  return (
    <div className="ur-wt">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <button
          type="button"
          aria-pressed={on}
          disabled={setWatch.isPending}
          onClick={() => setWatch.mutate({ vehicleId, watch: on ? "false" : "true" })}
          className={cn("ur-wt__toggle", on && "ur-wt__toggle--on")}
        >
          {on ? (
            <span className="ur-wt__check" aria-hidden="true">
              <IconCheck className="size-3" strokeWidth={3} />
            </span>
          ) : (
            <IconBell className="size-4" aria-hidden="true" />
          )}
          {on ? (
            <>
              Watching<span className="text-muted-foreground"> · weekly</span>
            </>
          ) : (
            "Watch this car"
          )}
        </button>
        {on ? (
          <button type="button" onClick={() => rescan.mutate({})} disabled={busy} className="ur-wt__quiet">
            {busy ? (
              <IconLoader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <IconRadar className="size-4" aria-hidden="true" />
            )}
            {busy ? "Checking NHTSA…" : "Check now"}
          </button>
        ) : null}
      </div>
      <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
        We’ll re-check NHTSA every Monday and tell you if a problem grows.
      </p>
      {checked && !busy ? (
        <p role="status" className="ur-wt__result lp-swap">
          <IconCheck className="size-3.5 shrink-0 text-ur-recalled" strokeWidth={2.6} aria-hidden="true" />
          <span>
            {checked.failed ? (
              "We couldn’t reach NHTSA just now. Try again in a minute."
            ) : fresh.length > 0 ? (
              <>
                Checked just now: <b className="ur-num">{fresh.length}</b> new {fresh.length === 1 ? "update" : "updates"} below.
              </>
            ) : (
              "Checked just now. No problem has grown since the last scan."
            )}
          </span>
        </p>
      ) : null}

      {alerts.length ? (
        <div className="ur-wt__updates" aria-labelledby={`ur-updates-${vehicleId}`}>
          <p id={`ur-updates-${vehicleId}`} className="ur-wt__label">
            Updates
          </p>
          <ul className="mt-1.5">
            {(showAll ? alerts : alerts.slice(0, PREVIEW)).map((a) => (
              <AlertItem
                key={a.id}
                a={a}
                vehicleId={vehicleId}
                name={names.get(a.failureModeId)}
                isNew={isNew(a.id)}
              />
            ))}
          </ul>
          {alerts.length > PREVIEW ? (
            <button type="button" className="ur-wt__quiet mt-1" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show fewer" : `Show all ${alerts.length} updates`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AlertItem({ a, vehicleId, name, isNew }: { a: AlertRow; vehicleId: string; name: string | undefined; isNew: boolean }) {
  const title = splitModeName(name ?? a.failureModeId).title;
  const grew = /grew by (\d+)/.exec(a.message)?.[1];
  const text =
    a.kind === "signal" ? (
      <>
        <b>{title}</b> is now reported far more often than on similar cars.
      </>
    ) : (
      <>
        <b>{title}</b>: {grew ? <span className="ur-num">{fmtInt(Number(grew))}</span> : "more"} new complaints from
        years nothing covers.
      </>
    );
  return (
    <li>
      <Link to={`/gaps/${encodeURIComponent(vehicleId)}/${encodeURIComponent(a.failureModeId)}`} className="ur-wt__item group">
        <span className={cn("ur-wt__icon", a.kind === "signal" && "ur-wt__icon--hot")} aria-hidden="true">
          <IconBellRinging className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] leading-snug text-foreground">{text}</span>
          <span className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted-foreground">
            {a.kind === "signal" ? "Early warning" : "Problem grew"} · {fmtRelative(a.createdAt)}
            {isNew ? <span className="ur-wt__new">New</span> : null}
          </span>
        </span>
        <IconArrowRight
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
