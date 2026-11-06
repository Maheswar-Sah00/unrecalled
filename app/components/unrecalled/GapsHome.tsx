import "@/styles/landing.css";

import { useEffect } from "react";
import { useLocation } from "react-router";

import { Closing } from "./landing/Closing";
import { Collage } from "./landing/Collage";
import { Features } from "./landing/Features";
import { Hero, scrollToScan } from "./landing/Hero";
import { HowItWorks } from "./landing/HowItWorks";
import { Showcase } from "./landing/Showcase";
import { Sources } from "./landing/Sources";
import { useCrumbs } from "./page";
import { VehicleList } from "./VehicleList";

export function GapsHome() {
  useCrumbs([{ label: "Gaps" }]);
  const { hash, key } = useLocation();

  // The nav's "Scan a car" links to /gaps#scan; React Router does not scroll to hashes.
  useEffect(() => {
    if (hash !== "#scan") return;
    const t = window.setTimeout(() => scrollToScan(), 60);
    return () => window.clearTimeout(t);
  }, [hash, key]);

  return (
    <div className="lp w-full overflow-x-clip">
      <Hero />
      <Sources />
      <Showcase />
      <HowItWorks />
      <Features />
      <Collage />
      <VehicleList />
      <Closing />
    </div>
  );
}
