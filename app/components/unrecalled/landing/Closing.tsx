// Final CTA band + footer over a soft blurred colour wash (OpenTag style).
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router";

import { Mascot } from "../mascots";
import { BrandMark } from "../premium";
import { scrollToScan } from "./Hero";
import { Rise } from "./shared";

const LINKS = [
  { to: "/gaps", label: "Gaps" },
  { to: "/petitions", label: "Petitions" },
  { to: "/backtest", label: "Backtest" },
  { to: "/rules", label: "Problem types" },
  { to: "/chat", label: "Ask the agent" },
];

export function Closing() {
  return (
    <div className="relative overflow-hidden">
      <div className="lp-wash" aria-hidden="true">
        <i className="left-[-8%] top-[52%] h-[420px] w-[520px] bg-[var(--lp-wash-b)]" style={{ animationDuration: "21s" }} />
        <i className="left-[24%] top-[60%] h-[380px] w-[560px] bg-[var(--lp-wash-c)]" style={{ animationDuration: "17s", animationDelay: "-6s" }} />
        <i className="right-[18%] top-[56%] h-[400px] w-[520px] bg-[var(--lp-wash-a)]" style={{ animationDuration: "19s", animationDelay: "-3s" }} />
        <i className="right-[-10%] top-[66%] h-[360px] w-[460px] bg-[var(--lp-wash-d)]" style={{ animationDuration: "23s", animationDelay: "-9s" }} />
      </div>

      <section className="relative pb-[clamp(96px,12vw,170px)] pt-[clamp(40px,6vw,80px)]" aria-labelledby="lp-cta">
        <div className="lp-container flex flex-col items-center text-center">
          <Rise>
            <Mascot pose="wave" color="coral" className="size-[132px] md:size-[150px]" />
          </Rise>
          <Rise delay={80}>
            <h2 id="lp-cta" className="lp-h2 mt-6">
              Start with one car.
            </h2>
          </Rise>
          <Rise delay={140}>
            <p className="lp-body mx-auto mt-4 max-w-[32rem]">
              Type a make, model and years. In seconds you will see what owners report and
              what nobody is fixing.
            </p>
          </Rise>
          <Rise delay={200} className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/backtest" className="ur-btn-soft h-12 rounded-[13px] px-6 text-[16px]">
              See the backtest
            </Link>
            <button type="button" onClick={() => scrollToScan()} className="ur-btn h-12 rounded-[13px] px-6 text-[16px]">
              Scan a car
              <IconArrowRight className="size-4" stroke={2} />
            </button>
          </Rise>
        </div>
      </section>

      <footer className="relative pb-12">
        <div className="lp-container grid gap-10 border-t border-foreground/10 pt-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link to="/gaps" className="inline-flex items-center gap-2.5" aria-label="Unrecalled home">
              <BrandMark className="size-8" />
              <span className="font-display text-[1.375rem] font-semibold tracking-[-0.03em]">Unrecalled</span>
            </Link>
            <p className="mt-5 max-w-[16rem] font-display text-[1.375rem] leading-snug tracking-[-0.02em]">
              The car defects nobody is fixing, found.
            </p>
          </div>
          <nav aria-label="Footer">
            <div className="text-[14px] font-medium">Product</div>
            <ul className="mt-4 space-y-3">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-[15px] text-[var(--lp-muted)] transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <div className="text-[14px] font-medium">Data</div>
            <p className="mt-4 max-w-[18rem] text-[15px] leading-relaxed text-[var(--lp-muted)]">
              Uses public NHTSA data. Not affiliated with NHTSA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
