import { IconRepeat } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

import { fmtDate, fmtInt } from "./format";
import { prettyRefId } from "./board/plain";
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
  const recall = postRecall.recallId ? prettyRefId("recall", postRecall.recallId) : null;
  const since = postRecall.sinceRecall ? ` (${fmtDate(postRecall.sinceRecall)})` : "";
  const n = fmtInt(postRecall.count);
  const noun = postRecall.count === 1 ? "complaint" : "complaints";
  if (compact) {
    return (
      <p
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-ur-investigation/30 bg-ur-investigation/10 px-2.5 py-0.5 text-[12px] text-foreground",
          className,
        )}
      >
        <IconRepeat className="size-3.5 shrink-0 text-ur-investigation" aria-hidden="true" />
        <span>
          <span className="ur-num font-semibold">{n}</span> {noun} after the recall
          {recall ? ` ${recall}` : ""}
        </span>
      </p>
    );
  }
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-ur-investigation/30 bg-ur-investigation/[0.08] px-4 py-3 text-sm text-foreground",
        className,
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ur-investigation/15 text-ur-investigation">
        <IconRepeat className="size-4" aria-hidden="true" />
      </span>
      <p className="leading-relaxed">
        <span className="font-semibold">The recall may not have fixed it.</span>{" "}
        <span className="text-muted-foreground">
          <span className="ur-num font-semibold text-foreground">{n}</span> {noun} came in more than a year
          after {recall ? `recall ${recall}` : "the recall"}
          {since}.
        </span>
      </p>
    </div>
  );
}
