// "Kiko si Kitsune" — anime-style short (720x1280, 30 fps).
// Grammar follows the house standard: one hard-cut shot per narration line,
// static mouths per expression, karaoke chunks of <=6 words with the active
// word in yellow, subtitle block inside the platform safe zone.
import React from "react";
import {
  AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate,
  staticFile, useCurrentFrame,
} from "remotion";
import { AnimeMascot, Kitsune, FoxForm, Shiba, PoofCloud, Sparkle4 } from "./chars";
import { Shrine, FoxFire, SkyVariant } from "./bg";
import wordsData from "./words.json";

const W = wordsData as { w: string; s: number; e: number }[];
export const ANIME_FRAMES = 2128;

const LINES: { start: number; end: number }[] = [
  { start: 0.0, end: 6.4 }, { start: 6.65, end: 11.81 }, { start: 12.06, end: 18.62 },
  { start: 18.87, end: 25.35 }, { start: 25.6, end: 31.32 }, { start: 31.57, end: 36.73 },
  { start: 36.98, end: 42.18 }, { start: 42.43, end: 48.95 }, { start: 49.2, end: 54.28 },
  { start: 54.53, end: 58.73 }, { start: 58.98, end: 64.42 }, { start: 64.67, end: 70.67 },
];
const lineWords = (i: number) => {
  const { start, end } = LINES[i];
  return W.filter((x) => x.s >= start - 0.05 && x.s < end + 0.15);
};

let fontReady = false;
const loadFont = async () => {
  if (fontReady) return;
  const face = new FontFace("Baloo2", `url(${staticFile("fonts/baloo2-700.woff2")})`, { weight: "700" });
  await face.load();
  (document as any).fonts.add(face);
  fontReady = true;
};

const Karaoke: React.FC<{ line: number }> = ({ line }) => {
  const frame = useCurrentFrame();
  const t = LINES[line].start + frame / 30;
  const ws = lineWords(line);
  const active = ws.findIndex((x) => t >= x.s && t < x.e);
  const act = active === -1 ? (t < (ws[0]?.s ?? 0) ? -1 : ws.length - 1) : active;
  const per = 6;
  const chunkIdx = act < 0 ? 0 : Math.floor(act / per);
  const chunk = ws.slice(chunkIdx * per, chunkIdx * per + per);
  return (
    <div style={{
      position: "absolute", left: 24, right: 24, top: 796, textAlign: "center",
      fontFamily: "Baloo2, sans-serif", fontWeight: 700, fontSize: 47, lineHeight: 1.24,
      color: "#ffffff", WebkitTextStroke: "2px rgba(30,25,20,0.9)",
      textShadow: "0 3px 0 rgba(30,25,20,0.9), 0 6px 14px rgba(0,0,0,0.35)",
    }}>
      {chunk.map((x, i) => {
        const gi = chunkIdx * per + i;
        return (
          <span key={i} style={{ color: gi === act ? "#ffd93b" : "#ffffff" }}>
            {x.w}{i < chunk.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};

const Actor: React.FC<{
  x: number; y: number; size: number; flip?: boolean; bobAmp?: number; children: React.ReactNode;
}> = ({ x, y, size, flip, bobAmp = 3, children }) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9) * bobAmp;
  return (
    <div style={{
      position: "absolute", left: x, top: y + bob, width: size, height: size * (560 / 600),
      transform: flip ? "scaleX(-1)" : undefined,
    }}>
      {children}
    </div>
  );
};

const Fx: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0 }} width="100%" height="100%">
    {children}
  </svg>
);

const InariPlate: React.FC = () => (
  <svg viewBox="0 0 300 130" width="100%" height="100%">
    <ellipse cx={150} cy={102} rx={138} ry={24} fill="#fdfdfd" stroke="#b9bec7" strokeWidth={5} />
    <ellipse cx={150} cy={96} rx={112} ry={17} fill="#e8ecf2" />
    {[70, 150, 230].map((x) => (
      <g key={x}>
        <path d={`M ${x - 36} 92 L ${x - 30} 40 Q ${x} 22 ${x + 30} 40 L ${x + 36} 92 Q ${x} 104 ${x - 36} 92 Z`} fill="#d99a3d" stroke="#8a5a1d" strokeWidth={4.5} strokeLinejoin="round" />
        <ellipse cx={x} cy={42} rx={24} ry={9} fill="#fff6e8" />
      </g>
    ))}
  </svg>
);

const SceneContent: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const g = LINES[i].start * 30 + frame; // global frame
  const V = (v: SkyVariant) => <Shrine variant={v} frame={g} />;
  switch (i) {
    case 0: {
      const poofing = g >= 148 && g < 170;
      const ps = interpolate(g, [148, 156, 168], [0.4, 1.25, 1.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const po = interpolate(g, [148, 152, 160, 168], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <AbsoluteFill>
          {V("sunset")}
          {g < 156 ? (
            <Actor x={56} y={566} size={400} bobAmp={1.5}><FoxForm frame={g} /></Actor>
          ) : (
            <Actor x={36} y={440} size={430}><Kitsune frame={g} expr="happy" tails={3} /></Actor>
          )}
          <Actor x={356} y={472} size={396}>
            <AnimeMascot frame={g} expr={g < 150 ? "smile" : g < 200 ? "wow" : "happy"} pose={g >= 156 ? "wave" : "idle"} />
          </Actor>
          {poofing ? (
            <Fx><g transform={`translate(246 818)`}><PoofCloud x={0} y={0} s={ps} o={po} /></g></Fx>
          ) : null}
        </AbsoluteFill>
      );
    }
    case 1:
      return (
        <AbsoluteFill>
          {V("sunset")}
          <Actor x={84} y={428} size={452}><Kitsune frame={g} expr="smile" tails={3} /></Actor>
          <Actor x={392} y={482} size={378}><AnimeMascot frame={g} expr="smile" pose="point" /></Actor>
        </AbsoluteFill>
      );
    case 2:
      return (
        <AbsoluteFill>
          {V("day")}
          <Actor x={140} y={418} size={462}><Kitsune frame={g} expr="sly" pose="hip" tails={3} /></Actor>
          <Actor x={428} y={502} size={338}><AnimeMascot frame={g} expr="think" /></Actor>
          <Fx><Sparkle4 x={168} y={330} s={0.9 + 0.15 * Math.sin(g / 6)} /><Sparkle4 x={560} y={290} s={0.7 + 0.13 * Math.cos(g / 7)} /></Fx>
        </AbsoluteFill>
      );
    case 3:
      return (
        <AbsoluteFill>
          {V("day")}
          <Actor x={136} y={428} size={452}><Kitsune frame={g} expr="smile" tails={3} /></Actor>
          <Actor x={404} y={490} size={362}><AnimeMascot frame={g} expr="happy" /></Actor>
        </AbsoluteFill>
      );
    case 4: {
      const fan = g >= 923;
      return (
        <AbsoluteFill>
          {V("sunset")}
          <Actor x={126} y={408} size={472}><Kitsune frame={g} expr={fan ? "happy" : "smile"} tails={fan ? 9 : 3} /></Actor>
          <Actor x={436} y={500} size={332}><AnimeMascot frame={g} expr={fan ? "wow" : "smile"} pose={fan ? "armsOut" : "idle"} /></Actor>
          {fan && g < 985 ? (
            <Fx>
              <Sparkle4 x={150} y={300} s={1 + 0.2 * Math.sin(g / 5)} /><Sparkle4 x={570} y={260} s={0.9} />
              <Sparkle4 x={360} y={180} s={0.8 + 0.18 * Math.cos(g / 6)} /><Sparkle4 x={110} y={520} s={0.7} />
            </Fx>
          ) : null}
        </AbsoluteFill>
      );
    }
    case 5:
      return (
        <AbsoluteFill>
          {V("day")}
          <Actor x={56} y={438} size={432}><Kitsune frame={g} expr="happy" tails={3} /></Actor>
          <Actor x={404} y={480} size={368}><AnimeMascot frame={g} expr="smile" pose="point" /></Actor>
          <div style={{ position: "absolute", left: 246, top: 822, width: 228, height: 99 }}>
            <InariPlate />
          </div>
        </AbsoluteFill>
      );
    case 6: {
      const dogX = interpolate(g, [1150, 1182], [770, 458], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <AbsoluteFill>
          {V("day")}
          <Actor x={16} y={472} size={392}><Kitsune frame={g} expr="wow" tails={3} sweat={g >= 1155} /></Actor>
          <Actor x={196} y={458} size={420}><AnimeMascot frame={g} expr={g >= 1155 ? "wow" : "smile"} pose={g >= 1155 ? "armsOut" : "idle"} /></Actor>
          <div style={{ position: "absolute", left: dogX, top: 706, width: 296, height: 222 }}>
            <Shiba frame={g} />
          </div>
        </AbsoluteFill>
      );
    }
    case 7:
      return (
        <AbsoluteFill>
          {V("night")}
          <Actor x={146} y={418} size={462}><Kitsune frame={g} expr="smile" tails={3} /></Actor>
          <Actor x={416} y={490} size={348}><AnimeMascot frame={g} expr="wow" /></Actor>
          <Fx>
            <FoxFire x={150} y={430} frame={g} />
            <FoxFire x={556} y={372} frame={g} ph={40} />
            <FoxFire x={368} y={268} frame={g} ph={80} />
          </Fx>
        </AbsoluteFill>
      );
    case 8:
      return (
        <AbsoluteFill>
          {V("rain")}
          <Actor x={86} y={438} size={432}><Kitsune frame={g} expr="happy" tails={3} /></Actor>
          <Actor x={394} y={480} size={368}><AnimeMascot frame={g} expr="happy" pose="armsOut" /></Actor>
        </AbsoluteFill>
      );
    case 9:
      return (
        <AbsoluteFill>
          {V("sunset")}
          <Actor x={76} y={418} size={462}><Kitsune frame={g} expr="smile" tails={3} /></Actor>
          <Actor x={368} y={452} size={408}><AnimeMascot frame={g} expr="smile" /></Actor>
          <Fx><Sparkle4 x={352} y={392} s={0.85 + 0.15 * Math.sin(g / 6)} c="#ff9ec7" /></Fx>
        </AbsoluteFill>
      );
    case 10:
      return (
        <AbsoluteFill>
          {V("sunset")}
          <Actor x={136} y={418} size={462}><Kitsune frame={g} expr="wink" pose="point" tails={3} /></Actor>
          <Actor x={424} y={490} size={342}><AnimeMascot frame={g} expr="smile" /></Actor>
        </AbsoluteFill>
      );
    default:
      return (
        <AbsoluteFill>
          {V("day")}
          <Actor x={66} y={438} size={432}><Kitsune frame={g} expr="happy" pose="wave" tails={3} /></Actor>
          <Actor x={384} y={458} size={398}><AnimeMascot frame={g} expr="happy" pose="wave" /></Actor>
          <Fx>
            <Sparkle4 x={120} y={300} s={0.9 + 0.16 * Math.sin(g / 6)} /><Sparkle4 x={610} y={270} s={0.8} />
            <Sparkle4 x={368} y={190} s={0.7 + 0.14 * Math.cos(g / 7)} />
          </Fx>
        </AbsoluteFill>
      );
  }
};


// ---------------------------------------------------------------- camera
// Cinematic camera over the flat scene: shot sizes (wide/med/close/ecu),
// push-in / pull-out / pan moves, hard punch cuts inside a line, dutch
// angle, impact shake. Karaoke stays OUTSIDE the camera (safe zone fixed).
type Shot = {
  at: number;            // local frame where this sub-shot starts
  s: number;             // base scale (1 = wide)
  fx: number; fy: number; // focus point in frame px (kept centered)
  move?: "push" | "pull" | "panR" | "panL";
  amt?: number;          // move amount (scale factor or px)
  rot?: number;          // dutch angle degrees
  shake?: boolean;
  vig?: boolean;
};
const SHOTS: Shot[][] = [
  // L1 hook: wide push-in, then PUNCH to Kiko at the poof (local 153)
  [{ at: 0, s: 1.0, fx: 360, fy: 640, move: "push", amt: 0.12 },
   { at: 153, s: 1.5, fx: 251, fy: 580, move: "push", amt: 0.08, shake: true }],
  // L2 intro: close on Kiko, pan right toward the mascot
  [{ at: 0, s: 1.8, fx: 300, fy: 560, move: "panR", amt: 110 }],
  // L3 trickster: low dutch-angle medium, slow push
  [{ at: 0, s: 1.32, fx: 371, fy: 660, move: "push", amt: 0.07, rot: -2 }],
  // L4 guardian: reverent wide pull-out
  [{ at: 0, s: 1.18, fx: 360, fy: 620, move: "pull", amt: 0.16 }],
  // L5 tails: medium push, then hard zoom OUT to wide as the 9 tails fan open (local 155)
  [{ at: 0, s: 1.52, fx: 362, fy: 560, move: "push", amt: 0.06 },
   { at: 155, s: 1.0, fx: 360, fy: 640, shake: true }],
  // L6 inari: two-shot push, then INSERT close-up of the plate (local 90)
  [{ at: 0, s: 1.25, fx: 360, fy: 620, move: "push", amt: 0.08 },
   { at: 90, s: 2.3, fx: 360, fy: 865 }],
  // L7 dog: medium, then pan right tracking the dog in (local 45)
  [{ at: 0, s: 1.3, fx: 400, fy: 620 },
   { at: 45, s: 1.38, fx: 400, fy: 620, move: "panR", amt: 80 }],
  // L8 kitsunebi night: wide slow push through the orbs, vignette
  [{ at: 0, s: 1.05, fx: 360, fy: 600, move: "push", amt: 0.17, vig: true }],
  // L9 sunshower: joyful wide pull-out
  [{ at: 0, s: 1.15, fx: 360, fy: 620, move: "pull", amt: 0.15 }],
  // L10 the lesson: close two-shot, very slow push
  [{ at: 0, s: 1.65, fx: 430, fy: 555, move: "push", amt: 0.1, vig: true }],
  // L11 the reveal: ECU on Kiko's face
  [{ at: 0, s: 2.6, fx: 367, fy: 550, move: "push", amt: 0.1, vig: true }],
  // L12 closing: wide pull-out to the establishing frame
  [{ at: 0, s: 1.14, fx: 360, fy: 640, move: "pull", amt: 0.14 }],
];
const easeIO = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const Cam: React.FC<{ line: number; dur: number; children: React.ReactNode }> = ({ line, dur, children }) => {
  const f = useCurrentFrame();
  const shots = SHOTS[line];
  let si = 0;
  for (let k = 0; k < shots.length; k++) if (f >= shots[k].at) si = k;
  const sh = shots[si];
  const end = si + 1 < shots.length ? shots[si + 1].at : dur;
  const p = Math.min(1, Math.max(0, (f - sh.at) / Math.max(1, end - sh.at)));
  const e = easeIO(p);
  let s = sh.s, fx = sh.fx;
  if (sh.move === "push") s = sh.s * (1 + (sh.amt ?? 0.1) * e);
  if (sh.move === "pull") s = sh.s * (1 + (sh.amt ?? 0.1) * (1 - e));
  if (sh.move === "panR") fx = sh.fx + (sh.amt ?? 80) * e;
  if (sh.move === "panL") fx = sh.fx - (sh.amt ?? 80) * e;
  let jx = 0, jy = 0;
  if (sh.shake && f - sh.at < 8) {
    const d = (8 - (f - sh.at)) / 8;
    jx = Math.sin(f * 2.7) * 5 * d; jy = Math.cos(f * 3.4) * 4 * d;
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        transform: `translate(${360 - fx + jx}px, ${640 - sh.fy + jy}px) scale(${s}) rotate(${sh.rot ?? 0}deg)`,
        transformOrigin: `${fx}px ${sh.fy}px`,
      }}>
        {children}
      </div>
      {sh.vig ? (
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 52%, rgba(10,8,24,0.38) 100%)" }} />
      ) : null}
    </AbsoluteFill>
  );
};

const SpeedLines: React.FC<{ cx: number; cy: number; from: number; to: number }> = ({ cx, cy, from, to }) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = interpolate(f, [from, from + 3, to - 3, to], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lines = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + (i % 2) * 0.12;
    const r1 = 120 + (i % 3) * 36, r2 = 560;
    return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2} />;
  });
  return (
    <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0 }} width="100%" height="100%" opacity={o}>
      <g stroke="#ffffff" strokeWidth={5} strokeLinecap="round">{lines}</g>
    </svg>
  );
};

const Scene: React.FC<{ i: number; dur: number }> = ({ i, dur }) => {
  const f = useCurrentFrame();
  const flash = i === 0 && f >= 151 && f <= 156
    ? interpolate(f, [151, 153, 156], [0, 0.95, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <AbsoluteFill>
      <Cam line={i} dur={dur}>
        <SceneContent i={i} />
      </Cam>
      {i === 0 ? <SpeedLines cx={251} cy={580} from={153} to={172} /> : null}
      {i === 4 ? <SpeedLines cx={360} cy={620} from={155} to={174} /> : null}
      {flash > 0 ? <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff", opacity: flash }} /> : null}
    </AbsoluteFill>
  );
};

export const KitsuneAnime: React.FC<{ silent?: boolean }> = ({ silent }) => {
  const [handle] = React.useState(() => delayRender("font"));
  React.useEffect(() => {
    loadFont().then(() => continueRender(handle)).catch(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#79c7f2" }}>
      {LINES.map((ln, i) => {
        const from = Math.round(ln.start * 30);
        const until = i === LINES.length - 1 ? ANIME_FRAMES : Math.round(LINES[i + 1].start * 30);
        return (
          <Sequence key={i} from={from} durationInFrames={until - from}>
            <Scene i={i} dur={until - from} />
            <Karaoke line={i} />
          </Sequence>
        );
      })}
      {silent ? null : <Audio src={staticFile("kitsune-mix.wav")} />}
    </AbsoluteFill>
  );
};
