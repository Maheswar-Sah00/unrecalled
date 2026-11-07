// Why it matters: an owner's petition really can open an investigation, and
// the gap between complaints and recalls is in the news right now.
import { Rise } from "./shared";

export function Proof() {
  return (
    <section id="proof" className="lp-section lp-proof" aria-labelledby="lp-proof-title">
      <div className="lp-container">
        <Rise>
          <p className="lp-kicker">Why it matters</p>
        </Rise>
        <Rise delay={60}>
          <h2 id="lp-proof-title" className="lp-h2 mt-5 max-w-[20ch]">
            One owner’s petition can start an investigation.
          </h2>
        </Rise>
        <Rise delay={120}>
          <p className="lp-body mt-5 max-w-[38rem]">
            Any driver can ask NHTSA to look into a defect. It is free, it takes a letter, and NHTSA has to
            answer. Unrecalled writes that letter for you.
          </p>
        </Rise>

        <div className="mt-14 grid gap-4 md:grid-cols-2 md:gap-5">
          <Rise delay={0}>
            <article className="lp-card h-full">
              <p className="lp-card__eyebrow">Petitions work</p>
              <h3 className="lp-h4 mt-3">One owner’s petition opened the Jeep wobble probe.</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                NHTSA’s 2019 investigation into the Jeep Wrangler “death wobble” began with a petition from a
                single owner. Unrecalled drafts the same kind of petition, for problems that are still
                uncovered.
              </p>
            </article>
          </Rise>
          <Rise delay={90}>
            <article className="lp-card h-full">
              <p className="lp-card__eyebrow">In the news</p>
              <h3 className="lp-h4 mt-3">NHTSA is probing GM’s 6.2L V8.</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                The investigation covers <b className="font-semibold text-foreground">997,743 vehicles</b>. On
                the Silverado 1500 alone, owners filed{" "}
                <b className="font-semibold text-foreground">71 complaints after the recall</b> that was meant to
                fix it.
              </p>
            </article>
          </Rise>
        </div>
      </div>
    </section>
  );
}
