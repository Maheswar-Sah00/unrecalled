// Small building blocks shared by the /gaps landing sections.
import {
  IconArrowLeft,
  IconArrowRight,
  IconSearch,
} from "@tabler/icons-react";
import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import { BrandMark } from "../premium";

/** Calls back with true once the element scrolls into view (once). */
export function useInView<T extends Element>(rootMargin = "0px 0px -12% 0px") {
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

/** App window in our navy chrome: traffic lights, nav arrows, search. */
export function LpWindow({
  children,
  className,
  innerClassName,
  search = "Search Unrecalled",
  style,
}: {
  children: ReactNode;
  className?: string | undefined;
  innerClassName?: string | undefined;
  search?: string | undefined;
  style?: CSSProperties | undefined;
}) {
  return (
    <div className={cn("lp-win", className)} style={style}>
      <div className="lp-win__bar" aria-hidden="true">
        <span className="lp-win__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="hidden items-center gap-2 opacity-70 sm:flex">
          <IconArrowLeft className="size-4" stroke={1.8} />
          <IconArrowRight className="size-4 opacity-60" stroke={1.8} />
        </span>
        <span className="lp-win__search">
          <IconSearch className="size-3.5 shrink-0" stroke={2} />
          <span className="truncate">{search}</span>
        </span>
        <span className="hidden w-[52px] sm:block" />
      </div>
      <div className={cn("lp-win__inner", innerClassName)}>{children}</div>
    </div>
  );
}

/** Window inner header, like a thread title. */
export function WinHead({
  title,
  sub,
  right,
}: {
  title: ReactNode;
  sub?: ReactNode | undefined;
  right?: ReactNode | undefined;
}) {
  return (
    <div className="lp-win__head">
      <div className="min-w-0">
        <div className="truncate text-[15px] font-bold tracking-[-0.01em]">{title}</div>
        {sub ? <div className="truncate text-[12px] text-muted-foreground">{sub}</div> : null}
      </div>
      <div className="ms-auto flex items-center gap-2 text-muted-foreground">{right}</div>
    </div>
  );
}

const AVATAR_TONES = ["#E2735B", "#6C7FD8", "#3FA58F", "#B07ADB", "#D79B2E"];

/** One chat message. `agent` uses the brand seal avatar and the AGENT badge. */
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

export type YearState = "uncovered" | "settlement" | "investigation" | "recalled";

export function YearTiles({
  years,
  className,
}: {
  years: { y: string; s: YearState; label: string }[];
  className?: string | undefined;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-1.5 sm:grid-cols-6", className)}>
      {years.map((t) => (
        <div key={t.y} className="lp-year" data-s={t.s}>
          <b>{t.y}</b>
          <span>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

export const WRANGLER_YEARS: { y: string; s: YearState; label: string }[] = [
  { y: "2018", s: "settlement", label: "Settlement" },
  { y: "2019", s: "settlement", label: "Settlement" },
  { y: "2020", s: "settlement", label: "Settlement" },
  { y: "2021", s: "uncovered", label: "Uncovered" },
  { y: "2022", s: "uncovered", label: "Uncovered" },
  { y: "2023", s: "uncovered", label: "Uncovered" },
];

/** Small coloured status dot + label. */
export function StatusDot({ tone, children }: { tone: YearState | "closed"; children: ReactNode }) {
  const color: Record<string, string> = {
    uncovered: "bg-ur-uncovered",
    settlement: "bg-ur-settlement",
    investigation: "bg-ur-investigation",
    recalled: "bg-ur-recalled",
    closed: "bg-ur-closed",
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", color[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}
