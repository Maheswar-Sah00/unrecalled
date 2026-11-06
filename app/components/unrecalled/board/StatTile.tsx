import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A premium stat card: small label, big serif figure, muted footnote. */
export function StatTile({
  label,
  children,
  note,
  className,
  delay = 0,
}: {
  label: ReactNode;
  children: ReactNode;
  note?: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("ur-card ur-reveal flex min-w-0 flex-col p-4 md:p-5", className)}
      style={{ ["--ur-delay" as string]: `${delay}ms` }}
    >
      <div className="text-[13px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 min-w-0 font-display text-[2rem] leading-none tracking-[-0.03em] text-foreground md:text-[2.5rem]">
        {children}
      </div>
      {note ? <div className="mt-2 text-[13px] leading-snug text-muted-foreground">{note}</div> : null}
    </div>
  );
}
