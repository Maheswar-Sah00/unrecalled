import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { Page, useCrumbs } from "./page";
import type { FailureMode } from "./types";

type ListKey = "include" | "exclude" | "coverageTerms";

const FIELDS: { key: ListKey; label: string; hint: string }[] = [
  { key: "include", label: "Include patterns", hint: "A complaint matches if any pattern matches its narrative." },
  { key: "exclude", label: "Exclude patterns", hint: "Matched complaints are dropped if any of these match." },
  { key: "coverageTerms", label: "Coverage terms", hint: "Matched against recall, investigation and settlement text." },
];

function splitLines(s: string): string[] {
  return s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function regexErrors(s: string): { line: number; message: string }[] {
  const errs: { line: number; message: string }[] = [];
  s.split(/\r?\n/).forEach((raw, i) => {
    const l = raw.trim();
    if (!l) return;
    try {
      new RegExp(l, "i");
    } catch (e) {
      errs.push({ line: i + 1, message: e instanceof Error ? e.message.replace(/^Invalid regular expression: /, "") : "Invalid pattern" });
    }
  });
  return errs;
}

export function RulesEditor() {
  useCrumbs([{ label: "Rules" }]);
  const [params, setParams] = useSearchParams();
  const { data, isLoading, error } = useActionQuery<{ modes: FailureMode[] }>("list-failure-modes", {});
  const modes = data?.modes ?? [];
  const selectedId = params.get("mode") ?? modes[0]?.id ?? null;
  const selected = modes.find((m) => m.id === selectedId) ?? null;

  return (
    <Page wide>
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="space-y-1.5">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : error ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load failure modes."}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label="Failure modes" className="md:sticky md:top-4 md:self-start">
            <label htmlFor="mode-select" className="sr-only">Failure mode</label>
            <select
              id="mode-select"
              className="h-9 w-full rounded-md border bg-background px-2 text-sm md:hidden"
              value={selectedId ?? ""}
              onChange={(e) => setParams({ mode: e.target.value }, { replace: true })}
            >
              {modes.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ul className="hidden max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto md:block">
              {modes.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setParams({ mode: m.id }, { replace: true })}
                    aria-current={m.id === selectedId ? "true" : undefined}
                    className={cn(
                      "w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      m.id === selectedId && "bg-accent font-medium",
                    )}
                  >
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {selected ? <ModeForm key={selected.id} mode={selected} /> : (
            <p className="text-sm text-muted-foreground">No failure modes defined.</p>
          )}
        </div>
      )}
    </Page>
  );
}

function ModeForm({ mode }: { mode: FailureMode }) {
  const initial = useMemo(
    () => ({
      name: mode.name,
      hazard: mode.hazard,
      include: mode.include.join("\n"),
      exclude: mode.exclude.join("\n"),
      coverageTerms: mode.coverageTerms.join("\n"),
    }),
    [mode],
  );
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial]);

  const errors = {
    include: regexErrors(form.include),
    exclude: regexErrors(form.exclude),
    coverageTerms: regexErrors(form.coverageTerms),
  };
  const hasErrors = Object.values(errors).some((e) => e.length > 0);
  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some((k) => form[k] !== initial[k]);
  const emptyInclude = splitLines(form.include).length === 0;

  const save = useActionMutation<unknown, { id: string; patch: Partial<FailureMode> }>(
    "update-failure-mode",
    {
      onSuccess: () => toast.success("Rules saved. Rescan a vehicle to apply them."),
      onError: (e) => toast.error(actionErrorMessage(e) ?? "Could not save these rules."),
    },
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hasErrors || emptyInclude || !dirty) return;
    save.mutate({
      id: mode.id,
      patch: {
        name: form.name.trim(),
        hazard: form.hazard.trim(),
        include: splitLines(form.include),
        exclude: splitLines(form.exclude),
        coverageTerms: splitLines(form.coverageTerms),
      },
    });
  }

  return (
    <form onSubmit={submit} className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="mode-name" className="text-xs text-muted-foreground">Name</Label>
          <Input id="mode-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <code className="pb-2 font-mono text-xs text-muted-foreground">{mode.id}</code>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mode-hazard" className="text-xs text-muted-foreground">Safety hazard</Label>
        <Input id="mode-hazard" value={form.hazard} onChange={(e) => setForm({ ...form, hazard: e.target.value })} />
      </div>
      {mode.componentHints.length ? (
        <p className="text-xs text-muted-foreground">
          Component hints:{" "}
          {mode.componentHints.map((h) => (
            <code key={h} className="me-1 rounded bg-muted px-1 font-mono">{h}</code>
          ))}
        </p>
      ) : null}
      {FIELDS.map((f) => {
        const errs = errors[f.key];
        const id = `mode-${f.key}`;
        const count = splitLines(form[f.key]).length;
        return (
          <div key={f.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={id} className="text-xs text-muted-foreground">
                {f.label} <span className="ur-num">({count})</span>
              </Label>
              <span className="hidden text-[11px] text-muted-foreground sm:inline">{f.hint}</span>
            </div>
            <textarea
              id={id}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              rows={Math.min(12, Math.max(3, count + 1))}
              spellCheck={false}
              aria-invalid={errs.length > 0 || (f.key === "include" && emptyInclude)}
              aria-describedby={errs.length ? `${id}-err` : undefined}
              className={cn(
                "w-full rounded-md border bg-card px-3 py-2 font-mono text-[12.5px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring",
                errs.length > 0 && "border-destructive focus-visible:ring-destructive",
              )}
            />
            {errs.length ? (
              <ul id={`${id}-err`} className="space-y-0.5 text-xs text-destructive">
                {errs.map((e) => (
                  <li key={e.line}>Line {e.line}: {e.message}</li>
                ))}
              </ul>
            ) : f.key === "include" && emptyInclude ? (
              <p className="text-xs text-destructive">Add at least one include pattern.</p>
            ) : null}
          </div>
        );
      })}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!dirty || hasErrors || emptyInclude || save.isPending}>
          {save.isPending ? <IconLoader2 className="size-4 motion-safe:animate-spin" /> : <IconDeviceFloppy className="size-4" />}
          Save rules
        </Button>
        {dirty ? (
          <Button type="button" variant="ghost" onClick={() => setForm(initial)}>
            Discard changes
          </Button>
        ) : null}
      </div>
    </form>
  );
}
