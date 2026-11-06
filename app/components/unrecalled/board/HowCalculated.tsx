import "../../../styles/report.css";

import { IconBellRinging, IconCalendarSearch, IconMessages } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

import { Mascot } from "../mascots";

const STEPS = [
  {
    icon: IconMessages,
    tint: "bg-ur-blue/12 text-ur-blue",
    title: "We group what owners say",
    body: "Every complaint owners filed with NHTSA is read and grouped by the words they use to describe the problem, like “wobble” or “shaking at highway speed”.",
  },
  {
    icon: IconCalendarSearch,
    tint: "bg-ur-uncovered/12 text-ur-uncovered",
    title: "We check every model year",
    body: "For each year we look for a recall, a government investigation or a class settlement that covers the problem. A year is “uncovered” when none of them does.",
  },
  {
    icon: IconBellRinging,
    tint: "bg-ur-investigation/15 text-ur-investigation",
    title: "We watch for early warnings",
    body: "The warning turns on when there are at least 10 complaints and the problem shows up 5 times more often than in similar cars.",
  },
];

/** "How we calculated this": an editorial three-step explainer (OpenTag "How it works"). */
export function HowCalculated({
  className,
  compact = false,
}: {
  className?: string;
  /** kept for older call sites */
  defaultOpen?: boolean;
  compact?: boolean;
}) {
  return (
    <section className={cn("grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16", className)}>
      <div className="relative">
        <h2 className="rp-h2">How we calculated this</h2>
        <p className="rp-lede mt-4 max-w-md">
          Three plain steps. No guesswork, and every number links back to the owners’ own reports.
        </p>
        {compact ? null : (
          <div className="mt-8 hidden w-36 lg:block">
            <Mascot pose="read" color="violet" className="ur-float h-auto w-full" />
          </div>
        )}
      </div>
      <ol className="min-w-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className="ur-reveal grid grid-cols-[46px_minmax(0,1fr)] gap-x-5"
              style={{ ["--ur-delay" as string]: `${i * 120}ms` }}
            >
              <div className="flex flex-col items-center">
                <span className={cn("rp-step-icon", s.tint)}>
                  <Icon aria-hidden="true" />
                </span>
                {i < STEPS.length - 1 ? <Squiggle /> : null}
              </div>
              <div className={cn("min-w-0", i < STEPS.length - 1 && "pb-6")}>
                <div className="flex items-baseline gap-3">
                  <span className="ur-num text-[13px] font-semibold text-muted-foreground">0{i + 1}</span>
                  <h3 className="rp-h3">{s.title}</h3>
                </div>
                <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Squiggle() {
  return (
    <svg viewBox="0 0 46 60" className="rp-squiggle h-[60px] grow" aria-hidden="true" preserveAspectRatio="xMidYMin meet">
      <path
        d="M23 6 C 31 13, 15 19, 23 26 S 15 39, 23 46 S 31 52, 23 58"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
