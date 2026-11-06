// "How Unrecalled works": three plain-language steps, each with a tiny product mockup.
import { IconFileText, IconListSearch, IconShieldCheck, IconUsers } from "@tabler/icons-react";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { AgentMessage, Window } from "../premium";

/** True once the element has scrolled into view (stays true). */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

function Step({
  n,
  icon,
  title,
  body,
  children,
  delay,
  seen,
}: {
  n: number;
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
  delay: number;
  seen: boolean;
}) {
  return (
    <li
      className={cn("flex flex-col", seen ? "ur-reveal" : "opacity-0")}
      style={{ ["--ur-delay" as string]: `${delay}ms` } as CSSProperties}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-ur-blue/12 text-ur-blue">
          {icon}
        </span>
        <span className="ur-num text-[13px] font-medium text-muted-foreground">
          Step {n}
        </span>
      </div>
      <h3 className="ur-title mt-4 text-[1.6rem]">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground lg:min-h-[3.2rem]">{body}</p>
      <div className="mt-6 flex-1">{children}</div>
    </li>
  );
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border bg-background px-3 py-2 font-display text-[13.5px] leading-snug">
      “{children}”
    </div>
  );
}

const YEARS: { y: string; tone: string; label: string }[] = [
  { y: "’18", tone: "bg-ur-settlement", label: "Settlement" },
  { y: "’19", tone: "bg-ur-settlement", label: "Settlement" },
  { y: "’20", tone: "bg-ur-settlement", label: "Settlement" },
  { y: "’21", tone: "bg-ur-uncovered", label: "Uncovered" },
  { y: "’22", tone: "bg-ur-uncovered", label: "Uncovered" },
  { y: "’23", tone: "bg-ur-uncovered", label: "Uncovered" },
];

export function HowItWorks() {
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <section ref={ref} className="mt-24 md:mt-32" aria-labelledby="how-heading">
      <div className={cn("max-w-2xl", seen ? "ur-reveal" : "opacity-0")}>
        <h2 id="how-heading" className="ur-display text-[2.4rem] md:text-[3.25rem]">
          How Unrecalled works
        </h2>
        <p className="ur-lede mt-3">
          Three steps, from what owners say to a request NHTSA has to answer.
        </p>
      </div>

      <ol className="mt-12 grid gap-12 md:gap-8 lg:grid-cols-3">
        <Step
          n={1}
          seen={seen}
          delay={120}
          icon={<IconUsers className="size-5" strokeWidth={1.8} />}
          title="Read every owner complaint"
          body="Owners’ own words, grouped by the problem they describe."
        >
          <Window title="Steering shakes at speed" bodyClassName="space-y-2.5 p-4">
            <Quote>The steering wheel shakes violently and it’s hard to control.</Quote>
            <Quote>Happens anytime the road has a bump.</Quote>
            <div className="flex items-center gap-2 pt-1 text-[12.5px] text-muted-foreground">
              <IconListSearch className="size-4" strokeWidth={1.8} />
              Grouped with similar reports
            </div>
          </Window>
        </Step>

        <Step
          n={2}
          seen={seen}
          delay={240}
          icon={<IconShieldCheck className="size-5" strokeWidth={1.8} />}
          title="Check what already covers it"
          body="Recalls, government investigations and settlements, year by year."
        >
          <Window title="Jeep Wrangler · model years" bodyClassName="p-4">
            <div className="grid grid-cols-6 gap-1.5">
              {YEARS.map((x, i) => (
                <div key={x.y} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn("h-10 w-full rounded-lg", x.tone, seen && "ur-pop")}
                    style={{ ["--ur-delay" as string]: `${400 + i * 90}ms` } as CSSProperties}
                    title={x.label}
                  />
                  <span className="ur-num text-[11.5px] text-muted-foreground">{x.y}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
              <Legend tone="bg-ur-settlement">Settlement</Legend>
              <Legend tone="bg-ur-uncovered">Nothing covers it</Legend>
            </div>
          </Window>
        </Step>

        <Step
          n={3}
          seen={seen}
          delay={360}
          icon={<IconFileText className="size-5" strokeWidth={1.8} />}
          title="Draft the request to investigate"
          body="The agent writes a petition you review and file."
        >
          <Window title="Petition draft" bodyClassName="space-y-3 p-4">
            <AgentMessage>
              Drafted a petition asking NHTSA to look into steering shake on 2021–2023
              Wranglers.
            </AgentMessage>
            <div className="ms-11 space-y-1.5 rounded-xl border bg-background p-3">
              <div className="h-2 w-3/4 rounded-full bg-foreground/15" />
              <div className="h-2 w-full rounded-full bg-foreground/10" />
              <div className="h-2 w-5/6 rounded-full bg-foreground/10" />
              <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
            </div>
            <div className="ms-11">
              <span className="ur-btn-soft h-8 rounded-lg px-3 text-[13px]">Ready for your review</span>
            </div>
          </Window>
        </Step>
      </ol>
    </section>
  );
}

function Legend({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", tone)} />
      {children}
    </span>
  );
}
