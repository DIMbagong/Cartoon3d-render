// Cast staging for the parade short: the bridge short's own people — the green platoon,
// the officer, Thomas the whistler, the townsfolk, the kid and his parent — staged around
// the town square. Reuses the bridge engine's billboard system (Pool / Actor / Fx) and the
// shared character drawings (bridge/toon.ts).
import * as THREE from "three";
import {
  bodyFront, bodySide, fxNote, fxContact,
  soldier, townsfolk, OFFICER, KID, PARENT, FrontOpts, SideOpts, Expr, Outfit,
} from "../bridge/toon";
import { Place, FxPlace, Stage, CamInfo } from "../bridge/cast";
import {
  FPS, LOOP_R, OFFICER_AT, KID_AT, PARENT_AT,
  headTheta, breakK, cheerAt, clamp01, smooth,
} from "./story";

const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

const SUN2 = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN2.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN2.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number) => {
  const f = Math.round(t * FPS);
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};

type Who = { o: Outfit; okey: string; seed: number };
const SOLDIER = [0, 1, 2, 3].map((v) => ({ o: soldier(v), okey: `s${v}`, seed: ((v * 5 + 3) % 7) + 1 }));
const OFFICER_WHO: Who = { o: OFFICER, okey: "off", seed: 2 };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => ({ o: townsfolk(v), okey: `f${v}`, seed: v + 1 }));
const KID_WHO: Who = { o: KID, okey: "kid", seed: 5 };
const PARENT_WHO: Who = { o: PARENT, okey: "parent", seed: 6 };
const tmpV = new THREE.Vector3();

const personP = (cam: CamInfo, who: Who, x: number, y: number, z: number, side: boolean, mirror: boolean,
  fo: FrontOpts, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmpV.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const light = light2D(cam, side && mirror);
  const f2: FrontOpts = { ...fo, light, seed: who.seed }, s2: SideOpts = { ...so, light, seed: who.seed };
  const key = side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return { key, x, y, z, scale, mirror, draw: (p) => (side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)), size: [w, h, k] };
};
const blobP = (out: Stage, x: number, y: number, z: number, sc = 1) => {
  out.fx.push({ key: "blob|contact|#4a4640", cw: 128, ch: 128, draw: (p) => fxContact(p, "#4a4640"), x, y: y + 0.02, z, w: 0.55 * sc, h: 0.42 * sc, flat: true, rot: 0.4 });
};
/** front / side view for someone at (x,z) walking along (dx,dz) — the bridge cast's recipe */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

/** Thomas whistles in L4 (20.75-27.4) and again, fals, in L12 (70.47+) */
const thomasWhistling = (t: number) => (t >= 20.75 && t < 27.4) || t >= 70.47;

const column = (t: number, cam: CamInfo, out: Stage) => {
  const bk = breakK(t);
  const strolling = t >= 57.57;
  for (let i = 0; i < 16; i++) {
    const lane = (i % 3) - 1;                       // -1, 0, +1 across the loop
    const rank = Math.floor(i / 3);                  // 0 = front rank (Thomas is i=0)
    const r = LOOP_R + lane * 0.95;
    const th = headTheta(t) - (rank * 1.35 + (i % 3) * 0.12) / LOOP_R - i * 0.012 * bk;
    const x = r * Math.sin(th), z = r * Math.cos(th);
    const dx = Math.cos(th), dz = -Math.sin(th);     // heading (tangent)
    const view = viewOf(cam, x, z, dx, dz);
    const isThomas = i === 0;
    let expr: Expr = i % 4 === 3 ? "smile_closed" : i % 2 ? "neutral" : "stern";
    if (t >= 40.58 && t < 57.57) expr = i % 3 === 0 ? "nervous" : "neutral";
    if (strolling) expr = (["smile", "smile_closed", "grin", "smile"] as Expr[])[i % 4];
    if (isThomas && thomasWhistling(t)) expr = "whistle";
    const phase = strolling ? q((t * 0.55 + i * 0.37 * bk + hh(i, 5)) % 1, 24) : q((t + rank * 0.0) % 1, 24);
    const fo: FrontOpts = strolling
      ? { mode: "stroll", phase, expr, look: Math.max(-1, Math.min(1, Math.round(Math.sin(t * 0.8 + i * 1.7)))), blink: lidAt(t, i), prop: t > 66 && i % 7 === 3 ? "icecream" : null }
      : { mode: "march", phase, expr, look: 0, blink: expr === "whistle" ? 0 : lidAt(t, i), lift: 60 };
    const so: SideOpts = strolling
      ? { mode: "march", phase, expr, blink: lidAt(t, i), stomp: 0.55, stride: 0.8 * view.fs }
      : { mode: "march", phase, expr, blink: expr === "whistle" ? 0 : lidAt(t, i), stomp: 1.1, stride: view.fs };
    out.places.push(personP(cam, SOLDIER[i % 4], x, 0, z, view.side, view.mirror, fo, so));
    blobP(out, x, 0, z);
    if (isThomas && expr === "whistle" && cam.pos.distanceTo(tmpV.set(x, 0, z)) < 15) {
      for (let n = 0; n < 4; n++) {
        const age = ((t + n * 0.42 + 0.3) % 1.68) / 1.68;
        const pop = Math.min(1, age * 7) * (age > 0.82 ? (1 - age) / 0.18 : 1);
        if (pop <= 0.02) continue;
        const kind = n % 2, side = 0.16 + 0.32 * age + 0.05 * Math.sin(age * 9 + n);
        out.fx.push({ key: `note${kind}`, cw: 220, ch: 260, draw: (p) => fxNote(p, kind), x: x + cam.right.x * side, y: 1.5 + 0.85 * age, z: z + cam.right.z * side - 0.1,
          w: 0.17 * pop, h: 0.2 * pop, rot: 0.3 * Math.sin(age * 6 + n) });
      }
    }
  }
};

const officer = (t: number, cam: CamInfo, out: Stage) => {
  let expr: Expr = "stern";
  if (t >= 27.4 && t < 34.69) expr = "smile_closed";
  else if (t >= 34.69 && t < 53.44) expr = "nervous";
  else if (t >= 53.44 && t < 57.57) expr = "shock";
  else if (t >= 57.57 && t < 62.9) expr = "stern";
  else if (t >= 62.9) expr = "relief";
  out.places.push(personP(cam, OFFICER_WHO, OFFICER_AT[0], 0, OFFICER_AT[2], false, false,
    { mode: "stand", expr, blink: lidAt(t, 99), facing: 1 }, {}));
  blobP(out, OFFICER_AT[0], 0, OFFICER_AT[2], 1.05);
};

const crowd = (t: number, cam: CamInfo, out: Stage) => {
  const cheer = cheerAt(t);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + hh(i, 1) * 0.18;
    const r = 12.6 + hh(i, 2) * 1.8;
    const x = r * Math.sin(a), z = r * Math.cos(a);
    if (x > 5.5 && z > -0.5 && z < 8.5) continue;   // keep the cake / kid sector open
    const kid = i % 5 === 2;
    const who = kid ? KID_WHO : FOLK[i % 6];
    const hop = kid && cheer > 0.5 ? Math.abs(Math.sin(t * 6 + i)) * 0.16 : 0;
    const expr: Expr = cheer > 0.5 ? (["grin", "laugh", "smile", "smile_closed"] as Expr[])[i % 4] : (["smile", "smile_closed", "neutral", "smile"] as Expr[])[i % 4];
    const fo: FrontOpts = { mode: "stand", expr, wave: cheer > 0.4 && i % 3 === 2 ? q(Math.sin(t * 9 + i * 1.3), 30) : undefined, blink: lidAt(t, i + 40) };
    out.places.push(personP(cam, who, x, hop, z, false, false, fo, {}, kid ? 0.72 : 1));
    blobP(out, x, 0, z, kid ? 0.72 : 1);
  }
  // the kid of the story + his parent, by the cake
  const caught = t >= 52.6;
  const hop = t >= 53.44 && t < 55.2 ? Math.abs(Math.sin((t - 53.44) * 7)) * 0.17 : 0;
  out.places.push(personP(cam, KID_WHO, KID_AT[0], hop, KID_AT[2], false, false,
    { mode: "stand", expr: caught ? "laugh" : t >= 47.91 ? "shock" : "smile", blink: lidAt(t, 77) }, {}, 0.72));
  blobP(out, KID_AT[0], 0, KID_AT[2], 0.72);
  out.places.push(personP(cam, PARENT_WHO, PARENT_AT[0], 0, PARENT_AT[2], false, false,
    { mode: "stand", expr: caught ? "laugh" : "smile", wave: cheerAt(t) > 0.4 ? q(Math.sin(t * 8 + 2), 30) : undefined, blink: lidAt(t, 78) }, {}));
  blobP(out, PARENT_AT[0], 0, PARENT_AT[2]);
};

/** everything with a face in shot `id` at time t (seconds) */
export const stageP = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  column(t, cam, out);
  officer(t, cam, out);
  crowd(t, cam, out);
  return out;
};
export { FPS };
