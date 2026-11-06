import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import {
  IconChevronDown,
  IconDeviceFloppy,
  IconLoader2,
  IconPencil,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import "../../styles/documents.css";
import { Page, useCrumbs } from "./page";
import { PageHero, Reveal } from "./premium";
import type { FailureMode } from "./types";

type ListKey = "include" | "exclude" | "coverageTerms";

const FIELDS: { key: ListKey; label: string; hint: string }[] = [
  {
    key: "include",
    label: "Words that mean this problem",
    hint: "A complaint counts if any line matches its story. One per line.",
  },
  {
    key: "exclude",
    label: "Words that rule a complaint out",
    hint: "A counted complaint is dropped if any of these match.",
  },
  {
    key: "coverageTerms",
    label: "Words that show a recall covers it",
    hint: "Checked against recall, investigation and settlement text.",
  },
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
  const selectedId = params.get("mode");

  function select(id: string | null) {
    setParams(id ? { mode: id } : {}, { replace: true });
  }

  return (
    <Page wide>
      <PageHero
        title="Problem types"
        lede="The kinds of defects the agent looks for in owner complaints. Each one has a plain name and the safety risk it creates. Edit them here, then rescan a vehicle to apply."
        actions={
          !isLoading && modes.length ? (
            <span className="ur-chip">
              <span className="ur-num">{modes.length}</span> problem types
            </span>
          ) : null
        }
      />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="ur-card space-y-3 p-6">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="ur-panel p-10 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load failure modes."}
        </div>
      ) : modes.length === 0 ? (
        <div className="ur-panel p-10 text-center text-sm text-muted-foreground">
          No problem types defined yet.
        </div>
      ) : (
        <ul className="grid grid-flow-row-dense gap-4 md:grid-cols-2">
          {modes.map((m, i) =>
            m.id === selectedId ? (
              <Reveal as="li" key={m.id} className="md:col-span-2">
                <ModeForm key={m.id} mode={m} onClose={() => select(null)} />
              </Reveal>
            ) : (
              <Reveal as="li" key={m.id} delay={Math.min(i, 10) * 40}>
                <button
                  type="button"
                  onClick={() => select(m.id)}
                  className="ur-card ur-lift group flex h-full w-full flex-col p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <h2 className="ur-title text-[1.3rem]">{m.name}</h2>
                    <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12.5px] font-medium text-muted-foreground/70 transition-colors group-hover:bg-foreground/[0.06] group-hover:text-foreground group-focus-visible:text-foreground">
                      <IconPencil className="size-3.5" aria-hidden="true" /> Edit
                    </span>
                  </div>
                  <p className="mt-2.5 border-l-2 border-foreground/10 ps-3 text-[14.5px] leading-relaxed text-muted-foreground transition-colors group-hover:border-ur-blue/50">
                    {m.hazard}
                  </p>
                </button>
              </Reveal>
            ),
          )}
        </ul>
      )}
    </Page>
  );
}

function ModeForm({ mode, onClose }: { mode: FailureMode; onClose: () => void }) {
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
  const [advanced, setAdvanced] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  const showAdvanced = advanced || hasErrors || emptyInclude;

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

  const phraseCount = FIELDS.reduce((n, f) => n + splitLines(form[f.key]).length, 0);

  return (
    <form ref={formRef} onSubmit={submit} className="ur-card scroll-mt-6 min-w-0 p-6 ring-2 ring-ur-blue/25 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-ur-blue">Editing problem type</div>
          <h2 className="ur-title mt-1 text-[1.6rem]">{form.name || mode.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close editor"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <IconX className="size-4" />
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-1.5">
          <Label htmlFor="mode-name" className="text-[13px]">Name</Label>
          <Input
            id="mode-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mode-hazard" className="text-[13px]">Why it is dangerous</Label>
          <Textarea
            id="mode-hazard"
            rows={2}
            value={form.hazard}
            onChange={(e) => setForm({ ...form, hazard: e.target.value })}
            className="min-h-11 resize-none rounded-xl"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-ur-sand/70 p-1">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-[14px] font-medium hover:bg-foreground/[0.04]"
        >
          <span>
            Advanced: matching words
            <span className="ms-2 font-normal text-muted-foreground">
              <span className="ur-num">{phraseCount}</span> lines
            </span>
          </span>
          <IconChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
        </button>
        {showAdvanced ? (
          <div className="space-y-5 px-4 pb-4 pt-2">
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              These are search patterns for experts. Most people only need the name and
              hazard above.
              {mode.componentHints.length ? (
                <>
                  {" "}NHTSA component areas:{" "}
                  {mode.componentHints.map((h) => (
                    <code key={h} className="me-1 rounded bg-card px-1.5 py-0.5 font-mono text-[11px]">{h}</code>
                  ))}
                  <span className="text-muted-foreground/70"> · id {mode.id}</span>
                </>
              ) : (
                <span className="text-muted-foreground/70"> id {mode.id}</span>
              )}
            </p>
            {FIELDS.map((f) => {
              const errs = errors[f.key];
              const id = `mode-${f.key}`;
              const count = splitLines(form[f.key]).length;
              return (
                <div key={f.key} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <Label htmlFor={id} className="text-[13px]">
                      {f.label} <span className="ur-num font-normal text-muted-foreground">({count})</span>
                    </Label>
                    <span className="text-[12px] text-muted-foreground">{f.hint}</span>
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
                      "w-full rounded-xl border bg-card px-3.5 py-2.5 font-mono text-[12px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                    <p className="text-xs text-destructive">Add at least one line here.</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="ur-btn h-10 px-5 text-sm"
          disabled={!dirty || hasErrors || emptyInclude || save.isPending}
        >
          {save.isPending ? <IconLoader2 className="size-4 motion-safe:animate-spin" /> : <IconDeviceFloppy className="size-4" />}
          Save rules
        </button>
        {dirty ? (
          <button type="button" className="ur-btn-soft h-10 px-4 text-sm" onClick={() => setForm(initial)}>
            Discard changes
          </button>
        ) : null}
        <span className="text-[12.5px] text-muted-foreground sm:ms-auto">
          Changes apply the next time a vehicle is scanned.
        </span>
      </div>
    </form>
  );
}
