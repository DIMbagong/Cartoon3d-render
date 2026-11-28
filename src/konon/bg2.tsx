// House-wall backgrounds for the Cicak story: day / golden / night variants.
import React from "react";

export type WallVariant = "day" | "golden" | "night";

export const Wall: React.FC<{ variant?: WallVariant; frame?: number }> = ({ variant = "day", frame = 0 }) => {
  const night = variant === "night";
  const golden = variant === "golden";
  const wallFill = night ? "#5a6b8c" : golden ? "#f7cf9e" : "#f3e2c7";
  const skyFill = night ? "#1d2a4a" : golden ? "#ff9e5e" : "#79bfe8";
  return (
    <svg viewBox="0 0 720 1280" style={{ display: "block", width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffedb5" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#ffdf8a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffdf8a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* sky strip + roof */}
      <rect x="0" y="0" width="720" height="150" fill={skyFill} />
      {night ? <g fill="#ffffff"><circle cx="90" cy="52" r="3" /><circle cx="230" cy="30" r="2.4" /><circle cx="430" cy="58" r="2.8" /><circle cx="610" cy="34" r="2.2" /><circle cx="690" cy="80" r="2.6" /><circle cx="330" cy="76" r="2" /></g>
        : <circle cx="622" cy="66" r="34" fill={golden ? "#ffdf8a" : "#fff6c9"} />}
      <path d="M0 118 L720 118 L720 168 Q 660 148 600 168 Q 540 148 480 168 Q 420 148 360 168 Q 300 148 240 168 Q 180 148 120 168 Q 60 148 0 168 Z" fill={night ? "#4a3a3a" : "#a5503c"} />
      {/* wall */}
      <rect x="0" y="160" width="720" height="928" fill={wallFill} />
      <g stroke={night ? "#4c5c7a" : "#e3cba6"} strokeWidth="3" opacity="0.7">
        <line x1="0" y1="330" x2="720" y2="330" /><line x1="0" y1="520" x2="720" y2="520" />
        <line x1="0" y1="710" x2="720" y2="710" /><line x1="0" y1="900" x2="720" y2="900" />
      </g>
      {/* window */}
      <g>
        <rect x="66" y="238" width="212" height="252" rx="10" fill={night ? "#ffca7a" : "#bfe6f7"} stroke="#7a4a2b" strokeWidth="14" />
        <line x1="172" y1="238" x2="172" y2="490" stroke="#7a4a2b" strokeWidth="10" />
        <line x1="66" y1="364" x2="278" y2="364" stroke="#7a4a2b" strokeWidth="10" />
        {night ? <path d="M 84 470 L 160 260 L 196 260 L 120 470 Z" fill="#ffe3a3" opacity="0.5" />
          : <path d="M 84 470 L 160 260 L 196 260 L 120 470 Z" fill="#ffffff" opacity="0.45" />}
        <rect x="52" y="490" width="240" height="18" rx="8" fill="#7a4a2b" />
      </g>
      {/* hanging plant pot */}
      <g>
        <line x1="470" y1="168" x2="512" y2="238" stroke="#5d4526" strokeWidth="6" />
        <line x1="596" y1="168" x2="554" y2="238" stroke="#5d4526" strokeWidth="6" />
        <path d="M 462 238 L 604 238 L 578 316 L 488 316 Z" fill="#c96f4a" stroke="#26303a" strokeWidth="5" strokeLinejoin="round" />
        <path d="M 470 244 Q 440 210 414 236 Q 452 236 462 258 Q 452 218 486 200 Q 496 232 520 206 Q 540 234 572 204 Q 584 236 614 224 Q 596 252 578 244 Q 540 226 470 244 Z" fill={night ? "#3e7d46" : "#57b25e"} stroke="#2c7a38" strokeWidth="4" strokeLinejoin="round" />
      </g>
      {/* terrace lamp */}
      <g>
        <rect x="352" y="252" width="12" height="30" fill="#4a3a2a" />
        <path d="M 322 282 L 394 282 L 380 316 L 336 316 Z" fill="#4a3a2a" />
        <circle cx="358" cy="330" r="17" fill={night ? "#ffedb5" : "#e8e2d2"} stroke="#4a3a2a" strokeWidth="5" />
        {night ? <circle cx="358" cy="330" r="150" fill="url(#lampGlow)" /> : null}
      </g>
      {/* ground */}
      <rect x="0" y="1088" width="720" height="192" fill={night ? "#3d4c68" : golden ? "#d9b77c" : "#e6cd8d"} />
      <line x1="0" y1="1088" x2="720" y2="1088" stroke={night ? "#2c3a56" : "#c9ab6a"} strokeWidth="6" />
      <g stroke={night ? "#33425e" : "#d4ba7d"} strokeWidth="4">
        <line x1="120" y1="1088" x2="86" y2="1280" /><line x1="330" y1="1088" x2="322" y2="1280" /><line x1="540" y1="1088" x2="566" y2="1280" />
      </g>
      {/* ground flower pot (the cat's hiding place) */}
      <g>
        <path d="M 566 996 L 690 996 L 668 1092 L 588 1092 Z" fill="#c96f4a" stroke="#26303a" strokeWidth="5" strokeLinejoin="round" />
        <ellipse cx="628" cy="972" rx="86" ry="42" fill={night ? "#3e7d46" : "#57b25e"} stroke="#2c7a38" strokeWidth="4" />
        <ellipse cx="580" cy="946" rx="42" ry="30" fill={night ? "#499152" : "#68c06e"} />
        <ellipse cx="676" cy="950" rx="38" ry="27" fill={night ? "#499152" : "#68c06e"} />
      </g>
      {golden ? <rect width="720" height="1280" fill="#ff8f3f" opacity="0.12" /> : null}
      {/* mosquito near the lamp at night: drawn by the composition */}
      <circle cx={0} cy={-100 + frame * 0} r="0" fill="none" />
    </svg>
  );
};
