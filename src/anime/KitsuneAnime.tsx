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

const Scene: React.FC<{ i: number }> = ({ i }) => {
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
            <Scene i={i} />
            <Karaoke line={i} />
          </Sequence>
        );
      })}
      {silent ? null : <Audio src={staticFile("kitsune-mix.wav")} />}
    </AbsoluteFill>
  );
};
