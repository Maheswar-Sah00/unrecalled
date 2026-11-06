// Unrecalled mascot: a round scalloped "safety seal" with big eyes, stubby ink
// limbs and a prop per pose. Original artwork (not anyone else's character).
// API: <Mascot pose="wave|read|write|alert|watch|sit" color="blue|coral|violet|teal|amber" />
// Optional hooks for motion (styled in app/styles/landing.css, inert elsewhere):
//   .ur-m-eyes (blink), .ur-m-wave (waving arm), .ur-m-legs (swinging legs).
import { type CSSProperties, useId } from "react";

import { cn } from "@/lib/utils";

export type MascotPose = "wave" | "read" | "write" | "alert" | "watch" | "sit";
export type MascotColor = "blue" | "coral" | "violet" | "teal" | "amber";

/** [highlight, base, shade] */
const FILL: Record<MascotColor, [string, string, string]> = {
  blue: ["#7AA6FF", "#4C82F5", "#3466DB"],
  coral: ["#FF9A8C", "#FF6B5C", "#E84E43"],
  violet: ["#C4AEFF", "#A285F7", "#8264E6"],
  teal: ["#6FE0D3", "#2CC3B4", "#169C90"],
  amber: ["#FFD57A", "#FFBA3B", "#EE9B12"],
};

/** Pupils, mouth: always dark (they sit on white / colour). */
const EYE = "#0D1633";

/** Rounded scallops (cubic bumps) with a little hand-made irregularity. */
function scallop(cx: number, cy: number, rIn: number, rOut: number, n: number) {
  const wob = [1, 0.97, 1.03, 0.99, 1.02, 0.96, 1.01, 1.03, 0.98, 1, 0.97, 1.02, 0.99];
  const step = (Math.PI * 2) / n;
  const off = -Math.PI / 2 + step / 2;
  const pt = (r: number, a: number) =>
    `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  let d = `M${pt(rIn, off)}`;
  for (let i = 0; i < n; i++) {
    const a0 = off + i * step;
    const a1 = a0 + step;
    const ro = rOut * (wob[i % wob.length] ?? 1);
    const rc = (ro - 0.25 * rIn * Math.cos(step / 2)) / 0.75;
    d += ` C${pt(rc, a0 + step * 0.16)} ${pt(rc, a1 - step * 0.16)} ${pt(rIn, a1)}`;
  }
  return `${d}Z`;
}
const BODY = scallop(60, 52, 30.8, 34.6, 13);

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
  // Limbs are navy on paper, pale on midnight so they never disappear.
  const limb: CSSProperties = { stroke: "var(--ur-m-ink)" };
  const limbFill: CSSProperties = { fill: "var(--ur-m-ink)" };
  const sitting = pose === "sit";

  // Where the pupils look, per pose.
  const look: Record<MascotPose, [number, number]> = {
    wave: [1.4, 0.6],
    read: [2.2, -1.4],
    write: [1.2, 2.2],
    alert: [0, 0],
    watch: [0, 0],
    sit: [-1.2, 1.2],
  };
  const [lx, ly] = look[pose];

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
        <radialGradient id={`b${gid}`} cx="36%" cy="28%" r="80%">
          <stop offset="0%" stopColor={hi} />
          <stop offset="55%" stopColor={base} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
      </defs>

      {/* ground shadow, tinted like the body */}
      {sitting ? null : <ellipse cx="60" cy="108" rx="27" ry="4.6" fill={base} opacity="0.2" />}

      {/* legs + feet (behind the body) */}
      <g className="ur-m-legs" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeWidth="5.6" style={limb}>
        {sitting ? (
          <>
            <path d="M51 78 Q49 88 47 98" />
            <path d="M69 78 Q72 88 74 98" />
          </>
        ) : pose === "wave" ? (
          <>
            <path d="M52 78 Q49 90 45 101" />
            <path d="M68 78 Q73 88 79 98" />
          </>
        ) : (
          <>
            <path d="M52 79 Q51 91 49 102" />
            <path d="M68 79 Q70 91 71 102" />
          </>
        )}
      </g>
      <g style={limbFill} className="ur-m-legs">
        {sitting ? (
          <>
            <path d="M40 98.5 q0 -4.5 6 -4.5 q6.5 0 6.5 4 q0 3.2 -6 3.2 h-3.5 q-3 0 -3 -2.7z" />
            <path d="M69 98 q0 -4 6.5 -4 q6 0 6 4.5 q0 2.7 -3 2.7 h-3.5 q-6 0 -6 -3.2z" />
          </>
        ) : pose === "wave" ? (
          <>
            <path d="M37 101.5 q0 -4.5 6.5 -4.5 q6.5 0 6.5 4 q0 3.4 -6 3.4 h-4 q-3 0 -3 -2.9z" />
            <path d="M76 98.5 q1 -4.6 7 -3.9 q6 .8 5.4 4.8 q-.5 3 -3.4 2.6 l-4.4 -.6 q-5 -.7 -4.6 -2.9z" />
          </>
        ) : (
          <>
            <path d="M41 102.5 q0 -4.5 6.5 -4.5 q6.5 0 6.5 4 q0 3.4 -6 3.4 h-4 q-3 0 -3 -2.9z" />
            <path d="M66 102.5 q0 -4 6.5 -4 q6.5 0 6.5 4.5 q0 2.9 -3 2.9 h-4 q-6 0 -6 -3.4z" />
          </>
        )}
      </g>

      {/* back arm (left side of the character) */}
      <g strokeLinecap="round" fill="none" strokeWidth="5.2" style={limb}>
        {pose === "wave" ? (
          <g className="ur-m-wave" style={{ transformOrigin: "34px 58px" }}>
            <path d="M34 58 Q22 49 23 33" />
            <path d="M14 30 q-3 4 -2 9 M17 24 q-6 3 -7 10" strokeWidth="2.2" style={{ stroke: base }} opacity="0.85" />
          </g>
        ) : pose === "watch" ? (
          <path d="M35 60 Q38 50 46 47" />
        ) : pose === "write" ? (
          <path d="M35 62 Q42 76 58 75" />
        ) : pose === "sit" ? (
          <path d="M34 62 Q30 72 40 80" />
        ) : pose === "alert" ? (
          <path d="M34 60 Q24 64 27 74" />
        ) : (
          <path d="M34 61 Q25 70 29 80" />
        )}
      </g>

      {/* body */}
      <path d={BODY} fill={`url(#b${gid})`} />
      <path
        d={BODY}
        fill="none"
        stroke={shade}
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      {/* soft top-left sheen */}
      <ellipse cx="47" cy="33" rx="9" ry="4.5" fill="#fff" opacity="0.22" transform="rotate(-24 47 33)" />

      {/* face */}
      {pose === "watch" ? null : (
        <g>
          <g className="ur-m-eyes" style={{ transformOrigin: "60px 48px" }}>
            <ellipse cx="51" cy="47" rx="7" ry={pose === "alert" ? 8.6 : 7.9} fill="#fff" />
            <ellipse cx="69" cy="47" rx="7" ry={pose === "alert" ? 8.6 : 7.9} fill="#fff" />
            <circle cx={51 + lx} cy={47.8 + ly} r="3.9" fill={EYE} />
            <circle cx={69 + lx} cy={47.8 + ly} r="3.9" fill={EYE} />
            <circle cx={52.4 + lx} cy={46.2 + ly} r="1.3" fill="#fff" />
            <circle cx={70.4 + lx} cy={46.2 + ly} r="1.3" fill="#fff" />
          </g>
        </g>
      )}
      {pose === "alert" ? (
        <ellipse cx="60" cy="62.5" rx="3" ry="3.6" fill={EYE} />
      ) : (
        <path d="M55.5 60.5 Q60 65.5 64.5 60.5" stroke={EYE} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}
      <ellipse cx="42.5" cy="58" rx="3.8" ry="2.3" fill="#FF8FA8" opacity="0.5" />
      <ellipse cx="77.5" cy="58" rx="3.8" ry="2.3" fill="#FF8FA8" opacity="0.5" />

      <Front pose={pose} base={base} limb={limb} limbFill={limbFill} />
    </svg>
  );
}

/** Front arm + prop, drawn over the body. */
function Front({
  pose,
  base,
  limb,
  limbFill,
}: {
  pose: MascotPose;
  base: string;
  limb: CSSProperties;
  limbFill: CSSProperties;
}) {
  const arm = (d: string) => (
    <path d={d} strokeLinecap="round" fill="none" strokeWidth="5.2" style={limb} />
  );
  switch (pose) {
    case "read": // magnifying glass held up beside the face
      return (
        <g>
          {arm("M86 61 Q97 60 99 50")}
          <path d="M99 50 L102.5 43" strokeWidth="4.4" strokeLinecap="round" style={limb} />
          <circle cx="106.5" cy="34" r="10" fill="#EAF3FF" fillOpacity="0.75" strokeWidth="3.4" style={limb} />
          <path d="M101 30.5 a6.5 6.5 0 0 1 7 -3.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </g>
      );
    case "write": // a petition with a seal, held in front
      return (
        <g>
          <g transform="rotate(9 82 76)">
            <rect x="68" y="60" width="28" height="35" rx="3.5" fill="#fff" strokeWidth="2.6" style={limb} />
            <path d="M73.5 68 h17 M73.5 73.5 h17 M73.5 79 h11" stroke="#9AA6BD" strokeWidth="2.1" strokeLinecap="round" />
            <circle cx="88" cy="87" r="4.2" fill={base} />
            <path d="M86.3 87 l1.3 1.3 2.4 -2.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          {/* pencil in the near hand */}
          <path d="M57 75 L66 67" stroke="#FFC24A" strokeWidth="4" strokeLinecap="round" />
          <path d="M66 67 L69 64" style={limb} strokeWidth="2.2" strokeLinecap="round" />
          {arm("M86 62 Q93 66 92 72")}
        </g>
      );
    case "alert": // a little flag, raised
      return (
        <g>
          {arm("M86 60 Q95 58 95 49")}
          <path d="M95 74 L95 18" strokeWidth="3.2" strokeLinecap="round" style={limb} />
          <path d="M96 19 Q106 17 114 22 Q106 27 96 33 Z" fill="#FF6B5C" strokeWidth="2" strokeLinejoin="round" style={limb} />
          <circle cx="95" cy="49" r="3.3" style={limbFill} />
        </g>
      );
    case "watch": // binoculars over the eyes
      return (
        <g>
          {arm("M85 60 Q82 50 74 47")}
          <rect x="41" y="38" width="17" height="17" rx="6" style={limbFill} />
          <rect x="62" y="38" width="17" height="17" rx="6" style={limbFill} />
          <rect x="55" y="42.5" width="10" height="7" rx="2.5" style={limbFill} />
          <circle cx="49.5" cy="46.5" r="5" fill="#8DB8FF" />
          <circle cx="70.5" cy="46.5" r="5" fill="#8DB8FF" />
          <circle cx="47.6" cy="44.6" r="1.6" fill="#fff" />
          <circle cx="68.6" cy="44.6" r="1.6" fill="#fff" />
        </g>
      );
    case "sit":
      return arm("M86 62 Q90 72 80 80");
    default: // wave: relaxed near arm
      return arm("M86 61 Q95 69 91 79");
  }
}
