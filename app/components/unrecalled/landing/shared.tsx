// Small building blocks shared by the homepage sections.
import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import { BrandMark } from "../premium";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** The element that actually scrolls the page (the app's <main>, not window). */
export function findScroller(el: Element | null): HTMLElement | null {
  let n = el?.parentElement ?? null;
  while (n) {
    const oy = getComputedStyle(n).overflowY;
    if (oy === "auto" || oy === "scroll") return n;
    n = n.parentElement;
  }
  return (document.scrollingElement as HTMLElement | null) ?? null;
}

/** Smooth-scrolls the page to an element id (and optionally focuses the scan form). */
export function scrollToId(id: string, focusScan = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = prefersReducedMotion();
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  if (focusScan) {
    window.setTimeout(
      () => (document.getElementById("scan-make") as HTMLInputElement | null)?.focus({ preventScroll: true }),
      reduce ? 0 : 650,
    );
  }
}

export function scrollToScan(focus = true) {
  scrollToId("scan", focus);
}

/**
 * Calls `onFrame` (at most once per animation frame) whenever the page
 * scrolls or resizes, with the element's rect and the visible viewport.
 */
export function useScrollFrame<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onFrame: (rect: DOMRect, view: { top: number; height: number }) => void,
) {
  const cb = useRef(onFrame);
  cb.current = onFrame;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scroller = findScroller(el);
    const target: HTMLElement | Window =
      scroller && scroller !== document.scrollingElement ? scroller : window;
    let raf = 0;
    const run = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const box =
        target === window
          ? { top: 0, height: window.innerHeight }
          : (() => {
              const b = (target as HTMLElement).getBoundingClientRect();
              return { top: b.top, height: (target as HTMLElement).clientHeight };
            })();
      cb.current(r, box);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    target.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);
}

/** True once the element has scrolled into view (once). */
export function useInView<T extends Element>(rootMargin = "0px 0px -15% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, rootMargin]);
  return [ref, seen] as const;
}

/** Fade-up on scroll into view. */
export function Rise({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  delay?: number | undefined;
  className?: string | undefined;
  as?: ElementType | undefined;
  style?: CSSProperties | undefined;
}) {
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={cn("lp-reveal", seen && "is-in", className)}
      style={{ ["--lp-delay" as string]: `${delay}ms`, ...style }}
    >
      {children}
    </Tag>
  );
}

/** Counts up to `value` each time `run` turns true (instant with reduced motion). */
export function useCount(value: number, run: boolean, duration = 1200) {
  const [n, setN] = useState(run ? value : 0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) {
      setN(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value, duration]);
  return n;
}

const AVATAR_TONES = ["#3f3f46", "#52525b", "#27272a", "#71717a"];

/** One chat message (used by the scan form's live progress). */
export function Msg({
  name,
  time,
  agent,
  initials,
  tone = 0,
  children,
  className,
  style,
}: {
  name: string;
  time?: string | undefined;
  agent?: boolean | undefined;
  initials?: string | undefined;
  tone?: number | undefined;
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}) {
  return (
    <div className={cn("lp-msg", className)} style={style}>
      {agent ? (
        <BrandMark className="size-[34px] shrink-0" />
      ) : (
        <span
          className="lp-avatar"
          style={{ background: AVATAR_TONES[tone % AVATAR_TONES.length] }}
          aria-hidden="true"
        >
          {initials ?? name.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="lp-msg__name">{name}</span>
          {agent ? <span className="ur-agent-badge">Agent</span> : null}
          {time ? <span className="lp-msg__time">{time}</span> : null}
        </div>
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}
