import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import {
  IconCar,
  IconChevronDown,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconEngine,
  IconHandStop,
  IconLayoutGrid,
  IconLoader2,
  IconPencil,
  IconRadar,
  IconShieldHalf,
  IconSteeringWheel,
  IconWindow,
  IconX,
} from "@tabler/icons-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { GradientTile, PillTabs, type Tone } from "./docs/shared";
import { Page, useCrumbs } from "./page";
import { BrandMark, Reveal } from "./premium";
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

type AreaId = "steering" | "brakes" | "engine" | "electrical" | "airbags" | "body" | "assist" | "other";

const AREAS: { id: AreaId; label: string; tone: Tone; icon: ReactNode; accent: string; test: RegExp }[] = [
  { id: "assist", label: "Driver assist", tone: "dusk", icon: <IconRadar />, accent: "#f2cc8b", test: /LANE|FORWARD COLLISION|PHANTOM|DRIVER.?ASSIST|ADAPTIVE CRUISE/ },
  { id: "airbags", label: "Airbags & belts", tone: "rose", icon: <IconShieldHalf />, accent: "#e0708f", test: /AIR ?BAG|SEAT ?BELT|SRS/ },
  { id: "body", label: "Body & glass", tone: "steel", icon: <IconWindow />, accent: "#a0968a", test: /WINDSHIELD|SUNROOF|LATCH|DOOR|WIPER|GLASS|ROOF/ },
  { id: "brakes", label: "Brakes", tone: "peach", icon: <IconHandStop />, accent: "#ff9152", test: /BRAKE|ROLLAWAY|PARK/ },
  { id: "steering", label: "Steering & suspension", tone: "meadow", icon: <IconSteeringWheel />, accent: "#d8b26f", test: /STEERING|SUSPENSION|WOBBLE|TIRE|WHEEL/ },
  { id: "electrical", label: "Electrical & screens", tone: "ocean", icon: <IconDeviceDesktop />, accent: "#d9a64f", test: /DISPLAY|CAMERA|HEADLIGHT|LIGHTING|INFOTAINMENT|BACK OVER|SCREEN/ },
  { id: "engine", label: "Engine & power", tone: "sand", icon: <IconEngine />, accent: "#e7a75a", test: /ENGINE|POWER TRAIN|FUEL|ACCELERAT|TRANSMISSION|STALL|FIRE|12V|ICCU|SPEED CONTROL|OIL/ },
];
const OTHER = { id: "other" as const, label: "Other", tone: "sage" as Tone, icon: <IconCar />, accent: "#8fae7e" };

/** Groups a problem type into a plain-language area from its id, name and NHTSA component hints. */
function areaOf(m: FailureMode) {
  const text = `${m.id} ${m.name} ${m.componentHints.join(" ")}`.toUpperCase().replace(/-/g, " ");
  return AREAS.find((a) => a.test.test(text)) ?? (/ELECTRICAL/.test(text) ? AREAS.find((a) => a.id === "electrical")! : OTHER);
}

/** "Death wobble (violent front-end shake)" -> ["Death wobble", "violent front-end shake"] */
function splitName(name: string): [string, string | null] {
  const m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? [m[1]!, m[2]!] : [name, null];
}

export function RulesEditor() {
  useCrumbs([{ label: "Problem types" }]);
  const [params, setParams] = useSearchParams();
  const { data, isLoading, error } = useActionQuery<{ modes: FailureMode[] }>("list-failure-modes", {});
  const modes = data?.modes ?? [];
  const selectedId = params.get("mode");
  const selected = modes.find((m) => m.id === selectedId) ?? null;
  const lastSelected = useRef<FailureMode | null>(null);
  if (selected) lastSelected.current = selected;
  const [area, setArea] = useState<AreaId | "all">("all");

  function select(id: string | null) {
    setParams(id ? { mode: id } : {}, { replace: true });
  }

  const withArea = modes.map((m) => ({ m, a: areaOf(m) }));
  const usedAreas = [...AREAS, OTHER].filter((a) => withArea.some((x) => x.a.id === a.id));
  const shown = area === "all" ? withArea : withArea.filter((x) => x.a.id === area);
  const sheetMode = selected ?? lastSelected.current;

  return (
    <Page wide className="max-w-[1240px]">
      {/* Hero */}
      <section className="relative pb-14 pt-6 text-center md:pb-16 md:pt-14">
        <div className="relative">
          <Reveal>
            <h1 className="ur-display ur-hero-xl">Problem types</h1>
          </Reveal>
          <Reveal delay={80}>
            <p className="ur-lede mx-auto mt-6 max-w-2xl text-[1.125rem] md:text-[1.25rem]">
              The kinds of defects the agent looks for in owner complaints, each with a plain name
              and the safety risk it creates. Edit one, then rescan a car to apply it.
            </p>
          </Reveal>
          {!isLoading && modes.length ? (
            <Reveal delay={140} className="mt-8">
              <div className="ur-trust">
                <span>
                  <b className="ur-num font-semibold">{modes.length}</b> problem types
                </span>
                <i aria-hidden="true" />
                <span>
                  <b className="ur-num font-semibold">{usedAreas.length}</b> areas of the car
                </span>
                <i aria-hidden="true" />
                <span>Changes apply on the next scan</span>
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="ur-mcard space-y-3">
              <Skeleton className="size-12 rounded-xl" />
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
        <div className="ur-panel flex flex-col items-center gap-3 p-12 text-center text-sm text-muted-foreground">
          <span className="ur-icon-tile" aria-hidden="true">
            <BrandMark className="size-6" />
          </span>
          No problem types defined yet.
        </div>
      ) : (
        <section aria-label="Problem types by area">
          <Reveal>
            <h2 className="ur-display ur-section-title">What the agent looks for</h2>
          </Reveal>
          <Reveal delay={60} className="mb-9 mt-7">
            <PillTabs<AreaId | "all">
              label="Areas of the car"
              value={area}
              onChange={setArea}
              tabs={[
                { id: "all", label: "All", icon: <IconLayoutGrid />, count: modes.length },
                ...usedAreas.map((a) => ({
                  id: a.id,
                  label: a.label,
                  icon: a.icon,
                  count: withArea.filter((x) => x.a.id === a.id).length,
                })),
              ]}
            />
          </Reveal>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(({ m, a }, i) => {
              const [title, sub] = splitName(m.name);
              return (
                <Reveal as="li" key={m.id} delay={Math.min(i, 12) * 35}>
                  <button
                    type="button"
                    onClick={() => select(m.id)}
                    className="ur-mcard group"
                    aria-haspopup="dialog"
                  >
                    <span className="ur-mcard__glow" style={{ background: a.accent }} aria-hidden="true" />
                    <span className="relative flex w-full items-start justify-between gap-3">
                      <GradientTile tone={a.tone} icon={a.icon} className="size-12 rounded-[14px]" />
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-medium text-muted-foreground transition-colors group-hover:bg-foreground/[0.06] group-hover:text-foreground">
                        <IconPencil className="size-3.5" aria-hidden="true" /> Edit
                      </span>
                    </span>
                    <span className="relative mt-5 block">
                      <span className="ur-title block text-[1.4rem]">{title}</span>
                      {sub ? <span className="mt-1 block text-[13.5px] text-muted-foreground">{sub}</span> : null}
                    </span>
                    <span className="relative mt-3 block text-[14.5px] leading-relaxed text-foreground/75">
                      {m.hazard}
                    </span>
                    <span className="relative mt-auto flex pt-5">
                      <span className="ur-chip h-7 text-[12px] text-muted-foreground">{a.label}</span>
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </ul>
        </section>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => (!o ? select(null) : undefined)}>
        <SheetContent
          side="right"
          showClose={false}
          className="w-full overflow-y-auto border-l p-0 sm:max-w-[600px]"
        >
          {sheetMode ? <ModeForm key={sheetMode.id} mode={sheetMode} onClose={() => select(null)} /> : null}
        </SheetContent>
      </Sheet>
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
  const area = areaOf(mode);
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
    <form ref={formRef} onSubmit={submit} className="flex min-h-full min-w-0 flex-col">
      <div className="relative overflow-hidden border-b bg-ur-sand/60 px-6 pb-7 pt-6 md:px-8">
        <span className="ur-mcard__glow" style={{ background: area.accent }} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <GradientTile tone={area.tone} icon={area.icon} className="mb-5 size-14 rounded-2xl" />
          <div className="text-[13px] font-medium text-muted-foreground">Editing · {area.label}</div>
          <SheetTitle className="ur-title mt-1 text-[1.9rem] leading-tight">{form.name || mode.name}</SheetTitle>
          <SheetDescription className="mt-2 text-[14px] leading-relaxed">
            Give it a plain name and say why it is dangerous. The agent uses this on the next scan.
          </SheetDescription>
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
      </div>

      <div className="flex-1 px-6 py-7 md:px-8">
      <div className="grid gap-5">
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
            rows={4}
            value={form.hazard}
            onChange={(e) => setForm({ ...form, hazard: e.target.value })}
            className="min-h-11 resize-none rounded-xl text-[15px] leading-relaxed"
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

      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-background/90 px-6 py-4 backdrop-blur md:px-8">
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
