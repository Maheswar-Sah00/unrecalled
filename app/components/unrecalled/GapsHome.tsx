import "@/styles/landing.css";

import { useEffect } from "react";
import { useLocation } from "react-router";

import { Closing } from "./landing/Closing";
import { Hero } from "./landing/Hero";
import { Proof } from "./landing/Proof";
import { ScanSection } from "./landing/ScanSection";
import { scrollToId } from "./landing/shared";
import { Story } from "./landing/Story";
import { WhyNot } from "./landing/WhyNot";
import { VehicleList } from "./VehicleList";

/** The homepage ("/"): the story of why Unrecalled exists, then the scan form. */
export function GapsHome() {
  const { hash, key } = useLocation();

  // Nav links point at /#how and /#scan; React Router does not scroll to hashes.
  useEffect(() => {
    const id = hash.slice(1);
    if (id !== "scan" && id !== "how" && id !== "proof") return;
    const t = window.setTimeout(() => scrollToId(id, id === "scan"), 60);
    return () => window.clearTimeout(t);
  }, [hash, key]);

  return (
    <div className="lp w-full overflow-x-clip">
      <Hero />
      <Story />
      <Proof />
      <WhyNot />
      <ScanSection />
      <VehicleList />
      <Closing />
    </div>
  );
}
