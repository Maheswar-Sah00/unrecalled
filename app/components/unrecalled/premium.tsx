// Shared premium building blocks (OpenTag-inspired). Styles live in app/global.css (.ur-*).
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Brand mark: a soft rounded "seal" shape with a check-gap, in the accent blue. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="hsl(var(--ur-blue))" />
      {/* scales on the roof */}
      <path d="M16 10.4V5.6M11.2 6.2h9.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.4 8.6h3.6q-.5 1.7-1.8 1.7t-1.8-1.7zM19 8.6h3.6q-.5 1.7-1.8 1.7T19 8.6z" fill="#F2B33D" />
      {/* car front */}
      <path d="M10.2 16.6l1.5-4.3q.5-1.3 1.9-1.3h4.8q1.4 0 1.9 1.3l1.5 4.3z" fill="#fff" fillOpacity="0.55" />
      <rect x="7.4" y="16" width="17.2" height="8" rx="3.2" fill="#fff" />
      <circle cx="11.3" cy="19.8" r="1.8" fill="hsl(var(--ur-blue))" />
      <circle cx="20.7" cy="19.8" r="1.8" fill="hsl(var(--ur-blue))" />
      <rect x="9" y="24" width="3" height="2.8" rx="1" fill="#fff" />
      <rect x="20" y="24" width="3" height="2.8" rx="1" fill="#fff" />
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
