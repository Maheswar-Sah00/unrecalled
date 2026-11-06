// Unrecalled mascot: "Docket", a little car seen from the front. Headlights
// are its eyes (steady, slightly lidded: an inspector, not a toy), the grille
// is its mouth, the scales of justice ride on the roof like a taxi sign, and
// the plate reads 552 (49 CFR Part 552, the defect-petition rule).
// When something is wrong ("alert") the scales tip out of balance.
// Original artwork. API unchanged:
//   <Mascot pose="wave|read|write|alert|watch|sit" color="blue|coral|violet|teal|amber" />
// Motion hooks (styled in app/styles/landing.css): .ur-m-eyes (blink), .ur-m-wave.
import { type CSSProperties, useId } from "react";

import { cn } from "@/lib/utils";

export type MascotPose = "wave" | "read" | "write" | "alert" | "watch" | "sit";
export type MascotColor = "blue" | "coral" | "violet" | "teal" | "amber";

/** [highlight, base, shade] */
const FILL: Record<MascotColor, [string, string, string]> = {
  blue: ["#6F9BFA", "#3F72E6", "#2A55BF"],
  coral: ["#F79486", "#E8604F", "#C9473A"],
  violet: ["#B29CF5", "#8C6FE6", "#6C50C7"],
  teal: ["#5ED2C4", "#22AE9F", "#14887C"],
  amber: ["#FFCF6E", "#F5A623", "#D4860B"],
};

const DARK = "#141C33"; // pupils, grille, tyres
const GOLD = "#F2B33D";

/** Where the headlights look, and how low the lids sit, per pose. */
const LOOK: Record<MascotPose, { x: number; y: number; lid: number }> = {
  wave: { x: 1.2, y: 0.6, lid: 3.4 },
  read: { x: 2.6, y: -1.2, lid: 4.4 },
  write: { x: 2.8, y: 1.6, lid: 4 },
  alert: { x: 0, y: 0, lid: 1.4 },
  watch: { x: 3, y: -0.6, lid: 3.8 },
  sit: { x: -1, y: 1.6, lid: 5.4 },
};

const EYE_R = 8.6;
const EYES: [number, number][] = [
  [37, 70],
  [83, 70],
];

export function Mascot({
  pose = "wave",
  color = "blue",
  className,
  title,
}: {
  pose?: MascotPose;
  color?: MascotColor;
  className?: string;
  title?: string;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [hi, base, shade] = FILL[color];
  const limb: CSSProperties = { stroke: "var(--ur-m-ink)" };
  const limbFill: CSSProperties = { fill: "var(--ur-m-ink)" };
  const look = LOOK[pose];
  // Scales: level when calm, tipped when there's a defect.
  const tilt = pose === "alert" ? 14 : pose === "read" ? -5 : 0;

  return (
    <svg
      viewBox="0 0 120 120"
      className={cn(
        "size-24 overflow-visible [--ur-m-ink:#13204A] dark:[--ur-m-ink:#D9E1F7]",
        className,
      )}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`b${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hi} />
          <stop offset="45%" stopColor={base} />
          <stop offset="100%" stopColor={shade} />
        </linearGradient>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#F2F7FF" />
          <stop offset="100%" stopColor="#B7CFF7" />
        </linearGradient>
        {EYES.map(([cx, cy], i) => (
          <clipPath key={i} id={`e${gid}${i}`}>
            <circle cx={cx} cy={cy} r={EYE_R} />
          </clipPath>
        ))}
      </defs>

      {/* ground shadow */}
      <ellipse cx="60" cy="104.5" rx="42" ry="4.2" fill={base} opacity="0.18" />

      {/* tyres (behind the body) */}
      <rect x="25" y="84" width="14" height="19" rx="4.5" fill={DARK} />
      <rect x="81" y="84" width="14" height="19" rx="4.5" fill={DARK} />

      {/* back arm */}
      <BackArm pose={pose} base={base} limb={limb} limbFill={limbFill} />

      {/* roof scales of justice */}
      <Scales tilt={tilt} limb={limb} />

      {/* cabin */}
      <path
        d="M29 59 L37 35.5 Q39.2 29 46 29 H74 Q80.8 29 83 35.5 L91 59 Z"
        fill={`url(#b${gid})`}
        stroke={shade}
        strokeWidth="1"
      />
      {/* windshield */}
      <path
        d="M37.5 56 L43 38.5 Q44.3 34.5 48.5 34.5 H71.5 Q75.7 34.5 77 38.5 L82.5 56 Z"
        fill={`url(#g${gid})`}
      />
      <path d="M47 53 L53.5 37.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M53 53 L57.5 42" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />

      {/* side mirrors */}
      <ellipse cx="24" cy="58" rx="5.4" ry="3.6" fill={base} stroke={shade} strokeWidth="1" />
      <ellipse cx="96" cy="58" rx="5.4" ry="3.6" fill={base} stroke={shade} strokeWidth="1" />

      {/* body */}
      <rect x="19" y="55" width="82" height="34" rx="13" fill={`url(#b${gid})`} stroke={shade} strokeWidth="1" />
      <path d="M27 60.5 Q60 56.5 93 60.5" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* headlight eyes, with steady lids */}
      <g className="ur-m-eyes" style={{ transformOrigin: "60px 70px" }}>
        {EYES.map(([cx, cy], i) => {
          const inner = i === 0 ? 1 : -1; // inner corner sits a touch lower: focused
          const top = cy - EYE_R;
          const yOuter = top + look.lid;
          const yInner = top + look.lid + 1;
          const xL = cx - EYE_R - 1;
          const xR = cx + EYE_R + 1;
          const yL = inner === 1 ? yOuter : yInner;
          const yR = inner === 1 ? yInner : yOuter;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={EYE_R + 1.6} fill={shade} opacity="0.55" />
              <circle cx={cx} cy={cy} r={EYE_R} fill="#fff" />
              <circle cx={cx + look.x} cy={cy + look.y + 0.8} r="4.1" fill={DARK} />
              <circle cx={cx + look.x + 1.4} cy={cy + look.y - 0.8} r="1.35" fill="#fff" />
              <g clipPath={`url(#e${gid}${i})`}>
                <path d={`M${xL} ${top - 2} H${xR} V${yR} L${xL} ${yL} Z`} fill={shade} />
                <path d={`M${xL} ${yL} L${xR} ${yR}`} stroke={DARK} strokeWidth="1.7" strokeLinecap="round" />
              </g>
            </g>
          );
        })}
      </g>

      {/* grille mouth */}
      {pose === "alert" ? (
        <rect x="54.5" y="71.5" width="11" height="10" rx="5" fill={DARK} />
      ) : (
        <g>
          <path
            d="M48.5 72.5 H71.5 Q73.4 72.5 72.9 74.4 Q70.4 81.5 60 81.5 Q49.6 81.5 47.1 74.4 Q46.6 72.5 48.5 72.5 Z"
            fill={DARK}
          />
          <path d="M51.5 75.6 H68.5" stroke="#3E4A6B" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}

      {/* bumper + plate */}
      <rect x="17" y="84.5" width="86" height="7" rx="3.5" fill="#E2E7F0" stroke="#9AA6BD" strokeWidth="0.8" />
      <rect x="50.5" y="84.6" width="19" height="7.6" rx="1.4" fill="#fff" stroke="#9AA6BD" strokeWidth="0.8" />
      <text
        x="60"
        y="90.6"
        textAnchor="middle"
        fontSize="5.6"
        fontWeight="800"
        fill="#13204A"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        letterSpacing="0.4"
      >
        552
      </text>

      <FrontArm pose={pose} base={base} limb={limb} limbFill={limbFill} />
    </svg>
  );
}

/** Gold scales on a short roof post. */
function Scales({ tilt, limb }: { tilt: number; limb: CSSProperties }) {
  const rad = (tilt * Math.PI) / 180;
  const half = 14;
  const dy = Math.sin(rad) * half;
  const dx = half - Math.cos(rad) * half;
  const pan = (x: number, y: number) => (
    <g>
      <path d={`M${x} ${y} L${x - 4} ${y + 7.5} M${x} ${y} L${x + 4} ${y + 7.5}`} strokeWidth="1.1" style={limb} />
      <path
        d={`M${x - 5.6} ${y + 7.5} H${x + 5.6} Q${x + 4.6} ${y + 11.6} ${x} ${y + 11.6} Q${x - 4.6} ${y + 11.6} ${x - 5.6} ${y + 7.5} Z`}
        fill={GOLD}
        strokeWidth="1.2"
        strokeLinejoin="round"
        style={limb}
      />
    </g>
  );
  return (
    <g>
      <path d="M60 29 V12" strokeWidth="2.2" strokeLinecap="round" style={limb} />
      <path d="M54.5 29.5 L56.5 26.5 H63.5 L65.5 29.5 Z" fill={GOLD} strokeWidth="1.1" strokeLinejoin="round" style={limb} />
      <path
        d={`M${60 - half + dx} ${12 - dy} L${60 + half - dx} ${12 + dy}`}
        strokeWidth="2.2"
        strokeLinecap="round"
        style={limb}
      />
      {pan(60 - half + dx, 12 - dy)}
      {pan(60 + half - dx, 12 + dy)}
      <circle cx="60" cy="11.5" r="2.4" fill={GOLD} strokeWidth="1.1" style={limb} />
    </g>
  );
}

type ArmProps = { pose: MascotPose; base: string; limb: CSSProperties; limbFill: CSSProperties };

function hand(x: number, y: number, limbFill: CSSProperties) {
  return <circle cx={x} cy={y} r="3.2" style={limbFill} />;
}

/** Left arm (viewer's left), drawn behind the body. */
function BackArm({ pose, base, limb, limbFill }: ArmProps) {
  const arm = (d: string) => <path d={d} strokeLinecap="round" fill="none" strokeWidth="4.6" style={limb} />;
  if (pose === "wave") {
    return (
      <g className="ur-m-wave" style={{ transformOrigin: "22px 70px" }}>
        {arm("M22 70 Q10 63 11 47")}
        {hand(11, 46, limbFill)}
        <path d="M3 44 q-2 4 -1 8 M6 38 q-5 3 -6 9" strokeWidth="2" strokeLinecap="round" fill="none" style={{ stroke: base }} opacity="0.8" />
      </g>
    );
  }
  return (
    <g>
      {arm("M21 72 Q12 78 14 87")}
      {hand(14, 88, limbFill)}
    </g>
  );
}

/** Right arm + prop, drawn over the body. */
function FrontArm({ pose, base, limb, limbFill }: ArmProps) {
  const arm = (d: string) => <path d={d} strokeLinecap="round" fill="none" strokeWidth="4.6" style={limb} />;
  switch (pose) {
    case "read": // magnifying glass
      return (
        <g>
          {arm("M99 71 Q107 67 106 58")}
          <path d="M106 58 L107.5 50.5" strokeWidth="3.8" strokeLinecap="round" style={limb} />
          <circle cx="109" cy="41.5" r="8.6" fill="#EAF3FF" fillOpacity="0.75" strokeWidth="3" style={limb} />
          <path d="M104.6 38.6 a5.4 5.4 0 0 1 5.8 -2.7" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" fill="none" />
          {hand(106, 58, limbFill)}
        </g>
      );
    case "write": // the petition, sealed
      return (
        <g>
          <g transform="rotate(8 104 72)">
            <rect x="93" y="56" width="23" height="30" rx="3" fill="#fff" strokeWidth="2.2" style={limb} />
            <path d="M97.5 63 h14 M97.5 67.8 h14 M97.5 72.6 h9" stroke="#9AA6BD" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="109.5" cy="79.5" r="3.8" fill={base} />
            <path d="M108 79.5 l1.1 1.1 2.1 -2.3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          {arm("M99 72 Q102 77 98 82")}
          {hand(97.5, 82.5, limbFill)}
        </g>
      );
    case "alert": // red flag raised
      return (
        <g>
          <path d="M106 80 V28" strokeWidth="2.6" strokeLinecap="round" style={limb} />
          <path d="M107 29 Q114 27.5 119 31.5 Q113.5 35.5 107 39.5 Z" fill="#E8604F" strokeWidth="1.6" strokeLinejoin="round" style={limb} />
          {arm("M99 70 Q106 66 106 58")}
          {hand(106, 57.5, limbFill)}
        </g>
      );
    case "watch": // hand shading the eyes, looking down the road
      return (
        <g>
          {arm("M99 70 Q106 60 97 55")}
          <path d="M98 55.5 L90 57" strokeWidth="4.6" strokeLinecap="round" style={limb} />
        </g>
      );
    default: // wave / sit: resting
      return (
        <g>
          {arm("M99 72 Q108 78 106 87")}
          {hand(106, 88, limbFill)}
        </g>
      );
  }
}
