import { AgentThreadDemo, HeroFloats } from "./landing/HeroFloats";
import { HowItWorks } from "./landing/HowItWorks";
import { Page, useCrumbs } from "./page";
import { BrandMark, Reveal } from "./premium";
import { ScanForm } from "./ScanForm";
import { VehicleList } from "./VehicleList";

export function GapsHome() {
  useCrumbs([{ label: "Gaps" }]);
  return (
    <div className="w-full overflow-x-clip">
      <section className="@container relative px-4 pb-6 pt-10 md:px-10 md:pt-16">
        <div className="pointer-events-none absolute inset-x-3 inset-y-0 md:inset-x-5">
          <HeroFloats />
        </div>

        <div className="relative mx-auto flex max-w-[600px] flex-col items-center text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3.5 py-1.5 text-[13px] text-muted-foreground shadow-[var(--ur-shadow)] backdrop-blur">
              <span className="ur-live-dot" aria-hidden="true" />
              Reading owner complaints filed with NHTSA
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="ur-display mt-6 text-[2.6rem] sm:text-[3.4rem] md:text-[4.1rem]">
              Find the car defects
              <span className="mx-2 hidden translate-y-[0.08em] align-baseline md:inline-block">
                <BrandMark className="ur-float size-[0.82em]" />
              </span>{" "}
              nobody is fixing.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="ur-lede mt-5 max-w-[34rem] text-[1.0625rem] md:text-[1.15rem]">
              Owners report problems to NHTSA every day. Unrecalled finds the ones
              no recall, investigation or settlement covers — and drafts the
              request to investigate.
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-9 w-full text-left">
            <ScanForm />
          </Reveal>
          {/* Compact agent preview where the edge decorations don't fit. */}
          <Reveal
            delay={360}
            className="mt-8 w-full max-w-[360px] text-left @min-[1040px]:hidden"
          >
            <div aria-hidden="true" className="ur-float" style={{ ["--ur-dur" as string]: "8s" }}>
              <AgentThreadDemo className="w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      <Page className="pt-4 md:pt-6">
        <VehicleList />
        <HowItWorks />
      </Page>
    </div>
  );
}
