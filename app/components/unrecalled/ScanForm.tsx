import { callAction, useActionMutation } from "@agent-native/core/client/hooks";
import {
  IconAlertTriangle,
  IconArrowUp,
  IconCheck,
  IconCircleCheckFilled,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Msg } from "./landing/shared";
import { ModeSwitch, type ScanMode, VIN_LENGTH, cleanVin, prettyName, vinProblem } from "./VinScan";
import type { ScanVehicleResult } from "./types";

const QUICK_PICKS = [
  { make: "Jeep", model: "Wrangler", from: 2018, to: 2023 },
  { make: "Tesla", model: "Model 3", from: 2021, to: 2021 },
  { make: "Jeep", model: "Gladiator", from: 2020, to: 2023 },
  { make: "Hyundai", model: "Ioniq 5", from: 2022, to: 2024 },
];

const THIS_YEAR = new Date().getFullYear() + 1;

/** Event the landing page fires to run the Jeep Wrangler example scan. */
export const EXAMPLE_SCAN_EVENT = "ur:example-scan";
export function startExampleScan() {
  window.dispatchEvent(new CustomEvent(EXAMPLE_SCAN_EVENT));
}

interface ScanVars {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
}

/**
 * The real scan form, styled as the message composer of the landing page's
 * agent window. `thread` is the demo conversation rendered above it; while a
 * scan runs, the request and the agent's staged progress are appended there.
 */
export function ScanForm({ thread }: { thread?: ReactNode }) {
  const navigate = useNavigate();
  const [make, setMake] = useState("Jeep");
  const [model, setModel] = useState("Wrangler");
  const [yearFrom, setYearFrom] = useState("2018");
  const [yearTo, setYearTo] = useState("2023");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [scanning, setScanning] = useState<ScanVars | null>(null);
  const [failure, setFailure] = useState<{ title: string; body: string } | null>(null);
  const [mode, setMode] = useState<ScanMode>("model");
  const [vin, setVin] = useState("");
  const [vinTouched, setVinTouched] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decoded, setDecoded] = useState<string | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);

  const scan = useActionMutation<ScanVehicleResult, ScanVars>("scan-vehicle", {
    timeoutMs: 180_000,
    onSuccess: (res) => {
      toast.success(
        res.uncovered === 0
          ? `${res.label}: every problem owners report is covered`
          : `${res.label}: ${res.uncovered} ${res.uncovered === 1 ? "problem" : "problems"} nobody covers`,
      );
      navigate(`/gaps/${encodeURIComponent(res.id)}`);
    },
    onError: (error, vars) => {
      setFailure(friendlyScanError(error, vars));
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
        ? `Pick model years between 1990 and ${THIS_YEAR}`
        : from > to
          ? "The first year should come before the last"
          : to - from > 7
            ? "Scan at most 8 model years at a time"
            : null;
  const showYearError = !!yearError && yearFrom.length === 4 && yearTo.length === 4;
  const canSubmit =
    make.trim() && model.trim() && !yearError && !scan.isPending;

  function run(vars: ScanVars) {
    setFailure(null);
    setStartedAt(Date.now());
    setScanning(vars);
    scan.mutate(vars);
  }

  function pick(q: (typeof QUICK_PICKS)[number]) {
    if (scan.isPending || decoding) return;
    setMode("model");
    setMake(q.make);
    setModel(q.model);
    setYearFrom(String(q.from));
    setYearTo(String(q.to));
    run({ make: q.make, model: q.model, yearFrom: q.from, yearTo: q.to });
  }

  // "See a real example" on the hero runs the Jeep Wrangler quick pick.
  useEffect(() => {
    const onExample = () => pick(QUICK_PICKS[0]!);
    window.addEventListener(EXAMPLE_SCAN_EVENT, onExample);
    return () => window.removeEventListener(EXAMPLE_SCAN_EVENT, onExample);
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    run({ make: make.trim(), model: model.trim(), yearFrom: from, yearTo: to });
  }

  const vinIssue = vinProblem(vin);
  // Bad characters show at once; a short VIN only once they try to scan it.
  const showVinIssue = !!vinIssue && (vinTouched || !!vinProblem(vin.padEnd(VIN_LENGTH, "0")));
  const vinMessage = vinError ?? (showVinIssue ? vinIssue : null);

  /** VIN to make, model, year (NHTSA vPIC), then the same scan as make & model mode. */
  async function submitVin(e: React.FormEvent) {
    e.preventDefault();
    if (scan.isPending || decoding) return;
    setVinTouched(true);
    setVinError(null);
    setDecoded(null);
    if (vinIssue) return;
    setFailure(null);
    setDecoding(true);
    try {
      const car = await callAction<{ make: string; model: string; modelYear: number }>(
        "decode-vin",
        { vin },
        { method: "GET", timeoutMs: 20_000 },
      );
      const vars = {
        make: prettyName(car.make),
        model: prettyName(car.model),
        yearFrom: car.modelYear,
        yearTo: car.modelYear,
      };
      setDecoded(`${car.modelYear} ${vars.make} ${vars.model}`);
      run(vars);
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      setVinError(
        status === 401 || status === 403
          ? "Your session ended. Refresh the page and sign in again."
          : UNREADABLE_VIN,
      );
    } finally {
      setDecoding(false);
    }
  }

  function switchMode(m: ScanMode) {
    setMode(m);
    setVinError(null);
    setFailure(null);
  }

  const busy = scan.isPending;
  const years = (v: ScanVars) =>
    v.yearFrom === v.yearTo ? String(v.yearFrom) : `${v.yearFrom}–${v.yearTo}`;

  return (
    <div className="flex flex-col">
      <div className="space-y-5 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
        {thread}
        {busy && scanning && startedAt ? (
          <>
            <Msg name="You" initials="Y" tone={1} time="now" className="lp-swap">
              Scan the{" "}
              <span className="font-medium">
                {years(scanning)} {scanning.make} {scanning.model}
              </span>
            </Msg>
            <ScanProgress vars={scanning} startedAt={startedAt} />
          </>
        ) : null}
        {!busy && failure ? (
          <div
            role="alert"
            className="lp-swap flex items-start gap-3 rounded-2xl border border-ur-uncovered/25 bg-ur-uncovered/[0.06] px-4 py-3.5 text-left"
          >
            <IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-ur-uncovered" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-foreground">{failure.title}</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">{failure.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setFailure(null)}
              className="-me-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
              aria-label="Dismiss"
            >
              <IconX className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="px-3 pb-3 sm:px-5 sm:pb-5">
        <form
          onSubmit={mode === "vin" ? submitVin : submit}
          className="lp-composer"
          aria-label="Scan a car"
          noValidate
        >
          <div className="flex items-center gap-2 pe-2.5 ps-3.5 pt-2.5 text-[14px] text-muted-foreground sm:pe-3 sm:ps-4 sm:pt-3">
            <span className="lp-mention shrink-0 font-medium">@Unrecalled</span>
            <span className="min-w-0 flex-1 truncate">find the problems nobody is fixing on…</span>
            <ModeSwitch value={mode} onChange={switchMode} disabled={busy || decoding} />
          </div>
          {mode === "vin" ? (
            <VinRow
              vin={vin}
              onVin={(v) => {
                setVin(v);
                setVinError(null);
                setDecoded(null);
                setVinTouched(false);
              }}
              message={vinMessage}
              onModelMode={() => switchMode("model")}
              decoding={decoding}
              decoded={decoded}
              busy={busy}
            />
          ) : (
          <div className="grid grid-cols-2 gap-2 p-2.5 sm:p-3 md:grid-cols-[1fr_1fr_7.5rem_7.5rem_auto]">
            <Field id="scan-make" label="Make">
              <input
                id="scan-make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Jeep"
                autoComplete="off"
                disabled={busy}
              />
            </Field>
            <Field id="scan-model" label="Model">
              <input
                id="scan-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Wrangler"
                autoComplete="off"
                disabled={busy}
              />
            </Field>
            <Field id="scan-from" label="From" invalid={showYearError}>
              <input
                id="scan-from"
                inputMode="numeric"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value.replace(/\D/g, "").slice(0, 4))}
                aria-invalid={!!yearError}
                className="ur-num"
                disabled={busy}
              />
            </Field>
            <Field id="scan-to" label="To" invalid={showYearError}>
              <input
                id="scan-to"
                inputMode="numeric"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value.replace(/\D/g, "").slice(0, 4))}
                aria-invalid={!!yearError}
                aria-describedby={yearError ? "scan-year-error" : undefined}
                className="ur-num"
                disabled={busy}
              />
            </Field>
            <button
              type="submit"
              disabled={!canSubmit}
              className="lp-send col-span-2 md:col-span-1"
            >
              {busy ? (
                <IconLoader2 className="size-4 motion-safe:animate-spin" />
              ) : null}
              {busy ? "Scanning…" : "Scan"}
              {busy ? null : (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground/15">
                  <IconArrowUp className="size-3.5" strokeWidth={2.4} />
                </span>
              )}
            </button>
            {showYearError ? (
              <p
                id="scan-year-error"
                className="col-span-2 px-1 text-xs text-destructive md:col-span-5"
              >
                {yearError}
              </p>
            ) : null}
          </div>
          )}
          {mode === "vin" ? (
            <div className="flex items-start gap-2 border-t border-border/80 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground sm:px-4">
              <IconInfoCircle className="mt-[3px] size-3.5 shrink-0" aria-hidden="true" />
              <p id="scan-vin-help">
                On your registration, insurance card, or the windshield (driver’s side)
              </p>
            </div>
          ) : (
          <div className="flex items-center gap-2 border-t border-border/80 py-2.5 ps-3.5 sm:px-4">
            <span className="shrink-0 text-[12.5px] text-muted-foreground">Try</span>
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5 pe-3 [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)] [scrollbar-width:none] md:flex-wrap md:overflow-visible md:pe-0 md:[mask-image:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_PICKS.map((q) => {
                const label = `${q.make} ${q.model} ${q.from === q.to ? q.from : `${q.from}–${q.to}`}`;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={busy}
                    onClick={() => pick(q)}
                    className="ur-chip ur-num h-7 shrink-0 text-[12.5px] transition-[transform,border-color] duration-150 hover:-translate-y-px hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          )}
        </form>
      </div>
    </div>
  );
}

const UNREADABLE_VIN = "We couldn’t read that VIN. Check it, or scan by make and model.";

function VinRow({
  vin,
  onVin,
  message,
  onModelMode,
  decoding,
  decoded,
  busy,
}: {
  vin: string;
  onVin: (v: string) => void;
  message: string | null;
  onModelMode: () => void;
  decoding: boolean;
  decoded: string | null;
  busy: boolean;
}) {
  const ready = vin.length === VIN_LENGTH && !message;
  return (
    <div className="grid grid-cols-1 gap-2 p-2.5 sm:p-3 md:grid-cols-[1fr_auto]">
      <div className="lp-field" data-invalid={message ? "true" : undefined}>
        <label htmlFor="scan-vin">VIN</label>
        <input
          id="scan-vin"
          value={vin}
          onChange={(e) => onVin(cleanVin(e.target.value))}
          placeholder="17 characters"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={!!message}
          aria-describedby={message ? "scan-vin-error" : "scan-vin-help"}
          className="font-mono tracking-[0.06em] placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
          disabled={busy || decoding}
        />
        <span
          className={cn(
            "ur-num flex h-5 min-w-9 shrink-0 items-center justify-end text-[12px] tabular-nums",
            ready ? "text-ur-recalled" : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          {ready ? (
            <IconCheck className="ur-pop size-4" strokeWidth={2.6} aria-label="17 of 17 characters" />
          ) : (
            `${vin.length}/${VIN_LENGTH}`
          )}
        </span>
      </div>
      <button type="submit" disabled={busy || decoding || !vin} className="lp-send">
        {busy || decoding ? <IconLoader2 className="size-4 motion-safe:animate-spin" /> : null}
        {decoding ? "Reading VIN…" : busy ? "Scanning…" : "Scan"}
        {busy || decoding ? null : (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground/15">
            <IconArrowUp className="size-3.5" strokeWidth={2.4} />
          </span>
        )}
      </button>
      {message ? (
        <p id="scan-vin-error" role="alert" className="lp-swap px-1 text-xs text-destructive md:col-span-2">
          {message === UNREADABLE_VIN ? (
            <>
              We couldn’t read that VIN. Check it, or{" "}
              <button
                type="button"
                onClick={onModelMode}
                className="font-medium underline underline-offset-2 hover:text-foreground"
              >
                scan by make and model
              </button>
              .
            </>
          ) : (
            message
          )}
        </p>
      ) : decoded ? (
        <p
          role="status"
          className="lp-swap flex items-center gap-1.5 px-1 text-[13px] text-muted-foreground md:col-span-2"
        >
          <IconCircleCheckFilled className="size-4 shrink-0 text-ur-recalled" aria-hidden="true" />
          <span>
            Found your car: <span className="font-semibold text-foreground">{decoded}</span>
          </span>
        </p>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  invalid,
  children,
}: {
  id: string;
  label: string;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="lp-field" data-invalid={invalid ? "true" : undefined}>
      <label htmlFor={id}>{label}</label>
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
    <div role="status" aria-live="polite" className="lp-swap">
      <Msg name="Unrecalled" agent time={`${secs}s`}>
        <p>
          Looking into the{" "}
          <span className="font-medium text-foreground">
            {years} {vars.make} {vars.model}
          </span>
        </p>
        <div className="mt-2.5 max-w-md rounded-xl border border-border/80 bg-background/60 p-3.5">
          <ol className="space-y-2">
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
          <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
            <div
              className="h-full rounded-full bg-ur-blue transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Msg>
    </div>
  );
}

/** Turns a failed scan into a plain title + one helpful sentence. */
function friendlyScanError(error: unknown, vars: ScanVars): { title: string; body: string } {
  const e = (error ?? {}) as { status?: number; errorCode?: string; actionMessage?: string; message?: string };
  const car = `${vars.yearFrom === vars.yearTo ? vars.yearFrom : `${vars.yearFrom}–${vars.yearTo}`} ${vars.make} ${vars.model}`;
  if (e.errorCode === "no_complaints" || e.status === 404) {
    return {
      title: `We couldn’t find complaints for the ${car}`,
      body: "Check the spelling of the make and model as NHTSA writes them, for example “F-150”, “Model 3” or “CR-V”, or try other model years.",
    };
  }
  if (e.errorCode === "too_many_years") {
    return { title: "That’s a lot of model years", body: "Scan at most 8 model years at a time, then scan the rest separately." };
  }
  if (e.errorCode === "invalid_years" || e.errorCode === "invalid_vehicle" || e.status === 400) {
    return {
      title: "Something in the form needs a look",
      body: e.actionMessage ?? "Enter a make, a model and the model years you want to check.",
    };
  }
  if (e.status === 408) {
    return {
      title: "NHTSA is taking too long to answer",
      body: "Their servers are slow right now. Give it a minute and try again; fewer model years also helps.",
    };
  }
  if (e.status === 401 || e.status === 403) {
    return { title: "Please sign in again", body: "Your session ended. Refresh the page, sign in and run the scan again." };
  }
  return {
    title: "We couldn’t reach NHTSA just now",
    body: "Check your internet connection and try again in a moment. If it keeps happening, NHTSA’s servers may be down for a while.",
  };
}
