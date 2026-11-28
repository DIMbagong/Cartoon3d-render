// Ciko the gecko + the orange cat, same chibi system as chars.tsx
// (viewBox -100 0 600 560, ground y=560).
import React from "react";
import type { Eyes, Mouth } from "./chars";

const INK = "#26303a";

export type TailState = "full" | "none" | "regrown";

const CikoEyes: React.FC<{ eyes: Eyes }> = ({ eyes }) => {
  // eyes sit on two bumps on top of the wide head: centers (158,150) (242,150)
  const one = (cx: number) => {
    if (eyes === "happy" || eyes === "closed")
      return <path d={`M ${cx - 16} 156 Q ${cx} ${eyes === "happy" ? 138 : 148} ${cx + 16} 156`} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />;
    if (eyes === "shock")
      return <g><circle cx={cx} cy="150" r="17" fill="#fff" stroke={INK} strokeWidth="5" /><circle cx={cx} cy="152" r="5" fill={INK} /></g>;
    if (eyes === "dizzy")
      return <path d={`M ${cx - 12} 140 L ${cx + 12} 160 M ${cx + 12} 140 L ${cx - 12} 160`} stroke={INK} strokeWidth="6" strokeLinecap="round" />;
    const look = eyes === "side" ? 5 : 0;
    return (
      <g>
        <circle cx={cx} cy="150" r="16" fill="#fff" stroke={INK} strokeWidth="5" />
        <circle cx={cx + look} cy="151" r="10" fill="#e8a13c" stroke={INK} strokeWidth="3" />
        <ellipse cx={cx + look} cy="151" rx="3.4" ry="7.5" fill={INK} />
        <circle cx={cx + look - 3} cy="145" r="3" fill="#fff" />
      </g>
    );
  };
  return <g>{one(158)}{one(242)}</g>;
};

export const Ciko: React.FC<{
  eyes?: Eyes; mouth?: Mouth; tail?: TailState; scared?: boolean;
}> = ({ eyes = "open", mouth = "smile", tail = "full", scared = false }) => {
  const tailColor = tail === "regrown" ? "#b9bd8f" : "#93b86a";
  return (
    <svg viewBox="-100 0 600 560" style={{ display: "block", width: "100%", height: "100%" }}>
      {/* tail sweeping along the ground to his left */}
      {tail !== "none" ? (
        <path d={tail === "regrown"
          ? "M 148 500 Q 60 520 18 478 Q 44 452 92 462 Q 140 470 156 478 Z"
          : "M 150 502 Q 30 540 -52 486 Q -16 442 62 452 Q 128 460 158 476 Z"}
          fill={tailColor} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      ) : null}
      {/* back legs splayed with toe pads */}
      <g>
        <rect x="118" y="452" width="30" height="66" rx="14" fill="#93b86a" stroke={INK} strokeWidth="4.5" transform="rotate(16 133 460)" />
        <circle cx="106" cy="524" r="13" fill="#a8c686" stroke={INK} strokeWidth="4" />
        <circle cx="92" cy="514" r="6.5" fill="#a8c686" stroke={INK} strokeWidth="3" /><circle cx="120" cy="512" r="6.5" fill="#a8c686" stroke={INK} strokeWidth="3" />
        <rect x="252" y="452" width="30" height="66" rx="14" fill="#93b86a" stroke={INK} strokeWidth="4.5" transform="rotate(-16 267 460)" />
        <circle cx="294" cy="524" r="13" fill="#a8c686" stroke={INK} strokeWidth="4" />
        <circle cx="280" cy="512" r="6.5" fill="#a8c686" stroke={INK} strokeWidth="3" /><circle cx="308" cy="514" r="6.5" fill="#a8c686" stroke={INK} strokeWidth="3" />
      </g>
      {/* body */}
      <ellipse cx="200" cy="392" rx="92" ry="102" fill="#a8c686" stroke={INK} strokeWidth="5" />
      <ellipse cx="200" cy="416" rx="56" ry="66" fill="#eef3d8" stroke={INK} strokeWidth="3.5" />
      <circle cx="146" cy="352" r="7" fill="#7ba254" opacity="0.7" /><circle cx="256" cy="330" r="6" fill="#7ba254" opacity="0.7" />
      <circle cx="238" cy="452" r="6" fill="#7ba254" opacity="0.6" /><circle cx="158" cy="446" r="5.5" fill="#7ba254" opacity="0.6" />
      {/* arms */}
      <g transform="rotate(10 104 350)"><rect x="90" y="338" width="26" height="104" rx="13" fill="#93b86a" stroke={INK} strokeWidth="4.5" /><circle cx="104" cy="448" r="12" fill="#a8c686" stroke={INK} strokeWidth="4" /></g>
      <g transform="rotate(-10 296 350)"><rect x="284" y="338" width="26" height="104" rx="13" fill="#93b86a" stroke={INK} strokeWidth="4.5" /><circle cx="297" cy="448" r="12" fill="#a8c686" stroke={INK} strokeWidth="4" /></g>
      {/* wide flat head */}
      <ellipse cx="200" cy="212" rx="118" ry="88" fill="#a8c686" stroke={INK} strokeWidth="5.5" />
      {/* eye bumps */}
      <circle cx="158" cy="140" r="27" fill="#a8c686" stroke={INK} strokeWidth="5" />
      <circle cx="242" cy="140" r="27" fill="#a8c686" stroke={INK} strokeWidth="5" />
      <ellipse cx="128" cy="238" rx="14" ry="7.5" fill="#8fbf6f" opacity="0.6" />
      <ellipse cx="272" cy="238" rx="14" ry="7.5" fill="#8fbf6f" opacity="0.6" />
      {scared ? <g stroke={INK} strokeWidth="5.5" strokeLinecap="round"><line x1="140" y1="104" x2="172" y2="96" /><line x1="260" y1="104" x2="228" y2="96" /></g> : null}
      <CikoEyes eyes={eyes} />
      {/* nostrils + mouth */}
      <circle cx="188" cy="238" r="2.8" fill={INK} /><circle cx="212" cy="238" r="2.8" fill={INK} />
      {mouth === "open" ? <ellipse cx="200" cy="262" rx="12" ry="10" fill="#8a3b2e" stroke={INK} strokeWidth="4" />
        : mouth === "wavy" ? <path d="M 178 260 q 7 -7 14 0 q 7 7 14 0 q 7 -7 14 0" fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
        : mouth === "flat" ? <line x1="184" y1="260" x2="216" y2="260" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        : <path d="M 172 254 Q 200 274 228 254" fill="none" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />}
    </svg>
  );
};

// The detached tail, drawn around its base pivot (0,0 at the thick end).
export const LooseTail: React.FC<{ dull?: boolean }> = ({ dull = false }) => (
  <svg viewBox="-10 -60 240 120" style={{ display: "block", width: "100%", height: "100%" }}>
    <path d="M 4 6 Q 90 -34 168 -18 Q 224 -8 230 6 Q 222 22 160 20 Q 84 20 10 22 Q -2 16 4 6 Z"
      fill={dull ? "#b9bd8f" : "#93b86a"} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <circle cx="70" cy="-4" r="5" fill="#7ba254" opacity="0.7" /><circle cx="130" cy="0" r="4.4" fill="#7ba254" opacity="0.7" />
  </svg>
);

export const Cat: React.FC<{ eyes?: Eyes; pawUp?: boolean }> = ({ eyes = "open", pawUp = false }) => (
  <svg viewBox="-100 0 600 560" style={{ display: "block", width: "100%", height: "100%" }}>
    {/* curled tail */}
    <path d="M 292 470 Q 372 470 366 408 Q 362 372 330 366" fill="none" stroke="#f5a83d" strokeWidth="30" strokeLinecap="round" />
    <path d="M 292 470 Q 372 470 366 408 Q 362 372 330 366" fill="none" stroke={INK} strokeWidth="36" strokeLinecap="round" opacity="0.16" />
    {/* body sitting */}
    <ellipse cx="200" cy="406" rx="106" ry="96" fill="#f5a83d" stroke={INK} strokeWidth="5" />
    <ellipse cx="200" cy="438" rx="58" ry="54" fill="#ffe9c9" />
    <path d="M 116 386 q 20 10 40 2 M 244 388 q 20 8 40 -2" stroke="#d9822b" strokeWidth="8" fill="none" strokeLinecap="round" />
    {/* front legs + paws */}
    <rect x="150" y="452" width="30" height="66" rx="14" fill="#f5a83d" stroke={INK} strokeWidth="4.5" />
    <rect x="220" y="452" width="30" height="66" rx="14" fill="#f5a83d" stroke={INK} strokeWidth="4.5" />
    <ellipse cx="162" cy="526" rx="24" ry="11" fill="#ffe9c9" stroke={INK} strokeWidth="4" />
    <ellipse cx="238" cy="526" rx="24" ry="11" fill="#ffe9c9" stroke={INK} strokeWidth="4" />
    {/* raised paw (hunting) */}
    {pawUp ? (
      <g transform="rotate(-32 292 380)">
        <rect x="278" y="330" width="28" height="96" rx="14" fill="#f5a83d" stroke={INK} strokeWidth="4.5" />
        <circle cx="292" cy="326" r="16" fill="#ffe9c9" stroke={INK} strokeWidth="4" />
        <path d="M 282 312 l -3 -10 M 292 310 l 0 -11 M 302 312 l 3 -10" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      </g>
    ) : (
      <g transform="rotate(-8 292 380)"><rect x="279" y="368" width="27" height="100" rx="13" fill="#f5a83d" stroke={INK} strokeWidth="4.5" /><circle cx="293" cy="474" r="12" fill="#ffe9c9" stroke={INK} strokeWidth="4" /></g>
    )}
    <g transform="rotate(8 108 380)"><rect x="94" y="368" width="27" height="100" rx="13" fill="#f5a83d" stroke={INK} strokeWidth="4.5" /><circle cx="107" cy="474" r="12" fill="#ffe9c9" stroke={INK} strokeWidth="4" /></g>
    {/* head */}
    <path d="M 118 128 L 104 52 L 168 84 Z" fill="#f5a83d" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M 282 128 L 296 52 L 232 84 Z" fill="#f5a83d" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M 122 112 L 114 70 L 152 90 Z" fill="#ffb3b3" />
    <path d="M 278 112 L 286 70 L 248 90 Z" fill="#ffb3b3" />
    <circle cx="200" cy="208" r="110" fill="#f5a83d" stroke={INK} strokeWidth="5.5" />
    <path d="M 128 140 q 14 8 28 3 M 244 143 q 14 5 28 -3 M 186 112 q 14 6 28 0" stroke="#d9822b" strokeWidth="8" fill="none" strokeLinecap="round" />
    {/* eyes */}
    {eyes === "happy" ? (
      <g fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round"><path d="M 138 208 Q 156 190 174 208" /><path d="M 226 208 Q 244 190 262 208" /></g>
    ) : eyes === "shock" ? (
      <g><circle cx="156" cy="204" r="15" fill="#fff" stroke={INK} strokeWidth="5" /><circle cx="244" cy="204" r="15" fill="#fff" stroke={INK} strokeWidth="5" /><circle cx="156" cy="206" r="4.5" fill={INK} /><circle cx="244" cy="206" r="4.5" fill={INK} /></g>
    ) : (
      <g>
        <ellipse cx="156" cy="204" rx="15" ry="17" fill="#7bc47f" stroke={INK} strokeWidth="4.5" /><ellipse cx="156" cy="204" rx="3.6" ry="10" fill={INK} />
        <ellipse cx="244" cy="204" rx="15" ry="17" fill="#7bc47f" stroke={INK} strokeWidth="4.5" /><ellipse cx="244" cy="204" rx="3.6" ry="10" fill={INK} />
      </g>
    )}
    {/* muzzle */}
    <ellipse cx="200" cy="250" rx="34" ry="22" fill="#ffe9c9" />
    <path d="M 190 240 Q 200 234 210 240 Q 206 250 200 250 Q 194 250 190 240 Z" fill="#e2707a" stroke={INK} strokeWidth="3.5" />
    <path d="M 200 250 Q 200 258 188 260 M 200 250 Q 200 258 212 260" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" opacity="0.65">
      <line x1="118" y1="240" x2="82" y2="232" /><line x1="118" y1="254" x2="84" y2="256" />
      <line x1="282" y1="240" x2="318" y2="232" /><line x1="282" y1="254" x2="316" y2="256" />
    </g>
  </svg>
);
