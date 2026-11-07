// "How it works" as a drive: on wide screens the section pins while the black
// car drives station to station along a road, one step per stop. On phones
// (and with reduced motion) the same five steps stack, each with its visual.
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Car, CAR_TIRE_R, CAR_VIEW } from "./Car";
import { useInView, useScrollFrame } from "./shared";
import { VISUALS } from "./visuals";

export const STEPS = [
  {
    station: "Report",
    title: "Owners report it.",
    body: "When a car keeps failing, owners file complaints with NHTSA, the US vehicle-safety regulator. Most of those problems never become a recall.",
  },
  {
    station: "Group",
    title: "We group them into problems.",
    body: "Unrecalled reads every complaint about a car and sorts them by what actually failed: the steering, the brakes, the engine.",
  },
  {
    station: "Check",
    title: "We check who’s already on it.",
    body: "Each problem is checked against every recall, every NHTSA investigation and every class-action settlement.",
  },
  {
    station: "Gap",
    title: "The gap lights up.",
    body: "Whatever nobody covers is left standing. On the 2021–23 Jeep Wrangler, that’s 380 complaints about the “death wobble”.",
  },
  {
    station: "Petition",
    title: "The agent drafts the petition.",
    body: "Any citizen can ask NHTSA to open an investigation. Unrecalled’s agent writes that petition for you, citing the complaints.",
  },
] as const;

const N = STEPS.length;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function Story() {
  return (
    <div id="how" className="scroll-mt-0">
      <StoryDrive />
      <StoryStack />
    </div>
  );
}

function StoryDrive() {
  const sectionRef = useRef<HTMLElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(0);

  useScrollFrame(sectionRef, (rect, view) => {
    const section = sectionRef.current;
    const road = roadRef.current;
    const car = carRef.current;
    if (!section || !road || !car || section.offsetParent === null) return;
    const total = rect.height - view.height;
    if (total <= 0) return;
    const p = clamp((view.top - rect.top) / total);
    const seg = p * N;
    const k = Math.min(N - 1, Math.floor(seg));
    const t = seg - k;
    const move = k < N - 1 ? ease(clamp((t - 0.45) / 0.5)) : 0;
    const at = k + move;
    const idx = move > 0.55 ? k + 1 : k;
    setActive((prev) => (prev === idx ? prev : idx));
    const snapped = Math.round(at * 4) / 4;
    setPos((prev) => (prev === snapped ? prev : snapped));

    const w = road.clientWidth;
    const cw = car.clientWidth;
    const x = (at / (N - 1)) * w - cw * 0.52;
    car.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    if (trailRef.current) trailRef.current.style.transform = `scaleX(${(at / (N - 1)).toFixed(4)})`;
    const r = (CAR_TIRE_R / CAR_VIEW.w) * cw;
    const deg = (x / (2 * Math.PI * r)) * 360;
    car.querySelectorAll<SVGGElement>("[data-wheel]").forEach((g) => {
      g.style.transform = `rotate(${deg.toFixed(1)}deg)`;
    });
  });

  return (
    <section ref={sectionRef} className="lp-drive" aria-label="How Unrecalled works">
      <div className="lp-drive__pin">
        <div className="lp-container grid h-full grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center gap-[clamp(32px,6vw,96px)] pb-[clamp(150px,22vh,210px)] pt-8">
          <div className="relative">
            <p className="lp-kicker">How it works</p>
            <div className="relative mt-5 min-h-[17rem]">
              {STEPS.map((s, i) => (
                <div
                  key={s.station}
                  className="lp-drive__text"
                  data-on={i === active || undefined}
                  data-before={i < active || undefined}
                  aria-hidden={i !== active}
                >
                  <div className="lp-stepnum ur-num">
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <span>/ {String(N).padStart(2, "0")}</span>
                  </div>
                  <h2 className="lp-h2 mt-4">{s.title}</h2>
                  <p className="lp-body mt-4 max-w-[30rem]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[min(470px,52vh)]">
            {VISUALS.map((V, i) => (
              <div
                key={i}
                className="lp-drive__vis"
                data-on={i === active || undefined}
                data-before={i < active || undefined}
                aria-hidden={i !== active}
              >
                <V on={i === active} />
              </div>
            ))}
          </div>
        </div>

        <div className="lp-road" aria-hidden="true">
          <div ref={roadRef} className="lp-road__inner">
            <div className="lp-road__line" />
            <div ref={trailRef} className="lp-road__trail" />
            {STEPS.map((s, i) => (
              <div
                key={s.station}
                className="lp-station"
                style={{ left: `${(i / (N - 1)) * 100}%` }}
                data-state={i < pos ? "past" : i === active ? "now" : "next"}
                data-gap={i === 3 || undefined}
              >
                <i />
                <span>
                  <em className="ur-num">{String(i + 1).padStart(2, "0")}</em> {s.station}
                </span>
              </div>
            ))}
            <div ref={carRef} className="lp-road__car">
              <Car reflection={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryStack() {
  return (
    <section className="lp-stack lp-section" aria-label="How Unrecalled works">
      <div className="lp-container">
        <p className="lp-kicker">How it works</p>
        <h2 className="lp-h2 mt-4 max-w-[18ch]">From a complaint to a petition, in five stops.</h2>
        <ol className="lp-stack__list mt-12">
          {STEPS.map((s, i) => (
            <StackStep key={s.station} i={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function StackStep({ i }: { i: number }) {
  const [ref, seen] = useInView<HTMLLIElement>("0px 0px -20% 0px");
  const s = STEPS[i]!;
  const V = VISUALS[i]!;
  return (
    <li ref={ref} className={cn("lp-stack__step lp-reveal", seen && "is-in")} data-gap={i === 3 || undefined}>
      <div className="lp-stepnum ur-num">
        <b>{String(i + 1).padStart(2, "0")}</b>
        <span>{s.station}</span>
      </div>
      <h3 className="lp-h3 mt-3">{s.title}</h3>
      <p className="lp-body mt-3">{s.body}</p>
      <div className="mt-6">
        <V on={seen} />
      </div>
    </li>
  );
}
