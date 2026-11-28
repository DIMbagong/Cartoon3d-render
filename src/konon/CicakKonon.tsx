// "Cicak, si Penjaga Dinding Rumah" in the konon flat-chibi style.
// Same engine as KappaKonon: measured voice timing (words-cicak.json),
// hard-cut shots, big word-by-word karaoke.
import React, { useEffect, useState } from "react";
import {
  AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate,
  staticFile, useCurrentFrame,
} from "remotion";
import { Mascot, type Eyes } from "./chars";
import { Ciko, Cat, LooseTail } from "./chars2";
import { Wall } from "./bg2";
import wordsData from "./words-cicak.json";

const FPS = 30;
export const CICAK_FRAMES = 2412;
const F = (sec: number) => Math.round(sec * FPS);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

type W = { w: string; s: number; e: number };
const WORDS = wordsData as W[];
const LINE_STARTS = [0, 5.85, 12.9, 18.07, 23.56, 29.65, 35.46, 43.27, 49.88, 58.33, 65.94, 71.95];
const LINES: W[][] = LINE_STARTS.map((st, i) =>
  WORDS.filter((w) => w.s >= st - 0.02 && (i === LINE_STARTS.length - 1 || w.s < LINE_STARTS[i + 1] - 0.02)));

const useBaloo = () => {
  const [handle] = useState(() => delayRender("load-baloo-cicak"));
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
  left: number; top: number; width: number; rot?: number; origin?: string; children: React.ReactNode;
}> = ({ left, top, width, rot = 0, origin = "50% 88%", children }) => (
  <div style={{
    position: "absolute", left, top, width, height: width * (560 / 600),
    transform: rot ? `rotate(${rot}deg)` : undefined, transformOrigin: origin,
  }}>{children}</div>
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
      <Wall variant="day" frame={frame} />
      <CharBox left={440} top={300} width={270} rot={-6}>
        <Ciko eyes={blink(frame, 30, "open")} mouth="smile" />
      </CharBox>
      <div style={{ position: "absolute", left: x, top: 616 + bobY, width: 504, height: 470, transform: `rotate(${walking ? Math.sin(frame / 4.2) * 2.4 : 0}deg)` }}>
        <Mascot eyes={blink(frame, 0, "open")} mouth="smile" walk={walking ? frame / 9 : 0} />
      </div>
    </AbsoluteFill>
  );
};

const Shot2: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(5.85);
  return (
    <AbsoluteFill>
      <Wall variant="day" frame={af} />
      <CharBox left={-80} top={190} width={880}>
        <Bob frame={af} amp={5} speed={30}>
          <Ciko eyes={blink(af, 17, af < F(8.5) ? "happy" : "open")} mouth="smile" />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const Shot3: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(12.9);
  const climb = easeInOut(clamp01((af - F(13.4)) / (F(17.9) - F(13.4))));
  const cx = lerp(320, 300, climb), cy = lerp(685, 150, climb), rot = lerp(0, 180, climb);
  const hanging = af >= F(18.07);
  const sparkP = 0.7 + 0.3 * Math.sin(af / 5);
  return (
    <AbsoluteFill>
      <Wall variant="day" frame={af} />
      <CharBox left={cx} top={cy} width={430} rot={rot} origin="50% 50%">
        <Ciko eyes={blink(af, 44, "open")} mouth="open" />
      </CharBox>
      {hanging ? <><Sparkle x={428} y={150} s={sparkP} /><Sparkle x={556} y={150} s={sparkP * 0.75} /></> : null}
      <CharBox left={-52} top={657} width={460}>
        <Bob frame={af} amp={4}>
          <Mascot eyes={blink(af, 8, hanging ? "happy" : "shock")} mouth={hanging ? "grin" : "open"} />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const CatAndCiko: React.FC<{ af: number; stage: "stalk" | "drop" | "chase" }> = ({ af, stage }) => {
  // cat: peeks over the pot bush, steps out, lunges at the drop
  let catLeft = 470, catTop = 905, paw = false;
  if (stage === "stalk") {
    const peek = easeOut(clamp01((af - F(26.5)) / (F(28.3) - F(26.5))));
    catTop = lerp(905, 872, peek);
    const step = easeInOut(clamp01((af - F(28.3)) / (F(29.2) - F(28.3))));
    catLeft = lerp(470, 350, step); catTop = lerp(catTop, 735, step);
    paw = af >= F(29.2);
  } else {
    catLeft = 350; catTop = 735; paw = true;
    if (stage === "drop" && af >= F(33.3)) {
      const lunge = easeOut(clamp01((af - F(33.3)) / (F(34.2) - F(33.3))));
      catLeft = lerp(350, 415, lunge);
    }
    if (stage === "chase") {
      catLeft = 415;
      paw = af < F(40.0) ? true : Math.floor(af / 11) % 2 === 0;
    }
  }
  const cikoTop = stage === "chase" ? lerp(250, 165, easeOut(clamp01((af - F(35.46)) / (F(38.5) - F(35.46))))) : 250;
  const cikoLeft = stage === "chase" ? lerp(400, 435, easeOut(clamp01((af - F(35.46)) / (F(38.5) - F(35.46))))) : 400;
  const dropped = af >= F(32.73);
  const scared = af >= F(26.8) && stage !== "chase";
  const tremble = scared && !dropped ? Math.sin(af * 1.9) * 2.2 : 0;
  return (
    <>
      <CharBox left={cikoLeft + tremble} top={cikoTop} width={340}>
        <Ciko eyes={blink(af, 52, scared ? "shock" : "open")} mouth={scared ? "open" : "smile"}
          tail={dropped ? "none" : "full"} scared={scared} />
      </CharBox>
      <CharBox left={catLeft} top={catTop} width={380}>
        <Cat eyes={stage === "chase" && af > F(41.5) ? "happy" : "open"} pawUp={paw} />
      </CharBox>
    </>
  );
};

const Shot4: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(23.56);
  return (
    <AbsoluteFill>
      <Wall variant="golden" frame={af} />
      <CatAndCiko af={af} stage="stalk" />
      <CharBox left={-60} top={666} width={450}>
        <Bob frame={af} amp={4}>
          <Mascot eyes={blink(af, 21, af > F(27.5) ? "shock" : "side")} mouth="wavy" />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const FallingTail: React.FC<{ af: number }> = ({ af }) => {
  const dropT = F(32.73), landT = F(33.18);
  if (af < dropT) return null;
  const p = clamp01((af - dropT) / (landT - dropT));
  const y = lerp(520, 985, p * p);
  const bounce = af > landT && af < landT + 14 ? Math.sin((af - landT) / 14 * Math.PI) * -13 : 0;
  return (
    <div style={{ position: "absolute", left: 452, top: y + bounce, width: 200, height: 100, transform: `rotate(${lerp(-12, 14, p)}deg)` }}>
      <LooseTail />
    </div>
  );
};

const Shot5: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(29.65);
  return (
    <AbsoluteFill>
      <Wall variant="golden" frame={af} />
      <CatAndCiko af={af} stage="drop" />
      <FallingTail af={af} />
      <CharBox left={-60} top={666} width={450}>
        <Bob frame={af} amp={4}>
          <Mascot eyes={blink(af, 5, "shock")} mouth="open" />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const Shot6: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(35.46);
  const wiggle = af >= F(37.9) && af < F(42.2) ? Math.sin(af * 0.62) * 12 : af >= F(42.2) ? Math.sin(af * 0.62) * 3 : 0;
  return (
    <AbsoluteFill>
      <Wall variant="golden" frame={af} />
      <CatAndCiko af={af} stage="chase" />
      <div style={{ position: "absolute", left: 452, top: 985, width: 200, height: 100, transform: `rotate(${14 + wiggle}deg)`, transformOrigin: "12% 50%" }}>
        <LooseTail />
      </div>
      <CharBox left={-60} top={666} width={450}>
        <Bob frame={af} amp={5}>
          <Mascot eyes={blink(af, 12, af > F(40.5) ? "happy" : "shock")} mouth={af > F(40.5) ? "grin" : "open"} />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const Shot7: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(43.27);
  return (
    <AbsoluteFill>
      <Wall variant="day" frame={af} />
      <CharBox left={20} top={666} width={450}>
        <Bob frame={af} amp={3} speed={34}>
          <Ciko eyes="side" mouth="flat" tail="none" />
        </Bob>
      </CharBox>
      <CharBox left={295} top={675} width={440}>
        <Bob frame={af} amp={4}>
          <Mascot eyes={blink(af, 19, "open")} mouth={af > F(48.6) ? "smile" : "flat"} />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const Shot8: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(49.88);
  const grown = af >= F(52.32);
  const sparkP = 0.7 + 0.3 * Math.sin(af / 5);
  return (
    <AbsoluteFill>
      <Wall variant="day" frame={af} />
      <CharBox left={80} top={647} width={470}>
        <Bob frame={af} amp={4}>
          <Ciko eyes={blink(af, 27, grown ? "happy" : "open")} mouth={grown ? "smile" : "flat"} tail={grown ? "regrown" : "none"} />
        </Bob>
      </CharBox>
      {grown && af < F(55.5) ? <><Sparkle x={128} y={952} s={sparkP} /><Sparkle x={186} y={990} s={sparkP * 0.7} /></> : null}
      <CharBox left={385} top={685} width={430}>
        <Bob frame={af} amp={5}>
          <Mascot eyes={blink(af, 33, "happy")} mouth="grin" />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const Mosquito: React.FC<{ af: number }> = ({ af }) => {
  const t0 = F(60.8), t1 = F(63.82);
  if (af < t0 || af >= t1) return null;
  const p = (af - t0) / (t1 - t0);
  const x = lerp(110, 505, p) + Math.sin(p * 9) * 30;
  const y = lerp(520, 368, p) + Math.cos(p * 7) * 24;
  const flap = Math.floor(af / 2) % 2 === 0 ? -24 : 24;
  return (
    <svg viewBox="0 0 60 44" style={{ position: "absolute", left: x, top: y, width: 46, height: 34 }}>
      <ellipse cx="22" cy="14" rx="13" ry="8" fill="#ffffff" opacity="0.75" transform={`rotate(${flap} 22 20)`} />
      <ellipse cx="40" cy="14" rx="11" ry="7" fill="#ffffff" opacity="0.75" transform={`rotate(${-flap} 40 20)`} />
      <ellipse cx="31" cy="24" rx="10" ry="6.5" fill="#3a3f47" />
      <circle cx="23" cy="22" r="4.5" fill="#3a3f47" />
      <line x1="19" y1="24" x2="6" y2="30" stroke="#3a3f47" strokeWidth="2.4" />
    </svg>
  );
};

const Shot9: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(58.33);
  const caught = af >= F(63.82);
  const tongueP = af >= F(63.82) && af < F(63.98) ? 1 - (af - F(63.82)) / (F(63.98) - F(63.82)) : 0;
  return (
    <AbsoluteFill>
      <Wall variant="night" frame={af} />
      <CharBox left={400} top={240} width={330}>
        <Bob frame={af} amp={3} speed={32}>
          <Ciko eyes={blink(af, 48, caught ? "happy" : "open")} mouth={caught ? "smile" : "open"} tail="regrown" />
        </Bob>
      </CharBox>
      <Mosquito af={af} />
      {tongueP > 0 ? (
        <svg viewBox="0 0 720 1280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <line x1={565} y1={383} x2={565 - 60 * tongueP} y2={383 - 15 * tongueP} stroke="#f28bb4" strokeWidth="6" strokeLinecap="round" />
          <circle cx={565 - 60 * tongueP} cy={383 - 15 * tongueP} r="5.5" fill="#f28bb4" />
        </svg>
      ) : null}
      <CharBox left={-60} top={685} width={430}>
        <Bob frame={af} amp={5}>
          <Mascot eyes={blink(af, 15, "happy")} mouth="grin" armUp={caught} />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const Shot10: React.FC = () => {
  const frame = useCurrentFrame();
  const af = frame + F(71.95);
  const glance = af >= F(76.3) && af < F(77.6);
  const tailPlay = af >= F(78.11) && af < F(79.3) ? Math.sin(af * 1.4) * 3.2 : 0;
  return (
    <AbsoluteFill>
      <Wall variant="golden" frame={af} />
      <CharBox left={15} top={657} width={460} rot={tailPlay}>
        <Bob frame={af} amp={4} speed={30}>
          <Ciko eyes={blink(af, 58, "happy")} mouth="smile" tail="regrown" />
        </Bob>
      </CharBox>
      <CharBox left={290} top={657} width={460}>
        <Bob frame={af} amp={5} speed={28}>
          <Mascot eyes={blink(af, 24, glance ? "side" : "happy")} mouth="grin" />
        </Bob>
      </CharBox>
    </AbsoluteFill>
  );
};

const SHOTS: { from: number; to: number; C: React.FC }[] = [
  { from: 0, to: F(5.85), C: Shot1 },
  { from: F(5.85), to: F(12.9), C: Shot2 },
  { from: F(12.9), to: F(23.56), C: Shot3 },
  { from: F(23.56), to: F(29.65), C: Shot4 },
  { from: F(29.65), to: F(35.46), C: Shot5 },
  { from: F(35.46), to: F(43.27), C: Shot6 },
  { from: F(43.27), to: F(49.88), C: Shot7 },
  { from: F(49.88), to: F(58.33), C: Shot8 },
  { from: F(58.33), to: F(71.95), C: Shot9 },
  { from: F(71.95), to: CICAK_FRAMES, C: Shot10 },
];

export const CicakKonon: React.FC<{ silent?: boolean }> = ({ silent }) => {
  useBaloo();
  return (
    <AbsoluteFill style={{ backgroundColor: "#79bfe8" }}>
      {SHOTS.map(({ from, to, C }, i) => (
        <Sequence key={i} from={from} durationInFrames={to - from} layout="none">
          <C />
        </Sequence>
      ))}
      <Karaoke />
      {silent ? null : <Audio src={staticFile("cicak-mix.wav")} />}
    </AbsoluteFill>
  );
};
