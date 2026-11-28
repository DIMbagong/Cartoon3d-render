// Cast for the Moon explainer: the mascot rides in the back seat, a parent
// drives. Both are side-view seated cards ("swing" seat mode); the 3D car
// body in world.ts occludes everything below the window line.
import {
  bodyFront, bodySide, fxBurst,
  MASCOT, PARENT, FrontOpts, SideOpts, Expr, Outfit, Pen,
} from "../bridge/toon";
import { Place, FxPlace, Stage, CamInfo } from "../bridge/cast";
import { FPS } from "./story";
import * as THREE from "three";

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
const MASCOT_WHO: Who = { o: MASCOT, okey: "mascot", seed: 3 };
const DRIVER_WHO: Who = { o: PARENT, okey: "driver", seed: 6 };
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

/** a hand-drawn question mark card (the mascot's puzzlement, L2) */
const fxQuestion = (p: Pen) => {
  const g = p.g;
  g.font = "700 300px 'Baloo 2', sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 26; g.strokeStyle = "#1f2a44"; g.lineJoin = "round";
  g.strokeText("?", 180, 190);
  g.fillStyle = "#ffd93b";
  g.fillText("?", 180, 190);
};

const mascotExpr = (f: number): Expr => {
  if (f < 191) return "grin";       // L1 delight: the Moon follows us!
  if (f < 379) return "nervous";    // L2 puzzled
  if (f < 542) return "grin";       // L3 aha — a trick of distance
  if (f < 1588) return "neutral";   // demos
  if (f < 2404) return "grin";      // sailors + explaining
  return "laugh";                   // closing
};

export const stageK = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const f = Math.round(t * FPS);
  // driver (front seat, x +0.62) and mascot (back seat, x -0.62), seated
  out.places.push(personP(cam, DRIVER_WHO, 0.62, 0.30, 0.8, true, false,
    {}, { mode: "swing", expr: f >= 2404 ? "grin" : "neutral", blink: lidAt(t, 3) }, 0.98));
  out.places.push(personP(cam, MASCOT_WHO, -0.62, 0.30, 0.8, true, false,
    {}, { mode: "swing", expr: mascotExpr(f), blink: lidAt(t, 5) }, 0.95));
  // puzzlement mark during L2, aha bursts at L3 and L10
  if (f >= 250 && f < 370) out.fx.push({ key: "fxq", cw: 360, ch: 360, draw: fxQuestion, x: -0.35, y: 2.75, z: 0.85, w: 0.55, h: 0.55 });
  if ((f >= 445 && f < 535) || (f >= 1870 && f < 1960)) {
    const u = ((f % 90) / 90);
    out.fx.push({ key: `fxb|${q(u, 24)}`, cw: 480, ch: 480, draw: (p) => fxBurst(p, u, "#ffe9a8"), x: -0.45, y: 2.8, z: 0.85, w: 0.85, h: 0.85 });
  }
  return out;
};
