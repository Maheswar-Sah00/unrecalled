import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import { IconArrowRight, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { BrandMark } from "./premium";
import type { ScanVehicleResult } from "./types";

const QUICK_PICKS = [
  { make: "Jeep", model: "Wrangler", from: 2018, to: 2023 },
  { make: "Tesla", model: "Model 3", from: 2021, to: 2021 },
  { make: "Jeep", model: "Gladiator", from: 2020, to: 2023 },
  { make: "Hyundai", model: "Ioniq 5", from: 2022, to: 2024 },
];

const THIS_YEAR = new Date().getFullYear() + 1;

interface ScanVars {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
}

export function ScanForm() {
  const navigate = useNavigate();
  const [make, setMake] = useState("Jeep");
  const [model, setModel] = useState("Wrangler");
  const [yearFrom, setYearFrom] = useState("2018");
  const [yearTo, setYearTo] = useState("2023");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [scanning, setScanning] = useState<ScanVars | null>(null);

  const scan = useActionMutation<ScanVehicleResult, ScanVars>("scan-vehicle", {
    timeoutMs: 180_000,
    onSuccess: (res) => {
      for (const w of res.warnings ?? []) toast.warning(w);
      toast.success(
        `${res.label}: ${res.uncovered} uncovered of ${res.clusters} failure modes`,
      );
      navigate(`/gaps/${encodeURIComponent(res.id)}`);
    },
    onError: (error) => {
      toast.error(actionErrorMessage(error) ?? "Scan failed. Try again.");
    },
    onSettled: () => {
      setStartedAt(null);
      setScanning(null);
    },
  });

  const from = Number(yearFrom);
  const to = Number(yearTo);
  const yearError =
    !Number.isInteger(from) || !Number.isInteger(to)
      ? "Enter model years"
      : from < 1990 || to > THIS_YEAR
        ? `Years must be 1990–${THIS_YEAR}`
        : from > to
          ? "From must be before To"
          : to - from > 9
            ? "Scan at most 10 model years"
            : null;
  const canSubmit =
    make.trim() && model.trim() && !yearError && !scan.isPending;

  function run(vars: ScanVars) {
    setStartedAt(Date.now());
    setScanning(vars);
    scan.mutate(vars);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    run({ make: make.trim(), model: model.trim(), yearFrom: from, yearTo: to });
  }

  const inputClass =
    "h-11 rounded-xl border-border/80 bg-background px-3.5 text-[15px] shadow-none transition-colors focus-visible:border-ur-blue/60 focus-visible:ring-ur-blue/25";

  return (
    <section className="ur-card overflow-hidden">
      <form
        onSubmit={submit}
        className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-[1fr_1fr_5.5rem_5.5rem] md:p-5"
      >
        <Field id="scan-make" label="Make">
          <Input
            id="scan-make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Jeep"
            autoComplete="off"
            disabled={scan.isPending}
            className={inputClass}
          />
        </Field>
        <Field id="scan-model" label="Model">
          <Input
            id="scan-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Wrangler"
            autoComplete="off"
            disabled={scan.isPending}
            className={inputClass}
          />
        </Field>
        <Field id="scan-from" label="From year">
          <Input
            id="scan-from"
            inputMode="numeric"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value.replace(/\D/g, "").slice(0, 4))}
            aria-invalid={!!yearError}
            className={cn("ur-num", inputClass)}
            disabled={scan.isPending}
          />
        </Field>
        <Field id="scan-to" label="To year">
          <Input
            id="scan-to"
            inputMode="numeric"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value.replace(/\D/g, "").slice(0, 4))}
            aria-invalid={!!yearError}
            aria-describedby={yearError ? "scan-year-error" : undefined}
            className={cn("ur-num", inputClass)}
            disabled={scan.isPending}
          />
        </Field>
        {yearError && (yearFrom.length === 4 && yearTo.length === 4) ? (
          <p
            id="scan-year-error"
            className="col-span-2 text-xs text-destructive sm:col-span-4"
          >
            {yearError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="ur-btn col-span-2 mt-1 w-full sm:col-span-4"
        >
          {scan.isPending ? (
            <IconLoader2 className="size-4 motion-safe:animate-spin" />
          ) : null}
          {scan.isPending ? "Scanning…" : "Scan for gaps"}
          {scan.isPending ? null : <IconArrowRight className="size-4" strokeWidth={2} />}
        </button>
      </form>
      {scan.isPending && scanning && startedAt ? (
        <ScanProgress vars={scanning} startedAt={startedAt} />
      ) : (
        <div className="flex items-center gap-2 border-t border-border/70 bg-ur-sand/50 py-3.5 ps-4 sm:pe-4 md:px-5">
          <span className="shrink-0 text-[13px] text-muted-foreground sm:self-start sm:pt-1.5">Try</span>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5 pe-4 [mask-image:linear-gradient(to_right,#000_calc(100%-36px),transparent)] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pe-0 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_PICKS.map((q) => {
            const label = `${q.make} ${q.model} ${q.from === q.to ? q.from : `${q.from}–${q.to}`}`;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setMake(q.make);
                  setModel(q.model);
                  setYearFrom(String(q.from));
                  setYearTo(String(q.to));
                  run({ make: q.make, model: q.model, yearFrom: q.from, yearTo: q.to });
                }}
                className="ur-chip ur-num shrink-0 transition-[transform,background-color,border-color] duration-150 hover:-translate-y-px hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {label}
              </button>
            );
          })}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="ps-1 text-[12.5px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Seconds at which each step starts (the scan itself takes ~2–10 s). */
const STEPS = [
  { label: "Reading owner complaints", at: 0 },
  { label: "Checking recalls", at: 1.4 },
  { label: "Checking NHTSA investigations", at: 2.8 },
  { label: "Checking settlements", at: 4.2 },
  { label: "Grouping by problem", at: 5.6 },
];

function ScanProgress({
  vars,
  startedAt,
}: {
  vars: ScanVars;
  startedAt: number;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(t);
  }, []);
  const elapsed = Math.max(0, (now - startedAt) / 1000);
  const secs = Math.floor(elapsed);
  let active = 0;
  STEPS.forEach((s, i) => {
    if (elapsed >= s.at) active = i;
  });
  // Eases toward ~95% so the bar never claims to be done before it is.
  const pct = Math.min(95, 100 * (1 - Math.exp(-elapsed / 4)));
  const years =
    vars.yearFrom === vars.yearTo
      ? String(vars.yearFrom)
      : `${vars.yearFrom}–${vars.yearTo}`;

  return (
    <div
      className="border-t border-border/70 bg-ur-sand/50 px-4 py-4 md:px-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <BrandMark className="mt-0.5 size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold">Unrecalled</span>
            <span className="ur-agent-badge">Agent</span>
            <span className="ur-num ms-auto text-xs text-muted-foreground">
              {secs}s
            </span>
          </div>
          <p className="mt-0.5 text-[14px] text-foreground/85">
            Looking into the{" "}
            <span className="font-medium text-foreground">
              {years} {vars.make} {vars.model}
            </span>
          </p>

          <ol className="mt-3 space-y-2">
            {STEPS.map((s, i) => {
              const done = i < active;
              const current = i === active;
              return (
                <li
                  key={s.label}
                  className={cn(
                    "flex items-center gap-2.5 text-[14px] transition-opacity duration-300",
                    i > active && "opacity-40",
                  )}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    {done ? (
                      <span className="ur-pop flex size-5 items-center justify-center rounded-full bg-ur-recalled text-white">
                        <IconCheck className="size-3" strokeWidth={3} />
                      </span>
                    ) : current ? (
                      <span className="ur-live-dot" />
                    ) : (
                      <span className="size-2 rounded-full border border-muted-foreground/50" />
                    )}
                  </span>
                  <span
                    className={cn(
                      done && "text-muted-foreground",
                      current && "font-medium text-foreground",
                    )}
                  >
                    {s.label}
                    {current ? "…" : ""}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
            <div
              className="h-full rounded-full bg-ur-blue transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}