// Unrecalled mascot: a friendly scalloped "safety seal" with a face, arms and legs,
// in a few colours and poses. Original artwork (not anyone else's character).
// API: <Mascot pose="wave|read|write|alert|watch|sit" color="blue|coral|violet|teal|amber" />
import { useId } from "react";

import { cn } from "@/lib/utils";

export type MascotPose = "wave" | "read" | "write" | "alert" | "watch" | "sit";
export type MascotColor = "blue" | "coral" | "violet" | "teal" | "amber";

const FILL: Record<MascotColor, [string, string]> = {
  blue: ["#5B8CF0", "#3F6FE0"],
  coral: ["#FF7A6B", "#F2554A"],
  violet: ["#A98BF5", "#8B6BEA"],
  teal: ["#3CCFC0", "#1FB3A5"],
  amber: ["#FFC14D", "#F5A524"],
};

/** Scalloped seal outline centred at (60,58), radius ~34. */
function sealPath(cx = 60, cy = 58, r = 34, bumps = 14, depth = 4.2) {
  const pts: string[] = [];
  const n = bumps * 2;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r + depth : r - depth * 0.35;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")}Z`;
}
const SEAL = sealPath();

const INK = "#0B1630";

function Prop({ pose }: { pose: MascotPose }) {
  switch (pose) {
    case "read": // magnifying glass in the right hand
      return (
        <g>
          <path d="M92 66 L104 54" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="108" cy="49" r="8.5" fill="#E8F3FF" stroke={INK} strokeWidth="3" />
          <path d="M104.5 45.5 a5 5 0 0 1 6 -0.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      );
    case "write": // a document held in front
      return (
        <g>
          <rect x="74" y="64" width="26" height="32" rx="3" fill="#fff" stroke={INK} strokeWidth="2.6" transform="rotate(8 87 80)" />
          <path d="M80 73 h14 M80 79 h14 M80 85 h9" stroke="#9AA6BD" strokeWidth="2" strokeLinecap="round" transform="rotate(8 87 80)" />
        </g>
      );
    case "alert": // a small warning flag
      return (
        <g>
          <path d="M98 70 L98 30" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M98 31 L118 37 L98 44 Z" fill="#F2554A" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      );
    case "watch": // binoculars
      return (
        <g>
          <rect x="44" y="44" width="13" height="12" rx="4" fill={INK} />
          <rect x="63" y="44" width="13" height="12" rx="4" fill={INK} />
          <rect x="55" y="47" width="10" height="5" rx="2" fill={INK} />
          <circle cx="50.5" cy="50" r="3" fill="#7FB2FF" />
          <circle cx="69.5" cy="50" r="3" fill="#7FB2FF" />
        </g>
      );
    default:
      return null;
  }
}

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
  const gid = useId().replace(/:/g, "");
  const [c1, c2] = FILL[color];
  const watching = pose === "watch";
  const sitting = pose === "sit";
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("size-24 overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id={`m${gid}`} cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </radialGradient>
      </defs>
      {/* soft ground shadow */}
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#0B1630" opacity="0.10" />
      {/* legs */}
      {sitting ? (
        <g stroke={INK} strokeWidth="3.6" strokeLinecap="round" fill="none">
          <path d="M48 90 L40 100" />
          <path d="M72 90 L82 100" />
        </g>
      ) : (
        <g stroke={INK} strokeWidth="3.6" strokeLinecap="round" fill="none">
          <path d="M50 90 L46 106" />
          <path d="M70 90 L76 105" />
        </g>
      )}
      <g fill={INK}>
        {sitting ? (
          <>
            <ellipse cx="38" cy="101" rx="6" ry="3.4" />
            <ellipse cx="84" cy="101" rx="6" ry="3.4" />
          </>
        ) : (
          <>
            <ellipse cx="44" cy="107" rx="6.5" ry="3.6" />
            <ellipse cx="78" cy="106" rx="6.5" ry="3.6" />
          </>
        )}
      </g>
      {/* left arm */}
      {pose === "wave" ? (
        <path d="M30 62 Q18 50 22 36" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M28 64 Q20 72 24 80" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      )}
      {/* body */}
      <path d={SEAL} fill={`url(#m${gid})`} />
      <path d={SEAL} fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.2" />
      {/* face */}
      {watching ? null : (
        <g>
          <ellipse cx="51" cy="53" rx="4.6" ry="5.4" fill="#fff" />
          <ellipse cx="69" cy="53" rx="4.6" ry="5.4" fill="#fff" />
          <circle cx="52.2" cy="54.4" r="2.5" fill={INK} />
          <circle cx="70.2" cy="54.4" r="2.5" fill={INK} />
        </g>
      )}
      <path d="M53 66 Q60 72 67 66" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <ellipse cx="44" cy="63" rx="3.6" ry="2.2" fill="#fff" opacity="0.28" />
      <ellipse cx="76" cy="63" rx="3.6" ry="2.2" fill="#fff" opacity="0.28" />
      {/* right arm (holds the prop) */}
      {pose === "wave" || pose === "sit" ? (
        <path d="M92 64 Q102 70 98 80" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      ) : pose === "write" ? (
        <path d="M90 66 Q96 72 92 78" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      ) : pose === "watch" ? (
        <>
          <path d="M30 62 Q36 56 46 52" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M90 62 Q84 56 74 52" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <path d="M90 64 Q96 66 98 68" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      )}
      <Prop pose={pose} />
    </svg>
  );
}
