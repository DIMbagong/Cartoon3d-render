// Anime shrine background: gradient skies, torii gate, small honden,
// sakura tree with falling petals, stone lanterns, stone path.
// Variants: day | sunset | night | rain (sunshower over sunset).
import React from "react";

export type SkyVariant = "day" | "sunset" | "night" | "rain";

const PAL: Record<SkyVariant, {
  sky: [string, string]; far: string; ground: string; path: string; torii: string; toriiD: string;
  wall: string; roof: string; pink: string; trunk: string; stone: string; stoneD: string;
}> = {
  day:    { sky: ["#79c7f2", "#e3f6ff"], far: "#9db8dd", ground: "#a8d08d", path: "#ddd6c2", torii: "#e2483a", toriiD: "#b93226", wall: "#fdf6ea", roof: "#54687f", pink: "#ffb7d5", trunk: "#7a4b32", stone: "#b9bec7", stoneD: "#8f959f" },
  sunset: { sky: ["#ff9a5c", "#ffe3ae"], far: "#c98bb0", ground: "#8fae6d", path: "#e3d3ae", torii: "#d63c2e", toriiD: "#a82a1f", wall: "#fdeed3", roof: "#4a3f55", pink: "#ff9ec7", trunk: "#6e4230", stone: "#a89aa2", stoneD: "#7e727c" },
  night:  { sky: ["#141f42", "#3a4a7d"], far: "#2c3a63", ground: "#3d5a45", path: "#5d6577", torii: "#93322a", toriiD: "#6e231c", wall: "#8d99b5", roof: "#232c47", pink: "#7d6a96", trunk: "#2e2019", stone: "#5d6577", stoneD: "#454c5e" },
  rain:   { sky: ["#e88a54", "#ffd9a0"], far: "#b57f9e", ground: "#7d9c60", path: "#d5c49c", torii: "#cc3527", toriiD: "#9c271b", wall: "#f7e6c6", roof: "#443a4e", pink: "#f292bd", trunk: "#633c2a", stone: "#9c8f96", stoneD: "#72656e" },
};

const STARS = [
  [60, 90], [150, 200], [240, 70], [330, 150], [420, 60], [510, 180], [600, 90], [680, 210],
  [110, 300], [560, 300], [30, 420], [700, 420], [210, 260], [470, 250], [650, 330], [90, 160],
];

const Lantern: React.FC<{ x: number; y: number; s: number; p: typeof PAL.day; night: boolean }> = ({ x, y, s, p, night }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {night ? <circle cx={0} cy={-52} r={64} fill="#ffca7a" opacity={0.30} /> : null}
    <rect x={-34} y={-16} width={68} height={14} rx={5} fill={p.stoneD} />
    <rect x={-22} y={-64} width={44} height={48} rx={6} fill={p.stone} stroke={p.stoneD} strokeWidth={4} />
    <rect x={-12} y={-54} width={24} height={28} rx={4} fill={night ? "#ffd98c" : "#e8ecf2"} stroke={p.stoneD} strokeWidth={3.5} />
    <path d="M -40 -64 L 0 -88 L 40 -64 Z" fill={p.stoneD} />
    <rect x={-10} y={-2} width={20} height={66} fill={p.stone} stroke={p.stoneD} strokeWidth={4} />
    <rect x={-30} y={64} width={60} height={14} rx={5} fill={p.stoneD} />
  </g>
);

export const Shrine: React.FC<{ variant: SkyVariant; frame: number }> = ({ variant, frame }) => {
  const p = PAL[variant];
  const night = variant === "night";
  const gid = `sky-${variant}`;
  const petals = Array.from({ length: 13 }, (_, i) => {
    const speed = 0.55 + (i % 5) * 0.16;
    const y = ((frame * speed + i * 173) % 900) + 120;
    const x = 560 + ((i * 67) % 190) + Math.sin((frame + i * 40) / 22) * 26 - (y - 120) * 0.16;
    const rot = (frame * (1 + (i % 3)) + i * 80) % 360;
    return <ellipse key={i} cx={x} cy={y} rx={11} ry={6.5} fill={p.pink} opacity={0.9} transform={`rotate(${rot} ${x} ${y})`} />;
  });
  const rainDrops = variant === "rain" ? Array.from({ length: 46 }, (_, i) => {
    const x = (i * 83) % 760 - 20;
    const y = ((frame * 26 + i * 211) % 1150);
    return <line key={i} x1={x} y1={y} x2={x - 13} y2={y + 44} stroke="#cfe8ff" strokeWidth={3.4} opacity={0.55} strokeLinecap="round" />;
  }) : null;
  return (
    <svg viewBox="0 0 720 1280" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky[0]} />
          <stop offset="100%" stopColor={p.sky[1]} />
        </linearGradient>
        <radialGradient id={`glow-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8fd0ff" stopOpacity={0.95} />
          <stop offset="55%" stopColor="#4f9dff" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#4f9dff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={720} height={1280} fill={`url(#${gid})`} />
      {night ? (
        <g fill="#ffffff">
          {STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 2} opacity={0.55 + 0.4 * Math.abs(Math.sin((frame + i * 31) / 26))} />)}
          <circle cx={606} cy={132} r={44} fill="#f6efdb" />
          <circle cx={588} cy={118} r={40} fill={p.sky[0]} opacity={0.35} />
        </g>
      ) : (
        <g>
          <circle cx={variant === "day" ? 96 : 606} cy={variant === "day" ? 128 : 150} r={variant === "day" ? 44 : 52} fill={variant === "day" ? "#fff3b0" : "#ffb347"} />
          <g fill="#ffffff" opacity={variant === "day" ? 0.92 : 0.75}>
            <ellipse cx={170 - (frame * 0.12 % 60)} cy={150} rx={66} ry={22} />
            <ellipse cx={216 - (frame * 0.12 % 60)} cy={134} rx={46} ry={18} />
            <ellipse cx={520 + (frame * 0.09 % 50)} cy={104} rx={58} ry={19} />
            <ellipse cx={560 + (frame * 0.09 % 50)} cy={90} rx={38} ry={15} />
          </g>
        </g>
      )}
      {/* far hills */}
      <path d="M 0 700 Q 150 596 320 668 Q 470 726 720 636 L 720 800 L 0 800 Z" fill={p.far} opacity={0.75} />
      {/* ground + stone path */}
      <rect x={0} y={760} width={720} height={520} fill={p.ground} />
      <path d="M 268 1280 L 330 776 L 390 776 L 452 1280 Z" fill={p.path} />
      <g stroke={p.stoneD} strokeWidth={3} opacity={0.5}>
        <path d="M 306 900 L 414 900" /><path d="M 292 1030 L 428 1030" /><path d="M 278 1170 L 442 1170" />
      </g>
      {/* honden (small shrine) behind torii */}
      <g>
        <rect x={292} y={618} width={136} height={104} fill={p.wall} stroke={p.roof} strokeWidth={5} />
        <path d="M 262 622 L 360 566 L 458 622 Z" fill={p.roof} />
        <rect x={338} y={656} width={44} height={66} fill={p.roof} opacity={0.85} />
        <rect x={276} y={722} width={168} height={14} fill={p.stoneD} />
      </g>
      {/* torii gate */}
      <g>
        <path d="M 176 470 Q 360 446 544 470 L 544 500 Q 360 476 176 500 Z" fill={p.torii} />
        <rect x={188} y={492} width={344} height={17} fill={p.toriiD} />
        <rect x={222} y={500} width={30} height={252} fill={p.torii} />
        <rect x={468} y={500} width={30} height={252} fill={p.torii} />
        <rect x={252} y={566} width={216} height={22} fill={p.torii} />
        <rect x={348} y={500} width={24} height={88} fill={p.toriiD} />
        <rect x={222} y={500} width={11} height={252} fill="#ffffff" opacity={0.14} />
        <rect x={468} y={500} width={11} height={252} fill="#ffffff" opacity={0.14} />
      </g>
      {/* stone lanterns */}
      <Lantern x={118} y={838} s={1.06} p={p} night={night} />
      <Lantern x={608} y={852} s={0.92} p={p} night={night} />
      {/* sakura tree */}
      <g>
        <path d="M 640 1010 C 628 880 636 760 668 640 L 700 640 C 676 770 676 890 692 1010 Z" fill={p.trunk} />
        <path d="M 664 700 C 620 660 580 646 540 650 C 584 634 632 644 668 676 Z" fill={p.trunk} />
        <g fill={p.pink}>
          <circle cx={618} cy={576} r={86} /><circle cx={700} cy={540} r={74} /><circle cx={548} cy={620} r={58} />
          <circle cx={668} cy={636} r={64} /><circle cx={596} cy={492} r={52} />
        </g>
        <g fill="#ffffff" opacity={0.28}>
          <circle cx={590} cy={548} r={34} /><circle cx={682} cy={512} r={26} />
        </g>
        {petals}
      </g>
      {/* grass tufts */}
      <g stroke={p.ground} strokeWidth={0} fill={night ? "#2e4a38" : "#7fb069"}>
        <path d="M 40 1080 l 10 -34 l 10 34 l 8 -26 l 8 26 Z" />
        <path d="M 648 1150 l 10 -34 l 10 34 l 8 -26 l 8 26 Z" />
        <path d="M 84 1210 l 9 -28 l 9 28 l 7 -22 l 7 22 Z" />
      </g>
      {variant === "rain" ? (
        <g>
          <path d="M 96 330 A 300 300 0 0 1 624 330" fill="none" stroke="#ff8a7a" strokeWidth={13} opacity={0.5} />
          <path d="M 122 330 A 274 274 0 0 1 598 330" fill="none" stroke="#ffd93b" strokeWidth={11} opacity={0.5} />
          <path d="M 148 330 A 248 248 0 0 1 572 330" fill="none" stroke="#8fd0ff" strokeWidth={11} opacity={0.5} />
          {rainDrops}
        </g>
      ) : null}
    </svg>
  );
};

// Floating blue fox-fire orbs for the night scene.
export const FoxFire: React.FC<{ x: number; y: number; frame: number; ph?: number }> = ({ x, y, frame, ph = 0 }) => {
  const fy = y + Math.sin((frame + ph) / 17) * 13;
  const fx = x + Math.cos((frame + ph) / 23) * 9;
  const fl = 0.82 + 0.18 * Math.sin((frame + ph) / 5);
  return (
    <g transform={`translate(${fx} ${fy}) scale(${fl})`}>
      <circle r={56} fill="url(#glow-night)" opacity={0.85} />
      <path d="M 0 20 C -15 4 -13 -14 0 -30 C 13 -14 15 4 0 20 Z" fill="#bfe3ff" />
      <path d="M 0 12 C -7 2 -6 -8 0 -17 C 6 -8 7 2 0 12 Z" fill="#5fb2ff" />
    </g>
  );
};
