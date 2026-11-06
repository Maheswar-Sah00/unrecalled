// "How Unrecalled works": an OpenTag-style vertical timeline. Icon tiles joined by a
// wavy line; the step in the middle of the viewport lights up and the sticky
// window on the right (desktop) swaps to that step's mockup.
import {
  IconAlertTriangle,
  IconFileText,
  IconMessages,
  IconShieldSearch,
  type Icon,
} from "@tabler/icons-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Mascot } from "../mascots";
import { BacktestMock, ComplaintsMock, CoverageMock, PetitionMock } from "./mockups";
import { Rise } from "./shared";

interface Step {
  icon: Icon;
  tone: string;
  title: string;
  body: string;
  mock: (cls: string) => ReactNode;
}

const STEPS: Step[] = [
  {
    icon: IconMessages,
    tone: "bg-ur-blue text-white",
    title: "Read every owner complaint",
    body: "Unrecalled pulls the complaints owners file with NHTSA for a car and groups the ones describing the same failure, like 380 reports of violent steering shake.",
    mock: (c) => <ComplaintsMock className={c} />,
  },
  {
    icon: IconShieldSearch,
    tone: "bg-ur-settlement text-white",
    title: "Check what already covers it",
    body: "Each problem is checked against recalls, NHTSA investigations and class settlements, model year by model year. Whatever is left is a gap.",
    mock: (c) => <CoverageMock className={c} />,
  },
  {
    icon: IconAlertTriangle,
    tone: "bg-ur-uncovered text-white",
    title: "Spot the early warning",
    body: "It compares complaint rates with similar cars and flags problems climbing far above normal. In a backtest it would have flagged Theta II engines 30 months early.",
    mock: (c) => <BacktestMock className={c} />,
  },
  {
    icon: IconFileText,
    tone: "bg-[#16a394] text-white",
    title: "Draft the request to investigate",
    body: "The agent writes the formal petition asking NHTSA to investigate, citing the real complaints. You review it before anything is sent.",
    mock: (c) => <PetitionMock className={c} />,
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = refs.current.indexOf(e.target as HTMLLIElement);
            if (i >= 0) setActive(i);
          }
        }
      },
      { rootMargin: "-42% 0px -52% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="lp-section" aria-labelledby="lp-how">
      <div className="lp-container grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,500px)] md:gap-16 lg:gap-24">
        <div>
          <Rise>
            <h2 id="lp-how" className="lp-h2">
              How Unrecalled works
            </h2>
          </Rise>
          <ol className="mt-14 md:mt-20">
            {STEPS.map((s, i) => {
              const on = i === active;
              const last = i === STEPS.length - 1;
              return (
                <li
                  key={s.title}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  data-active={on}
                  className="lp-step grid grid-cols-[44px_1fr] gap-x-5 md:grid-cols-[48px_1fr] md:gap-x-7"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "lp-step__icon flex size-11 shrink-0 items-center justify-center rounded-xl md:size-12",
                        s.tone,
                      )}
                    >
                      <s.icon className="size-[22px]" stroke={1.9} />
                    </span>
                    {last ? null : <span className="lp-wave mt-3 flex-1" aria-hidden="true" />}
                  </div>
                  <div className={cn("pb-16 md:min-h-[300px] md:pb-24", last && "md:min-h-0 md:pb-0")}>
                    <span className="ur-num text-[13px] font-medium text-muted-foreground">Step {i + 1}</span>
                    <h3 className="lp-h4 mt-1 md:text-[1.75rem]">{s.title}</h3>
                    <p className="lp-body mt-3 max-w-[32rem]">{s.body}</p>
                    <div className="mt-7 md:hidden">{s.mock("min-h-[420px]")}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative hidden md:block">
          <div className="sticky top-[120px] pt-[70px]">
            <div className="lp-perch top-[-2px] right-[9%]" aria-hidden="true">
              <Mascot pose="sit" color="violet" className="size-[108px]" />
            </div>
            <div key={active} className="lp-swap">
              {STEPS[active]?.mock("min-h-[560px]")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
