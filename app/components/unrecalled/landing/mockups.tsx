// Product mockups (window contents) for the landing sections. Every number here
// is a verified fact from the Unrecalled research; nothing is invented.
import {
  IconAlertTriangle,
  IconCheck,
  IconFileText,
  IconMinus,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { LpWindow, Msg, StatusDot, WinHead, WRANGLER_YEARS, YearTiles } from "./shared";

function Reply() {
  return (
    <div className="mx-4 mb-4 mt-auto flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-[13.5px] text-muted-foreground sm:mx-5">
      <span className="text-lg leading-none">+</span>
      Reply…
      <IconSend className="ms-auto size-4" stroke={1.8} />
    </div>
  );
}

function Shell({
  title,
  sub,
  children,
  className,
  reply = true,
}: {
  title: ReactNode;
  sub?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  reply?: boolean | undefined;
}) {
  return (
    <LpWindow className={className} innerClassName="flex min-h-[inherit] flex-col">
      <WinHead title={title} sub={sub} right={<IconX className="size-4" />} />
      <div className="flex-1 space-y-4 px-4 py-4 sm:px-5">{children}</div>
      {reply ? <Reply /> : null}
    </LpWindow>
  );
}

/* --------------------------------------------------------- 1. Uncovered */
export function UncoveredMock({ className }: { className?: string }) {
  return (
    <Shell title="Gap board" sub="Jeep Wrangler · 2018–2023" className={className}>
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-[1.2rem] leading-tight tracking-[-0.02em]">Death wobble</div>
            <div className="text-[12.5px] text-muted-foreground">Violent steering shake at highway speed</div>
          </div>
          <StatusDot tone="uncovered">
            <span className="text-[12px] font-semibold text-ur-uncovered">Uncovered</span>
          </StatusDot>
        </div>
        <div className="mt-4 flex items-end gap-3">
          <span className="font-display text-[3rem] leading-none tracking-[-0.04em] text-ur-uncovered">380</span>
          <span className="mb-1 text-[12.5px] leading-snug text-muted-foreground">
            owner complaints in model
            <br />
            years nothing covers
          </span>
        </div>
        <YearTiles years={WRANGLER_YEARS} className="mt-4 !grid-cols-3" />
        <p className="mt-3 text-[12px] text-muted-foreground">
          2018–2020 covered by the Reynolds v. FCA settlement.
        </p>
      </div>
      <p className="lp-quote text-[13.5px] leading-snug">
        “Jeep death wobble, terribly! Starting when going over 55mph, now happens often…”
        <span className="mt-1 block font-sans text-[11.5px] text-muted-foreground">
          ODI 11742715 · 2021 Wrangler · 8 Jun 2026
        </span>
      </p>
    </Shell>
  );
}

/* ---------------------------------------------- 2. Under investigation */
export function InvestigationMock({ className }: { className?: string }) {
  return (
    <Shell title="Coverage check" sub="Chevrolet Silverado 1500 · 6.2L V8" className={className}>
      <Msg name="Unrecalled" agent time="Mon 8:02 AM">
        Engine failures on the 6.2L V8 are{" "}
        <span className="font-semibold text-ur-investigation">already under investigation</span>, so
        I won’t ask NHTSA to open a second one.
      </Msg>
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[13px] font-semibold tracking-wide">EA26005</span>
          <span className="rounded-full bg-ur-investigation/12 px-2.5 py-0.5 text-[12px] font-semibold text-ur-investigation">
            Open investigation
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <div className="text-muted-foreground">Vehicles</div>
            <div className="font-display text-[1.6rem] leading-tight tracking-[-0.03em]">~1M trucks</div>
          </div>
          <div>
            <div className="text-muted-foreground">Problem</div>
            <div className="font-medium leading-snug">Engine failure after the recall repair</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <StatusDot tone="investigation">Marked “Under investigation” on the board</StatusDot>
      </div>
    </Shell>
  );
}

/* ------------------------------------------- 3. Complaints after recall */
export function AfterRecallMock({ className }: { className?: string }) {
  return (
    <Shell title="Complaints after a recall" sub="Chevrolet Silverado 1500 · 6.2L V8" className={className}>
      <Msg name="Unrecalled" agent time="9:12 AM">
        The recall repair did not end it. I found{" "}
        <span className="font-semibold">71 complaints</span> of engine failure filed{" "}
        <em>after</em> trucks got the fix.
      </Msg>
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-end gap-3">
          <span className="font-display text-[3rem] leading-none tracking-[-0.04em]">71</span>
          <span className="mb-1 text-[12.5px] leading-snug text-muted-foreground">
            complaints after the
            <br />
            recall repair
          </span>
        </div>
        <ol className="mt-4 grid grid-cols-3 gap-1.5 text-[11.5px]">
          <li className="lp-year" data-s="recalled">
            <b>Recall</b>
            <span>Issued</span>
          </li>
          <li className="lp-year" data-s="recalled">
            <b>Repair</b>
            <span>Done</span>
          </li>
          <li className="lp-year" data-s="uncovered">
            <b>Failure</b>
            <span>Again</span>
          </li>
        </ol>
      </div>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Found independently. NHTSA has since opened EA26005 into the same failures on ~1M trucks.
      </p>
    </Shell>
  );
}

/* --------------------------------------------------- 4. Early warning */
export function EarlyWarningMock({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Shell title="Early warning" sub="Jeep Wrangler · death wobble" className={className} reply={!compact}>
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between text-[12.5px] text-muted-foreground">
          <span>Complaint rate vs. similar cars</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-ur-uncovered">
            <IconAlertTriangle className="size-3.5" stroke={2.2} />
            Signal fired
          </span>
        </div>
        <svg viewBox="0 0 320 140" className="mt-3 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="lp-ew" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="hsl(var(--ur-uncovered))" stopOpacity="0.28" />
              <stop offset="1" stopColor="hsl(var(--ur-uncovered))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" x2="320" y1="96" y2="96" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.5" strokeDasharray="4 4" />
          <text x="4" y="90" fontSize="9" fill="hsl(var(--muted-foreground))">alert threshold</text>
          <path d="M0 124 L30 121 L60 123 L90 118 L120 116 L150 108 L180 92 L210 70 L240 48 L270 34 L300 22 L320 18 L320 140 L0 140Z" fill="url(#lp-ew)" />
          <path d="M0 124 L30 121 L60 123 L90 118 L120 116 L150 108 L180 92 L210 70 L240 48 L270 34 L300 22 L320 18" fill="none" stroke="hsl(var(--ur-uncovered))" strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="183" cy="90" r="5" fill="hsl(var(--card))" stroke="hsl(var(--ur-uncovered))" strokeWidth="2.4" />
          <line x1="183" x2="183" y1="84" y2="18" stroke="hsl(var(--ur-uncovered))" strokeOpacity="0.4" />
        </svg>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-display text-[2.4rem] leading-none tracking-[-0.04em] text-ur-uncovered">21×</span>
          <span className="mb-0.5 text-[12.5px] leading-snug text-muted-foreground">
            similar cars when the signal
            <br />
            fired in Nov 2018
          </span>
        </div>
      </div>
      {compact ? null : (
        <Msg name="Unrecalled" agent time="Backtest">
          The same signal would have flagged Hyundai/Kia Theta II engine failures{" "}
          <span className="font-semibold">30 months</span> before the 2017 recall.
        </Msg>
      )}
    </Shell>
  );
}

/* --------------------------------------------------------- 5. Petition */
export function PetitionMock({ className }: { className?: string }) {
  return (
    <LpWindow className={className} innerClassName="flex min-h-[inherit] flex-col" search="Petitions · Jeep Wrangler">
      <WinHead
        title={
          <span className="flex items-center gap-2">
            <IconFileText className="size-4 text-ur-blue" stroke={2} />
            Defect petition
          </span>
        }
        sub="Draft · ready for your review"
        right={
          <span className="rounded-lg bg-primary px-2.5 py-1 text-[12px] font-semibold text-primary-foreground">
            Review
          </span>
        }
      />
      <div className="flex-1 px-5 py-5 sm:px-7">
        <div className="text-[11.5px] uppercase tracking-[0.12em] text-muted-foreground">To: NHTSA, Office of Defects Investigation</div>
        <h4 className="mt-2 font-display text-[1.35rem] leading-snug tracking-[-0.02em]">
          Request to investigate steering shake at highway speed, 2021–2023 Jeep Wrangler
        </h4>
        <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-foreground/85">
          <p>
            Owners have filed <mark className="ur-mark">380 complaints</mark> describing violent
            steering shake in model years no recall, investigation or settlement covers.
          </p>
          <p>
            <mark className="ur-mark">248</mark> were filed after NHTSA closed its investigation in
            October 2023, and <mark className="ur-mark">80</mark> in the last 12 months.
          </p>
          <p className="lp-quote text-[13px]">
            “…the steering wheel shakes violently and it's hard to control the Jeep.” — ODI 11774893
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {["ODI 11774893", "ODI 11742715", "+378 more"].map((t) => (
            <span key={t} className="ur-chip h-6 text-[11.5px]">{t}</span>
          ))}
        </div>
      </div>
    </LpWindow>
  );
}

/* ----------------------------------------------------- 6. Weekly watch */
export function WatchMock({ className }: { className?: string }) {
  return (
    <Shell title="Weekly watch" sub="Every Monday · 1 car watched" className={className}>
      <Msg name="Unrecalled" agent time="Mon 7:00 AM">
        Weekly check on the <span className="font-semibold">2021–2023 Jeep Wrangler</span>: death
        wobble is still uncovered and still growing.
      </Msg>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border p-3.5">
          <div className="font-display text-[2rem] leading-none tracking-[-0.04em] text-ur-uncovered">80</div>
          <div className="mt-1 text-[12px] text-muted-foreground">complaints in the last 12 months</div>
        </div>
        <div className="rounded-xl border border-border p-3.5">
          <div className="font-display text-[1.35rem] leading-tight tracking-[-0.03em]">31 Oct 2026</div>
          <div className="mt-1 text-[12px] text-muted-foreground">latest complaint filed</div>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-ur-sand/70 px-3.5 py-2.5 text-[13px]">
        <span>Watch weekly</span>
        <span className="relative h-5 w-9 rounded-full bg-ur-blue">
          <span className="absolute right-0.5 top-0.5 size-4 rounded-full bg-white shadow" />
        </span>
      </div>
    </Shell>
  );
}

/* ------------------------------------------- How-it-works step windows */
export function ComplaintsMock({ className }: { className?: string }) {
  const rows = [
    {
      id: "11774893",
      car: "2022 Wrangler",
      date: "31 Oct 2026",
      text: "While driving above 50 mph, if you hit a bump the steering wheel shakes violently and it's hard to control the Jeep.",
    },
    {
      id: "11742715",
      car: "2021 Wrangler",
      date: "8 Jun 2026",
      text: "Jeep death wobble, terribly! Starting when going over 55mph, now happens often and anytime the road has a bump, uneven, or hole.",
    },
  ];
  return (
    <Shell title="Owner complaints" sub="NHTSA · Jeep Wrangler" className={className} reply={false}>
      {rows.map((r, i) => (
        <div key={r.id} className="lp-tick rounded-xl border border-border p-3.5" style={{ ["--lp-delay" as string]: `${i * 120}ms` }}>
          <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span className="font-mono">ODI {r.id}</span>
            <span>
              {r.car} · {r.date}
            </span>
          </div>
          <p className="mt-1.5 font-display text-[14.5px] leading-snug">“{r.text}”</p>
        </div>
      ))}
      <div className="lp-tick flex items-center gap-2 text-[12.5px] text-muted-foreground" style={{ ["--lp-delay" as string]: "260ms" }}>
        <span className="ur-typing"><i /><i /><i /></span>
        Grouping 380 similar reports into one problem
      </div>
    </Shell>
  );
}

export function CoverageMock({ className }: { className?: string }) {
  const rows: { k: string; v: string; s: "none" | "closed" | "partial" }[] = [
    { k: "Recalls", v: "None for this problem", s: "none" },
    { k: "NHTSA investigation", v: "Closed Oct 2023 · 248 complaints since", s: "closed" },
    { k: "Class settlement", v: "Reynolds v. FCA · 2018–2020 only", s: "partial" },
  ];
  return (
    <Shell title="Coverage check" sub="Jeep Wrangler · death wobble" className={className} reply={false}>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.k}
            className="lp-tick flex items-start gap-3 rounded-xl border border-border p-3.5"
            style={{ ["--lp-delay" as string]: `${i * 110}ms` }}
          >
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                r.s === "partial" ? "bg-ur-settlement/15 text-ur-settlement" : "bg-ur-closed/15 text-ur-closed",
              )}
            >
              {r.s === "partial" ? <IconCheck className="size-3.5" stroke={2.6} /> : <IconMinus className="size-3.5" stroke={2.6} />}
            </span>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold">{r.k}</div>
              <div className="text-[12.5px] text-muted-foreground">{r.v}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="lp-tick rounded-xl bg-ur-uncovered/10 p-3.5 text-[13.5px]" style={{ ["--lp-delay" as string]: "360ms" }}>
        <span className="font-semibold text-ur-uncovered">2021–2023 are uncovered.</span>{" "}
        <span className="text-foreground/80">380 owner complaints, no remedy.</span>
      </div>
    </Shell>
  );
}

export function BacktestMock({ className }: { className?: string }) {
  return (
    <Shell title="Backtest" sub="Hyundai / Kia Theta II engine" className={className} reply={false}>
      <div className="rounded-xl border border-border p-4">
        <svg viewBox="0 0 320 150" className="w-full" aria-hidden="true">
          <defs>
            <linearGradient id="lp-bt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="hsl(var(--ur-blue))" stopOpacity="0.25" />
              <stop offset="1" stopColor="hsl(var(--ur-blue))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 130 L40 128 L80 124 L110 116 L140 104 L170 92 L200 82 L230 66 L260 52 L290 40 L320 30 L320 150 L0 150Z" fill="url(#lp-bt)" />
          <path d="M0 130 L40 128 L80 124 L110 116 L140 104 L170 92 L200 82 L230 66 L260 52 L290 40 L320 30" fill="none" stroke="hsl(var(--ur-blue))" strokeWidth="2.4" strokeLinejoin="round" />
          <line x1="110" x2="110" y1="20" y2="140" stroke="hsl(var(--ur-uncovered))" strokeWidth="1.6" />
          <circle cx="110" cy="116" r="5" fill="hsl(var(--card))" stroke="hsl(var(--ur-uncovered))" strokeWidth="2.4" />
          <text x="106" y="30" fontSize="10" fontWeight="600" textAnchor="end" fill="hsl(var(--ur-uncovered))">Our signal</text>
          <line x1="280" x2="280" y1="20" y2="140" stroke="hsl(var(--foreground))" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="3 3" />
          <text x="276" y="30" fontSize="10" textAnchor="end" fill="hsl(var(--foreground))" fillOpacity="0.7">2017 recall</text>
          <path d="M112 60 L278 60" stroke="hsl(var(--foreground))" strokeOpacity="0.45" strokeWidth="1.2" />
          <rect x="166" y="51" width="58" height="18" rx="9" fill="hsl(var(--card))" />
          <text x="195" y="64" fontSize="10" fontWeight="600" textAnchor="middle" fill="hsl(var(--foreground))">30 months</text>
          <path d="M112 56 L112 64 M278 56 L278 64" stroke="hsl(var(--foreground))" strokeOpacity="0.45" strokeWidth="1.2" />
        </svg>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-display text-[2.6rem] leading-none tracking-[-0.04em] text-ur-blue">30</span>
          <span className="mb-0.5 text-[12.5px] leading-snug text-muted-foreground">
            months before the recall,
            <br />
            from complaints alone
          </span>
        </div>
      </div>
      <Msg name="Unrecalled" agent time="Backtest">
        I replayed real NHTSA owner complaints month by month. The signal crossed the line long
        before the recall came.
      </Msg>
    </Shell>
  );
}
