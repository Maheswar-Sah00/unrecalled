import { useSetPageTitle } from "@agent-native/toolkit/app-shell/header-actions";
import { IconChevronRight } from "@tabler/icons-react";
import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

export function Page({
  children,
  className,
  wide,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pb-16 pt-4 md:px-8 md:pt-6",
        wide ? "max-w-[1400px]" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface Crumb {
  label: ReactNode;
  to?: string;
}

/** Publishes a breadcrumb trail into the app header. */
export function useCrumbs(crumbs: Crumb[]) {
  useSetPageTitle(
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1 text-sm"
    >
      {crumbs.map((c, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <IconChevronRight
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
          {c.to && i < crumbs.length - 1 ? (
            <Link
              to={c.to}
              className="truncate text-muted-foreground hover:text-foreground"
            >
              {c.label}
            </Link>
          ) : (
            <span
              className={cn(
                "truncate",
                i === crumbs.length - 1 && "font-medium text-foreground",
              )}
            >
              {c.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

export function SectionHeading({
  children,
  right,
  className,
}: {
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-2 flex min-h-8 flex-wrap items-center justify-between gap-2",
        className,
      )}
    >
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </h2>
      {right}
    </div>
  );
}
