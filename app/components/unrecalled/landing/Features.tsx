// Two alternating feature rows (OpenTag "Build shared knowledge" style): text on
// one side, a window with a mascot perched on top on the other.
import { IconArrowRight } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import { Mascot, type MascotColor, type MascotPose } from "../mascots";
import { BacktestMock, WatchMock } from "./mockups";
import { Rise } from "./shared";

function Row({
  title,
  body,
  link,
  mock,
  pose,
  color,
  flip,
}: {
  title: string;
  body: ReactNode;
  link?: { to: string; label: string } | undefined;
  mock: ReactNode;
  pose: MascotPose;
  color: MascotColor;
  flip?: boolean | undefined;
}) {
  return (
    <div className="grid items-center gap-14 md:grid-cols-2 md:gap-20 lg:gap-28">
      <Rise className={cn(flip && "md:order-2")}>
        <h3 className="lp-h3 max-w-[14ch]">{title}</h3>
        <div className="lp-body mt-6 max-w-[34rem]">{body}</div>
        {link ? (
          <Link
            to={link.to}
            className="group mt-8 inline-flex items-center gap-2 text-[16px] font-medium text-foreground underline decoration-foreground/25 underline-offset-[6px] transition-colors hover:decoration-foreground"
          >
            {link.label}
            <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" stroke={2} />
          </Link>
        ) : null}
      </Rise>
      <Rise delay={120} className={cn("relative pt-[92px]", flip && "md:order-1")}>
        <div className={cn("lp-perch top-[4px]", flip ? "left-[12%]" : "right-[12%]")} aria-hidden="true">
          <Mascot pose={pose} color={color} className="size-[104px]" />
        </div>
        <div className="mx-auto max-w-[480px]">{mock}</div>
      </Rise>
    </div>
  );
}

export function Features() {
  return (
    <section className="lp-section" aria-labelledby="lp-features">
      <div className="lp-container">
        <Rise>
          <h2 id="lp-features" className="lp-h2 max-w-[18ch]">
            Stay ahead of the next recall
          </h2>
          <p className="lp-body mt-5 max-w-[40rem]">
            A gap is not a one-time finding. Unrecalled keeps reading, and its signal has
            already been tested against recalls that really happened.
          </p>
        </Rise>
        <div className="mt-20 space-y-28 md:mt-28 md:space-y-40">
          <Row
            title="Keep watch, every week"
            body={
              <p>
                Turn on Watch weekly for any scanned car. Every week Unrecalled re-reads the new
                complaints and tells you when a problem grows, like the 80 Wrangler reports filed
                in the last 12 months.
              </p>
            }
            mock={<WatchMock className="min-h-[470px]" />}
            pose="watch"
            color="teal"
          />
          <Row
            flip
            title="Proof from the past"
            body={
              <p>
                We replayed real owner complaints month by month. The early-warning signal would
                have flagged the Hyundai/Kia Theta II engine failures 30 months before the 2017
                recall.
              </p>
            }
            link={{ to: "/backtest", label: "See the backtest" }}
            mock={<BacktestMock className="min-h-[470px]" />}
            pose="read"
            color="blue"
          />
        </div>
      </div>
    </section>
  );
}
