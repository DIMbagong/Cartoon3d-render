// "Kamu Terlempar ke Tahun 1945 dengan Satu HP, Baterai 100%, Tanpa Charger"
// Cerita Hipotetis, 9:16, timed to the measured voice (production-1945/audio/starts.json;
// platform TTS MAI_03 narration + MAI_01 pejuang dialogue, no time-stretch).
// Line starts (s): L1 0.00, L2 14.01, L3 22.50, L4 27.23, L5 34.96, L6 43.29,
// L7 54.58, L8 63.07, L9 68.68, L10 73.33, L11 83.94, L12 91.83; voice ends 103.19.
// The battery IS the story's hourglass: 100 -> 95 -> 75 -> 58 -> 25 -> 1 -> 0.
export const FPS = 30;
export const TOTAL = 3126; // 104.2 s @ 30 fps (voice 103.19 + tail)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- layout (metres) ----------------
export const MASCOT_AT: V3 = [0, 0, 0];          // the traveller's home spot, mid-street
export const PEJUANG_AT: V3 = [1.7, 0, 0.7];     // the young pejuang beside him
export const PORCH_AT: V3 = [0, 0, -6];          // a house beranda: night talks (S5, S8)
export const DAPUR_AT: V3 = [-4.6, 0, -4.2];     // the communal kitchen (S6)
export const PROK_AT: V3 = [0, 0, -13.2];        // the proclamation house porch (S9)
export const FLAG_AT: V3 = [-2.6, 0, -12.6];     // the flag pole by the proclamation house

// ---------------- key events (frames) ----------------
export const RAISE_A = 2540, RAISE_B = 2620;     // mascot lifts the phone during L11
export const FLASH_F = 2662;                     // "Klik." — the last photo
export const DIE_F = 2700;                       // the screen dies for good
export const phoneOn = (f: number) => f < DIE_F;
/** phone height in the mascot's hand: pocket level, raised for the photo */
export const phoneY = (f: number) => 1.08 + 1.05 * smooth((f - RAISE_A) / (RAISE_B - RAISE_A));

// ---------------- shots ----------------
export type Light = "day" | "golden" | "night";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0,    b: 420,  light: "golden" }, // L1      hook: wakes in 1945, phone at 100%
  { id: 2, a: 420,  b: 817,  light: "golden" }, // L2-L3   the camera demo + the pejuang's shock
  { id: 3, a: 817,  b: 1049, light: "golden" }, // L4      no signal in 1945
  { id: 4, a: 1049, b: 1329, light: "night" },  // L5      the flashlight night march (75%)
  { id: 5, a: 1329, b: 1637, light: "night" },  // L6      living by candlelight rules (58%)
  { id: 6, a: 1637, b: 1892, light: "golden" }, // L7      the communal kitchen
  { id: 7, a: 1892, b: 2060, light: "night" },  // L8      the gallery he dares not open (25%)
  { id: 8, a: 2060, b: 2200, light: "night" },  // L9      "kalau benda itu mati..."
  { id: 9, a: 2200, b: 2755, light: "golden" }, // L10-L11 17 August: the last 1%, the photo
  { id: 10, a: 2755, b: TOTAL, light: "golden" }, // L12    the photo never dies + closing question
];
export const XFADE: Record<number, number> = { 4: 10, 6: 8, 9: 8, 10: 10 };
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- battery labels (world-space diagram cards) ----------------
export interface LabelDef { text: string; a: number; b: number; pos: V3; w: number; accent?: boolean }
export const LABELS: LabelDef[] = [
  { text: "BATERAI 100%", a: 40,   b: 400,  pos: [0, 3.7, -3],    w: 7.5, accent: true },
  { text: "BATERAI 95%",  a: 460,  b: 660,  pos: [2.4, 3.1, -2],  w: 6.5 },
  { text: "BATERAI 75%",  a: 1150, b: 1320, pos: [0, 3.5, -4],    w: 6.5 },
  { text: "BATERAI 58%",  a: 1360, b: 1620, pos: [0, 2.45, -6],   w: 6.5 },
  { text: "BATERAI 25%",  a: 1920, b: 2050, pos: [0, 3.0, -1.5],  w: 6.5, accent: true },
  { text: "BATERAI 1%",   a: 2240, b: 2500, pos: [-3.6, 3.8, -7], w: 6.5, accent: true },
  { text: "BATERAI 0%",   a: 2820, b: 2980, pos: [0, 3.9, -3],    w: 6.5 },
];

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
  1: [{ f: 0,    s: (f) => dolly([0, 3.0, 12.5], [0, 1.2, -2], pushK(f, 0, 0.0009), { fov: 44 }) }],
  2: [{ f: 420,  s: (f) => dolly([3.2, 2.0, 8.6], [0.55, 1.15, 0], pushK(f, 420, 0.0012), { fov: 40 }) }],
  3: [{ f: 817,  s: (f) => dolly([-3.2, 2.3, 8.4], [0, 1.7, 0], pushK(f, 817, 0.0011), { fov: 40 }) }],
  4: [{ f: 1049, s: (f) => dolly([3.4, 2.1, 9.5], [0, 1.0, -2.5], pushK(f, 1049, 0.0009), { fov: 42 }) }],
  5: [{ f: 1329, s: (f) => dolly([0, 1.9, 0.4], [0, 0.9, -6], pushK(f, 1329, 0.001), { fov: 40 }) }],
  6: [{ f: 1637, s: (f) => dolly([1.5, 2.4, 3.5], [-4.2, 0.9, -4], pushK(f, 1637, 0.0009), { fov: 44 }) }],
  7: [{ f: 1892, s: (f) => dolly([1.7, 1.8, 5.0], [0, 1.15, 0], pushK(f, 1892, 0.0013), { fov: 38 }) }],
  8: [{ f: 2060, s: (f) => dolly([2.4, 1.9, -0.2], [0.1, 0.95, -6], pushK(f, 2060, 0.0011), { fov: 40 }) }],
  9: [
    { f: 2200, s: (f) => dolly([0, 2.8, 13], [0, 1.4, -6], pushK(f, 2200, 0.0005), { fov: 46 }) },
    { f: 2518, cut: true, s: (f) => dolly([5.4, 2.1, 1.8], [2.6, 1.3, -3.5], pushK(f, 2518, 0.001), { fov: 40 }) }, // L11: close on the raised phone
  ],
  10: [
    { f: 2755, s: (f) => dolly([0, 3.0, 12.5], [0, 1.2, -2], pushK(f, 2755, 0.0006), { fov: 44 }) },
    { f: 2920, dur: 190, s: (f) => dolly([0, 7.5, 26], [0, 1.2, -4], pushK(f, 2755, 0.0006), { fov: 44 }) },
  ],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

/** thin-lens focus per shot */
export const dofAt = (f: number): { focus: (f: number) => V3; cInf: number } => {
  const id = shotAt(f).id;
  switch (id) {
    case 1: return { focus: () => [0, 1.2, 0], cInf: 16 };
    case 2: return { focus: () => [0.4, 1.15, 0.2], cInf: 14 };
    case 3: return { focus: () => [0, 1.5, 0], cInf: 14 };
    case 4: return { focus: () => [0, 1.0, -1], cInf: 18 };
    case 5: return { focus: () => [0, 0.9, -6], cInf: 12 };
    case 6: return { focus: () => [-4.2, 0.9, -4], cInf: 16 };
    case 7: return { focus: () => [0, 1.15, 0], cInf: 11 };
    case 8: return { focus: () => [-0.2, 0.95, -6], cInf: 12 };
    case 9: return { focus: () => [0, 1.3, -8], cInf: 22 };
    default: return { focus: () => [0, 1.2, -2], cInf: 16 };
  }
};
