// Timeline of the parade short: the bridge short's cast (the green platoon, the officer,
// Thomas the whistler, the townsfolk, the kid + parent) in a NEW place — the town square
// with its clock tower and the giant centenary cake. Timed to the measured voice
// (production-parade/voice/words.json, platform TTS, no time-stretch).
// Line starts (s): L1 0.00, L2 6.29, L3 13.78, L4 20.75, L5 27.40, L6 34.69, L7 40.58,
// L8 47.91, L9 53.44, L10 57.57, L11 62.90, L12 70.47; voice ends 81.83.
export const FPS = 30;
export const TOTAL = 2480; // 82.67 s
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- world layout (metres) ----------------
export const CAKE_AT: V3 = [5.5, 0, -3.0];       // the centenary cake on its table
export const OFFICER_AT: V3 = [4.2, 0, 4.6];
export const KID_AT: V3 = [8.6, 0, 3.2];         // the kid + parent near the cake side
export const PARENT_AT: V3 = [9.4, 0, 3.9];
export const LOOP_R = 8.5;                        // the parade loop radius
export const CHERRY_TO: V3 = [8.15, 0, 2.55];    // where the runaway cherry stops

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 413, light: "day" },      // wide: the square, the tower, the column enters
  { id: 2, a: 413, b: 622, light: "day" },    // the officer demands perfection
  { id: 3, a: 622, b: 822, light: "day" },    // Thomas whistles, the column locks step
  { id: 4, a: 822, b: 1040, light: "day" },   // lap one: cheers, the officer smiles
  { id: 5, a: 1040, b: 1217, light: "day" },  // the bell begins to swing
  { id: 6, a: 1217, b: 1603, light: "day" },  // the bell tolls, the cake wobbles, the cherry runs
  { id: 7, a: 1603, b: 1887, light: "day" },  // the catch, the shout: BREAK STEP
  { id: 8, a: 1887, b: TOTAL, light: "golden" }, // golden calm: the fals whistle, crane out
];
export const XFADE: Record<number, number> = { 2: 6, 5: 8, 7: 8, 8: 8 };
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- performance envelopes (seconds) ----------------
const T = (f: number) => f / FPS;
/** parade speed (m/s): full march until the shout at 57.57, then a stroll */
export const speedAt = (t: number) => t < 57.57 ? 1.5 : 0.85;
/** angle of the column head (Thomas) on the loop; he passes the camera front (theta=0) at 23.5 s */
export const headTheta = (t: number) => {
  // integrate the speed in two pieces so the stroll is slower
  const d = t <= 57.57 ? 1.5 * t : 1.5 * 57.57 + 0.85 * (t - 57.57);
  return d / LOOP_R - (1.5 * 23.5) / LOOP_R;
};
/** after the shout each soldier keeps his OWN step phase (they break step) */
export const breakK = (t: number) => smooth((t - 57.57) / 1.6);
/** bell swing amplitude, degrees: grows lap 2, full lap 3, dies after the shout */
export const bellAmp = (t: number) => {
  if (t < 34.69) return 0;
  if (t < 40.58) return 6 * smooth((t - 34.69) / 5.89);
  if (t < 57.57) return 6 + 9 * smooth((t - 40.58) / 6);
  return 15 * (1 - smooth((t - 57.57) / 6.5));
};
export const bellAngle = (t: number) => bellAmp(t) * Math.sin(2 * Math.PI * (t / 2.2));
/** cake wobble amplitude, degrees: a tremble on lap 2, a real sway on lap 3, calm after */
export const cakeAmp = (t: number) => {
  if (t < 34.69) return 0;
  if (t < 40.58) return 1.4 * smooth((t - 34.69) / 5.89);
  if (t < 57.57) return 1.4 + 3.4 * smooth((t - 40.58) / 5);
  return 4.8 * (1 - smooth((t - 57.57) / 4));
};
export const cakeWob = (t: number) => cakeAmp(t) * Math.sin(2 * Math.PI * 1.35 * t);
/** the runaway cherry: sits on the cake until L8 (47.91), falls, rolls to the kid, stops 52.6 */
export const cherryPos = (t: number): V3 => {
  const top: V3 = [CAKE_AT[0] + 0.35, 2.06, CAKE_AT[2] + 0.3];
  if (t < 47.91) return top;
  if (t < 48.45) { // the fall off the cake edge
    const u = (t - 47.91) / 0.54;
    return [top[0] + 0.55 * u, top[1] * (1 - u * u) + 0.09 * u * u, top[2] + 0.5 * u];
  }
  const u = easeOut((t - 48.45) / 4.15); // the roll, decelerating
  const x0 = top[0] + 0.55, z0 = top[2] + 0.5;
  return [x0 + (CHERRY_TO[0] - x0) * u, 0.09, z0 + (CHERRY_TO[2] - z0) * u];
};
/** crowd cheer level 0..1 (drives waving + hopping) */
export const cheerAt = (t: number) => {
  if (t >= 27.4 && t < 34.69) return 0.7;
  if (t >= 53.44 && t < 58.5) return 1.0;
  if (t >= 62.9) return 0.45;
  return 0.15;
};

// ---------------- camera (grammar copied from the bridge / kappa shorts) ----------------
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
  1: [{ f: 0, s: (f) => dolly([0, 6.5, 25], [0, 1.6, -5], pushK(f, 0, 0.0009), { fov: 46 }) }],
  2: [{ f: 413, s: (f) => dolly([7.6, 2.3, 11.2], [4.2, 1.25, 4.6], pushK(f, 413, 0.0016)) }],
  3: [{ f: 622, s: (f) => dolly([3.6, 2.0, 16.2], [0.8, 1.15, 7.2], pushK(f, 622, 0.0012), { fov: 38 }) }],
  4: [
    { f: 822, s: (f) => dolly([-8.5, 3.4, 19.5], [1.5, 1.0, -2], pushK(f, 822, 0.0009), { fov: 44 }) },
    { f: 965, cut: true, s: (f) => dolly([8.6, 2.6, 12.5], [4.2, 1.25, 4.6], pushK(f, 965, 0.0012), { fov: 42 }) }, // cut on "Perwira pun mulai tersenyum"
  ],
  5: [{ f: 1040, s: (f) => dolly([10.5, 2.7, 3.0], [0, 9.2, -21], pushK(f, 1040, 0.0008), { fov: 42 }) }],
  6: [{ f: 1217, s: (f) => dolly([13.5, 3.2, 9.5], [4.5, 1.6, -4], pushK(f, 1217, 0.0007), { fov: 44 }) }],
  7: [{ f: 1603, s: (f) => dolly([12.6, 2.1, 10.6], [7.9, 0.9, 3.5], pushK(f, 1603, 0.0013), { fov: 38 }) }],
  8: [
    { f: 1887, s: (f) => dolly([0, 5.2, 22.5], [1.0, 1.4, -3.5], pushK(f, 1887, 0.0004), { fov: 44 }) },
    { f: 2180, dur: 260, s: (f) => dolly([0, 10.5, 31], [1.5, 1.5, -4], pushK(f, 1887, 0.0004), { fov: 44 }) },
  ],
};
export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

/** thin-lens focus per shot */
export const dofAt = (f: number): { focus: (f: number) => V3; cInf: number } => {
  const id = shotAt(f).id;
  switch (id) {
    case 1: return { focus: () => [0, 1.2, 4], cInf: 10 };
    case 2: return { focus: () => [...OFFICER_AT] as V3, cInf: 18 };
    case 3: return { focus: () => [0.4, 1.1, 8.0], cInf: 20 };
    case 4: return f < 965 ? { focus: () => [0, 1.1, 6], cInf: 12 } : { focus: () => [...OFFICER_AT] as V3, cInf: 16 };
    case 5: return { focus: () => [0, 10.5, -21], cInf: 14 };
    case 6: return { focus: () => [CAKE_AT[0], 1.2, CAKE_AT[2]], cInf: 18 };
    case 7: return { focus: () => [KID_AT[0], 0.7, KID_AT[2]], cInf: 20 };
    case 8: return { focus: () => [0, 1.2, 2], cInf: 10 };
    default: return { focus: () => [0, 1.1, 4], cInf: 14 };
  }
};
