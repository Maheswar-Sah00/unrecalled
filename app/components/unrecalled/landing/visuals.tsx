// The five story visuals. Each takes `on`: true while its step is showing, so
// CSS transitions play in (and reverse when the reader scrolls back).
import { IconCar, IconCheck, IconFileText, IconGavel, IconSearch } from "@tabler/icons-react";
import type { CSSProperties } from "react";

import { useCount } from "./shared";

const v = (o: Record<string, string | number>) => o as CSSProperties;

/* 1 · Owners report it ----------------------------------------------------- */
const REPORTS = [
  { car: "2022 Jeep Wrangler", text: "Steering wheel shook violently at 55 mph. I had to pull over.", part: "Steering" },
  { car: "2021 Jeep Wrangler", text: "Front end started wobbling after a bump on the highway.", part: "Suspension" },
  { car: "2023 Jeep Wrangler", text: "Dealer replaced the steering damper. The wobble came back.", part: "Steering" },
  { car: "2022 Jeep Wrangler", text: "It happened again at 60 mph, with my kids in the car.", part: "Steering" },
];

export function ReportsVisual({ on }: { on: boolean }) {
  return (
    <div className="lp-vis" data-on={on || undefined}>
      <ul className="space-y-2.5">
        {REPORTS.map((r, i) => (
          <li key={i} className="lp-rcard" style={v({ "--i": i })}>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="lp-rcard__dot" />
              <span className="font-medium text-foreground/80">Owner complaint to NHTSA</span>
              <span className="ms-auto">{r.part}</span>
            </div>
            <p className="mt-1.5 text-[15px] leading-snug text-foreground">“{r.text}”</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">{r.car}</p>
          </li>
        ))}
      </ul>
      <p className="lp-vis__note">Paraphrased examples. Unrecalled reads the real complaints.</p>
    </div>
  );
}

/* 2 · We group them into problems ---------------------------------------- */
const CLUSTERS = [
  { label: "Steering wobble", x: 30, y: 40, n: 26, hot: true },
  { label: "Brakes", x: 76, y: 20, n: 9 },
  { label: "Electrical", x: 78, y: 62, n: 8 },
  { label: "Engine", x: 46, y: 74, n: 6 },
];

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const DOTS = CLUSTERS.flatMap((c, ci) =>
  Array.from({ length: c.n }, (_, i) => {
    const r = (c.hot ? 3.1 : 3.3) * Math.sqrt(i + 0.6);
    const a = i * 2.39996 + ci;
    const k = ci * 40 + i;
    return {
      hot: !!c.hot,
      x0: 6 + rand(k + 1) * 88,
      y0: 6 + rand(k + 77) * 84,
      x1: c.x + r * Math.cos(a) * 0.8,
      y1: c.y + r * Math.sin(a),
      d: Math.round(rand(k + 13) * 380),
    };
  }),
);

export function GroupVisual({ on }: { on: boolean }) {
  return (
    <div className="lp-vis" data-on={on || undefined}>
      <div className="lp-cluster" aria-hidden="true">
        {DOTS.map((d, i) => (
          <i
            key={i}
            data-hot={d.hot || undefined}
            style={v({ "--x0": d.x0, "--y0": d.y0, "--x1": d.x1, "--y1": d.y1, "--d": `${d.d}ms` })}
          />
        ))}
        {CLUSTERS.map((c) => (
          <span
            key={c.label}
            className="lp-cluster__label"
            data-hot={c.hot || undefined}
            style={v({ left: `${c.x}%`, top: `calc(${c.y}% + ${c.hot ? 64 : 38}px)` })}
          >
            {c.label}
          </span>
        ))}
      </div>
      <p className="sr-only">Complaints sorted into problems: steering wobble, brakes, electrical, engine.</p>
    </div>
  );
}

/* 3 · We check every recall, investigation and settlement --------------- */
const CHECKS = [
  { icon: IconCar, label: "Recalls", result: "None cover it", tone: "none" },
  { icon: IconSearch, label: "NHTSA investigations", result: "PE19-012, closed Oct 2023", tone: "closed" },
  { icon: IconGavel, label: "Class-action settlements", result: "Covers 2018–20 only", tone: "partial" },
] as const;

export function CheckVisual({ on }: { on: boolean }) {
  return (
    <div className="lp-vis" data-on={on || undefined}>
      <div className="lp-panel">
        <div className="lp-panel__head">
          <div className="text-[12px] text-muted-foreground">Checking coverage</div>
          <div className="mt-0.5 text-[15px] font-semibold tracking-[-0.01em]">
            2021–23 Jeep Wrangler · steering wobble
          </div>
        </div>
        <ul>
          {CHECKS.map((c, i) => (
            <li key={c.label} className="lp-check" style={v({ "--i": i })}>
              <span className="lp-check__icon">
                <c.icon className="size-[17px]" stroke={1.7} />
              </span>
              <span className="text-[15px]">{c.label}</span>
              <span className="lp-check__state">
                <span className="lp-check__spin" aria-hidden="true" />
                <span className="lp-check__result" data-tone={c.tone}>
                  {c.result}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="lp-check__verdict">
          <span className="lp-gapdot" aria-hidden="true" />
          Nothing covers the 2021–23 models.
        </div>
      </div>
    </div>
  );
}

/* 4 · The gap ---------------------------------------------------------------- */
const YEARS = [
  { y: "2018", gap: false },
  { y: "2019", gap: false },
  { y: "2020", gap: false },
  { y: "2021", gap: true },
  { y: "2022", gap: true },
  { y: "2023", gap: true },
];

export function GapVisual({ on }: { on: boolean }) {
  const n = useCount(380, on, 1400);
  return (
    <div className="lp-vis" data-on={on || undefined}>
      <div className="lp-panel lp-gap">
        <div className="text-[12.5px] text-muted-foreground">2021–23 Jeep Wrangler · “death wobble”</div>
        <div className="mt-2 flex items-end gap-4">
          <span className="lp-gap__num ur-num">{n}</span>
          <span className="mb-3 text-[15px] leading-snug text-muted-foreground">
            complaints no recall,
            <br />
            investigation or settlement covers
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {YEARS.map((t, i) => (
            <div key={t.y} className="lp-yr" data-gap={t.gap || undefined} style={v({ "--i": i })}>
              <b className="ur-num">{t.y}</b>
              <span>{t.gap ? "Uncovered" : "Settlement"}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <div className="lp-gap__stat ur-num">248</div>
            <div className="text-[13px] leading-snug text-muted-foreground">filed after NHTSA closed its investigation (PE19-012)</div>
          </div>
          <div>
            <div className="lp-gap__stat ur-num">80</div>
            <div className="text-[13px] leading-snug text-muted-foreground">filed in the last 12 months</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5 · The agent drafts the petition --------------------------------------- */
const LINES = [92, 100, 84, 96, 60];

export function PetitionVisual({ on }: { on: boolean }) {
  return (
    <div className="lp-vis" data-on={on || undefined}>
      <div className="lp-doc">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <IconFileText className="size-4" stroke={1.7} />
          Petition for a defect investigation
        </div>
        <div className="lp-doc__title">Request to open an investigation</div>
        <div className="mt-1 text-[13px] text-muted-foreground">Under 49 CFR Part 552 · to NHTSA</div>
        <dl className="lp-doc__meta">
          <div className="lp-doc__row" style={v({ "--i": 0 })}>
            <dt>Vehicle</dt>
            <dd>2021–2023 Jeep Wrangler</dd>
          </div>
          <div className="lp-doc__row" style={v({ "--i": 1 })}>
            <dt>Defect</dt>
            <dd>Steering wobble at highway speed</dd>
          </div>
          <div className="lp-doc__row" style={v({ "--i": 2 })}>
            <dt>Evidence</dt>
            <dd>380 owner complaints, cited by number</dd>
          </div>
        </dl>
        <div className="mt-4 space-y-2">
          {LINES.map((w, i) => (
            <div key={i} className="lp-doc__line" style={v({ "--i": i, width: `${w}%` })} />
          ))}
        </div>
        <div className="lp-doc__stamp">
          <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
            <IconCheck className="size-3" stroke={3} />
          </span>
          Drafted by the agent · ready for your review
        </div>
      </div>
      <p className="lp-vis__note">
        Petitions work: NHTSA’s own wobble investigation, PE19-012, was opened from a citizen petition (DP18-004).
      </p>
    </div>
  );
}

export const VISUALS = [ReportsVisual, GroupVisual, CheckVisual, GapVisual, PetitionVisual];
