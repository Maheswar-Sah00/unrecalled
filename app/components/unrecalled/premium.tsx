// Shared premium building blocks (OpenTag-inspired). Styles live in app/global.css (.ur-*).
import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Shield silhouette shared by the mark and the favicons (32×32 grid). */
const CREST = "M6.4 2.5H25.6Q27.5 2.5 27.5 4.4V15.2C27.5 22.1 22.6 27 16 30.2C9.4 27 4.5 22.1 4.5 15.2V4.4Q4.5 2.5 6.4 2.5Z";
/** Right half of the crest: drawn a touch lighter so the shield reads as faceted metal. */
const CREST_RIGHT = "M16 2.5H25.6Q27.5 2.5 27.5 4.4V15.2C27.5 22.1 22.6 27 16 30.2Z";
/** The "bar": a level line across the crest (law, and the road's horizon). */
const BAR = "M9.5 7.1H22.5V8.7H9.5Z";
/** Monogram U: two upright strokes joined by a single arc. */
const U = "M10.3 11.4H13V17.1A3 3 0 0 0 19 17.1V11.4H21.7V17.1A5.7 5.7 0 0 1 10.3 17.1Z";

/**
 * Brand mark: a monochrome crest. A shield with a level bar (the law, and the
 * horizon of the road) over a monogram U, cut out of the metal. Inherits
 * `currentColor`, so it is ink on paper and white on black.
 */
export function BrandMark({ className }: { className?: string }) {
  const id = `ur-crest-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 shrink-0 text-foreground", className)} aria-hidden="true">
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
          <rect width="32" height="32" fill="#fff" />
          <path d={BAR} fill="#000" />
          <path d={U} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <path d={CREST} fill="currentColor" />
        <path d={CREST_RIGHT} fill="hsl(var(--background))" fillOpacity="0.12" />
      </g>
    </svg>
  );
}

/** Editorial page header: serif title + muted lede + optional actions. */
export function PageHero({
  title,
  lede,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <div className="mb-3 text-sm text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="ur-display text-[2.25rem] md:text-[3rem]">{title}</h1>
        {lede ? <p className="ur-lede mt-3 max-w-2xl">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/** macOS-style app window frame used for agent/product mockups. */
export function Window({
  title,
  children,
  className,
  bodyClassName,
  style,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("ur-window", className)} style={style}>
      <div className="ur-window__bar">
        <span className="ur-window__dots">
          <i />
          <i />
          <i />
        </span>
        {title ? <span className="ml-2 truncate opacity-80">{title}</span> : null}
      </div>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  );
}

/** One message in an agent thread (avatar + name + optional AGENT badge). */
export function AgentMessage({
  name = "Unrecalled",
  agent = true,
  time,
  children,
  avatar,
  className,
  style,
}: {
  name?: string;
  agent?: boolean;
  time?: string;
  children: ReactNode;
  avatar?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("flex gap-3", className)} style={style}>
      <div className="mt-0.5 shrink-0">{avatar ?? <BrandMark className="size-8" />}</div>
      <div className="min-w-0 text-[14px] leading-relaxed">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{name}</span>
          {agent ? <span className="ur-agent-badge">Agent</span> : null}
          {time ? <span className="text-xs text-muted-foreground">{time}</span> : null}
        </div>
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

/** Typing indicator dots. */
export function Typing({ className }: { className?: string }) {
  return (
    <span className={cn("ur-typing inline-flex items-center text-muted-foreground", className)} aria-label="Working">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Counts up from 0 to `value` when it first renders (respects reduced motion). */
export function CountUp({ value, duration = 1100, className }: { value: number; duration?: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) {
      setShown(value);
      return;
    }
    started.current = true;
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={cn("ur-num", className)}>{shown.toLocaleString("en-US")}</span>;
}

/** Wraps children in a staggered fade-up reveal. */
export function Reveal({
  delay = 0,
  children,
  className,
  as: Tag = "div",
}: {
  delay?: number;
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  return (
    <Tag className={cn("ur-reveal", className)} style={{ ["--ur-delay" as string]: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
