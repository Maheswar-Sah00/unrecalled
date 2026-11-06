import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

const CSS = `
@keyframes ur-shimmer { 0% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
.ur-shimmer {
  border-radius: 10px;
  background-color: hsl(var(--foreground) / 0.06);
  background-image: linear-gradient(100deg, transparent 20%, hsl(var(--foreground) / 0.07) 45%, transparent 70%);
  background-size: 220% 100%;
  animation: ur-shimmer 1.6s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) { .ur-shimmer { animation: none; } }
`;

/** Injects the shimmer keyframes once (scoped to the board components). */
export function ShimmerStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}

/** A soft shimmering placeholder block. */
export function Shimmer({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("ur-shimmer", className)} style={style} aria-hidden="true" />;
}
