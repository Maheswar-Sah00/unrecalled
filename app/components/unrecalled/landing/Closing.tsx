// Quiet footer: wordmark, tagline, where the data comes from.
import { Link } from "react-router";

import { BrandMark } from "../premium";

export function Closing() {
  return (
    <footer className="lp-footer">
      <div className="lp-container flex flex-col gap-8 py-14 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Unrecalled home">
            <BrandMark className="size-8" />
            <span className="lp-wordmark">Unrecalled</span>
          </Link>
          <p className="mt-3 max-w-[26rem] text-[15px] text-muted-foreground">
            Find the car defects nobody is fixing, and ask NHTSA to look.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-[14px] text-muted-foreground md:items-end">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/petitions" className="hover:text-foreground">Petitions</Link>
            <Link to="/backtest" className="hover:text-foreground">Proof</Link>
            <Link to="/rules" className="hover:text-foreground">Problem types</Link>
            <Link to="/chat" className="hover:text-foreground">Ask the agent</Link>
          </nav>
          <p className="text-[13px]">Data: NHTSA complaints, recalls and investigations.</p>
        </div>
      </div>
    </footer>
  );
}
