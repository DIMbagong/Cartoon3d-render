// Timeline of the kappa short: 8 shots over one swamp-pond location, timed to the measured
// voice (production-kappa/voice/words.json, platform TTS, no time-stretch).
// Line starts (s): L1 0.00, L2 4.93, L3 11.26, L4 17.07, L5 20.88, L6 26.37, L7 31.50,
// L8 37.63, L9 43.72, L10 47.77, L11 53.82, L12 59.19; voice ends 66.79.
export const FPS = 30;
export const TOTAL = 2010; // 67.0 s: voice 66.79 + a held tail beat
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- world layout (metres) ----------------
export const POND: V3 = [0, 0, 0];            // pond centre; water surface y = 0.02
export const KAPPA_HOME: V3 = [-0.8, -0.32, 1.2]; // standing in the shallows, shins under water
export const MASCOT_SPOT: V3 = [2.6, 0, 6.4];     // on the near bank
export const SIGN_AT: V3 = [4.6, 0, 5.2];

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 148, light: "day" },     // wide: the swamp, mascot walks in
  { id: 2, a: 148, b: 338, light: "day" },   // medium: the kappa emerges
  { id: 3, a: 338, b: 626, light: "day" },   // close: the water dish on its head
  { id: 4, a: 626, b: 945, light: "day" },   // two-shot: the bow trick, the spill
  { id: 5, a: 945, b: 1312, light: "day" },  // medium: cucumbers
  { id: 6, a: 1312, b: 1615, light: "day" }, // dim wide: the dark side + the warning sign
  { id: 7, a: 1615, b: 1776, light: "golden" }, // medium: sumo stomp
  { id: 8, a: 1776, b: TOTAL, light: "golden" }, // wide golden: side by side, the question
];
export const XFADE: Record<number, number> = { 2: 6, 6: 8, 7: 8, 8: 8 };
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

/** darkness of the "dark side" beat (shot 6): 0 normally, up to 1 mid-shot */
export const dimAt = (f: number) => {
  if (f < 1312 || f >= 1615) return 0;
  return smooth((f - 1312) / 48) * (1 - smooth((f - 1567) / 48));
};

// ---------------- performance envelopes (seconds) ----------------
const T = (f: number) => f / FPS;
/** kappa rises out of the pond at the start of L2 */
export const emergeK = (f: number) => easeOut((T(f) - 5.0) / 1.8);
/** mascot's deep bow (L5 "membungkuklah yang dalam"), degrees of forward tilt */
export const bowM = (f: number) => {
  const t = T(f);
  return 40 * smooth((t - 24.5) / 1.6) * (1 - smooth((t - 26.6) / 1.2));
};
/** kappa bows back (L6), then its dish water is gone */
export const bowK = (f: number) => {
  const t = T(f);
  return 42 * smooth((t - 26.9) / 1.7) * (1 - smooth((t - 29.6) / 1.6));
};
/** sara water level: full until the bow spills it at ~29.0 s, refilled off-screen by shot 5 */
export const dishAt = (f: number) => {
  const t = T(f);
  if (t < 28.9) return 1;
  if (t < 29.15) return 1 - (t - 28.9) / 0.25;
  return f >= 945 ? 1 : 0;
};

// ---------------- camera (grammar copied from the bridge short) ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number) => Math.exp(-rate * Math.max(0, f - f0));
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const CAMS: Record<number, Key[]> = {
  // Framing verified by projection (scripts/project-check.mjs): every staged
  // subject inside the 9:16 frame at its beat. Shot 1 pans west->east with
  // the mascot's walk; shots 4/5 share one two-shot of the bow spot (2.2, 5.2).
  1: [
    { f: 0, s: (f) => dolly([0.4, 3.3, 14.8], [-1.6, 0.7, 2.6], pushK(f, 0, 0.0011), { fov: 44 }) },
    { f: 70, dur: 70, s: (f) => dolly([3.4, 3.3, 14.8], [0.6, 0.7, 2.2], pushK(f, 0, 0.0011), { fov: 44 }) },
  ],
  2: [{ f: 148, s: (f) => dolly([4.4, 2.2, 10.4], [-0.4, 0.95, 1.8], pushK(f, 148, 0.0012)) }],
  3: [{ f: 338, s: (f) => dolly([0.35, 1.5, 3.6], [-0.8, 1.28, 1.2], pushK(f, 338, 0.0009)) }],
  4: [{ f: 626, s: (f) => dolly([1.9, 1.85, 10.6], [1.10, 0.92, 3.2], pushK(f, 626, 0.0004)) }],
  5: [{ f: 945, s: (f) => dolly([1.9, 1.85, 10.6], [1.10, 0.92, 3.2], pushK(f, 945, 0.0004)) }],
  6: [{ f: 1312, s: (f) => dolly([2.0, 2.6, 15.5], [0.9, 0.8, 3.0], pushK(f, 1312, 0.0007), { fov: 44 }) }], // re-framed 2026-11-28: old cam put mascot+kappa on one screen-x (kappa hidden behind mascot) and the warning sign's dark back filled the right third; new cam separates them (kappa -0.4, mascot +0.67, sign out at +1.5)
  7: [{ f: 1615, s: (f) => dolly([4.6, 2.0, 10.8], [0.6, 0.9, 3.0], pushK(f, 1615, 0.0011)) }],
  8: [{ f: 1776, s: (f) => dolly([1.4, 2.8, 14.8], [1.2, 0.85, 3.4], pushK(f, 1776, 0.0009)) }],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

/** thin-lens focus per shot: the subject point + circle-of-confusion cap */
export const dofAt = (f: number): { focus: (f: number) => V3; cInf: number } => {
  const id = shotAt(f).id;
  switch (id) {
    case 1: return { focus: () => [0, 0.9, 6.0], cInf: 16 };
    case 2: return { focus: () => [KAPPA_HOME[0], 1.0, KAPPA_HOME[2]], cInf: 22 };
    case 3: return { focus: () => [KAPPA_HOME[0], 1.3, KAPPA_HOME[2]], cInf: 30 };
    case 4: case 5: return { focus: () => [0.7, 0.95, 3.4], cInf: 22 };
    case 6: return { focus: () => [0.6, 0.9, 3.1], cInf: 22 };
    case 7: return { focus: () => [0.3, 0.9, 2.9], cInf: 22 };
    case 8: return { focus: () => [0.8, 1.0, 4.8], cInf: 18 };
    default: return { focus: () => [0.6, 0.95, 2.8], cInf: 22 };
  }
};
