// Playful floating decorations for the Gaps hero (OpenTag-style). Shown only when
// the hero container is wide enough; purely decorative, hidden from screen readers.
import { IconFileText, IconQuote } from "@tabler/icons-react";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { AgentMessage, Typing, Window } from "../premium";

function floatStyle(dur: number, delay: number, rot: number): CSSProperties {
  return {
    ["--ur-dur" as string]: `${dur}s`,
    ["--ur-delay" as string]: `${delay}s`,
    ["--ur-rot" as string]: `${rot}deg`,
  };
}

function Floating({
  children,
  className,
  dur,
  delay,
  rot,
  enter = 0,
}: {
  children: ReactNode;
  className?: string;
  dur: number;
  delay: number;
  rot: number;
  enter?: number;
}) {
  return (
    <div className={cn("absolute", className)}>
      <div className="ur-pop" style={{ ["--ur-delay" as string]: `${enter}ms` } as CSSProperties}>
        <div className="ur-float" style={floatStyle(dur, delay, rot)}>
          {children}
        </div>
      </div>
    </div>
  );
}

function QuoteCard({
  quote,
  meta,
  className,
}: {
  quote: string;
  meta: string;
  className?: string;
}) {
  return (
    <figure className={cn("ur-card w-[216px] p-4", className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-ur-uncovered/12 text-ur-uncovered">
          <IconQuote className="size-3.5" strokeWidth={2} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Owner complaint
        </span>
      </div>
      <blockquote className="font-display text-[14.5px] leading-snug text-foreground">
        “{quote}”
      </blockquote>
      <figcaption className="mt-3 text-[11.5px] text-muted-foreground">{meta}</figcaption>
    </figure>
  );
}

function StatusChip({ tone, children }: { tone: "uncovered" | "investigation" | "recalled"; children: ReactNode }) {
  const dot = {
    uncovered: "bg-ur-uncovered",
    investigation: "bg-ur-investigation",
    recalled: "bg-ur-recalled",
  }[tone];
  return (
    <span className="ur-chip shadow-[var(--ur-shadow)]">
      <span className={cn("size-2 rounded-full", dot)} />
      {children}
    </span>
  );
}

/** Agent thread that plays out (scanning → finding → drafting) and loops every ~8 s. */
export function AgentThreadDemo({ className }: { className?: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setStep(3);
      return;
    }
    let timers: number[] = [];
    const play = () => {
      setStep(0);
      timers = [
        window.setTimeout(() => setStep(1), 1400),
        window.setTimeout(() => setStep(2), 3000),
        window.setTimeout(() => setStep(3), 4600),
      ];
    };
    play();
    const loop = window.setInterval(play, 8000);
    return () => {
      window.clearInterval(loop);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <Window
      title="Unrecalled · Jeep Wrangler"
      className={cn("w-[258px]", className)}
      bodyClassName="min-h-[232px] space-y-4 p-4"
    >
      <AgentMessage time="now">
        <span>Scanning 4,948 owner complaints</span>
        {step < 1 ? <Typing className="ms-1.5" /> : <span>…</span>}
      </AgentMessage>
      {step >= 1 ? (
        <div className="ur-pop ps-11">
          <div className="rounded-xl border bg-background px-3 py-2.5">
            <div className="ur-num font-display text-[26px] font-semibold leading-none text-ur-uncovered">380</div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">complaints no recall covers</div>
          </div>
        </div>
      ) : null}
      {step >= 2 ? (
        <div className="ur-pop ps-11 text-[13.5px]">
          {step < 3 ? (
            <span className="text-muted-foreground">
              Drafting a petition <Typing className="ms-1" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-ur-sand px-2.5 py-1.5 font-medium">
              <IconFileText className="size-4 text-ur-blue" strokeWidth={1.8} />
              Drafted a petition for review
            </span>
          )}
        </div>
      ) : null}
    </Window>
  );
}

/** Left + right edge decorations. Parent must be `relative @container`. */
export function HeroFloats() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden select-none @min-[1040px]:block"
    >
      {/* Left edge: real owner complaints */}
      <Floating className="left-0 top-6" dur={7.5} delay={0} rot={-4} enter={300}>
        <QuoteCard
          quote="While driving above 50 mph, if you hit a bump the steering wheel shakes violently and it's hard to control the Jeep."
          meta="2022 Jeep Wrangler · filed 31 Oct 2026"
        />
      </Floating>
      <Floating className="left-4 top-[272px]" dur={8.5} delay={1.2} rot={3} enter={550}>
        <QuoteCard
          quote="Jeep death wobble, terribly! … now happens often and anytime the road has a bump."
          meta="2021 Jeep Wrangler · filed 8 Jun 2026"
          className="w-[204px]"
        />
      </Floating>
      <Floating className="left-10 top-[468px]" dur={6.5} delay={0.6} rot={-2} enter={800}>
        <StatusChip tone="uncovered">Uncovered</StatusChip>
      </Floating>

      {/* Right edge: the agent at work */}
      <Floating className="right-0 top-2" dur={8} delay={0.4} rot={2.5} enter={450}>
        <AgentThreadDemo />
      </Floating>
      <Floating className="right-20 top-[360px]" dur={6.8} delay={1.6} rot={-3} enter={900}>
        <StatusChip tone="investigation">Under investigation</StatusChip>
      </Floating>
      <Floating className="right-2 top-[424px]" dur={7.2} delay={0.9} rot={2} enter={1100}>
        <StatusChip tone="recalled">Recalled</StatusChip>
      </Floating>
    </div>
  );
}
