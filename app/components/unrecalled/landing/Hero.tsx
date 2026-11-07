// Hero: the problem in one line, the black car driving in, owner reports
// popping up above it, and the two calls to action. Scrolling drives the car
// off to the right, into the story.
import { IconArrowRight } from "@tabler/icons-react";
import { useRef } from "react";

import { Car, CAR_TIRE_R, CAR_VIEW } from "./Car";
import { prefersReducedMotion, scrollToId, scrollToScan, useScrollFrame } from "./shared";

const REPORTS = [
  { text: "Steering wheel shakes hard at 55 mph", x: "6%", y: "10%", d: 2300 },
  { text: "Whole front end wobbles after a bump", x: "37%", y: "-6%", d: 2700 },
  { text: "Dealer says there's no recall for it", x: "64%", y: "7%", d: 3100 },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const driveRef = useRef<HTMLDivElement>(null);

  // Scroll drives the car off to the right; wheels turn with the distance.
  useScrollFrame(sectionRef, (rect, view) => {
    const drive = driveRef.current;
    if (!drive || prefersReducedMotion()) return;
    const p = Math.min(1, Math.max(0, (view.top - rect.top) / (rect.height * 0.9)));
    const dx = Math.pow(p, 1.6) * window.innerWidth * 0.75;
    drive.style.transform = `translate3d(${dx.toFixed(1)}px,0,0)`;
    const w = drive.getBoundingClientRect().width;
    const r = (CAR_TIRE_R / CAR_VIEW.w) * w;
    const deg = (dx / (2 * Math.PI * r)) * 360;
    drive.querySelectorAll<SVGGElement>("[data-wheel-scroll]").forEach((g) => {
      g.style.transform = `rotate(${deg.toFixed(1)}deg)`;
    });
  });

  return (
    <section ref={sectionRef} className="lp-hero relative overflow-hidden" aria-labelledby="lp-hero-title">
      <div className="lp-hero__light" aria-hidden="true" />
      <div className="lp-container relative z-[2] flex flex-col items-center pt-[clamp(40px,6.5vh,72px)] text-center">
        <p className="lp-eyebrow lp-in" style={{ ["--lp-delay" as string]: "0ms" }}>
          <span className="lp-eyebrow__dot" aria-hidden="true" />
          Built on official NHTSA complaint data
        </p>
        <h1 id="lp-hero-title" className="lp-display lp-in mt-5" style={{ ["--lp-delay" as string]: "80ms" }}>
          Owners report it.
          <br />
          <span className="lp-display__soft">Nobody fixes it.</span>
        </h1>
        <p className="lp-body lp-in mx-auto mt-5 max-w-[40rem]" style={{ ["--lp-delay" as string]: "160ms" }}>
          Most problems drivers report to NHTSA never become a recall. Unrecalled finds the ones nobody
          covers, and its agent drafts the petition that asks NHTSA to investigate.
        </p>
        <div className="lp-in mt-7 flex flex-wrap justify-center gap-3" style={{ ["--lp-delay" as string]: "240ms" }}>
          <button type="button" onClick={() => scrollToScan()} className="ur-btn lp-cta">
            Scan a car
            <IconArrowRight className="size-4" stroke={2} />
          </button>
          <button type="button" onClick={() => scrollToId("how")} className="ur-btn-soft lp-cta">
            See how it works
          </button>
        </div>
      </div>

      <div className="lp-hero__stage relative z-[1] mx-auto">
        <div className="relative">
          {REPORTS.map((r) => (
            <div
              key={r.text}
              className="lp-report-pop"
              style={{ left: r.x, top: r.y, ["--lp-delay" as string]: `${r.d}ms` }}
              aria-hidden="true"
            >
              <span className="lp-report-pop__dot" />
              <span className="lp-report-pop__label">Owner report</span>
              {r.text}
            </div>
          ))}
          <div ref={driveRef} className="lp-hero__drive will-change-transform">
            <div className="lp-hero__car">
              <Car sheen />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollToId("how")}
        className="lp-scrollcue"
        aria-label="Scroll to how it works"
      >
        <IconArrowRight className="size-4 rotate-90" stroke={1.8} />
      </button>
    </section>
  );
}
