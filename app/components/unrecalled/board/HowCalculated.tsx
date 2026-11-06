import { IconChevronDown, IconSparkles } from "@tabler/icons-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "We group what owners say",
    body: "Every complaint owners filed with NHTSA is read and grouped by the words they use to describe the problem, like “wobble” or “shaking at highway speed”.",
  },
  {
    title: "We check every model year",
    body: "For each year, we look for a recall, a government investigation or a class settlement that covers this problem. A year is “uncovered” when none of them does.",
  },
  {
    title: "We watch for early warnings",
    body: "The warning signal turns on when there are at least 10 complaints and this problem shows up 5 times more often than in similar cars.",
  },
];

/** Small collapsible plain-English explainer of the numbers. */
export function HowCalculated({ className, defaultOpen = false }: { className?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("ur-panel overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ur-blue/12 text-ur-blue">
          <IconSparkles className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">How we calculated this</span>
          <span className="block text-[13px] text-muted-foreground">Three plain steps, no guesswork</span>
        </span>
        <IconChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ol className="space-y-4 px-4 pb-5 pt-1">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="ur-num grid size-6 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold shadow-sm">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{s.title}</div>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
