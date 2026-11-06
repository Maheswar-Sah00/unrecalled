import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import {
  IconCircleCheckFilled,
  IconCircleDashed,
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconLoader2,
  IconSend,
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { fmtRelative } from "./format";
import { Markdown } from "./Markdown";
import { Page, SectionHeading, useCrumbs } from "./page";
import type { Petition } from "./types";

export function isReady(status: string | null | undefined) {
  return status === "ready" || status === "filed";
}

export function statusLabel(status: string | null | undefined) {
  return status === "filed" ? "Filed" : status === "ready" ? "Ready to file" : "Draft";
}

export function PetitionEditor({ id }: { id: string }) {
  const { data, isLoading, error } = useActionQuery<Petition>("get-petition", { id });
  const [text, setText] = useState<string | null>(null);
  const [pane, setPane] = useState<"edit" | "preview">("edit");
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
    { label: data?.title ?? "…" },
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
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load this petition."}{" "}
          <Link to="/petitions" className="underline">All petitions</Link>
        </p>
      </Page>
    );
  }
  if (isLoading || !data) return <EditorSkeleton />;

  const ready = isReady(data.status);
  const missing = data.checklist.filter((c) => !c.ok).length;

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

  return (
    <Page wide className="flex min-h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium",
            ready ? "border-ur-recalled/40 bg-ur-recalled/12 text-ur-recalled" : "text-muted-foreground",
          )}
        >
          {statusLabel(data.status)}
        </span>
        <span className="text-xs text-muted-foreground">
          {dirty ? "Unsaved changes" : `Saved ${fmtRelative(data.updatedAt)}`}
        </span>
        <div className="ms-auto flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={copy}>
            <IconCopy className="size-4" /> Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={download}>
            <IconDownload className="size-4" /> .md
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate({ id, markdown })}
          >
            {save.isPending && !save.variables?.status ? (
              <IconLoader2 className="size-4 motion-safe:animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-4" />
            )}
            Save
          </Button>
          {data.status === "filed" ? null : ready ? (
            <Button
              size="sm"
              variant="outline"
              disabled={save.isPending}
              onClick={() => save.mutate({ id, status: "draft" })}
            >
              Back to draft
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={save.isPending || missing > 0}
                  title={missing > 0 ? `${missing} Part 552.4 item${missing === 1 ? "" : "s"} still missing` : undefined}
                >
                  <IconSend className="size-4" /> Ready to file
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark this petition ready to file?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All {data.checklist.length} Part 552.4 items are present.
                    Marking it ready records that you reviewed it; filing with
                    NHTSA is still up to you.
                    {dirty ? " Unsaved edits are saved first." : ""}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      save.mutate({ id, status: "ready", ...(dirty ? { markdown } : {}) })
                    }
                  >
                    Mark ready
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={pane}
        onValueChange={(v) => v && setPane(v as "edit" | "preview")}
        className="mb-3 lg:hidden"
        aria-label="Editor pane"
      >
        <ToggleGroupItem value="edit" className="px-3 text-xs">Markdown</ToggleGroupItem>
        <ToggleGroupItem value="preview" className="px-3 text-xs">Preview</ToggleGroupItem>
      </ToggleGroup>

      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <div className={cn("flex min-h-[60vh] flex-col", pane !== "edit" && "hidden lg:flex")}>
          <label htmlFor="petition-md" className="sr-only">Petition markdown</label>
          <textarea
            id="petition-md"
            value={markdown}
            onChange={(e) => setText(e.target.value)}
            spellCheck
            className="min-h-[60vh] flex-1 resize-none rounded-lg border bg-card p-4 font-mono text-[13px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className={cn("flex min-w-0 flex-col gap-4", pane !== "preview" && "hidden lg:flex")}>
          <Checklist items={data.checklist} />
          <div className="max-h-[75vh] overflow-y-auto rounded-lg border bg-card px-5 py-4 lg:px-8 lg:py-6">
            <Markdown text={markdown} />
          </div>
        </div>
      </div>
    </Page>
  );
}

function Checklist({ items }: { items: Petition["checklist"] }) {
  const ok = items.filter((i) => i.ok).length;
  return (
    <section className="rounded-lg border bg-card px-4 py-3">
      <SectionHeading className="mb-1">
        49 CFR 552.4 · <span className="ur-num">{ok}/{items.length}</span>
      </SectionHeading>
      <ul className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.item} className="flex items-start gap-1.5">
            {i.ok ? (
              <IconCircleCheckFilled className="mt-0.5 size-4 shrink-0 text-ur-recalled" aria-label="Present" />
            ) : (
              <IconCircleDashed className="mt-0.5 size-4 shrink-0 text-ur-uncovered" aria-label="Missing" />
            )}
            <span className={cn(!i.ok && "text-muted-foreground")}>{i.item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EditorSkeleton() {
  return (
    <Page wide>
      <div className="mb-3 flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="ms-auto h-8 w-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[60vh] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[48vh] w-full" />
        </div>
      </div>
    </Page>
  );
}
