// "Why not just…": the existing options, factually, and the one chain only
// Unrecalled completes.
import { IconArrowRight } from "@tabler/icons-react";
import { Fragment } from "react";

import { Rise } from "./shared";

const ROWS = [
  { q: "check NHTSA.gov?", a: "Its lookup shows recalls. Not the problems that never got one." },
  { q: "read CarComplaints.com?", a: "It lists complaints. It doesn’t check what’s covered, or act on it." },
  { q: "use a recall-gap score?", a: "ProblemsByVin’s Recall-Gap index rates the gap. It doesn’t file anything." },
  { q: "call a lawyer?", a: "Class actions come when there’s money at stake, and usually years later." },
];

const CHAIN = ["Complaints", "Problem", "Coverage check", "Petition"];

export function WhyNot() {
  return (
    <section className="lp-section lp-why" aria-labelledby="lp-why-title">
      <div className="lp-container">
        <Rise>
          <h2 id="lp-why-title" className="lp-h2">
            Why not just…
          </h2>
        </Rise>
        <ul className="mt-10 border-t border-border">
          {ROWS.map((r, i) => (
            <Rise as="li" key={r.q} delay={i * 60} className="lp-why__row">
              <span className="lp-why__q">…{r.q}</span>
              <span className="lp-why__a">{r.a}</span>
            </Rise>
          ))}
          <Rise as="li" delay={ROWS.length * 60} className="lp-why__row lp-why__row--us">
            <span className="lp-why__q">Unrecalled does the whole chain.</span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-2">
              {CHAIN.map((c, i) => (
                <Fragment key={c}>
                  {i > 0 ? <IconArrowRight className="size-3.5 text-muted-foreground" stroke={2} aria-hidden="true" /> : null}
                  <span className="lp-chainchip">{c}</span>
                </Fragment>
              ))}
            </span>
          </Rise>
        </ul>
      </div>
    </section>
  );
}
