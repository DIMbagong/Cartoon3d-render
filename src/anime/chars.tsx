// Anime-style character kit (SVG, viewBox "-100 0 600 560" — same staging
// space as the konon kit). Anime markers: tall gradient eyes with double
// highlights and lash lines, layered hair with highlight streaks, blush,
// cel shading (one darker shade side), small mouths, expression glyphs
// (sweat drop). Mouths are static per expression (house rule: no flap).
import React from "react";

export type Expr = "smile" | "open" | "happy" | "think" | "wow" | "sly" | "wink";
export type Pose = "idle" | "wave" | "point" | "armsOut" | "hip";

const INK = "#33302e";

function AnimeEyes({ cx1, cx2, cy, iris, blink, expr }: {
  cx1: number; cx2: number; cy: number; iris: [string, string]; blink: boolean; expr: Expr;
}) {
  if (expr === "happy") {
    return (
      <g stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round">
        <path d={`M ${cx1 - 24} ${cy + 6} Q ${cx1} ${cy - 22} ${cx1 + 24} ${cy + 6}`} />
        <path d={`M ${cx2 - 24} ${cy + 6} Q ${cx2} ${cy - 22} ${cx2 + 24} ${cy + 6}`} />
      </g>
    );
  }
  if (blink) {
    return (
      <g stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d={`M ${cx1 - 22} ${cy} Q ${cx1} ${cy + 12} ${cx1 + 22} ${cy}`} />
        <path d={`M ${cx2 - 22} ${cy} Q ${cx2} ${cy + 12} ${cx2 + 22} ${cy}`} />
      </g>
    );
  }
  const eye = (cx: number, winkEye: boolean) => {
    if (winkEye) {
      return <path d={`M ${cx - 22} ${cy + 2} Q ${cx} ${cy + 14} ${cx + 22} ${cy + 2}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
    }
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={21} ry={30} fill="#ffffff" />
        <ellipse cx={cx} cy={cy + 3} rx={16.5} ry={25} fill={iris[1]} />
        <ellipse cx={cx} cy={cy - 4} rx={16.5} ry={17} fill={iris[0]} opacity={0.85} />
        <ellipse cx={cx} cy={cy + 4} rx={8} ry={13} fill="#1d1a26" />
        <circle cx={cx - 6} cy={cy - 9} r={6.5} fill="#ffffff" />
        <circle cx={cx + 6} cy={cy + 11} r={3.4} fill="#ffffff" opacity={0.95} />
        <path d={`M ${cx - 23} ${cy - 22} Q ${cx} ${cy - 34} ${cx + 23} ${cy - 22}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d={`M ${cx - 18} ${cy + 27} Q ${cx} ${cy + 33} ${cx + 18} ${cy + 27}`} stroke={INK} strokeWidth={2.6} fill="none" opacity={0.5} />
      </g>
    );
  };
  return (
    <g>
      {eye(cx1, expr === "wink")}
      {eye(cx2, false)}
    </g>
  );
}

function Mouth({ expr, cx = 200, cy = 238 }: { expr: Expr; cx?: number; cy?: number }) {
  switch (expr) {
    case "open": return <ellipse cx={cx} cy={cy} rx={11} ry={14} fill="#8c3b34" stroke={INK} strokeWidth={3.5} />;
    case "wow": return <ellipse cx={cx} cy={cy} rx={9} ry={12} fill="#8c3b34" stroke={INK} strokeWidth={3.5} />;
    case "happy": return <path d={`M ${cx - 15} ${cy - 4} Q ${cx} ${cy + 16} ${cx + 15} ${cy - 4} Z`} fill="#8c3b34" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />;
    case "think": return <path d={`M ${cx - 10} ${cy + 2} L ${cx + 12} ${cy + 2}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />;
    case "sly": return <path d={`M ${cx - 4} ${cy - 2} Q ${cx + 14} ${cy + 8} ${cx + 20} ${cy - 4}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
    default: return <path d={`M ${cx - 13} ${cy - 3} Q ${cx} ${cy + 10} ${cx + 13} ${cy - 3}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
  }
}

export const SweatDrop: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -26 C 12 -6 17 4 17 13 A 17 17 0 1 1 -17 13 C -17 4 -12 -6 0 -26 Z" fill="#7cc4ff" stroke="#3d7ab8" strokeWidth={3} />
    <ellipse cx={-6} cy={10} rx={4} ry={7} fill="#ffffff" opacity={0.75} />
  </g>
);

export const Sparkle4: React.FC<{ x: number; y: number; s?: number; o?: number; c?: string }> = ({ x, y, s = 1, o = 1, c = "#ffe066" }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} opacity={o}
    d="M 0 -30 C 4 -10 10 -4 30 0 C 10 4 4 10 0 30 C -4 10 -10 4 -30 0 C -10 -4 -4 -10 0 -30 Z"
    fill={c} stroke="#e0a92e" strokeWidth={2.5} strokeLinejoin="round" />
);

export const PoofCloud: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill="#ffffff" stroke="#c9ced6" strokeWidth={3}>
    <circle cx={-52} cy={16} r={30} /><circle cx={-16} cy={-8} r={40} /><circle cx={28} cy={-14} r={34} />
    <circle cx={58} cy={14} r={28} /><circle cx={4} cy={22} r={36} />
  </g>
);

// ---------------------------------------------------------------- mascot
export const AnimeMascot: React.FC<{ expr?: Expr; pose?: Pose; frame?: number; sweat?: boolean }> = ({
  expr = "smile", pose = "idle", frame = 0, sweat = false,
}) => {
  const blink = frame % 101 < 5;
  const armL = pose === "wave" ? "rotate(-138 148 322)" : pose === "armsOut" ? "rotate(38 148 322)" : pose === "point" ? "rotate(0 148 322)" : "rotate(6 148 322)";
  const armR = pose === "point" ? "rotate(-96 252 322)" : pose === "armsOut" ? "rotate(-38 252 322)" : pose === "hip" ? "rotate(-52 252 322)" : "rotate(-6 252 322)";
  return (
    <svg viewBox="-100 0 600 560" width="100%" height="100%">
      {/* legs + shoes */}
      <rect x={158} y={428} width={30} height={74} rx={10} fill="#3a3f4a" />
      <rect x={212} y={428} width={30} height={74} rx={10} fill="#33363f" />
      <ellipse cx={170} cy={508} rx={30} ry={13} fill="#6b4226" stroke={INK} strokeWidth={4} />
      <ellipse cx={230} cy={508} rx={30} ry={13} fill="#633922" stroke={INK} strokeWidth={4} />
      {/* arms */}
      <g transform={armL}>
        <rect x={128} y={318} width={38} height={104} rx={19} fill="#2b4c9b" stroke={INK} strokeWidth={5} />
        <circle cx={147} cy={428} r={17} fill="#ffe3c2" stroke={INK} strokeWidth={4.5} />
      </g>
      <g transform={armR}>
        <rect x={234} y={318} width={38} height={104} rx={19} fill="#274684" stroke={INK} strokeWidth={5} />
        <circle cx={253} cy={428} r={17} fill="#ffe3c2" stroke={INK} strokeWidth={4.5} />
      </g>
      {/* shirt with cel shade */}
      <path d="M 138 316 Q 200 296 262 316 L 272 446 Q 200 464 128 446 Z" fill="#2b4c9b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 226 306 Q 252 310 262 316 L 272 446 Q 246 452 226 450 Z" fill="#22406f" opacity={0.55} />
      <path d="M 172 302 L 200 330 L 228 302 L 214 296 L 200 310 L 186 296 Z" fill="#ffffff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={200} cy={356} r={6.5} fill="#ffd94d" stroke={INK} strokeWidth={3} />
      <circle cx={200} cy={392} r={6.5} fill="#ffd94d" stroke={INK} strokeWidth={3} />
      <circle cx={200} cy={428} r={6.5} fill="#ffd94d" stroke={INK} strokeWidth={3} />
      {/* ears + face */}
      <circle cx={106} cy={196} r={17} fill="#ffe3c2" stroke={INK} strokeWidth={4.5} />
      <circle cx={294} cy={196} r={17} fill="#ffe3c2" stroke={INK} strokeWidth={4.5} />
      <path d="M 200 62 C 262 62 296 112 294 176 C 292 232 252 276 200 276 C 148 276 108 232 106 176 C 104 112 138 62 200 62 Z" fill="#ffe3c2" stroke={INK} strokeWidth={5} />
      <ellipse cx={130} cy={224} rx={17} ry={10} fill="#ffb3a0" opacity={0.6} />
      <ellipse cx={270} cy={224} rx={17} ry={10} fill="#ffb3a0" opacity={0.6} />
      <AnimeEyes cx1={163} cx2={237} cy={188} iris={["#8fc2ff", "#2b50a8"]} blink={blink} expr={expr} />
      <path d="M 140 148 Q 163 138 186 147" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M 214 147 Q 237 138 260 148" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M 196 214 Q 200 220 204 214" stroke="#d89a76" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Mouth expr={expr} />
      {/* anime hair: back mass + spiky fringe + highlights */}
      <path d="M 96 178 C 84 84 138 30 200 30 C 262 30 316 84 304 178 C 296 128 282 104 268 88 L 262 138 L 232 84 L 214 132 L 186 78 L 168 130 L 138 86 L 130 140 L 106 96 C 100 122 98 150 96 178 Z" fill="#2e4479" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 128 84 C 150 52 186 40 214 44 C 188 52 158 66 140 92 Z" fill="#5f83d8" opacity={0.8} />
      <path d="M 238 52 C 262 64 280 88 288 116 C 272 92 254 72 238 52 Z" fill="#5f83d8" opacity={0.65} />
      <path d="M 100 150 L 118 196 L 104 210 Z" fill="#2e4479" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 300 150 L 282 196 L 296 210 Z" fill="#2e4479" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {sweat ? <SweatDrop x={316} y={110} /> : null}
    </svg>
  );
};

// ---------------------------------------------------------------- kitsune girl
export const Kitsune: React.FC<{ expr?: Expr; pose?: Pose; frame?: number; tails?: 1 | 3 | 9; sweat?: boolean }> = ({
  expr = "smile", pose = "idle", frame = 0, tails = 3, sweat = false,
}) => {
  const blink = frame % 113 < 5;
  const sway = Math.sin(frame / 16) * 2.2;
  const armL = pose === "wave" ? "rotate(-136 148 322)" : pose === "armsOut" ? "rotate(36 148 322)" : "rotate(5 148 322)";
  const armR = pose === "point" ? "rotate(-94 252 322)" : pose === "hip" ? "rotate(-50 252 322)" : pose === "armsOut" ? "rotate(-36 252 322)" : "rotate(-5 252 322)";
  const tailFan = (list: number[]) => (
    <g transform={`rotate(${sway} 200 430)`}>
      {list.map((a) => (
        <g key={a} transform={`rotate(${a} 200 430)`}>
          <path d="M 200 430 C 150 380 138 300 168 226 C 178 202 196 190 200 190 C 204 190 222 202 232 226 C 262 300 250 380 200 430 Z" fill="#f5821f" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M 172 268 C 180 230 194 208 200 206 C 206 208 220 230 228 268 C 218 286 182 286 172 268 Z" fill="#fff3dd" />
        </g>
      ))}
    </g>
  );
  const fan = tails === 9 ? [-64, -48, -32, -16, 0, 16, 32, 48, 64] : tails === 3 ? [-30, 0, 30] : [38];
  return (
    <svg viewBox="-100 0 600 560" width="100%" height="100%">
      {/* long back hair */}
      <path d="M 104 130 C 96 260 104 400 128 486 L 160 470 L 182 492 L 204 470 L 226 492 L 246 470 L 272 486 C 296 400 304 260 296 130 C 260 84 140 84 104 130 Z" fill="#f98a2b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 250 108 C 268 200 268 340 254 452 L 236 440 C 246 330 246 210 236 122 Z" fill="#e06f14" opacity={0.5} />
      {tailFan(fan)}
      {/* legs + shoes */}
      <rect x={160} y={440} width={28} height={62} rx={9} fill="#ffe9d2" stroke={INK} strokeWidth={4} />
      <rect x={214} y={440} width={28} height={62} rx={9} fill="#ffe9d2" stroke={INK} strokeWidth={4} />
      <ellipse cx={172} cy={508} rx={28} ry={12} fill="#b3372c" stroke={INK} strokeWidth={4} />
      <ellipse cx={230} cy={508} rx={28} ry={12} fill="#b3372c" stroke={INK} strokeWidth={4} />
      {/* arms (wide white sleeves) */}
      <g transform={armL}>
        <path d="M 126 318 L 168 318 L 174 402 L 118 402 Z" fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={146} cy={416} r={15} fill="#ffe3c2" stroke={INK} strokeWidth={4.5} />
      </g>
      <g transform={armR}>
        <path d="M 232 318 L 274 318 L 282 402 L 226 402 Z" fill="#f4f4f4" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={254} cy={416} r={15} fill="#ffe3c2" stroke={INK} strokeWidth={4.5} />
      </g>
      {/* miko outfit: white top + red hakama skirt */}
      <path d="M 140 316 L 260 316 L 282 452 L 118 452 Z" fill="#d63c30" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 232 316 L 260 316 L 282 452 L 244 452 Z" fill="#b92e24" opacity={0.55} />
      <path d="M 136 312 Q 200 294 264 312 L 268 372 Q 200 388 132 372 Z" fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 158 306 L 200 344 L 242 306" stroke="#d8d8d8" strokeWidth={5} fill="none" />
      <path d="M 182 348 C 170 336 156 342 158 354 C 160 366 176 368 184 360 C 182 372 196 378 204 368 C 212 378 226 372 224 360 C 232 368 248 366 250 354 C 252 342 238 336 226 348 L 204 360 Z" fill="#e8483f" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* ears + face */}
      <circle cx={106} cy={196} r={16} fill="#ffe3c2" stroke={INK} strokeWidth={4.5} />
      <circle cx={294} cy={196} r={16} fill="#ffe3c2" stroke={INK} strokeWidth={4.5} />
      <path d="M 200 62 C 262 62 296 112 294 176 C 292 232 252 276 200 276 C 148 276 108 232 106 176 C 104 112 138 62 200 62 Z" fill="#ffe9d2" stroke={INK} strokeWidth={5} />
      <ellipse cx={130} cy={224} rx={17} ry={10} fill="#ffb3a0" opacity={0.65} />
      <ellipse cx={270} cy={224} rx={17} ry={10} fill="#ffb3a0" opacity={0.65} />
      <AnimeEyes cx1={163} cx2={237} cy={188} iris={["#ffd76a", "#d97706"]} blink={blink} expr={expr} />
      <path d="M 141 147 Q 163 139 185 146" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M 215 146 Q 237 139 259 147" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M 196 214 Q 200 220 204 214" stroke="#d89a76" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Mouth expr={expr} />
      {/* fox ears */}
      <path d="M 118 74 L 100 6 L 168 40 C 152 52 134 64 118 74 Z" fill="#f98a2b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 282 74 L 300 6 L 232 40 C 248 52 266 64 282 74 Z" fill="#f98a2b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 120 62 L 110 24 L 148 42 C 138 50 128 56 120 62 Z" fill="#ffe9c9" />
      <path d="M 280 62 L 290 24 L 252 42 C 262 50 272 56 280 62 Z" fill="#ffe9c9" />
      {/* hime bangs + side locks + highlights */}
      <path d="M 102 168 C 96 92 142 44 200 44 C 258 44 304 92 298 168 L 282 150 L 268 108 L 250 148 L 200 128 L 150 148 L 132 108 L 118 150 Z" fill="#f98a2b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 138 66 C 162 46 196 40 224 46 C 196 50 166 58 146 76 Z" fill="#ffd9a0" opacity={0.9} />
      <path d="M 104 160 L 96 320 L 124 330 L 128 190 Z" fill="#f98a2b" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <path d="M 296 160 L 304 320 L 276 330 L 272 190 Z" fill="#f98a2b" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      {sweat ? <SweatDrop x={318} y={104} /> : null}
    </svg>
  );
};

// ---------------------------------------------------------------- fox form
export const FoxForm: React.FC<{ frame?: number }> = ({ frame = 0 }) => {
  const blink = frame % 107 < 5;
  const sway = Math.sin(frame / 15) * 3;
  return (
    <svg viewBox="-100 0 600 560" width="100%" height="100%">
      <g transform={`rotate(${sway} 268 430)`}>
        <path d="M 268 452 C 330 420 356 348 330 282 C 320 256 300 244 292 246 C 284 248 272 268 268 300 C 260 362 258 420 268 452 Z" fill="#f98a2b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M 300 268 C 318 292 326 330 320 366 C 306 344 296 306 300 268 Z" fill="#fff3dd" />
      </g>
      <ellipse cx={196} cy={428} rx={104} ry={80} fill="#f98a2b" stroke={INK} strokeWidth={5} />
      <ellipse cx={196} cy={452} rx={58} ry={52} fill="#fff3dd" />
      <rect x={128} y={478} width={26} height={34} rx={10} fill="#e07f1f" stroke={INK} strokeWidth={4} />
      <rect x={238} y={478} width={26} height={34} rx={10} fill="#e07f1f" stroke={INK} strokeWidth={4} />
      <path d="M 118 268 L 102 182 L 178 224 C 156 238 136 252 118 268 Z" fill="#f98a2b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 282 268 L 298 182 L 222 224 C 244 238 264 252 282 268 Z" fill="#f98a2b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 124 250 L 116 202 L 158 228 C 146 236 134 244 124 250 Z" fill="#ffe9c9" />
      <path d="M 276 250 L 284 202 L 242 228 C 254 236 266 244 276 250 Z" fill="#ffe9c9" />
      <circle cx={200} cy={300} r={94} fill="#ffb066" stroke={INK} strokeWidth={5} />
      <ellipse cx={200} cy={338} rx={40} ry={30} fill="#fff3dd" />
      {blink ? (
        <g stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round">
          <path d="M 138 292 Q 158 302 178 292" /><path d="M 222 292 Q 242 302 262 292" />
        </g>
      ) : (
        <g>
          <ellipse cx={158} cy={290} rx={17} ry={24} fill="#7c4a12" />
          <ellipse cx={242} cy={290} rx={17} ry={24} fill="#7c4a12" />
          <circle cx={152} cy={280} r={6} fill="#ffffff" /><circle cx={236} cy={280} r={6} fill="#ffffff" />
          <circle cx={164} cy={300} r={3} fill="#ffffff" /><circle cx={248} cy={300} r={3} fill="#ffffff" />
        </g>
      )}
      <path d="M 188 330 Q 200 324 212 330 Q 208 342 200 342 Q 192 342 188 330 Z" fill="#5b3a2a" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M 200 342 Q 200 350 188 352 M 200 342 Q 200 350 212 352" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <ellipse cx={128} cy={322} rx={14} ry={8} fill="#ffb3a0" opacity={0.7} />
      <ellipse cx={272} cy={322} rx={14} ry={8} fill="#ffb3a0" opacity={0.7} />
    </svg>
  );
};

// ---------------------------------------------------------------- shiba dog
export const Shiba: React.FC<{ frame?: number }> = ({ frame = 0 }) => {
  const bob = Math.abs(Math.sin(frame / 4)) * -4;
  return (
    <svg viewBox="0 0 400 300" width="100%" height="100%">
      <g transform={`translate(0 ${bob})`}>
        <path d="M 306 108 C 348 92 366 56 350 30 C 366 62 352 108 314 126 Z" fill="#e08a3c" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={96} y={196} width={24} height={64} rx={10} fill="#d97f2e" stroke={INK} strokeWidth={4.5} />
        <rect x={238} y={196} width={24} height={64} rx={10} fill="#d97f2e" stroke={INK} strokeWidth={4.5} />
        <ellipse cx={186} cy={168} rx={112} ry={62} fill="#eda04c" stroke={INK} strokeWidth={5} />
        <ellipse cx={196} cy={188} rx={70} ry={38} fill="#fff3dd" />
        <path d="M 66 96 L 52 40 L 104 66 C 90 78 76 88 66 96 Z" fill="#eda04c" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={104} cy={118} r={56} fill="#eda04c" stroke={INK} strokeWidth={5} />
        <ellipse cx={82} cy={140} rx={28} ry={20} fill="#fff3dd" />
        <circle cx={88} cy={106} r={8.5} fill="#26221f" />
        <circle cx={85} cy={103} r={3} fill="#ffffff" />
        <path d="M 58 128 Q 66 122 76 126 Q 74 136 66 137 Q 58 136 58 128 Z" fill="#26221f" />
        <path d="M 62 140 Q 74 148 88 144" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M 128 84 Q 150 74 172 84" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </g>
      <g stroke={INK} strokeWidth={5} strokeLinecap="round">
        <path d="M 8 108 L 26 118" /><path d="M 4 134 L 24 136" />
      </g>
    </svg>
  );
};

