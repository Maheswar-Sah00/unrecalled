// Shared premium building blocks (OpenTag-inspired). Styles live in app/global.css (.ur-*).
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Brand mark: a soft rounded "seal" shape with a check-gap, in the accent blue. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden="true">
      <path
        d="M16 2.5l3.1 2.6 4-.6 1.5 3.8 3.8 1.5-.6 4 2.6 3.1-2.6 3.1.6 4-3.8 1.5-1.5 3.8-4-.6L16 29.5l-3.1-2.6-4 .6-1.5-3.8-3.8-1.5.6-4L1.6 16l2.6-3.1-.6-4 3.8-1.5 1.5-3.8 4 .6z"
        fill="hsl(var(--ur-blue))"
      />
      <circle cx="12.4" cy="14.6" r="1.7" fill="#fff" />
      <circle cx="19.6" cy="14.6" r="1.7" fill="#fff" />
      <path d="M12.6 19.4c1.9 1.6 4.9 1.6 6.8 0" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
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
