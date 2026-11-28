// "Kappa, si Legenda Rawa Jepang" retold in the konon flat-chibi style:
// front-facing big-head characters, flat pond, hard-cut shots, big karaoke.
// Same narration + mix as the 3D version (voice timing from words.json).
import React, { useEffect, useState } from "react";
import {
  AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate,
  staticFile, useCurrentFrame,
} from "remotion";
import { Mascot, Kappa, Cucumber, type Eyes, type Mouth } from "./chars";
import { Pond, Sign, Rings, Splash, type Variant } from "./bg";
import wordsData from "./words.json";

const FPS = 30;
export const KONON_FRAMES = 2010;
const F = (sec: number) => Math.round(sec * FPS);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

type W = { w: string; s: number; e: number };
const WORDS = wordsData as W[];
const LINE_STARTS = [0, 4.93, 11.26, 17.07, 20.88, 26.37, 31.5, 37.63, 43.72, 47.77, 53.82, 59.19];
const LINES: W[][] = LINE_STARTS.map((st, i) =>
  WORDS.filter((w) => w.s >= st - 0.02 && (i === LINE_STARTS.length - 1 || w.s < LINE_STARTS[i + 1] - 0.02)));

const useBaloo = () => {
  const [handle] = useState(() => delayRender("load-baloo"));
  useEffect(() => {
    const f = new FontFace("Baloo2", `url(${staticFile("fonts/baloo2-700.woff2")})`, { weight: "700" });
    f.load()
      .then(() => { (document as unknown as { fonts: FontFaceSet }).fonts.add(f); continueRender(handle); })
      .catch(() => continueRender(handle));
  }, [handle]);
};

const Karaoke: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let li = 0;
  LINE_STARTS.forEach((s, i) => { if (t >= s) li = i; });
  const line = LINES[li] ?? [];
  const activeIdx = line.findIndex((w) => t >= w.s && t < w.e);
  const lastSpoken = line.reduce((acc, w, i) => (t >= w.s ? i : acc), -1);
  const CH = 6;
  const chunkIdx = Math.max(0, Math.floor((activeIdx >= 0 ? activeIdx : lastSpoken) / CH));
  const chunk = line.slice(chunkIdx * CH, chunkIdx * CH + CH);
  const size = chunk.length <= 3 ? 58 : chunk.length <= 5 ? 52 : 47;
  return (
    <div style={{
      position: "absolute", left: 30, right: 30, top: 796, minHeight: 150,
      display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "flex-start",
      gap: "4px 12px", fontFamily: "Baloo2, 'DejaVu Sans', sans-serif", fontWeight: 700,
      fontSize: size, lineHeight: 1.18, textAlign: "center",
    }}>
      {chunk.map((w, i) => {
        const gi = chunkIdx * CH + i;
        const isActive = gi === activeIdx;
        const spoken = gi <= lastSpoken;
        return (
          <span key={i} style={{
            color: isActive ? "#ffd93b" : "#ffffff",
            opacity: spoken || isActive ? 1 : 0.6,
            transform: isActive ? "scale(1.14)" : "scale(1)",
            display: "inline-block",
            textShadow: "3px 3px 0 #14202b, -3px 3px 0 #14202b, 3px -3px 0 #14202b, -3px -3px 0 #14202b, 0 5px 0 #14202b, 0 0 14px rgba(0,0,0,0.35)",
          }}>{w.w}</span>
        );
      })}
    </div>
  );
};

const blink = (frame: number, off: number, eyes: Eyes): Eyes =>
  eyes === "open" && (frame + off) % 111 < 5 ? "closed" : eyes;

const Bob: React.FC<{ frame: number; amp?: number; speed?: number; children: React.ReactNode }> =
  ({ frame, amp = 5, speed = 26, children }) => (
    <div style={{ transform: `translateY(${Math.sin(frame / speed) * amp}px)`, width: "100%", height: "100%" }}>{children}</div>
  );

const CharBox: React.FC<{
  left: number; top: number; width: number; rot?: number; children: React.ReactNode;
}> = ({ left, top, width, rot = 0, children }) => (
  <div style={{
    position: "absolute", left, top, width, height: width * (560 / 600),
    transform: rot ? `rotate(${rot}deg)` : undefined, transformOrigin: "50% 88%",
  }}>{children}</div>
);

// Kappa standing in the pond: lower body clipped at the waterline.
const KappaInPond: React.FC<{
  left: number; top: number; width: number; visibleH: number; riseY?: number;
  eyes: Eyes; dish?: number; bow?: number; beakOpen?: boolean; frame: number;
}> = ({ left, top, width, visibleH, riseY = 0, eyes, dish = 1, bow = 0, beakOpen, frame }) => (
  <div style={{ position: "absolute", left, top, width, height: visibleH, overflow: "hidden" }}>
    <div style={{ width, height: width * (560 / 600), transform: `translateY(${riseY}px)` }}>
      <Bob frame={frame} amp={4} speed={30}>
        <Kappa eyes={eyes} dish={dish} bow={bow} beakOpen={beakOpen} />
      </Bob>
    </div>
  </div>
);

const Sparkle: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <svg viewBox="0 0 40 40" style={{ position: "absolute", left: x, top: y, width: 40 * s, height: 40 * s }}>
    <path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16 Z" fill="#fff7ae" stroke="#e8b93b" strokeWidth="2" />
  </svg>
);

const Shot1: React.FC = () => {
  const frame = useCurrentFrame();
  const p = easeOut(clamp01((frame - 8) / 112));
  const walking = frame < 122;
  const x = lerp(-570, -28, p);
  const bobY = walking ? Math.abs(Math.sin(frame / 4.2)) * 9 : Math.sin(frame / 26) * 5;
  return (
    <AbsoluteFill>
      <Pond variant="day" frame={frame} />
      <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <Rings x={300} y={792} p={(frame % 48) / 48} />
        <Rings x={470} y={880} p={((frame + 24) % 48) / 48} />
      </svg>
      <div style={{ position: "absolute", left: x, top: 615 + bobY, width: 504, height: 470, transform: `rotate(${walking ? Math.sin(frame / 4.2) * 2.4 : 0}deg)` }}>
        <Mascot eyes={blink(frame, 0, "open")} mouth="smile" walk={walking ? frame / 9 : 0} />
      </div>
    </AbsoluteFill>
  );
};

const Shot2: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(4.93);
  const emerge = easeOut(clamp01((af - F(5.0)) / (F(6.8) - F(5.0))));
  const riseY = lerp(440, 187, emerge);
  const shocked = af < F(7.0);
  return (
    <AbsoluteFill>
      <Pond variant="day" frame={af} />
      <KappaInPond left={70} top={250} width={460} visibleH={440} riseY={riseY}
        eyes={blink(af, 40, "open")} beakOpen={Math.floor(af / 7) % 2 === 0} frame={af} />
      <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {af >= F(5.02) && af <= F(5.75) ? <Splash x={300} y={692} p={(af - F(5.02)) / (F(5.75) - F(5.02))} /> : null}
        <Rings x={300} y={698} p={(af % 44) / 44} />
      </svg>
      <CharBox left={298} top={625} width={493}>
        <Bob frame={af} amp={5}>
          <Mascot eyes={blink(af, 9, shocked ? "shock" : "open")} mouth={shocked ? "open" : "smile"} />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const Shot3: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(11.26);
  const sparkP = 0.7 + 0.3 * Math.sin(af / 5);
  return (
    <AbsoluteFill>
      <Pond variant="day" frame={af} zoom={1.55} />
      <CharBox left={-111} top={154} width={943}>
        <Bob frame={af} amp={4} speed={32}>
          <Kappa eyes={blink(af, 25, af < F(14.5) ? "happy" : "open")} dish={1} beakOpen={Math.floor(af / 7) % 2 === 0} />
        </Bob>
      </CharBox>
      {af < F(17.0) ? <><Sparkle x={318} y={262} s={sparkP} /><Sparkle x={398} y={296} s={sparkP * 0.7} /></> : null}
    </AbsoluteFill>
  );
};

const Shot4: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(20.88);
  const bowM = interpolate(af, [F(24.5), F(26.1), F(26.9), F(27.8)], [0, 38, 38, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bowK = interpolate(af, [F(26.9), F(28.6), F(29.7), F(31.2)], [0, 40, 40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dish = af < F(28.95) ? 1 : 0;
  const dizzy = af >= F(29.15) && af < F(31.5);
  const spill = af >= F(28.95) && af <= F(29.6);
  return (
    <AbsoluteFill>
      <Pond variant="day" frame={af} />
      <CharBox left={-48} top={640} width={471}>
        <Bob frame={af} amp={bowM > 2 ? 0 : 5}>
          <Mascot eyes={blink(af, 3, "open")} mouth={af > F(29.2) && af < F(30.2) ? "open" : "grin"} bow={bowM} />
        </Bob>
      </CharBox>
      <KappaInPond left={307} top={540} width={471} visibleH={380} riseY={66} eyes={blink(af, 55, dizzy ? "dizzy" : "open")}
        dish={dish} bow={bowK} beakOpen={false} frame={af} />
      <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <Rings x={543} y={926} p={(af % 44) / 44} />
        {spill ? <Splash x={543} y={620} p={(af - F(28.95)) / (F(29.6) - F(28.95))} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

const Shot5: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(31.5);
  const toss = (f0: number, f1: number, x0: number, y0: number, x1: number, y1: number) => {
    if (af < F(f0) || af > F(f1)) return null;
    const p = (af - F(f0)) / (F(f1) - F(f0));
    const x = lerp(x0, x1, p), y = lerp(y0, y1, p) - Math.sin(p * Math.PI) * 120;
    return <div style={{ position: "absolute", left: x, top: y }}><Cucumber size={76} rot={p * 340} /></div>;
  };
  const landed1 = af >= F(39.12), landed2 = af >= F(41.42);
  return (
    <AbsoluteFill>
      <Pond variant="day" frame={af} />
      <KappaInPond left={30} top={540} width={471} visibleH={380} riseY={66}
        eyes={blink(af, 31, af > F(33) ? "happy" : "open")} dish={1} beakOpen={Math.floor(af / 7) % 2 === 0} frame={af} />
      <CharBox left={290} top={640} width={471}>
        <Bob frame={af} amp={5}>
          <Mascot eyes={blink(af, 14, "open")} mouth="grin" holdCuke={af >= F(31.6) && af < F(41.0)} />
        </Bob>
      </CharBox>
      {toss(38.3, 39.12, 590, 980, 208, 862)}
      {toss(40.6, 41.42, 590, 980, 292, 892)}
      <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {landed1 && af <= F(39.9) ? <Splash x={222} y={876} p={(af - F(39.12)) / (F(39.9) - F(39.12))} /> : null}
        {landed2 && af <= F(42.2) ? <Splash x={306} y={906} p={(af - F(41.42)) / (F(42.2) - F(41.42))} /> : null}
        <Rings x={222} y={880} p={(af % 44) / 44} /><Rings x={266} y={926} p={((af + 20) % 44) / 44} />
      </svg>
      {landed1 ? <div style={{ position: "absolute", left: 196, top: 856 + Math.sin(af / 16) * 4 }}><Cucumber size={62} rot={76} /></div> : null}
      {landed2 ? <div style={{ position: "absolute", left: 280, top: 886 + Math.cos(af / 15) * 4 }}><Cucumber size={62} rot={104} /></div> : null}
    </AbsoluteFill>
  );
};

const Shot6: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(43.72);
  const shadowX = lerp(150, 470, 0.5 + 0.5 * Math.sin(af / 90));
  return (
    <AbsoluteFill>
      <Pond variant="dim" frame={af} />
      <div style={{
        position: "absolute", left: shadowX, top: 838, width: 210, height: 52, borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(8,20,34,0.55) 0%, rgba(8,20,34,0) 70%)",
      }} />
      <KappaInPond left={175} top={530} width={450} visibleH={370} riseY={70} eyes="stern" dish={1} frame={af} />
      <CharBox left={-52} top={650} width={461}>
        <Bob frame={af} amp={3} speed={34}>
          <Mascot eyes="side" mouth="wavy" />
        </Bob>
      </CharBox>
      <div style={{ position: "absolute", left: 520, top: 650, width: 175, height: 239 }}>
        <Sign />
      </div>
      <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <Rings x={400} y={906} p={(af % 52) / 52} color="#bcd9ea" />
      </svg>
    </AbsoluteFill>
  );
};

const Shot7: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(53.82);
  const stomp1 = af >= F(55.42) && af < F(55.42) + 16;
  const stomp2 = af >= F(57.72) && af < F(57.72) + 16;
  const sumo = stomp1 ? 1 : stomp2 ? 2 : 0;
  const squash = (af >= F(55.42) + 10 && af < F(55.42) + 17) || (af >= F(57.72) + 10 && af < F(57.72) + 17) ? 0.965 : 1;
  return (
    <AbsoluteFill>
      <Pond variant="golden" frame={af} />
      <CharBox left={123} top={575} width={514}>
        <div style={{ transform: `scaleY(${squash})`, transformOrigin: "50% 100%", width: "100%", height: "100%" }}>
          <Kappa eyes={blink(af, 47, "open")} dish={1} sumo={sumo} beakOpen />
        </div>
      </CharBox>
      <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {stomp1 ? <Rings x={348} y={1058} p={(af - F(55.42)) / 16} color="#d9c08a" /> : null}
        {stomp2 ? <Rings x={412} y={1058} p={(af - F(57.72)) / 16} color="#d9c08a" /> : null}
      </svg>
      <CharBox left={-66} top={655} width={429}>
        <div style={{ transform: `translateY(${Math.abs(Math.sin(af / 6)) * -8}px)`, width: "100%", height: "100%" }}>
          <Mascot eyes="happy" mouth="grin" />
        </div>
      </CharBox>
    </AbsoluteFill>
  );
};

const Shot8: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(59.19);
  const raise = af >= F(63.2);
  return (
    <AbsoluteFill>
      <Pond variant="golden" frame={af} />
      <CharBox left={-25} top={610} width={482}>
        <Bob frame={af} amp={5} speed={30}>
          <Kappa eyes={blink(af, 61, "happy")} dish={1} beakOpen={Math.floor(af / 9) % 2 === 0} />
        </Bob>
      </CharBox>
      <CharBox left={295} top={610} width={482}>
        <Bob frame={af} amp={5} speed={28}>
          <Mascot eyes={blink(af, 21, "happy")} mouth="grin" armUp={raise} holdCuke={raise} />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const SHOTS: { from: number; to: number; C: React.FC }[] = [
  { from: 0, to: F(4.93), C: Shot1 },
  { from: F(4.93), to: F(11.26), C: Shot2 },
  { from: F(11.26), to: F(20.88), C: Shot3 },
  { from: F(20.88), to: F(31.5), C: Shot4 },
  { from: F(31.5), to: F(43.72), C: Shot5 },
  { from: F(43.72), to: F(53.82), C: Shot6 },
  { from: F(53.82), to: F(59.19), C: Shot7 },
  { from: F(59.19), to: KONON_FRAMES, C: Shot8 },
];

export const KappaKonon: React.FC<{ silent?: boolean }> = ({ silent }) => {
  useBaloo();
  return (
    <AbsoluteFill style={{ backgroundColor: "#79bfe8" }}>
      {SHOTS.map(({ from, to, C }, i) => (
        <Sequence key={i} from={from} durationInFrames={to - from} layout="none">
          <C />
        </Sequence>
      ))}
      <Karaoke />
      {silent ? null : <Audio src={staticFile("kappa-mix.wav")} />}
    </AbsoluteFill>
  );
};
