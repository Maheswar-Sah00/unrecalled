import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BrandMark } from "../premium";

/** Quiet empty / error state: an icon on a glass tile, a serif title and a line of help. */
export function EmptyState({
  title,
  children,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Defaults to the brand crest. */
  icon?: ReactNode;
  /** Accepted for older call sites; no longer drawn. */
  pose?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ur-reveal flex flex-col items-center rounded-[24px] border border-border bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="ur-icon-tile" aria-hidden="true">
        {icon ?? <BrandMark className="size-6" />}
      </span>
      <h3 className="rp-h3 mt-5">{title}</h3>
      {children ? <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
