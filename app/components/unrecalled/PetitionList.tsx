import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCircleCheck,
  IconFileText,
  IconLayoutGrid,
  IconPencil,
  IconScale,
  IconSend,
  IconShieldHalf,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";

import {
  docStatus,
  type DocStatus,
  GradientTile,
  PaperSheet,
  Perch,
  PillTabs,
  splitPetitionTitle,
  StatusPill,
  type Tone,
  WindowTitle,
} from "./docs/shared";
import { fmtRelative } from "./format";
import { Page, useCrumbs } from "./page";
import { AgentMessage, BrandMark, Reveal, Window } from "./premium";
import type { PetitionSummary } from "./types";

type Filter = "all" | DocStatus;

const STAGE_TONE: Record<DocStatus, Tone> = { draft: "sand", ready: "sage", filed: "ocean" };

export function PetitionList() {
  useCrumbs([{ label: "My petitions" }]);
  const { data, isLoading, error } = useActionQuery<
    { petitions: PetitionSummary[] } | PetitionSummary[]
  >("list-petitions", {});
  const petitions = Array.isArray(data) ? data : (data?.petitions ?? []);
  const [filter, setFilter] = useState<Filter>("all");

  const count = (s: DocStatus) => petitions.filter((p) => docStatus(p.status) === s).length;
  const shown = filter === "all" ? petitions : petitions.filter((p) => docStatus(p.status) === filter);
  const latest = petitions[0];

  return (
    <Page wide className="max-w-[1240px]">
      {/* Hero */}
      <section className="relative pb-14 pt-6 text-center md:pb-20 md:pt-14">
        <Reveal>
          <h1 className="ur-display ur-hero-xl">My petitions</h1>
        </Reveal>
        <Reveal delay={80}>
          <p className="ur-lede mx-auto mt-6 max-w-2xl text-[1.125rem] md:text-[1.25rem]">
            Formal requests asking NHTSA to investigate a defect. The agent drafts them; you
            read them, sign them and send them yourself.
          </p>
        </Reveal>
        <Reveal delay={140} className="mt-8">
          <div className="ur-trust">
            <span className="inline-flex items-center gap-2">
              <IconScale className="size-4 text-muted-foreground" aria-hidden="true" />
              A formal request under US law
            </span>
            <i aria-hidden="true" />
            <span className="inline-flex items-center gap-2">
              <IconShieldHalf className="size-4 text-muted-foreground" aria-hidden="true" />
              You send it, never the agent
            </span>
          </div>
        </Reveal>
        <Reveal delay={200} className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/#scan" className="ur-btn-soft">
            Scan another car
          </Link>
          {latest ? (
            <Link to={`/petitions/${encodeURIComponent(latest.id)}`} className="ur-btn">
              Open the latest <IconArrowRight className="size-4" />
            </Link>
          ) : null}
        </Reveal>
      </section>

      {/* Agent summary window */}
      {!isLoading && !error && petitions.length > 0 ? (
        <Reveal delay={260} className="mx-auto mb-24 max-w-[760px]">
          <Perch>
            <Window
              title={<WindowTitle icon={<IconFileText className="size-3.5" />}>Petitions desk</WindowTitle>}
              bodyClassName="p-5 md:p-7"
            >
              <AgentMessage time="just now" className="text-[15px]">
                <p className="mt-1 text-[15px] leading-relaxed">
                  I have drafted <b className="ur-num">{petitions.length}</b>{" "}
                  petition{petitions.length === 1 ? "" : "s"} from owner complaints.{" "}
                  {count("ready") ? (
                    <>
                      <b className="ur-num">{count("ready")}</b> {count("ready") === 1 ? "is" : "are"} ready for
                      you to send
                    </>
                  ) : (
                    "None are marked ready yet"
                  )}
                  {count("draft") ? (
                    <>
                      {" "}and <b className="ur-num">{count("draft")}</b> still need{count("draft") === 1 ? "s" : ""} your
                      review
                    </>
                  ) : null}
                  . Sending them is always your call.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {latest ? (
                    <Link
                      to={`/petitions/${encodeURIComponent(latest.id)}`}
                      className="ur-chip h-8 hover:border-foreground/30"
                    >
                      <IconFileText className="size-3.5" /> Read the latest
                    </Link>
                  ) : null}
                  <Link to="/chat" className="ur-chip h-8 hover:border-foreground/30">
                    Ask the agent
                  </Link>
                </div>
              </AgentMessage>
            </Window>
          </Perch>
        </Reveal>
      ) : null}

      {/* List */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ur-pcard">
              <Skeleton className="h-[184px] w-full rounded-none" />
              <div className="space-y-2.5 p-5">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="ur-panel p-10 text-center text-sm text-muted-foreground">
          {actionErrorMessage(error) ?? "Could not load petitions."}
        </div>
      ) : petitions.length === 0 ? (
        <EmptyState />
      ) : (
        <section aria-label="Your petitions">
          <Reveal>
            <h2 className="ur-display ur-section-title">Your petitions</h2>
          </Reveal>
          <Reveal delay={60} className="mb-8 mt-7">
            <PillTabs<Filter>
              label="Filter petitions"
              value={filter}
              onChange={setFilter}
              tabs={[
                { id: "all", label: "All", icon: <IconLayoutGrid />, count: petitions.length },
                { id: "draft", label: "Draft", icon: <IconPencil />, count: count("draft") },
                { id: "ready", label: "Ready", icon: <IconCircleCheck />, count: count("ready") },
                { id: "filed", label: "Filed", icon: <IconSend />, count: count("filed") },
              ]}
            />
          </Reveal>
          {shown.length === 0 ? (
            <div className="ur-panel flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="ur-icon-tile" aria-hidden="true">
                <BrandMark className="size-6" />
              </span>
              <p className="text-[15px] text-muted-foreground">
                {filter === "filed"
                  ? "Nothing marked as sent yet. Once you have mailed a petition, ask the agent to mark it as filed."
                  : filter === "ready"
                    ? "None are ready yet. Open a draft, read it through and mark it ready."
                    : "No drafts right now. Every petition here has been reviewed."}
              </p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((p, i) => {
                const { issue, vehicle } = splitPetitionTitle(p.title);
                const s = docStatus(p.status);
                return (
                  <Reveal as="li" key={p.id} delay={Math.min(i, 8) * 50}>
                    <Link to={`/petitions/${encodeURIComponent(p.id)}`} className="ur-pcard group">
                      <GradientTile tone={STAGE_TONE[s]} className="ur-pcard__stage">
                        <PaperSheet status={p.status} />
                      </GradientTile>
                      <div className="flex flex-1 flex-col p-5 md:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="ur-title line-clamp-2 text-[1.35rem]">{issue}</h3>
                          <IconArrowUpRight
                            className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                            aria-hidden="true"
                          />
                        </div>
                        {vehicle ? <p className="mt-1.5 text-[14.5px] text-muted-foreground">{vehicle}</p> : null}
                        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-5">
                          <StatusPill status={p.status} />
                          {p.updatedAt ? (
                            <span className="text-[13px] text-muted-foreground">
                              Updated {fmtRelative(p.updatedAt)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </Page>
  );
}

function EmptyState() {
  return (
    <Reveal className="relative mx-auto max-w-[760px]">
      <Perch>
        <Window title={<WindowTitle>Petitions desk</WindowTitle>} bodyClassName="px-6 py-14 text-center md:py-16">
          <div className="relative mx-auto mb-8 h-[120px] w-[170px]" aria-hidden="true">
            <div className="ur-float absolute left-0 top-2 [--ur-dur:8s] [--ur-rot:-8deg]">
              <PaperSheet className="origin-top-left scale-[0.72] rounded-[5px]" />
            </div>
            <div className="ur-float absolute right-0 top-0 [--ur-delay:0.6s] [--ur-rot:6deg]">
              <PaperSheet status="ready" className="origin-top-right scale-[0.72] rounded-[5px]" />
            </div>
          </div>
          <h2 className="ur-title text-[2rem] md:text-[2.4rem]">No petitions yet</h2>
          <p className="ur-lede mx-auto mt-3 max-w-md text-[15.5px]">
            Scan your car, open a problem nobody covers and press Draft petition. The agent
            writes it in about a minute, and it lands here for you to read, edit and send.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/#scan" className="ur-btn">
              Scan your car <IconArrowRight className="size-4" />
            </Link>
            <Link to="/chat" className="ur-btn-soft">
              Ask the agent
            </Link>
          </div>
        </Window>
      </Perch>
    </Reveal>
  );
}
