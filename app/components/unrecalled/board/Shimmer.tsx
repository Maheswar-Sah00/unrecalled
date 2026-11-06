import "../../../styles/report.css";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Kept for compatibility: shimmer keyframes now live in app/styles/report.css. */
export function ShimmerStyles() {
  return null;
}

/** A soft shimmering placeholder block. */
export function Shimmer({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("ur-shimmer", className)} style={style} aria-hidden="true" />;
}
