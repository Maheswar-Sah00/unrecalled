import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import { IconLoader2, IconRadar } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

  return (
    <section className="rounded-lg border bg-card">
      <form
        onSubmit={submit}
        className="grid grid-cols-2 gap-3 p-4 md:grid-cols-[1fr_1fr_6rem_6rem_auto] md:items-end"
      >
        <Field id="scan-make" label="Make">
          <Input
            id="scan-make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Jeep"
            autoComplete="off"
            disabled={scan.isPending}
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
          />
        </Field>
        <Field id="scan-from" label="Year from">
          <Input
            id="scan-from"
            inputMode="numeric"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value.replace(/\D/g, "").slice(0, 4))}
            aria-invalid={!!yearError}
            className="ur-num"
            disabled={scan.isPending}
          />
        </Field>
        <Field id="scan-to" label="Year to">
          <Input
            id="scan-to"
            inputMode="numeric"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value.replace(/\D/g, "").slice(0, 4))}
            aria-invalid={!!yearError}
            aria-describedby={yearError ? "scan-year-error" : undefined}
            className="ur-num"
            disabled={scan.isPending}
          />
        </Field>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="col-span-2 md:col-span-1"
        >
          {scan.isPending ? (
            <IconLoader2 className="size-4 motion-safe:animate-spin" />
          ) : (
            <IconRadar className="size-4" />
          )}
          {scan.isPending ? "Scanning…" : "Scan for gaps"}
        </Button>
        {yearError && (yearFrom.length === 4 && yearTo.length === 4) ? (
          <p
            id="scan-year-error"
            className="col-span-2 text-xs text-destructive md:col-span-5"
          >
            {yearError}
          </p>
        ) : null}
      </form>
      {scan.isPending && scanning && startedAt ? (
        <ScanProgress vars={scanning} startedAt={startedAt} />
      ) : (
        <div className="flex flex-wrap items-center gap-1.5 border-t px-4 py-3">
          <span className="me-1 text-xs text-muted-foreground">Try</span>
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
                className="h-7 rounded-full border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {label}
              </button>
            );
          })}
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
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ScanProgress({
  vars,
  startedAt,
}: {
  vars: ScanVars;
  startedAt: number;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000));
  const years = vars.yearTo - vars.yearFrom + 1;
  return (
    <div className="border-t px-4 py-3" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">
          Pulling NHTSA complaints, recalls and investigations for{" "}
          <span className="font-medium">
            {vars.make} {vars.model}
          </span>{" "}
          · {years} model year{years === 1 ? "" : "s"}
        </span>
        <span className="ur-num shrink-0 text-xs text-muted-foreground">
          {secs}s
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "ur-indeterminate h-full w-2/5 rounded-full bg-ur-uncovered",
          )}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        First scans of a vehicle usually take 10–30 seconds.
      </p>
    </div>
  );
}
