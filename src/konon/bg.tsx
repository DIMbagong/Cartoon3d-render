// Flat illustrated pond backgrounds (day / dim / golden) + props, konon style.
import React from "react";

export type Variant = "day" | "dim" | "golden";

const Trees: React.FC<{ tone: string; dark?: boolean }> = ({ tone, dark }) => (
  <g>
    {/* far tree line */}
    <path d="M0 452 Q 45 408 95 446 Q 140 402 195 444 Q 250 406 305 446 Q 360 404 415 444 Q 470 408 525 446 Q 580 402 635 444 Q 685 412 720 440 L720 500 L0 500 Z" fill={tone} opacity={dark ? 0.85 : 0.75} />
    {/* big left tree */}
    <rect x="52" y="238" width="26" height="230" rx="10" fill="#8a5a34" />
    <circle cx="66" cy="196" r="86" fill={tone} /><circle cx="128" cy="238" r="62" fill={tone} /><circle cx="8" cy="248" r="56" fill={tone} />
    <circle cx="40" cy="168" r="34" fill="#ffffff" opacity="0.10" />
    {/* big right tree */}
    <rect x="644" y="252" width="24" height="216" rx="10" fill="#8a5a34" />
    <circle cx="656" cy="212" r="78" fill={tone} /><circle cx="712" cy="256" r="54" fill={tone} /><circle cx="600" cy="258" r="48" fill={tone} />
    <circle cx="632" cy="186" r="30" fill="#ffffff" opacity="0.10" />
  </g>
);

export const Pond: React.FC<{ variant?: Variant; frame?: number; zoom?: number }> = ({ variant = "day", frame = 0, zoom = 1 }) => {
  const golden = variant === "golden";
  const sky = golden ? "url(#skyG)" : "url(#skyD)";
  const water = golden ? "url(#watG)" : "url(#watD)";
  const treeTone = golden ? "#4c9455" : "#3f9e50";
  const flies = variant !== "day"
    ? Array.from({ length: 12 }, (_, i) => {
        const x = 60 + ((i * 173) % 600), y = 560 + ((i * 211) % 420);
        const o = 0.35 + 0.55 * Math.abs(Math.sin(frame / 22 + i * 1.7));
        return <g key={i}><circle cx={x} cy={y + Math.sin(frame / 30 + i) * 6} r="10" fill="#ffe98a" opacity={o * 0.35} /><circle cx={x} cy={y} r="4" fill="#fff3b0" opacity={o} /></g>;
      })
    : null;
  return (
    <svg viewBox="0 0 720 1280" style={{ display: "block", width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ea9e6" /><stop offset="70%" stopColor="#a8d8f5" /><stop offset="100%" stopColor="#e8f7ff" />
        </linearGradient>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8f4d" /><stop offset="55%" stopColor="#ffc46b" /><stop offset="100%" stopColor="#fff0bd" />
        </linearGradient>
        <linearGradient id="watD" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f9fd8" /><stop offset="100%" stopColor="#79cfee" />
        </linearGradient>
        <linearGradient id="watG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a86c8" /><stop offset="100%" stopColor="#8fb6dd" />
        </linearGradient>
      </defs>
      <g transform={`translate(360 800) scale(${zoom}) translate(-360 -800)`}>
        <rect x="-400" y="-200" width="1520" height="900" fill={sky} />
        {/* sun + clouds */}
        <circle cx={golden ? 590 : 618} cy={golden ? 300 : 128} r={golden ? 52 : 40} fill={golden ? "#ffdf8a" : "#fff6c9"} />
        <g fill="#ffffff" opacity="0.92">
          <ellipse cx="150" cy="120" rx="74" ry="26" /><ellipse cx="196" cy="102" rx="52" ry="24" />
          <ellipse cx="470" cy="180" rx="62" ry="21" /><ellipse cx="508" cy="164" rx="42" ry="19" />
        </g>
        <Trees tone={treeTone} dark={variant === "dim"} />
        {/* grass + sand bank */}
        <rect x="-400" y="470" width="1520" height="180" fill={golden ? "#8fbf4d" : "#79c94f"} />
        <ellipse cx="360" cy="716" rx="470" ry="128" fill="#eed9a0" />
        <ellipse cx="360" cy="726" rx="428" ry="106" fill="#e6cd8d" />
        {/* pond */}
        <ellipse cx="360" cy="838" rx="412" ry="296" fill={water} />
        <ellipse cx="360" cy="838" rx="412" ry="296" fill="none" stroke="#dff3ee" strokeWidth="10" opacity="0.55" />
        {/* sparkles */}
        <g stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.55">
          <path d="M120 780 q 22 -12 44 0" /><path d="M520 740 q 22 -12 44 0" /><path d="M300 920 q 22 -12 44 0" />
          <path d="M580 940 q 22 -12 44 0" /><path d="M170 990 q 22 -12 44 0" /><path d="M420 800 q 18 -10 36 0" />
        </g>
        {/* lily pads */}
        <g fill="#3f9e4d" stroke="#2c7a38" strokeWidth="4">
          <path d="M118 736 a34 15 0 1 1 20 12 l-20 -6 Z" /><path d="M548 872 a38 16 0 1 1 22 13 l-22 -7 Z" /><path d="M408 690 a28 12 0 1 1 16 10 l-16 -5 Z" />
        </g>
        {/* reeds */}
        <g stroke="#2c7a38" strokeWidth="6" strokeLinecap="round">
          <path d="M36 700 q -6 -52 4 -84" fill="none" /><path d="M58 706 q 2 -46 14 -72" fill="none" />
          <path d="M684 706 q 6 -52 -4 -84" fill="none" /><path d="M662 712 q -2 -46 -14 -72" fill="none" />
        </g>
        {/* foreground shore */}
        <rect x="-400" y="1108" width="1520" height="380" fill={golden ? "#a8cc55" : "#8fd45e"} />
        <ellipse cx="360" cy="1112" rx="470" ry="42" fill="#eed9a0" />
      </g>
      {variant === "dim" ? <rect width="720" height="1280" fill="#152a44" opacity="0.42" /> : null}
      {golden ? <rect width="720" height="1280" fill="#ff8f3f" opacity="0.13" /> : null}
      {flies}
    </svg>
  );
};

export const Sign: React.FC = () => (
  <svg viewBox="0 0 220 300" style={{ display: "block", width: "100%", height: "100%" }}>
    <rect x="100" y="120" width="18" height="172" rx="6" fill="#7a5a38" stroke="#26303a" strokeWidth="4" />
    <rect x="10" y="8" width="200" height="150" rx="14" fill="#fdfdf8" stroke="#26303a" strokeWidth="6" />
    <circle cx="110" cy="83" r="56" fill="none" stroke="#d43a2f" strokeWidth="11" />
    {/* mini kappa head */}
    <circle cx="110" cy="92" r="34" fill="#63b245" />
    <ellipse cx="110" cy="62" rx="22" ry="7" fill="#e8e4da" stroke="#26303a" strokeWidth="3" />
    <ellipse cx="110" cy="61" rx="15" ry="4.5" fill="#9fd8ef" />
    <circle cx="98" cy="90" r="3.6" fill="#26303a" /><circle cx="122" cy="90" r="3.6" fill="#26303a" />
    <path d="M 98 106 Q 110 100 122 106" fill="#f2b13c" stroke="#26303a" strokeWidth="3" />
    <line x1="66" y1="128" x2="154" y2="40" stroke="#d43a2f" strokeWidth="11" strokeLinecap="round" />
  </svg>
);

export const Rings: React.FC<{ x: number; y: number; p: number; color?: string }> = ({ x, y, p, color = "#ffffff" }) => (
  <g transform={`translate(${x} ${y})`} opacity={Math.max(0, 1 - p)}>
    <ellipse rx={18 + p * 74} ry={(18 + p * 74) * 0.32} fill="none" stroke={color} strokeWidth="5" />
    <ellipse rx={8 + p * 44} ry={(8 + p * 44) * 0.32} fill="none" stroke={color} strokeWidth="4" opacity="0.7" />
  </g>
);

export const Splash: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <g transform={`translate(${x} ${y})`} opacity={Math.max(0, 1 - p * 1.15)}>
    {[-52, -26, 0, 26, 52].map((dx, i) => (
      <circle key={i} cx={dx * (0.4 + p)} cy={-p * (44 - Math.abs(dx) * 0.4)} r={6 - p * 2.4} fill="#cdeffb" stroke="#7fc6e8" strokeWidth="2" />
    ))}
  </g>
);
