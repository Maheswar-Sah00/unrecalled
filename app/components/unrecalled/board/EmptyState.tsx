import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Mascot, type MascotColor, type MascotPose } from "../mascots";

/** Friendly empty / error state with a mascot. */
export function EmptyState({
  title,
  children,
  action,
  pose = "sit",
  color = "blue",
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  pose?: MascotPose;
  color?: MascotColor;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ur-reveal flex flex-col items-center rounded-[24px] border border-dashed border-border bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <Mascot pose={pose} color={color} className="ur-float h-auto w-28" />
      <h3 className="rp-h3 mt-4">{title}</h3>
      {children ? <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
