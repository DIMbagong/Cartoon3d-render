// MOON EXPLAINER — "Kenapa Bulan Terlihat Mengikuti Kita Saat Naik Mobil?"
// 16:9 explainer for SMP students, timed to the measured voice
// (production-moon/audio/starts.json; platform TTS option-A dub — the
// ElevenLabs re-dub after the 2026-12-17 quota reset reuses this grid).
// Line starts (s): L1 0.00, L2 6.37, L3 12.62, L4 18.07, L5 24.32, L6 32.65,
// L7 38.78, L8 45.67, L9 52.92, L10 61.61, L11 69.06, L12 75.19, L13 80.12,
// L14 89.37; voice ends 95.21.
// The scene IS the lesson: the world scrolls past the car (near layers fast,
// far layers slow) while the Moon is re-pinned to the camera every frame.
export const FPS = 30;
export const TOTAL = 2857; // 95.21 s @ 30 fps
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- shots ----------------
export type Light = "night";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0,    b: 379,  light: "night" }, // L1-L2  hook: the Moon follows us
  { id: 2, a: 379,  b: 542,  light: "night" }, // L3     no — a trick of distance
  { id: 3, a: 542,  b: 1163, light: "night" }, // L4-L6  near tree sweeps, far mountain crawls, paralaks gerak
  { id: 4, a: 1163, b: 1588, light: "night" }, // L7-L8  384.400 km; 10 km later, same direction
  { id: 5, a: 1588, b: 1848, light: "night" }, // L9     sailors steered by the Moon and stars
  { id: 6, a: 1848, b: 2404, light: "night" }, // L10-L12 the brain's conclusion, the rule, the truth
  { id: 7, a: 2404, b: TOTAL, light: "night" }, // L13-L14 try it yourself tonight + closing
];
export const XFADE: Record<number, number> = { 7: 12 };
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- scene constants ----------------
export const SPEED = 7; // world scroll, units/s (car cruise)
export const HERO_TREE_T0 = 18.07, HERO_TREE_X0 = 17, HERO_TREE_Z = -7.5;
/** Moon direction per shot (from the camera), tuned so the disc sits in the
 *  upper-right of each shot's frame; normalised in world.ts */
export const MOON_DIR: Record<number, V3> = {
  1: [0.16, 0.20, -1], 2: [0.30, 0.35, -1], 3: [0.05, 0.28, -1], 4: [0.18, 0.30, -1],
  5: [0.10, 0.22, -1], 6: [0.16, 0.20, -1], 7: [0.30, 0.08, -1],
};

export interface LabelDef { text: string; a: number; b: number; pos: V3; w: number; accent?: boolean }
export const LABELS: LabelDef[] = [
  { text: "dekat: cepat tertinggal", a: 542,  b: 730,  pos: [-2, 4.4, -9],   w: 8.5 },
  { text: "jauh: lambat berubah",    a: 730,  b: 980,  pos: [-7, 5.6, -22],  w: 9.5 },
  { text: "PARALAKS GERAK",          a: 980,  b: 1163, pos: [-1, 5.0, -10],  w: 10, accent: true },
  { text: "384.400 km",              a: 1163, b: 1588, pos: [7.5, 7.6, -26], w: 11, accent: true },
  { text: "10 km kemudian...",       a: 1370, b: 1588, pos: [-5.2, 3.8, -2], w: 7 },
  { text: "arah berubah hampir 0°",  a: 1370, b: 1588, pos: [8.0, 5.0, -26], w: 9.5 },
];
export const LINE_TREE: [number, number] = [542, 730];
export const LINE_MOON: [number, number] = [1163, 1588];
export const LINE_MOON2: [number, number] = [1370, 1588];

// ---------------- camera ----------------
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
  1: [{ f: 0,    s: (f) => dolly([2.4, 2.1, 11.8], [0, 1.35, -2], pushK(f, 0, 0.0009), { fov: 40 }) }],
  2: [{ f: 379,  s: (f) => dolly([0.4, 1.7, 6.2], [0.1, 1.2, 0], pushK(f, 379, 0.0012), { fov: 36 }) }],
  3: [
    { f: 542, s: (f) => dolly([3.6, 1.15, 7.8], [-1.5, 1.2, -3], pushK(f, 542, 0.0006), { fov: 42 }) },
    { f: 730, dur: 120, s: (f) => dolly([4.6, 3.6, 13.8], [-3.5, 3.0, -14], pushK(f, 730, 0.0005), { fov: 42 }) },
  ],
  4: [{ f: 1163, s: (f) => dolly([5.5, 1.35, 12.5], [-3.5, 4.6, -20], pushK(f, 1163, 0.0004), { fov: 44 }) }],
  5: [{ f: 1588, s: (f) => dolly([1.5, 2.4, 10.5], [-4, 8.5, -30], pushK(f, 1588, 0.0006), { fov: 40 }) }],
  6: [{ f: 1848, s: (f) => dolly([1.9, 1.95, 10.0], [0, 1.3, -1], pushK(f, 1848, 0.0008), { fov: 38 }) }],
  7: [
    { f: 2404, s: (f) => dolly([2.0, 2.0, 10.5], [0, 1.2, -2], pushK(f, 2404, 0.001), { fov: 42 }) },
    { f: 2560, dur: 200, s: () => dolly([-6.5, 7.5, 25], [0, 1.2, -2], 1, { fov: 42 }) },
  ],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

/** thin-lens focus per shot: the subject point + circle-of-confusion cap */
export const dofAt = (f: number): { focus: (f: number) => V3; cInf: number } => {
  const id = shotAt(f).id;
  switch (id) {
    case 1: return { focus: () => [0, 1.3, 0], cInf: 18 };
    case 2: return { focus: () => [0, 1.2, 0], cInf: 13 };
    case 3: return f < 730 ? { focus: () => [0, 1.2, 0], cInf: 22 } : { focus: () => [-2, 2, -10], cInf: 24 };
    case 4: return { focus: () => [0, 1.2, 0], cInf: 27 };
    case 5: return { focus: () => [-6, 10, -40], cInf: 34 };
    case 6: return { focus: () => [0, 1.25, 0], cInf: 16 };
    default: return { focus: () => [0, 1.2, 0], cInf: 20 };
  }
};
