// Proof: the backtest headline (30 months early), the news hook and the
// fact that citizen petitions do open investigations.
import { IconArrowUpRight } from "@tabler/icons-react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import { Rise, useCount, useInView } from "./shared";

export function Proof() {
  const [ref, seen] = useInView<HTMLDivElement>("0px 0px -25% 0px");
  const months = useCount(30, seen, 1300);
  return (
    <section id="proof" className="lp-section lp-proof" aria-labelledby="lp-proof-title">
      <div className="lp-container">
        <Rise>
          <p className="lp-kicker">Proof it works</p>
        </Rise>
        <div ref={ref} className="mt-6 grid items-end gap-10 lg:grid-cols-[auto_1fr] lg:gap-20">
          <Rise delay={60}>
            <div className="lp-big ur-num" aria-hidden="true">
              {months}
              <span>months</span>
            </div>
          </Rise>
          <Rise delay={140} className="pb-2">
            <h2 id="lp-proof-title" className="lp-h3 max-w-[22ch]">
              Its alarm fires 30 months before the recall.
            </h2>
            <p className="lp-body mt-4 max-w-[36rem]">
              We replayed the complaint history behind Hyundai and Kia’s Theta II engine failures.
              Unrecalled’s alarm went off two and a half years before the recall came.
            </p>
          </Rise>
        </div>

        <Rise delay={100} className="mt-12">
          <div className={cn("lp-timeline", seen && "is-in")} aria-hidden="true">
            <div className="lp-timeline__track" />
            <div className="lp-timeline__fill" />
            <div className="lp-timeline__mark" style={{ left: "0%" }}>
              <i data-hot="" />
              <span>Unrecalled alarm</span>
            </div>
            <div className="lp-timeline__span">30 months of warning</div>
            <div className="lp-timeline__mark lp-timeline__mark--end" style={{ left: "100%" }}>
              <i />
              <span>Recall</span>
            </div>
          </div>
        </Rise>

        <div className="mt-16 grid gap-4 md:grid-cols-2 md:gap-5">
          <Rise delay={0}>
            <article className="lp-card h-full">
              <p className="lp-card__eyebrow">In the news</p>
              <h3 className="lp-h4 mt-3">NHTSA is probing GM’s 6.2L V8.</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Investigation EA26005 covers <b className="font-semibold text-foreground">997,743 vehicles</b>.
                On the Silverado 1500 alone, Unrecalled finds{" "}
                <b className="font-semibold text-foreground">71 complaints filed after the recall</b>.
              </p>
            </article>
          </Rise>
          <Rise delay={90}>
            <article className="lp-card h-full">
              <p className="lp-card__eyebrow">Petitions work</p>
              <h3 className="lp-h4 mt-3">One owner’s petition opened the wobble probe.</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                NHTSA’s Jeep Wrangler investigation <b className="font-semibold text-foreground">PE19-012</b> began
                with a citizen petition, <b className="font-semibold text-foreground">DP18-004</b>. Unrecalled
                drafts the same kind of petition, for the problems still uncovered.
              </p>
            </article>
          </Rise>
        </div>

        <Rise delay={120} className="mt-8">
          <Link to="/backtest" className="lp-link">
            See the full backtest
            <IconArrowUpRight className="size-4" stroke={1.8} />
          </Link>
        </Rise>
      </div>
    </section>
  );
}
