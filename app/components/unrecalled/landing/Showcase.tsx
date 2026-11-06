// "It finds what everyone else misses": OpenTag-style pill tabs, each with a
// mascot + serif title + text + tags on the left and a product window on the right.
import {
  IconAlertTriangle,
  IconBell,
  IconFileText,
  IconListSearch,
  IconRefreshAlert,
  IconZoomScan,
  type Icon,
} from "@tabler/icons-react";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Mascot, type MascotColor, type MascotPose } from "../mascots";
import {
  AfterRecallMock,
  EarlyWarningMock,
  InvestigationMock,
  PetitionMock,
  UncoveredMock,
  WatchMock,
} from "./mockups";
import { Rise, useInView } from "./shared";

interface Tab {
  id: string;
  label: string;
  icon: Icon;
  pose: MascotPose;
  color: MascotColor;
  title: string;
  body: string;
  tags: string[];
  mock: ReactNode;
}

const TABS: Tab[] = [
  {
    id: "uncovered",
    label: "Uncovered problems",
    icon: IconZoomScan,
    pose: "read",
    color: "blue",
    title: "Uncovered problems",
    body: "Problems owners keep reporting that no recall, investigation or class settlement covers, year by year, with the complaints to prove it.",
    tags: ["Owner complaints", "Recalls", "Settlements"],
    mock: <UncoveredMock className="min-h-[560px]" />,
  },
  {
    id: "investigation",
    label: "Under investigation",
    icon: IconListSearch,
    pose: "watch",
    color: "amber",
    title: "Under investigation",
    body: "When NHTSA is already looking into a problem, Unrecalled says so, so nobody files a second request for the same failure.",
    tags: ["ODI investigations", "EA26005"],
    mock: <InvestigationMock className="min-h-[560px]" />,
  },
  {
    id: "after-recall",
    label: "Complaints after a recall",
    icon: IconRefreshAlert,
    pose: "alert",
    color: "coral",
    title: "Complaints after a recall",
    body: "A recall is not the end. Unrecalled spots failures owners report after the recall repair, the sign a fix did not work.",
    tags: ["Recalls", "Owner complaints"],
    mock: <AfterRecallMock className="min-h-[560px]" />,
  },
  {
    id: "early",
    label: "Early warnings",
    icon: IconAlertTriangle,
    pose: "watch",
    color: "violet",
    title: "Early warnings",
    body: "Compares each car with similar cars and fires when complaints climb far above normal, often years before anyone acts.",
    tags: ["Similar cars", "Backtested"],
    mock: <EarlyWarningMock className="min-h-[560px]" />,
  },
  {
    id: "petitions",
    label: "Petitions",
    icon: IconFileText,
    pose: "write",
    color: "teal",
    title: "Petitions",
    body: "The agent drafts the formal request asking NHTSA to investigate, citing the real complaints. You review and send it.",
    tags: ["Defect petition", "Cited complaints"],
    mock: <PetitionMock className="min-h-[560px]" />,
  },
  {
    id: "watch",
    label: "Weekly watch",
    icon: IconBell,
    pose: "wave",
    color: "amber",
    title: "Weekly watch",
    body: "Watch any car and Unrecalled re-reads new complaints every week, telling you when a problem grows or finally gets covered.",
    tags: ["Every Monday", "Alerts"],
    mock: <WatchMock className="min-h-[560px]" />,
  },
];

const AUTO_MS = 7000;

export function Showcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPicked, setUserPicked] = useState(false);
  const [rootRef, seen] = useInView<HTMLElement>("0px 0px -30% 0px");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!seen || paused || userPicked) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % TABS.length), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [active, seen, paused, userPicked]);

  // Keep the active pill visible in the horizontally scrolling row.
  useEffect(() => {
    const el = tabRefs.current[active];
    const list = listRef.current;
    if (!el || !list) return;
    const left = el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  function select(i: number, focus = false) {
    setActive(i);
    setUserPicked(true);
    if (focus) tabRefs.current[i]?.focus();
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const n = TABS.length;
    if (e.key === "ArrowRight") select((active + 1) % n, true);
    else if (e.key === "ArrowLeft") select((active - 1 + n) % n, true);
    else if (e.key === "Home") select(0, true);
    else if (e.key === "End") select(n - 1, true);
    else return;
    e.preventDefault();
  }

  return (
    <section
      ref={rootRef}
      className="lp-section"
      aria-labelledby="lp-showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="lp-container">
        <Rise>
          <h2 id="lp-showcase" className="lp-h2 max-w-[13ch] md:max-w-[21ch]">
            It finds what everyone else misses
          </h2>
        </Rise>
      </div>

      <Rise delay={100} className="lp-container mt-10 md:mt-12">
        <div
          ref={listRef}
          role="tablist"
          aria-label="What Unrecalled finds"
          onKeyDown={onKey}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`lp-tab-${t.id}`}
              aria-selected={i === active}
              aria-controls={`lp-panel-${t.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(i)}
              className="lp-pill shrink-0"
            >
              <t.icon className="size-[18px]" stroke={1.8} />
              {t.label}
            </button>
          ))}
        </div>
      </Rise>

      <div className="lp-container mt-12 md:mt-16">
        <div className="grid">
          {TABS.map((t, i) => {
            const on = i === active;
            return (
              <div
                key={t.id}
                role="tabpanel"
                id={`lp-panel-${t.id}`}
                aria-labelledby={`lp-tab-${t.id}`}
                tabIndex={on ? 0 : -1}
                className={cn(
                  "grid items-center gap-10 [grid-area:1/1] focus-visible:outline-none md:grid-cols-[1fr_minmax(0,520px)] md:gap-16 lg:gap-24",
                  "transition-[opacity,visibility] duration-500 ease-out",
                  on ? "visible opacity-100" : "invisible opacity-0",
                )}
              >
                <div className={cn("transition-transform duration-700 ease-out", on ? "translate-y-0" : "translate-y-3")}>
                  <Mascot pose={t.pose} color={t.color} className="size-[104px]" />
                  <h3 className="lp-h3 mt-5">{t.title}</h3>
                  <p className="lp-body mt-5 max-w-[34rem]">{t.body}</p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {t.tags.map((tag) => (
                      <span key={tag} className="lp-tag">
                        <span className="size-1.5 rounded-full bg-ur-blue" aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* auto-advance progress */}
                  <div className="mt-9 hidden h-[3px] w-40 overflow-hidden rounded-full bg-foreground/[0.08] md:block" aria-hidden="true">
                    {on && seen && !userPicked ? (
                      <span
                        key={`${active}-${paused}`}
                        className="block h-full origin-left rounded-full bg-foreground/60"
                        style={{
                          animation: paused ? "none" : `lp-progress ${AUTO_MS}ms linear both`,
                          transform: paused ? "scaleX(0)" : undefined,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                <div
                  className={cn(
                    "w-full transition-[transform] duration-700 ease-out md:justify-self-end",
                    on ? "translate-y-0 scale-100" : "translate-y-4 scale-[0.985]",
                  )}
                >
                  {t.mock}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
