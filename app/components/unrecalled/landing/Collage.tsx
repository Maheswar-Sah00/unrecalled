// Floating collage (OpenTag "best model for every task" style): soft gradient
// tiles, one per problem type, drifting around a centred serif line.
import {
  IconAirBalloon,
  IconBolt,
  IconCamera,
  IconCarCrash,
  IconDoor,
  IconEngine,
  IconFlame,
  IconHandStop,
  IconSteeringWheel,
  IconSunWind,
  IconCircleDashed,
  IconWaveSine,
  type Icon,
} from "@tabler/icons-react";
import type { CSSProperties } from "react";
import { Link } from "react-router";

import { Rise } from "./shared";

const G = {
  coral: "radial-gradient(circle at 22% 18%, #fff1e2 0, transparent 45%), radial-gradient(circle at 80% 78%, #f0775f 0, transparent 58%), radial-gradient(circle at 15% 85%, #f7b78f 0, transparent 50%), linear-gradient(150deg, #f8c9ae, #e88b8a)",
  blue: "radial-gradient(circle at 78% 18%, #eef4ff 0, transparent 45%), radial-gradient(circle at 18% 82%, #5d83df 0, transparent 58%), radial-gradient(circle at 85% 85%, #9fb7e8 0, transparent 50%), linear-gradient(165deg, #bcd0f5, #7d97dc)",
  violet: "radial-gradient(circle at 25% 20%, #f8eefe 0, transparent 45%), radial-gradient(circle at 80% 78%, #8a72d9 0, transparent 58%), linear-gradient(145deg, #d6c6f6, #a592e2)",
  teal: "radial-gradient(circle at 80% 18%, #effdf9 0, transparent 45%), radial-gradient(circle at 20% 80%, #2f9e92 0, transparent 58%), linear-gradient(150deg, #a9e2d8, #64b4c4)",
  amber: "radial-gradient(circle at 22% 18%, #fffaf0 0, transparent 45%), radial-gradient(circle at 78% 82%, #e39a2a 0, transparent 56%), radial-gradient(circle at 20% 80%, #b9c98f 0, transparent 50%), linear-gradient(150deg, #f6dda6, #e2ac63)",
  green: "radial-gradient(circle at 70% 22%, #f6fbea 0, transparent 45%), radial-gradient(circle at 25% 80%, #4f8f61 0, transparent 58%), linear-gradient(155deg, #cfe3b9, #8bb79a)",
  dusk: "radial-gradient(circle at 25% 20%, #ffeef3 0, transparent 45%), radial-gradient(circle at 75% 85%, #6475cf 0, transparent 58%), linear-gradient(155deg, #efbdd0, #9aa0e3)",
  sand: "radial-gradient(circle at 70% 20%, #ffffff 0, transparent 45%), radial-gradient(circle at 25% 85%, #b98f6a 0, transparent 58%), linear-gradient(155deg, #eedfca, #c4b6db)",
};

interface Tile {
  name: string;
  icon: Icon;
  g: string;
  /** left/top in % of the stage, size in px */
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number | undefined;
  dur?: number | undefined;
  d?: number | undefined;
  big?: boolean | undefined;
}

// Desktop stage: 1192 × 1060. Big cluster above the line, small tiles scattered below.
const TILES: Tile[] = [
  { name: "Engine seizure", icon: IconEngine, g: G.amber, x: 22, y: 12, w: 220, h: 290, r: -1.5, dur: 15, big: true },
  { name: "Death wobble", icon: IconSteeringWheel, g: G.coral, x: 39, y: 0, w: 300, h: 340, r: 1, dur: 17, d: -3, big: true },
  { name: "Phantom braking", icon: IconHandStop, g: G.blue, x: 64, y: 8, w: 230, h: 300, r: -1, dur: 14, d: -6, big: true },
  { name: "Airbag did not deploy", icon: IconAirBalloon, g: G.violet, x: 7, y: 30, w: 180, h: 220, r: 2, dur: 16, d: -2, big: true },
  { name: "Brake loss", icon: IconCarCrash, g: G.teal, x: 82, y: 33, w: 150, h: 180, r: -2, dur: 13, d: -8, big: true },
  { name: "Vehicle fire", icon: IconFlame, g: G.dusk, x: 7, y: 57, w: 96, h: 120, r: 2.5, dur: 12, d: -4 },
  { name: "Sudden acceleration", icon: IconBolt, g: G.coral, x: 23, y: 84, w: 104, h: 124, r: -2, dur: 14, d: -7 },
  { name: "Rearview camera", icon: IconCamera, g: G.blue, x: 46, y: 88, w: 96, h: 112, r: 1.5, dur: 13, d: -1 },
  { name: "Tire blowout", icon: IconCircleDashed, g: G.green, x: 66, y: 83, w: 100, h: 120, r: -1.5, dur: 15, d: -9 },
  { name: "Door opens", icon: IconDoor, g: G.sand, x: 85, y: 58, w: 96, h: 116, r: 2, dur: 12, d: -5 },
  { name: "Sunroof shatters", icon: IconSunWind, g: G.violet, x: 2, y: 79, w: 84, h: 100, r: -2, dur: 16, d: -3 },
  { name: "Harsh shifting", icon: IconWaveSine, g: G.amber, x: 92, y: 80, w: 84, h: 100, r: 2, dur: 14, d: -6 },
];

function TileView({ t, style }: { t: Tile; style?: CSSProperties }) {
  return (
    <div
      className="lp-tile"
      style={{
        ["--lp-g" as string]: t.g,
        ["--lp-r" as string]: `${t.r ?? 0}deg`,
        ["--lp-dur" as string]: `${t.dur ?? 14}s`,
        ["--lp-d" as string]: `${t.d ?? 0}s`,
        ["--lp-dx" as string]: `${(t.r ?? 1) * 5}px`,
        ["--lp-dy" as string]: `${-10 - (t.dur ?? 14)}px`,
        ...style,
      }}
    >
      <t.icon
        className={t.big ? "absolute left-1/2 top-[42%] size-[34%] min-w-14 -translate-x-1/2 -translate-y-1/2 opacity-95 drop-shadow-[0_6px_14px_#0b163040]" : "absolute left-1/2 top-[40%] size-9 -translate-x-1/2 -translate-y-1/2 opacity-95"}
        stroke={1.5}
      />
      <span
        className={
          t.big
            ? "relative max-w-[12ch] font-display text-[1rem] leading-[1.1] md:text-[1.25rem] tracking-[-0.02em] [text-shadow:0_1px_10px_#0b163040]"
            : "relative text-[11.5px] font-semibold leading-tight [text-shadow:0_1px_8px_#0b163050]"
        }
      >
        {t.name}
      </span>
    </div>
  );
}

export function Collage() {
  return (
    <section className="overflow-hidden pt-[clamp(72px,11vw,150px)] pb-0" aria-labelledby="lp-collage">
      <div className="lp-container relative md:h-[1060px]">
        {/* desktop stage */}
        <div className="absolute inset-0 hidden md:block" aria-hidden="true">
          {TILES.map((t) => (
            <TileView
              key={t.name}
              t={t}
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.w, height: t.h }}
            />
          ))}
        </div>
        {/* mobile stage */}
        <div className="relative mx-auto h-[400px] w-full max-w-[380px] md:hidden" aria-hidden="true">
          {TILES.slice(0, 5).map((t, i) => {
            const pos = [
              { left: "0%", top: "16%", width: 112, height: 144 },
              { left: "29%", top: "0%", width: 148, height: 184 },
              { left: "69%", top: "13%", width: 108, height: 140 },
              { left: "8%", top: "62%", width: 92, height: 108 },
              { left: "66%", top: "60%", width: 96, height: 116 },
            ][i]!;
            return <TileView key={t.name} t={{ ...t, big: i < 3 }} style={pos} />;
          })}
        </div>

        <Rise className="relative z-[1] mx-auto mt-6 flex max-w-[40rem] flex-col items-center text-center md:absolute md:inset-x-0 md:top-[548px] md:mt-0">
          <h2 id="lp-collage" className="lp-h2">
            Every problem owners report
          </h2>
          <p className="lp-body mt-4 max-w-[30rem]">
            Death wobble, phantom braking, engine seizure and two dozen more, each with clear rules
            you can read.
          </p>
          <Link to="/rules" className="ur-btn mt-8 h-12 rounded-[13px] px-6 text-[16px]">
            See all problem types
          </Link>
        </Rise>
      </div>
    </section>
  );
}
