// "Built on official public data": the sources as muted type wordmarks (no logos).
import {
  IconBuildingBank,
  IconCar,
  IconFileAlert,
  IconMessages,
  IconScale,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

import { Rise } from "./shared";

const MARKS: { key: string; node: ReactNode }[] = [
  {
    key: "complaints",
    node: (
      <>
        <IconMessages className="size-7" stroke={1.7} />
        <span className="text-[25px] font-extrabold tracking-[-0.03em]">NHTSA</span>
        <span className="text-[25px] font-light tracking-[-0.02em]">Complaints</span>
      </>
    ),
  },
  {
    key: "recalls",
    node: (
      <>
        <IconFileAlert className="size-7" stroke={1.7} />
        <span className="font-display text-[29px] italic tracking-[-0.02em]">Recalls</span>
      </>
    ),
  },
  {
    key: "odi",
    node: (
      <span className="font-mono text-[21px] font-semibold uppercase tracking-[0.18em]">
        ODI&nbsp;Investigations
      </span>
    ),
  },
  {
    key: "vpic",
    node: (
      <>
        <span className="flex size-8 items-center justify-center rounded-lg bg-current">
          <IconCar className="size-5 text-background" stroke={2} />
        </span>
        <span className="text-[28px] font-black tracking-[-0.05em]">vPIC</span>
      </>
    ),
  },
  {
    key: "fedreg",
    node: (
      <>
        <IconBuildingBank className="size-7" stroke={1.6} />
        <span className="font-display text-[24px] font-semibold uppercase tracking-[0.06em]">
          Federal Register
        </span>
      </>
    ),
  },
  {
    key: "courts",
    node: (
      <>
        <IconScale className="size-7" stroke={1.7} />
        <span className="text-[24px] font-medium tracking-[-0.03em]">Court settlements</span>
      </>
    ),
  },
];

export function Sources() {
  return (
    <section className="pb-4 pt-[clamp(72px,9vw,120px)]" aria-labelledby="lp-sources">
      <Rise>
        <h2 id="lp-sources" className="text-center text-[1.25rem] tracking-[-0.02em] text-[var(--lp-muted)] md:text-[1.6rem]">
          Built on official public data
        </h2>
      </Rise>
      <Rise delay={100} className="lp-marquee mt-10 overflow-hidden">
        <div className="lp-marquee__track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex items-center" aria-hidden={copy === 1 ? true : undefined}>
              {MARKS.map((m) => (
                <li key={m.key} className="lp-wordmark">
                  {m.node}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </Rise>
    </section>
  );
}
