import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import {
  IconArrowBackUp,
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconFileText,
  IconLoader2,
  IconPencil,
  IconSend,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  Perch,
  petitionFacts,
  plainChecklistLabel,
  ProgressRing,
  splitPetitionTitle,
  StatusPill,
  WindowTitle,
} from "./docs/shared";
import { fmtRelative } from "./format";
import { Markdown } from "./Markdown";
import { Page, useCrumbs } from "./page";
import { AgentMessage, BrandMark, Reveal, Window } from "./premium";
import type { Petition } from "./types";

export function isReady(status: string | null | undefined) {
  return status === "ready" || status === "filed";
}

export function statusLabel(status: string | null | undefined) {
  return status === "filed" ? "Filed" : status === "ready" ? "Ready to file" : "Draft";
}

const ACTION_BTN =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13.5px] sm:px-3.5 font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PetitionEditor({ id }: { id: string }) {
  const { data, isLoading, error } = useActionQuery<Petition>("get-petition", { id });
  const [text, setText] = useState<string | null>(null);
  const [pane, setPane] = useState<"preview" | "edit">("preview");
  const lastServer = useRef<{ id: string; markdown: string } | null>(null);

  // Adopt server text on first load, and on later server changes (e.g. the
  // agent edited the petition) as long as there are no local edits.
  useEffect(() => {
    if (!data) return;
    const prev = lastServer.current;
    if (!prev || prev.id !== data.id) {
      setText(data.markdown);
    } else if (prev.markdown !== data.markdown) {
      setText((cur) => (cur == null || cur === prev.markdown ? data.markdown : cur));
    }
    lastServer.current = { id: data.id, markdown: data.markdown };
  }, [data]);

  const markdown = text ?? data?.markdown ?? "";
  const dirty = data != null && text != null && text !== data.markdown;

  const save = useActionMutation<
    unknown,
    { id: string; markdown?: string; status?: string }
  >("update-petition", {
    onSuccess: (_r, vars) => {
      toast.success(vars.status ? (isReady(vars.status) ? "Marked ready to file" : "Moved back to draft") : "Saved");
    },
    onError: (e) => toast.error(actionErrorMessage(e) ?? "Could not save the petition."),
  });

  useCrumbs([
    { label: "Petitions", to: "/petitions" },
    { label: data ? splitPetitionTitle(data.title).issue : "…" },
  ]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !save.isPending) save.mutate({ id, markdown });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, id, markdown, save]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (error && !data) {
    return (
      <Page>
        <div className="ur-panel p-10 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load this petition."}{" "}
          <Link to="/petitions" className="font-medium text-foreground underline underline-offset-4">
            All petitions
          </Link>
        </div>
      </Page>
    );
  }
  if (isLoading || !data) return <EditorSkeleton />;

  const ready = isReady(data.status);
  const missing = data.checklist.filter((c) => !c.ok).length;
  const { issue, vehicle } = splitPetitionTitle(data.title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Markdown copied");
    } catch {
      toast.error("Clipboard not available in this browser.");
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (data?.title ?? "petition")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
    a.href = url;
    a.download = `${slug || "petition"}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const readyAction =
    data.status === "filed" ? null : ready ? (
      <button
        type="button"
        className="ur-btn-soft h-10 px-3.5 text-sm sm:px-4"
        disabled={save.isPending}
        onClick={() => save.mutate({ id, status: "draft" })}
      >
        <IconArrowBackUp className="size-4" /> Back to draft
      </button>
    ) : (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="ur-btn h-10 px-3.5 text-sm sm:px-4"
            disabled={save.isPending || missing > 0}
            title={missing > 0 ? `${missing} Part 552.4 item${missing === 1 ? "" : "s"} still missing` : undefined}
          >
            <IconSend className="size-4" /> Ready to file
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-ur-recalled/12 text-ur-recalled">
              <IconShieldCheck className="size-5" />
            </div>
            <AlertDialogTitle className="ur-title text-[1.5rem]">
              Mark this petition ready to file?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14.5px] leading-relaxed">
              All {data.checklist.length} Part 552.4 items are present.
              Marking it ready records that you reviewed it; filing with
              NHTSA is still up to you.
              {dirty ? " Unsaved edits are saved first." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() =>
                save.mutate({ id, status: "ready", ...(dirty ? { markdown } : {}) })
              }
            >
              Mark ready
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

  const facts = petitionFacts(markdown);
  const agentNote = (
    <AgentNote
      complaints={facts.complaints}
      uncovered={facts.uncovered}
      when={fmtRelative(data.updatedAt)}
      onCopy={copy}
      onDownload={download}
    />
  );

  return (
    <Page wide className="flex min-h-full max-w-[1320px] flex-col">
      {/* Header */}
      <Reveal>
        <header className="mb-4 md:mb-6">
          <Link
            to="/petitions"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft className="size-4" /> All petitions
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <StatusPill status={data.status} label={statusLabel(data.status)} />
            <span className="text-[13px] text-muted-foreground">
              {dirty ? (
                <span className="inline-flex items-center gap-1.5 text-ur-investigation">
                  <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                  Unsaved changes
                </span>
              ) : (
                `Saved ${fmtRelative(data.updatedAt)}`
              )}
            </span>
          </div>
          <h1 className="ur-display mt-4 max-w-5xl text-[2.4rem] leading-[1.02] md:text-[4.25rem]">{issue}</h1>
          {vehicle ? (
            <p className="ur-lede mt-4 text-[1.125rem] md:text-[1.25rem]">
              {vehicle}
              {facts.complaints ? (
                <>
                  {" "}· <span className="ur-num">{facts.complaints.toLocaleString("en-US")}</span> owner complaints
                </>
              ) : null}
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap items-center gap-1 sm:gap-1.5">
            <button type="button" className={ACTION_BTN} onClick={copy}>
              <IconCopy className="size-4" /> Copy
            </button>
            <button type="button" className={ACTION_BTN} onClick={download}>
              <IconDownload className="size-4" /> .md
            </button>
            <button
              type="button"
              className={ACTION_BTN}
              disabled={!dirty || save.isPending}
              onClick={() => save.mutate({ id, markdown })}
            >
              {save.isPending && !save.variables?.status ? (
                <IconLoader2 className="size-4 motion-safe:animate-spin" />
              ) : (
                <IconDeviceFloppy className="size-4" />
              )}
              Save
            </button>
            {readyAction ? <div className="ms-auto sm:ms-2">{readyAction}</div> : null}
          </div>
        </header>
      </Reveal>

      <div className="grid flex-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
        {/* Document inside a window, mascot perched on top */}
        <Reveal delay={80} className="order-2 min-w-0 lg:order-1">
          <Perch pose="write" color="blue" size={112}>
            <Window
              title={
                <WindowTitle icon={<IconFileText className="size-3.5 shrink-0" />}>
                  Petition draft · {vehicle ?? issue}
                </WindowTitle>
              }
              bodyClassName="p-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-3 py-2.5 sm:px-5">
                <div
                  role="tablist"
                  aria-label="Petition view"
                  className="inline-flex rounded-full bg-foreground/[0.06] p-1"
                >
                  <TabButton active={pane === "preview"} onClick={() => setPane("preview")}>
                    <IconFileText className="size-4" /> Document
                  </TabButton>
                  <TabButton active={pane === "edit"} onClick={() => setPane("edit")}>
                    <IconPencil className="size-4" /> Edit text
                  </TabButton>
                </div>
                <span className="hidden items-center gap-2 text-[12.5px] text-muted-foreground sm:inline-flex">
                  <BrandMark className="size-5" />
                  {pane === "edit" ? "Editing text" : "Prepared with Unrecalled · for your review"}
                </span>
              </div>
              <div className="ur-doc-desk px-2.5 py-5 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
                <article className="ur-paper mx-auto max-w-[780px]">
                  {pane === "edit" ? (
                    <div className="px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
                      <label htmlFor="petition-md" className="sr-only">Petition text</label>
                      <textarea
                        id="petition-md"
                        value={markdown}
                        onChange={(e) => setText(e.target.value)}
                        spellCheck
                        className="ur-paper-editor"
                      />
                      <p className="mt-4 border-t pt-4 text-[12.5px] text-muted-foreground">
                        Switch to Document to see it laid out. Press Ctrl+S (⌘S) to save.
                      </p>
                    </div>
                  ) : (
                    <div className="px-5 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                      <Markdown text={markdown} />
                    </div>
                  )}
                </article>
              </div>
            </Window>
          </Perch>
          <div className="mt-6 lg:hidden">{agentNote}</div>
        </Reveal>

        {/* Ready-to-file card + agent note */}
        <Reveal delay={140} className="order-1 space-y-5 lg:sticky lg:top-6 lg:order-2 lg:mt-[98px]">
          <Checklist items={data.checklist} />
          <div className="hidden lg:block">{agentNote}</div>
        </Reveal>
      </div>
    </Page>
  );
}

function AgentNote({
  complaints,
  uncovered,
  when,
  onCopy,
  onDownload,
}: {
  complaints: number | null;
  uncovered: number | null;
  when: string;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section className="ur-card p-5" aria-label="Note from the agent">
      <AgentMessage time={when}>
        <p className="mt-1 text-[14.5px] leading-relaxed">
          I drafted this from{" "}
          {complaints ? (
            <b className="ur-num">{complaints.toLocaleString("en-US")} owner complaints</b>
          ) : (
            "owner complaints"
          )}{" "}
          sent to NHTSA
          {uncovered ? (
            <>
              ; <b className="ur-num">{uncovered.toLocaleString("en-US")}</b> are for model years nothing covers yet
            </>
          ) : null}
          . Read it through and add anything I missed.
        </p>
        <p className="mt-2 text-[14.5px] leading-relaxed">
          You stay in charge; <b>I never file.</b>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="ur-chip h-8 cursor-pointer hover:border-foreground/30" onClick={onCopy}>
            <IconCopy className="size-3.5" /> Copy text
          </button>
          <button type="button" className="ur-chip h-8 cursor-pointer hover:border-foreground/30" onClick={onDownload}>
            <IconDownload className="size-3.5" /> Download
          </button>
          <Link to="/chat" className="ur-chip h-8 hover:border-foreground/30">
            Ask for changes
          </Link>
        </div>
      </AgentMessage>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-card text-foreground shadow-[0_1px_2px_#0000000f,0_4px_12px_-6px_#00000033]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Checklist({ items }: { items: Petition["checklist"] }) {
  const ok = items.filter((i) => i.ok).length;
  const left = items.length - ok;
  const [showList, setShowList] = useState(left > 0);
  return (
    <section className="ur-card p-5 md:p-6" aria-label="Ready to file checklist">
      <div className="flex items-center gap-4">
        <ProgressRing value={ok} total={items.length} />
        <div className="min-w-0">
          <h2 className="ur-title text-[1.45rem]">Ready to file?</h2>
          <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">
            {left === 0
              ? "Everything NHTSA asks for is in place."
              : `${left} thing${left === 1 ? "" : "s"} still missing before you can file.`}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowList((v) => !v)}
        aria-expanded={showList}
        className="mt-4 text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline lg:hidden"
      >
        {showList ? "Hide checklist" : `Show all ${items.length} checks`}
      </button>
      <ul className={cn("mt-4 space-y-0.5 border-t pt-4 lg:mt-5 lg:block", !showList && "hidden")}>
        {items.map((i) => (
          <li
            key={i.item}
            title={i.item}
            className={cn(
              "flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[14px]",
              !i.ok && "bg-ur-uncovered/[0.07]",
            )}
          >
            {i.ok ? (
              <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-ur-recalled/15 text-ur-recalled">
                <IconCheck className="size-3" stroke={3} aria-label="Present" />
              </span>
            ) : (
              <span
                className="mt-0.5 size-[18px] shrink-0 rounded-full border-[1.5px] border-dashed border-ur-uncovered"
                aria-label="Missing"
              />
            )}
            <span className={cn(i.ok ? "text-foreground/85" : "font-medium text-ur-uncovered")}>
              {plainChecklistLabel(i.item)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EditorSkeleton() {
  return (
    <Page wide>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-11 w-[28rem] max-w-full" />
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px]">
        <Skeleton className="h-[70vh] w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </Page>
  );
}
