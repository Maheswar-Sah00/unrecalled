import { actionErrorMessage, useActionQuery } from "@agent-native/core/client/hooks";
import { IconArrowRight, IconArrowUpRight } from "@tabler/icons-react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";

import { PaperThumb, splitPetitionTitle, StatusPill } from "./docs/shared";
import { fmtRelative } from "./format";
import { Page, useCrumbs } from "./page";
import { PageHero, Reveal } from "./premium";
import type { PetitionSummary } from "./types";

export function PetitionList() {
  useCrumbs([{ label: "Petitions" }]);
  const { data, isLoading, error } = useActionQuery<
    { petitions: PetitionSummary[] } | PetitionSummary[]
  >("list-petitions", {});
  const petitions = Array.isArray(data) ? data : (data?.petitions ?? []);
  const readyCount = petitions.filter((p) => p.status === "ready").length;

  return (
    <Page>
      <PageHero
        title="Petitions"
        lede="Drafted requests asking NHTSA to open a defect investigation. You review and file them; the agent never files for you."
        actions={
          !isLoading && petitions.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="ur-chip">
                <span className="ur-num">{petitions.length}</span> drafted
              </span>
              {readyCount ? (
                <span className="ur-chip">
                  <span className="size-1.5 rounded-full bg-ur-recalled" aria-hidden="true" />
                  <span className="ur-num">{readyCount}</span> ready
                </span>
              ) : null}
            </div>
          ) : null
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="ur-card flex gap-4 p-5">
              <Skeleton className="h-[76px] w-[60px] rounded-md" />
              <div className="flex-1 space-y-2.5 pt-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
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
        <ul className="grid gap-4 md:grid-cols-2">
          {petitions.map((p, i) => {
            const { issue, vehicle } = splitPetitionTitle(p.title);
            return (
              <Reveal as="li" key={p.id} delay={Math.min(i, 8) * 50}>
                <Link
                  to={`/petitions/${encodeURIComponent(p.id)}`}
                  className="ur-card ur-lift group flex h-full gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-6"
                >
                  <PaperThumb className="mt-0.5 h-[76px] w-[60px] shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="ur-title line-clamp-2 text-[1.3rem]">{issue}</h2>
                      <IconArrowUpRight
                        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    {vehicle ? (
                      <p className="mt-1 text-[14.5px] text-muted-foreground">{vehicle}</p>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
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
    </Page>
  );
}

function EmptyState() {
  return (
    <Reveal className="ur-panel relative overflow-hidden px-6 py-16 text-center md:py-20">
      <div className="relative mx-auto mb-8 h-[120px] w-[150px]" aria-hidden="true">
        <PaperThumb
          lines={7}
          className="ur-float absolute left-2 top-3 h-[104px] w-[82px] [--ur-rot:-8deg] [--ur-dur:8s]"
        />
        <PaperThumb
          lines={7}
          className="ur-float absolute right-2 top-0 h-[110px] w-[86px] [--ur-delay:0.6s] [--ur-rot:6deg]"
        />
      </div>
      <h2 className="ur-title text-[1.75rem] md:text-[2rem]">No petitions yet</h2>
      <p className="ur-lede mx-auto mt-3 max-w-md text-[15.5px]">
        Open a problem that no recall covers and ask the agent to draft a
        petition. It shows up here for you to read, edit and file.
      </p>
      <Link to="/gaps" className="ur-btn mt-8">
        Find an uncovered problem <IconArrowRight className="size-4" />
      </Link>
    </Reveal>
  );
}
