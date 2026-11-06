import { IconRepeat } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

import { fmtDate, fmtInt } from "./format";
import type { PostRecall } from "./types";

/** "Recall may not have fixed it": complaints filed >1 yr after the matching recall. */
export function PostRecallNote({
  postRecall,
  compact,
  className,
}: {
  postRecall: PostRecall | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  if (!postRecall || postRecall.count <= 0) return null;
  const recall = postRecall.recallId
    ? postRecall.recallId.replace(/000$/, "")
    : "the recall";
  const since = postRecall.sinceRecall ? ` (${fmtDate(postRecall.sinceRecall)})` : "";
  return (
    <p
      className={cn(
        "inline-flex items-start gap-1 rounded-md border border-ur-investigation/40 bg-ur-investigation/10 text-foreground",
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-3 py-2 text-sm",
        className,
      )}
    >
      <IconRepeat
        className={cn("shrink-0 text-ur-investigation", compact ? "mt-px size-3" : "mt-0.5 size-4")}
        aria-hidden="true"
      />
      <span>
        <span className="ur-num font-semibold">{fmtInt(postRecall.count)}</span>{" "}
        complaint{postRecall.count === 1 ? "" : "s"} filed &gt;1 yr after recall{" "}
        <span className="font-mono">{recall}</span>
        {since}
        {compact ? "" : " — the recall may not have fixed it."}
      </span>
    </p>
  );
}
