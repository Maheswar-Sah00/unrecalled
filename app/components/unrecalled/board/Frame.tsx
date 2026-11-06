// macOS-style app window with a thick ink frame, a search bar, an optional channel
// header and an optional mascot perched on top (OpenTag layout language, our art).
import "../../../styles/report.css";

import { IconArrowLeft, IconArrowRight, IconDotsVertical, IconHelpCircle, IconSearch, IconX } from "@tabler/icons-react";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BrandMark } from "../premium";

export function Frame({
  search = "Search Unrecalled",
  channel,
  sub,
  headRight,
  perch,
  perchSide = "right",
  children,
  className,
  bodyClassName,
  style,
  closable = true,
}: {
  search?: ReactNode;
  channel?: ReactNode;
  sub?: ReactNode;
  headRight?: ReactNode;
  perch?: ReactNode;
  perchSide?: "left" | "right";
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  closable?: boolean;
}) {
  return (
    <div className={cn("rp-frame-wrap", className)} style={style}>
      {perch ? <div className={cn("rp-perch ur-float", `rp-perch--${perchSide}`)}>{perch}</div> : null}
      <div className="rp-frame">
        <div className="rp-frame__bar" aria-hidden="true">
          <span className="rp-frame__dots">
            <i />
            <i />
            <i />
          </span>
          <span className="rp-frame__nav">
            <IconArrowLeft />
            <IconArrowRight />
          </span>
          <span className="rp-frame__search">
            <IconSearch />
            <span className="truncate">{search}</span>
          </span>
          <IconHelpCircle className="hidden size-4 shrink-0 sm:block" />
        </div>
        <div className={cn("rp-frame__body", bodyClassName)}>
          {channel ? (
            <div className="rp-frame__head">
              <div className="min-w-0 flex-1">
                <div className="rp-frame__channel truncate">
                  {channel}
                  {sub ? <small className="truncate">{sub}</small> : null}
                </div>
              </div>
              {headRight}
              {closable ? (
                <span className="hidden items-center gap-2 text-muted-foreground sm:flex" aria-hidden="true">
                  <IconDotsVertical className="size-[18px]" />
                  <IconX className="size-[18px]" />
                </span>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

/** One Slack-style message row. */
export function Msg({
  avatar,
  name,
  agent,
  time,
  children,
  className,
  style,
  actions,
  pinned,
}: {
  avatar?: ReactNode;
  name: ReactNode;
  agent?: boolean;
  time?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  actions?: ReactNode;
  pinned?: boolean;
}) {
  return (
    <div className={cn("rp-msg", pinned && "rp-pinned", className)} style={style}>
      <div className="pt-0.5">
        {avatar ?? (
          <span className="rp-agent-avatar">
            <BrandMark />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="rp-msg__name">
          <b>{name}</b>
          {agent ? <span className="rp-badge">Agent</span> : null}
          {time ? <span className="rp-time">{time}</span> : null}
        </div>
        <div className="rp-msg__text">{children}</div>
        {actions}
      </div>
    </div>
  );
}
