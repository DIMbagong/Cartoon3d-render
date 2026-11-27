// Cast staging for the kappa short: our mascot + the kappa, placed per shot from the story
// envelopes. Reuses the bridge engine's billboard system (Pool / Actor / Fx in bridge/cast.ts)
// and the shared character drawings (bridge/toon.ts: MASCOT, kappa).
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxSplash, fxRing, fxContact, fxShadow,
  MASCOT, kappa, FrontOpts, SideOpts, Expr, Outfit,
} from "../bridge/toon";
import { Place, FxPlace, Stage, CamInfo } from "../bridge/cast";
import { FPS, KAPPA_HOME, MASCOT_SPOT, emergeK, bowM, bowK, dishAt, clamp01, smooth } from "./story";

const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light + blink (same recipes as the bridge cast) ----------------
const SUN2 = new THREE.Vector3(-0.45, 0.8, 0.3).normalize();
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

// ---------------- placement ----------------
type Who = { o: Outfit; okey: string; seed: number };
const MASCOT_WHO: Who = { o: MASCOT, okey: "mascot", seed: 3 };
const KAPPA_WHO: Who = { o: kappa(), okey: "kappa", seed: 4 };
const tmpV = new THREE.Vector3();
const personK = (cam: CamInfo, who: Who, x: number, y: number, z: number, side: boolean, mirror: boolean,
  fo: FrontOpts, so: SideOpts, scale = 1, roll = 0): Place => {
  const d = cam.pos.distanceTo(tmpV.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const light = light2D(cam, side && mirror);
  const f2: FrontOpts = { ...fo, light, seed: who.seed }, s2: SideOpts = { ...so, light, seed: who.seed };
  const key = side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return { key, x, y, z, scale, mirror, roll, draw: (p) => (side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)), size: [w, h, k] };
};

/** tight contact shadow under a standing card (bank / ground) */
const blobK = (out: Stage, x: number, y: number, z: number, sc = 1, col = "#3f4a38") => {
  out.fx.push({ key: `blob|contact|${col}`, cw: 128, ch: 128, draw: (p) => fxContact(p, col), x, y: y + 0.02, z, w: 0.55 * sc, h: 0.42 * sc, flat: true, rot: 0.4 });
};
/** expanding ring on the pond surface */
const ringK = (out: Stage, x: number, z: number, t0: number, t: number, w = 1.6, y = 0.045) => {
  const u = (t - t0) / 0.9;
  if (u < 0 || u >= 1) return;
  const s = 0.45 + 0.75 * u;
  out.fx.push({ key: `ring${q(u, 24)}`, cw: 400, ch: 400, draw: (p) => fxRing(p, q(u, 24)), x, y, z, w: w * s, h: w * 0.7 * s, flat: true });
};
/** water splash card (billboard) */
const splashK = (out: Stage, x: number, y: number, z: number, t0: number, t: number, s = 1) => {
  const u = (t - t0) / 0.8;
  if (u < 0 || u >= 1) return;
  out.fx.push({ key: `splash${q(u, 24)}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, q(u, 24)), x, y, z, w: 2.4 * s, h: 2.4 * s });
};
/** a cucumber on a 200 x 400 canvas */
const fxCucumber = (p: Pen) => {
  p.ell(100, 200, 54, 168, "#43a047", 7);
  p.line([[76, 52], [70, 348]], "#7cc47f", 8);
  p.line([[124, 52], [130, 348]], "#7cc47f", 8);
  for (const [x, y] of [[92, 110], [110, 190], [88, 275], [112, 320]] as const) p.dot(x, y, 5, "#2e7d32");
};
const cucumberK = (out: Stage, x: number, y: number, z: number, s = 1, rot = 0) => {
  out.fx.push({ key: "cucumber", cw: 200, ch: 400, draw: fxCucumber, x, y, z, w: 0.17 * s, h: 0.34 * s, rot });
};

const M_SCALE = 0.92, K_SCALE = 0.8;

/** everything with a face in shot `id` at time t (seconds) */
export const stageK = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const f = Math.round(t * FPS);
  const dish = q(dishAt(f), 12);
  const mascot = (x: number, y: number, z: number, fo: FrontOpts, scale = M_SCALE) =>
    out.places.push(personK(cam, MASCOT_WHO, x, y, z, false, false, { mode: "stand", blink: lidAt(t, 3), ...fo }, {}, scale));
  const kappaF = (x: number, y: number, z: number, fo: FrontOpts, roll = 0) =>
    out.places.push(personK(cam, KAPPA_WHO, x, y, z, false, false, { mode: "stand", blink: lidAt(t, 4), dish, ...fo }, {}, K_SCALE, roll));
  /** ambient rings around the kappa while it stands in the pond */
  const pondRings = (x: number, z: number) => ringK(out, x, z, t - (t % 2.6), t, 1.5);

  switch (id) {
    case 1: {
      const u = smooth((t - 0.3) / 4.3);
      if (u < 1) {
        const wx = -2.8 + (MASCOT_SPOT[0] + 2.8) * u, wz = 6.6 + (MASCOT_SPOT[2] - 6.6) * u;
        out.places.push(personK(cam, MASCOT_WHO, wx, 0, wz, true, false, {},
          { mode: "march", phase: q((u * 5.4 / 1.6) % 1, 24), expr: "smile", blink: lidAt(t, 3) }, M_SCALE));
        blobK(out, wx, 0, wz, M_SCALE);
      } else {
        mascot(MASCOT_SPOT[0], 0, MASCOT_SPOT[2], { expr: "smile", look: -1 });
        blobK(out, MASCOT_SPOT[0], 0, MASCOT_SPOT[2], M_SCALE);
      }
      ringK(out, KAPPA_HOME[0], KAPPA_HOME[2], 2.2, t, 1.3);
      ringK(out, KAPPA_HOME[0], KAPPA_HOME[2], 3.9, t, 1.3);
      break;
    }
    case 2: {
      const e = emergeK(f);
      const ky = -1.7 + (KAPPA_HOME[1] + 1.7) * e + (e >= 1 ? 0.02 * Math.sin(t * 1.7) : 0);
      kappaF(KAPPA_HOME[0], ky, KAPPA_HOME[2], { expr: t < 7.5 ? "stern" : "neutral", look: 1 });
      if (e >= 1) pondRings(KAPPA_HOME[0], KAPPA_HOME[2]);
      splashK(out, KAPPA_HOME[0], 0.55, KAPPA_HOME[2] + 0.3, 5.05, t, 1);
      ringK(out, KAPPA_HOME[0], KAPPA_HOME[2], 5.3, t, 2.0);
      mascot(MASCOT_SPOT[0], 0, MASCOT_SPOT[2], { expr: t >= 5.0 && t < 6.4 ? "shock" : "smile", look: -1 });
      blobK(out, MASCOT_SPOT[0], 0, MASCOT_SPOT[2], M_SCALE);
      break;
    }
    case 3: {
      const expr: Expr = t < 17.2 ? "neutral" : t < 19.9 ? "nervous" : "relief";
      kappaF(KAPPA_HOME[0], KAPPA_HOME[1] + 0.02 * Math.sin(t * 1.7), KAPPA_HOME[2],
        { expr, headTilt: q(2.5 * Math.sin(t * 1.3), 20), look: 0 });
      pondRings(KAPPA_HOME[0], KAPPA_HOME[2]);
      break;
    }
    case 4: {
      mascot(2.2, 0, 5.2, { expr: t >= 29.4 ? "grin" : "smile", tilt: q(bowM(f), 30), look: t >= 29.4 ? 0 : -1 });
      blobK(out, 2.2, 0, 5.2, M_SCALE);
      const wob = t > 29.2 ? 0.06 * Math.sin((t - 29.2) * 7) * Math.exp(-(t - 29.2) * 1.1) : 0;
      const kexpr: Expr = t < 24.9 ? "neutral" : t < 26.7 ? "shock" : t < 29.25 ? "neutral" : "dazed";
      kappaF(KAPPA_HOME[0], KAPPA_HOME[1], KAPPA_HOME[2], { expr: kexpr, tilt: q(bowK(f), 30), look: -1 }, wob);
      splashK(out, KAPPA_HOME[0], 1.66, KAPPA_HOME[2], 29.0, t, 0.55);
      pondRings(KAPPA_HOME[0], KAPPA_HOME[2]);
      break;
    }
    case 5: {
      mascot(2.2, 0, 5.2, { expr: t >= 38 && t < 42 ? "grin" : "smile", look: -1 });
      blobK(out, 2.2, 0, 5.2, M_SCALE);
      if (t >= 31.6 && t < 38.2) cucumberK(out, 1.62, 1.04, 4.95, 1, 0.5);
      const kexpr: Expr = t < 31.6 ? "neutral" : t < 34 ? "relief_open" : (t >= 38.3 && t < 39.4) || (t >= 40.6 && t < 41.7) ? "lick" : "grin";
      kappaF(KAPPA_HOME[0], KAPPA_HOME[1], KAPPA_HOME[2], { expr: kexpr, look: 1 });
      pondRings(KAPPA_HOME[0], KAPPA_HOME[2]);
      // two offering cucumbers arc from the mascot's hand into the pond
      for (const [t0, tx, tz] of [[38.3, -1.7, 2.4], [40.6, 0.3, 0.6]] as const) {
        const u = (t - t0) / 0.85;
        if (u >= 0 && u < 1) {
          const x = 1.62 + (tx - 1.62) * u, z = 4.95 + (tz - 4.95) * u, y = 1.04 + (0.1 - 1.04) * u + 4 * 0.75 * u * (1 - u);
          cucumberK(out, x, y, z, 0.9, u * 2.2);
        }
        ringK(out, tx, tz, t0 + 0.85, t, 1.15);
        splashK(out, tx, 0.35, tz, t0 + 0.85, t, 0.4);
      }
      break;
    }
    case 6: {
      const u = smooth((t - 44) / 8);
      const kx = KAPPA_HOME[0] + (-0.2 - KAPPA_HOME[0]) * u, kz = KAPPA_HOME[2] + (3.0 - KAPPA_HOME[2]) * u;
      const moving = t < 52;
      out.places.push(personK(cam, KAPPA_WHO, kx, KAPPA_HOME[1], kz, false, false,
        { mode: moving ? "stroll" : "stand", phase: q((t * 0.45) % 1, 24), lift: 22, expr: "stern", blink: lidAt(t, 4), dish }, {}, K_SCALE));
      pondRings(kx, kz);
      // the dark shape gliding under the surface
      if (t >= 44 && t < 51) {
        const su = (t - 44) / 7;
        out.fx.push({ key: "blob|shadow|#14261e", cw: 128, ch: 256, draw: (p) => fxShadow(p, "#14261e"),
          x: -3.5 + 6 * su, y: 0.04, z: -1 + 2.5 * su, w: 1.15, h: 2.4, flat: true, rot: Math.atan2(6, 2.5) - Math.PI / 2 });
      }
      mascot(MASCOT_SPOT[0], 0, MASCOT_SPOT[2], { expr: t < 48.5 ? "nervous" : "stern", look: -1 });
      blobK(out, MASCOT_SPOT[0], 0, MASCOT_SPOT[2], M_SCALE);
      break;
    }
    case 7: {
      const ph = 0.5 * (smooth((t - 54.9) / 0.55) + smooth((t - 57.2) / 0.55));
      out.places.push(personK(cam, KAPPA_WHO, 0.3, -0.12, 2.9, true, false, {},
        { mode: "march", phase: q(ph % 1, 24), stride: 0.12, stomp: 1.7, expr: t >= 56.5 ? "grin" : "stern", blink: lidAt(t, 4), dish }, K_SCALE));
      ringK(out, 0.55, 2.9, 55.45, t, 1.35);
      ringK(out, 0.55, 2.9, 57.75, t, 1.35);
      splashK(out, 0.45, 0.3, 2.9, 55.45, t, 0.45);
      splashK(out, 0.45, 0.3, 2.9, 57.75, t, 0.45);
      const mx = 2.55 + 0.4 * smooth((t - 55) / 3);
      mascot(mx, 0, 5.6, { expr: "laugh", look: -1 });
      blobK(out, mx, 0, 5.6, M_SCALE);
      break;
    }
    case 8: {
      const u = smooth((t - 59.3) / 1.7);
      if (u < 1) {
        const kx = 0.3 + (0.2 - 0.3) * u, kz = 2.9 + (4.7 - 2.9) * u, ky = -0.12 + 0.12 * u + Math.sin(u * Math.PI) * 0.22;
        out.places.push(personK(cam, KAPPA_WHO, kx, ky, kz, true, false, {},
          { mode: "march", phase: q((u * 1.5) % 1, 24), expr: "smile", blink: lidAt(t, 4), dish }, K_SCALE));
      } else {
        kappaF(0.2, 0, 4.7, { expr: "smile_closed", look: 1 });
        blobK(out, 0.2, 0, 4.7, K_SCALE);
      }
      mascot(1.5, 0, 4.95, { expr: "smile_closed", look: 0 });
      blobK(out, 1.5, 0, 4.95, M_SCALE);
      if (t >= 63.2) cucumberK(out, 1.0, 1.16 + 0.03 * Math.sin(t * 2), 4.5, 1.25, 0.35);
      break;
    }
  }
  return out;
};
