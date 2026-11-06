// Hero: centred serif headline with the mascot set between words, badges, two
// CTAs, then the big agent window whose composer is the real scan form.
import { useActionQuery } from "@agent-native/core/client/hooks";
import {
  IconArrowRight,
  IconChartLine,
  IconDotsVertical,
  IconFileText,
  IconHome,
  IconListSearch,
  IconMessageCircle,
  IconPlus,
  IconRosetteDiscountCheck,
  IconEye,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";

import { Mascot } from "../mascots";
import { BrandMark, CountUp } from "../premium";
import { ScanForm, startExampleScan } from "../ScanForm";
import type { ListVehiclesResult } from "../types";
import { LpWindow, Msg, Rise, WinHead, WRANGLER_YEARS, YearTiles } from "./shared";

export function scrollToScan(focus = true) {
  const el = document.getElementById("scan");
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  if (focus) {
    window.setTimeout(
      () => (document.getElementById("scan-make") as HTMLInputElement | null)?.focus({ preventScroll: true }),
      reduce ? 0 : 450,
    );
  }
}

export function Hero() {
  const navigate = useNavigate();
  const { data } = useActionQuery<ListVehiclesResult>("list-vehicles", {});

  function seeExample() {
    const jeep = (data?.vehicles ?? []).find(
      (v) => /jeep/i.test(v.make) && /wrangler/i.test(v.model),
    );
    if (jeep) {
      navigate(`/gaps/${encodeURIComponent(jeep.id)}`);
      return;
    }
    scrollToScan(false);
    startExampleScan();
  }

  return (
    <section className="relative pt-[clamp(56px,9vw,120px)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_50%_45%_at_50%_38%,hsl(var(--ur-blue)/0.09),transparent_70%)] dark:bg-[radial-gradient(ellipse_50%_45%_at_50%_38%,hsl(var(--ur-blue)/0.16),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="lp-container relative flex flex-col items-center text-center">
        <Rise>
          <h1 className="lp-display mx-auto max-w-[15ch] sm:max-w-none">
            Find the
            <span className="relative mx-[0.1em] inline-block h-[0.9em] w-[1.25em] align-baseline">
              <Mascot
                pose="read"
                color="blue"
                className="ur-float absolute bottom-[-0.3em] left-1/2 size-[1.62em] -translate-x-1/2 [--ur-dur:6s]"
              />
            </span>
            car defects
            <br className="hidden sm:block" /> nobody is fixing.
          </h1>
        </Rise>
        <Rise delay={90}>
          <p className="lp-body mx-auto mt-6 max-w-[44rem] md:mt-7">
            Owners report problems to NHTSA every day. Unrecalled finds the ones no
            recall, investigation or settlement covers, and its agent drafts the
            formal petition asking NHTSA to investigate.
          </p>
        </Rise>
        <Rise delay={170} className="mt-8">
          <div className="lp-badges">
            <span className="inline-flex items-center gap-2">
              <IconRosetteDiscountCheck className="size-[18px] text-ur-blue" stroke={1.9} />
              Built on official NHTSA data
            </span>
            <span className="lp-badges__sep hidden sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-2">
              <IconChartLine className="size-[18px] text-ur-uncovered" stroke={1.9} />
              Backtested: <b className="font-semibold">30 months early</b>
            </span>
          </div>
        </Rise>
        <Rise delay={240} className="mt-9 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={seeExample} className="ur-btn-soft h-12 rounded-[13px] px-6 text-[16px]">
            See a real example
          </button>
          <button type="button" onClick={() => scrollToScan()} className="ur-btn h-12 rounded-[13px] px-6 text-[16px]">
            Scan a car
            <IconArrowRight className="size-4" stroke={2} />
          </button>
        </Rise>
      </div>

      {/* Product window */}
      <div className="lp-container relative mt-[clamp(88px,11vw,140px)]">
        <Rise delay={120} className="relative mx-auto max-w-[1100px]">
          <div className="lp-perch left-[5%] top-[-84px] sm:top-[-108px]" aria-hidden="true">
            <Mascot pose="write" color="coral" className="size-[96px] sm:size-[124px]" />
          </div>
          <div id="scan" className="scroll-mt-28">
            <LpWindow innerClassName="flex">
              <Rail />
              <div className="min-w-0 flex-1">
                <WinHead
                  title={
                    <span className="flex items-center gap-1.5">
                      <IconMessageCircle className="size-4 text-muted-foreground" stroke={2} />
                      Ask the agent
                    </span>
                  }
                  right={
                    <>
                      <span className="hidden items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-[12px] sm:inline-flex">
                        <span className="size-1.5 rounded-full bg-ur-recalled" />
                        NHTSA data synced
                      </span>
                      <IconDotsVertical className="size-4" />
                    </>
                  }
                />
                <ScanForm thread={<DemoThread />} />
              </div>
            </LpWindow>
          </div>
        </Rise>
      </div>
    </section>
  );
}

function Rail() {
  const items = [
    { icon: IconHome, label: "Gaps", on: true },
    { icon: IconFileText, label: "Petitions" },
    { icon: IconListSearch, label: "Types" },
    { icon: IconEye, label: "Watch" },
  ];
  return (
    <div className="lp-win__rail hidden w-[76px] shrink-0 flex-col items-center gap-4 py-4 md:flex" aria-hidden="true">
      <span className="flex size-10 items-center justify-center rounded-xl bg-white/95">
        <BrandMark className="size-7" />
      </span>
      {items.map((it) => (
        <span key={it.label} className="flex flex-col items-center gap-1 text-[11px] font-semibold">
          <span
            className={
              it.on
                ? "flex size-9 items-center justify-center rounded-lg bg-white/18"
                : "flex size-9 items-center justify-center rounded-lg opacity-75"
            }
          >
            <it.icon className="size-[18px]" stroke={1.9} />
          </span>
          <span className={it.on ? "" : "opacity-75"}>{it.label}</span>
        </span>
      ))}
      <span className="mt-auto flex size-9 items-center justify-center rounded-full bg-white/12">
        <IconPlus className="size-4" stroke={2} />
      </span>
    </div>
  );
}

function DemoThread() {
  return (
    <>
      <Msg name="Maya" initials="M" tone={0} time="9:41 AM">
        <span className="lp-mention">@Unrecalled</span> Which Jeep Wrangler problems is
        nobody fixing?
      </Msg>
      <div className="lp-replies ps-[45px]">1 reply</div>
      <Msg name="Unrecalled" agent time="9:41 AM">
        <p>
          One stands out:{" "}
          <span className="font-semibold">violent steering shake at highway speed</span>{" "}
          (the “death wobble”). Owners keep reporting it in model years nothing covers.
        </p>
        <div className="mt-3 rounded-xl border border-border bg-background/70 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13.5px] font-semibold">Death wobble · Jeep Wrangler</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ur-uncovered/12 px-2.5 py-0.5 text-[12px] font-semibold text-ur-uncovered">
              <span className="ur-live-dot !size-1.5" />
              Uncovered
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 border-b border-border/80 pb-3">
            <Stat value={380} label="complaints nothing covers" accent />
            <Stat value={248} label="after NHTSA closed its probe" />
            <Stat value={80} label="in the last 12 months" />
          </div>
          <YearTiles years={WRANGLER_YEARS} className="mt-3" />
          <p className="lp-quote mt-3 text-[13.5px] leading-snug">
            “While driving above 50 mph, if you hit a bump the steering wheel shakes
            violently and it's hard to control the Jeep.”
            <span className="mt-1 block font-sans text-[11.5px] text-muted-foreground">
              ODI 11774893 · 2022 Wrangler · 31 Oct 2026
            </span>
          </p>
        </div>
        <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px]">
          <IconFileText className="size-4 text-ur-blue" stroke={2} />
          Drafted a petition for review
          <IconArrowRight className="size-3.5 text-muted-foreground" stroke={2} />
        </div>
      </Msg>
    </>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <CountUp
        value={value}
        className={
          accent
            ? "font-display text-[1.75rem] leading-none tracking-tight text-ur-uncovered sm:text-[2rem]"
            : "font-display text-[1.75rem] leading-none tracking-tight sm:text-[2rem]"
        }
      />
      <div className="mt-1 text-[11.5px] leading-tight text-muted-foreground sm:text-[12px]">{label}</div>
    </div>
  );
}
