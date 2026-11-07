// A glossy black GT coupe in side profile, drawn as layered SVG: paint
// gradients, studio reflections, chrome glass surround, machined wheels with
// drilled discs, LED lamps and a floor reflection. Faces right.
//
// Wheels: every rotating group carries `data-wheel`; callers rotate them by
// setting `style.transform = rotate(Ndeg)` (origin is the hub, since each
// group sits inside a translate to the hub). `data-wheel-intro` groups are
// used by the hero's drive-in animation.
import { type CSSProperties, useId } from "react";

import { cn } from "@/lib/utils";

export const CAR_VIEW = { w: 1100, h: 360, ground: 318 } as const;
export const CAR_WHEELS = [
  { cx: 320, cy: 241 },
  { cx: 850, cy: 241 },
] as const;
export const CAR_TIRE_R = 77;

const BODY =
  "M70 287 L245.5 287 A86 86 0 1 1 394.5 287 L775.5 287 A86 86 0 1 1 924.5 287 L1012 287 " +
  "C1032 287 1046 278 1050 262 C1054 248 1054 232 1049 221 C1044 208 1030 200 1008 196 " +
  "C968 186 905 152 850 148 C800 145 760 146 724 148 C684 128 634 100 594 86 " +
  "C548 70 472 64 420 70 C336 80 236 108 160 130 C126 138 98 146 68 154 " +
  "C58 156 54 162 53 170 C50 198 52 238 58 262 C61 278 64 287 72 287 Z";

const DLO =
  "M706 156 C666 132 628 106 598 95 C552 80 480 74 430 80 C362 88 296 108 246 128 " +
  "C340 140 548 154 706 156 Z";

const ROOF_RIM = "M716 150 C676 126 632 100 594 87 C548 71 472 65 421 71 C337 81 236 109 160 131";
const HOOD_RIM = "M1046 210 C1036 202 1024 198 1008 196 C968 186 905 152 850 148 C800 145 760 146 724 149";
const SHOULDER =
  "M1030 220 C940 210 860 196 760 194 C640 192 520 186 430 180 C350 174 262 168 156 168";
const HAUNCH = "M182 178 C246 160 346 156 412 174 C446 184 466 192 486 200";
const ARCHES = "M245.5 287 A86 86 0 1 1 394.5 287 M775.5 287 A86 86 0 1 1 924.5 287";

function spokes() {
  const out: string[] = [];
  for (let k = 0; k < 5; k++) {
    for (const off of [-8.5, 8.5]) out.push(String(k * 72 + off));
  }
  return out;
}
const SPOKE_ANGLES = spokes();
const HOLES = Array.from({ length: 12 }, (_, i) => i * 30);

export function Car({
  className,
  style,
  reflection = true,
  lights = true,
  sheen = false,
}: {
  className?: string;
  style?: CSSProperties;
  reflection?: boolean;
  lights?: boolean;
  sheen?: boolean;
}) {
  const raw = useId();
  const id = (n: string) => `car${raw.replace(/[^a-zA-Z0-9]/g, "")}${n}`;
  const url = (n: string) => `url(#${id(n)})`;

  const paint = (
    <>
      {/* wheel wells */}
      {CAR_WHEELS.map((w) => (
        <path
          key={`well${w.cx}`}
          d={`M${w.cx - 74.5} 287 A86 86 0 1 1 ${w.cx + 74.5} 287 Z`}
          fill="#030303"
        />
      ))}
      {/* body */}
      <path d={BODY} fill={url("paint")} />
      {/* lower body falls off into shadow; nose and tail curve away */}
      <path d={BODY} fill={url("lower")} />
      <path d={BODY} fill={url("ends")} />
      {/* broad soft studio reflection on the flank */}
      <path
        d="M1024 226 C920 214 820 206 720 206 C600 206 500 200 400 194 C320 190 240 186 150 188 L150 200 C250 200 330 204 410 210 C520 218 620 226 720 226 C820 226 910 232 1022 242 Z"
        fill={url("band")}
      />
      {/* floor reflection on the sill */}
      <path d="M394 258 C520 262 650 262 776 258 L776 285 L394 285 Z" fill={url("floor")} />
      {/* fender crest sheen */}
      <path d="M1008 200 C968 190 905 158 850 154 C800 151 760 152 724 155 L724 170 C770 168 820 168 856 172 C910 178 960 198 1006 212 Z" fill={url("crest")} />
      {/* wheel-arch lips catch the light */}
      <path d={ARCHES} fill="none" stroke="#fff" strokeOpacity=".11" strokeWidth="1.3" />
      {/* rear haunch highlight */}
      <path d={HAUNCH} fill="none" stroke={url("haunch")} strokeWidth="2.2" strokeLinecap="round" />
      {/* crisp shoulder character line */}
      <path d={SHOULDER} fill="none" stroke={url("line")} strokeWidth="1.3" />
      <path d={SHOULDER} transform="translate(0 2)" fill="none" stroke="#000" strokeOpacity=".7" strokeWidth="1.2" />
      {/* rim light along the roof and hood */}
      <path d={ROOF_RIM} fill="none" stroke={url("rim")} strokeWidth="2.4" strokeLinecap="round" />
      <path d={HOOD_RIM} fill="none" stroke={url("hoodrim")} strokeWidth="2" strokeLinecap="round" />
      {/* glass */}
      <path d={DLO} fill={url("glass")} />
      <g clipPath={url("dloclip")}>
        <path d="M572 66 L628 66 L554 170 L498 170 Z" fill="#fff" opacity=".07" />
        <path d="M642 66 L658 66 L584 170 L568 170 Z" fill="#fff" opacity=".05" />
        <path d="M240 142 C380 120 520 106 710 112 L710 170 L240 170 Z" fill="#000" opacity=".35" />
      </g>
      {/* B-pillar */}
      <path d="M452 76 L466 76 L486 151 L471 150 Z" fill="#070708" />
      {/* chrome window surround */}
      <path d={DLO} fill="none" stroke={url("chrome")} strokeWidth="2.6" strokeLinejoin="round" />
      {/* mirror */}
      <path d="M690 168 L700 158" stroke="#0a0a0b" strokeWidth="5" strokeLinecap="round" />
      <path d="M670 160 C678 144 714 141 724 152 C728 161 718 168 698 168 C682 168 670 166 670 160 Z" fill={url("paint")} />
      <path d="M674 154 C686 145 710 144 721 151" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.2" strokeLinecap="round" />
      {/* door shut lines */}
      <path d="M732 166 C726 210 732 254 748 286" fill="none" stroke="#000" strokeWidth="1.6" />
      <path d="M733.5 166 C727.5 210 733.5 254 749.5 286" fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="1" />
      <path d="M478 156 C486 198 490 242 476 286" fill="none" stroke="#000" strokeWidth="1.6" />
      <path d="M479.5 156 C487.5 198 491.5 242 477.5 286" fill="none" stroke="#fff" strokeOpacity=".06" strokeWidth="1" />
      {/* flush handle */}
      <rect x="508" y="200" width="48" height="5" rx="2.5" fill={url("chrome")} opacity=".85" />
      {/* sill blade */}
      <path d="M396 283 L774 283" stroke="#fff" strokeOpacity=".08" strokeWidth="1.4" />
      {/* front splitter + intake */}
      <path d="M990 287 L1016 287 C1032 287 1044 280 1048 270 L1030 270 C1022 278 1008 282 990 282 Z" fill="#050505" />
      <path d="M1008 248 L1048 248" stroke="#000" strokeWidth="5" strokeLinecap="round" />
      {/* exhaust */}
      <ellipse cx="74" cy="279" rx="9" ry="4.5" fill="#1b1c1e" stroke="#6b6e74" strokeWidth="1" />
      {/* lamps */}
      <path
        d="M998 206 C1020 207 1040 212 1049 222 L1046 227 C1034 219 1016 214 996 212 Z"
        fill={lights ? "#f4f6fb" : "#3a3c40"}
        className="lp-car-head"
      />
      <path
        d="M55 170 C63 163 84 157 112 152 L113 157 C88 162 67 167 58 176 Z"
        fill={lights ? "#ff2b2b" : "#5a1414"}
        className="lp-car-tail"
      />
      {/* top edge definition so the silhouette reads on black */}
      <path d={BODY} fill="none" stroke="#fff" strokeOpacity=".05" strokeWidth="1" />
    </>
  );

  const wheel = (w: { cx: number; cy: number }, i: number) => (
    <g key={`w${i}`} transform={`translate(${w.cx} ${w.cy})`}>
      <circle r={CAR_TIRE_R} fill={url("tire")} />
      <circle r={74} fill="none" stroke="#2a2a2c" strokeWidth="1.4" />
      <circle r={64} fill="none" stroke="#0e0e0f" strokeWidth="3" />
      <circle r={61} fill={url("barrel")} />
      <g data-wheel-scroll="">
        <g data-wheel="" data-wheel-intro="">
          <circle r={45} fill={url("disc")} />
          {HOLES.map((a) => (
            <circle key={a} cx={0} cy={-35} r={1.9} fill="#141415" transform={`rotate(${a})`} />
          ))}
          <circle r={18} fill="#1a1b1d" />
        </g>
      </g>
      {/* caliper (does not turn) */}
      <path
        d="M -36.4 -21 A 42 42 0 0 1 -10.9 -40.6"
        fill="none"
        stroke={url("caliper")}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <g data-wheel-scroll="">
        <g data-wheel="" data-wheel-intro="">
          {SPOKE_ANGLES.map((a) => (
            <path key={a} d="M-3.8 -14 L3.8 -14 L6.5 -58 L-6.5 -58 Z" fill={url("spoke")} transform={`rotate(${a})`} />
          ))}
          <circle r={14} fill={url("hub")} stroke="#9ea2a9" strokeWidth="1" />
          <circle r={4.2} fill="#d9dbe0" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={0} cy={-9} r={1.6} fill="#0d0d0e" transform={`rotate(${a + 36})`} />
          ))}
        </g>
      </g>
      <circle r={60.5} fill="none" stroke={url("lip")} strokeWidth="2.4" />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${CAR_VIEW.w} ${reflection ? CAR_VIEW.h + 60 : CAR_VIEW.h}`}
      className={cn("lp-car block h-auto w-full overflow-visible", className)}
      style={style}
      role="img"
      aria-label="A black sports car"
    >
      <defs>
        <linearGradient id={id("paint")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b5f66" />
          <stop offset=".1" stopColor="#24262a" />
          <stop offset=".3" stopColor="#0d0e10" />
          <stop offset=".55" stopColor="#070708" />
          <stop offset=".78" stopColor="#0c0c0e" />
          <stop offset=".9" stopColor="#151619" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={id("lower")} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".72" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id={id("band")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".35" stopColor="#fff" stopOpacity=".07" />
          <stop offset=".62" stopColor="#fff" stopOpacity=".13" />
          <stop offset=".85" stopColor="#fff" stopOpacity=".05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("crest")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".13" />
          <stop offset="1" stopColor="#fff" stopOpacity=".02" />
        </linearGradient>
        <linearGradient id={id("ends")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".6" />
          <stop offset=".12" stopColor="#000" stopOpacity="0" />
          <stop offset=".88" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".5" />
        </linearGradient>
        <linearGradient id={id("floor")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".05" />
        </linearGradient>
        <linearGradient id={id("line")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".25" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".85" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("haunch")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".42" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("rim")} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".1" />
          <stop offset=".3" stopColor="#fff" stopOpacity=".75" />
          <stop offset=".6" stopColor="#fff" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("hoodrim")} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".2" />
          <stop offset=".4" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity=".05" />
        </linearGradient>
        <linearGradient id={id("glass")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4048" />
          <stop offset=".35" stopColor="#171a1f" />
          <stop offset="1" stopColor="#060708" />
        </linearGradient>
        <linearGradient id={id("chrome")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3f4f6" />
          <stop offset=".35" stopColor="#8e9299" />
          <stop offset=".55" stopColor="#e6e8eb" />
          <stop offset="1" stopColor="#5d6168" />
        </linearGradient>
        <radialGradient id={id("tire")}>
          <stop offset=".7" stopColor="#141415" />
          <stop offset=".93" stopColor="#0b0b0c" />
          <stop offset="1" stopColor="#030303" />
        </radialGradient>
        <radialGradient id={id("barrel")}>
          <stop offset=".5" stopColor="#0a0a0b" />
          <stop offset="1" stopColor="#1c1d20" />
        </radialGradient>
        <radialGradient id={id("disc")} cx=".4" cy=".35">
          <stop offset="0" stopColor="#6d7076" />
          <stop offset=".7" stopColor="#3a3c40" />
          <stop offset="1" stopColor="#232427" />
        </radialGradient>
        <linearGradient id={id("caliper")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ef3b3b" />
          <stop offset="1" stopColor="#8f1414" />
        </linearGradient>
        <linearGradient id={id("spoke")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5f636a" />
          <stop offset=".45" stopColor="#e9ebee" />
          <stop offset=".6" stopColor="#c3c6cb" />
          <stop offset="1" stopColor="#40434a" />
        </linearGradient>
        <radialGradient id={id("hub")} cx=".35" cy=".3">
          <stop offset="0" stopColor="#c9ccd1" />
          <stop offset="1" stopColor="#3d4046" />
        </radialGradient>
        <linearGradient id={id("lip")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5f6f8" />
          <stop offset=".5" stopColor="#6d7178" />
          <stop offset="1" stopColor="#d9dbdf" />
        </linearGradient>
        <radialGradient id={id("shadow")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".55" />
          <stop offset=".6" stopColor="#000" stopOpacity=".22" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("sheen")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("fade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".22" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id("refmask")} maskUnits="userSpaceOnUse" x="0" y={CAR_VIEW.ground} width={CAR_VIEW.w} height="200">
          <rect x="0" y={CAR_VIEW.ground} width={CAR_VIEW.w} height="200" fill={url("fade")} />
        </mask>
        <clipPath id={id("dloclip")}>
          <path d={DLO} />
        </clipPath>
        <clipPath id={id("bodyclip")}>
          <path d={BODY} />
        </clipPath>
        <filter id={id("glow")} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="552" cy={CAR_VIEW.ground + 2} rx="540" ry="16" fill={url("shadow")} />
      {CAR_WHEELS.map((w) => (
        <ellipse key={`cs${w.cx}`} cx={w.cx} cy={CAR_VIEW.ground} rx="70" ry="5" fill="#000" opacity=".7" />
      ))}

      {reflection ? (
        <g mask={url("refmask")} className="lp-car-reflection">
          <g transform={`matrix(1 0 0 -1 0 ${CAR_VIEW.ground * 2})`}>
            {paint}
            {CAR_WHEELS.map(wheel)}
          </g>
        </g>
      ) : null}

      <g className="lp-car-body">
        {paint}
        {sheen ? (
          <g clipPath={url("bodyclip")}>
            <rect className="lp-car-sheen" x="-260" y="40" width="220" height="280" fill={url("sheen")} transform="skewX(-18)" />
          </g>
        ) : null}
        {CAR_WHEELS.map(wheel)}
        {lights ? (
          <g className="lp-car-glow" filter={url("glow")} aria-hidden="true">
            <path d="M998 206 C1020 207 1040 212 1049 222 L1046 227 C1034 219 1016 214 996 212 Z" fill="#fff" />
            <path d="M55 170 C63 163 84 157 112 152 L113 157 C88 162 67 167 58 176 Z" fill="#ff2020" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
