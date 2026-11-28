// Cast staging for the 1945 phone short: our mascot (the traveller), the young
// pejuang, the proclamation reader, and 1945 townsfolk — staged per shot around
// one old Jakarta street. Reuses the bridge engine's billboard system and the
// shared character drawings (bridge/toon.ts); the phone itself is an fx card.
import * as THREE from "three";
import {
  bodyFront, bodySide, fxContact, fxBurst,
  MASCOT, townsfolk, SKINS, FrontOpts, SideOpts, Expr, Outfit, Pen, INK,
} from "../bridge/toon";
import { Place, FxPlace, Stage, CamInfo } from "../bridge/cast";
import {
  FPS, MASCOT_AT, PEJUANG_AT, PORCH_AT, DAPUR_AT, PROK_AT,
  FLASH_F, DIE_F, phoneOn, phoneY, clamp01, smooth,
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
const MASCOT_WHO: Who = { o: MASCOT, okey: "mascot", seed: 3 };
const pejuang = (v = 0): Outfit => ({
  jacket: "#6e5a33", pants: "#47402f", boots: "#3a2e20", hat: "cap", cap: "#8c2f28",
  buttons: "#d9c9a0", skin: SKINS[v % 4],
});
const PEJUANG_WHO: Who = { o: pejuang(1), okey: "pejuang", seed: 7 };
const SQUAD: Who[] = [0, 1, 2, 3].map((v) => ({ o: pejuang(v), okey: `sq${v}`, seed: 11 + v }));
const READER_WHO: Who = {
  o: { jacket: "#3f4a3a", pants: "#333026", boots: "#2e2620", hat: "cap", cap: "#2e2a24", buttons: "#c9b98a", skin: SKINS[2], build: "stout" },
  okey: "reader", seed: 21,
};
const FOLK: Who[] = [0, 1, 2, 3, 4, 5].map((v) => ({ o: townsfolk(v), okey: `f${v}`, seed: v + 1 }));
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
const stand = (out: Stage, cam: CamInfo, who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 1) => {
  out.places.push(personP(cam, who, x, y, z, false, false, { mode: "stand", ...fo }, {}, scale));
  blobP(out, x, y, z, scale);
};

/** the phone as a drawn card: dark body, glowing (or dead) screen, battery bar */
const fxPhone = (pct: number, on: boolean) => (p: Pen) => {
  p.poly([[60, 10], [160, 10], [160, 330], [60, 330]], "#14161c");
  p.poly([[74, 52], [146, 52], [146, 292], [74, 292]], on ? "#d7ecff" : "#232830");
  if (on) {
    p.poly([[84, 66], [136, 66], [136, 84], [84, 84]], "#ffffff");
    const bw = Math.max(2, 44 * pct / 100);
    p.poly([[86, 69], [86 + bw, 69], [86 + bw, 81], [86, 81]], pct <= 25 ? "#e2453c" : "#57a639");
    p.ell(110, 190, 34, 46, "#8fc3ee", 0);
    p.ell(110, 168, 15, 15, "#fff3b0", 0);
  }
  p.ell(110, 312, 7, 7, "#3a4150", 0);
};
const phoneFx = (out: Stage, cam: CamInfo, x: number, y: number, z: number, pct: number, on: boolean, big = 1) => {
  out.fx.push({
    key: `phone|${pct}|${on}`, cw: 220, ch: 340, draw: fxPhone(pct, on),
    x: x + cam.right.x * 0.45 * big, y, z: z + cam.right.z * 0.45 * big - 0.05,
    w: 0.30 * big, h: 0.46 * big, rot: -0.06,
  });
};
/** battery % the story has reached by time t (seconds) */
const pctAt = (t: number) => t < 14.01 ? 100 : t < 34.96 ? 95 : t < 43.29 ? 75 : t < 63.07 ? 58 : t < 83.94 ? 25 : 1;

const crowdAt = (out: Stage, cam: CamInfo, t: number, spots: [number, number][], exprs: Expr[], waveK = 0) => {
  spots.forEach(([x, z], i) => {
    const expr = exprs[i % exprs.length];
    stand(out, cam, FOLK[i % 6], x, 0, z, {
      expr, blink: lidAt(t, 40 + i),
      wave: waveK > 0.4 && i % 3 === 1 ? q(Math.sin(t * 8 + i * 1.4), 30) : undefined,
      look: i % 3 === 0 ? -1 : i % 3 === 2 ? 1 : 0,
    }, i % 5 === 4 ? 0.74 : 1);
  });
};

export const stage45 = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const f = Math.round(t * FPS);
  const on = phoneOn(f), pct = pctAt(t);
  const M = MASCOT_AT, P = PEJUANG_AT;
  switch (id) {
    case 1: { // wakes mid-street, stares at the glowing phone
      const expr: Expr = t < 3 ? "shock" : t < 8 ? "nervous" : "neutral";
      stand(out, cam, MASCOT_WHO, M[0], 0, M[2], { expr, blink: lidAt(t, 3), look: Math.round(Math.sin(t * 0.7)) });
      phoneFx(out, cam, M[0], 1.08, M[2], pct, on);
      crowdAt(out, cam, t, [[-3.8, -3.0], [5.2, -2.6], [-5.6, 2.8]], ["neutral", "neutral", "stern"]);
      break;
    }
    case 2: { // the camera demo; the pejuang leans in, then speaks (L3)
      stand(out, cam, MASCOT_WHO, M[0], 0, M[2], { expr: "smile", blink: lidAt(t, 3), look: 1 });
      phoneFx(out, cam, M[0], 1.08, M[2], pct, on);
      if (f >= 486 && f < 502) { // the photo flash, right on "satu foto"
        out.fx.push({ key: "burst2", cw: 300, ch: 300, draw: (p) => fxBurst(p, 0.5), x: M[0] + cam.right.x * 0.45, y: 1.1, z: M[2] - 0.1, w: 1.5, h: 1.5 });
      }
      const speaking = t >= 22.5;
      stand(out, cam, PEJUANG_WHO, P[0], 0, P[2], { expr: speaking ? "shock" : "neutral", blink: lidAt(t, 7), look: -1 });
      crowdAt(out, cam, t, [[-2.6, -2.2], [-3.4, 1.2], [3.4, -2.0], [2.9, 2.4], [-1.8, 3.2]], ["shock", "smile", "neutral", "shock", "smile"]);
      break;
    }
    case 3: { // no signal: phone held high to the empty sky
      stand(out, cam, MASCOT_WHO, M[0], 0, M[2], { expr: "nervous", blink: lidAt(t, 3), look: Math.round(Math.sin(t * 0.9)) });
      phoneFx(out, cam, M[0], 2.02, M[2], pct, on);
      break;
    }
    case 4: { // the flashlight march: mascot leads, the squad follows his light
      out.places.push(personP(cam, MASCOT_WHO, M[0], 0, M[2], false, false,
        { mode: "march", phase: q((t * 0.9) % 1, 24), expr: "stern", blink: lidAt(t, 3), lift: 40 }, {}));
      blobP(out, M[0], 0, M[2]);
      phoneFx(out, cam, M[0], 1.15, M[2], pct, on, 1.1);
      SQUAD.forEach((who, i) => {
        const x = [-1.5, 1.4, -0.7, 0.9][i], z = -2.3 - i * 1.15;
        out.places.push(personP(cam, who, x, 0, z, false, false,
          { mode: "march", phase: q((t * 0.9 + i * 0.13) % 1, 24), expr: "stern", blink: lidAt(t, 11 + i), lift: 55 }, {}));
        blobP(out, x, 0, z);
      });
      break;
    }
    case 5: { // candlelight rules on the beranda: both sit, the dim phone between them
      const pz = PORCH_AT[2];
      out.places.push(personP(cam, MASCOT_WHO, -0.85, 0.32, pz, false, false, { mode: "sit", expr: "neutral", blink: lidAt(t, 3), look: 1 }, {}));
      out.places.push(personP(cam, PEJUANG_WHO, 0.95, 0.32, pz, false, false, { mode: "sit", expr: "neutral", blink: lidAt(t, 7), look: -1 }, {}));
      phoneFx(out, cam, -0.05, 0.86, pz + 0.35, pct, on, 0.9);
      break;
    }
    case 6: { // the communal kitchen: he helps with the calculator and the stored map
      stand(out, cam, MASCOT_WHO, DAPUR_AT[0] + 1.7, 0, DAPUR_AT[2] + 1.2, { expr: "smile", blink: lidAt(t, 3), look: -1 });
      phoneFx(out, cam, DAPUR_AT[0] + 1.7, 1.08, DAPUR_AT[2] + 1.2, pct, on);
      crowdAt(out, cam, t, [[-6.4, -5.4], [-3.1, -5.8], [-5.9, -2.0], [-2.6, -2.2], [-5.4, -6.8]], ["smile", "neutral", "smile_closed", "smile", "neutral"]);
      break;
    }
    case 7: { // 25%: he stares at the phone, daring not to open the gallery
      stand(out, cam, MASCOT_WHO, M[0], 0, M[2], { expr: "nervous", blink: lidAt(t, 3), look: 0, headTilt: 0.12 });
      phoneFx(out, cam, M[0], 1.02, M[2], pct, on, 1.15);
      break;
    }
    case 8: { // the pejuang's question, on the dark beranda
      const pz = PORCH_AT[2];
      out.places.push(personP(cam, MASCOT_WHO, -0.85, 0.32, pz, false, false, { mode: "sit", expr: "neutral", blink: lidAt(t, 3), look: 1 }, {}));
      out.places.push(personP(cam, PEJUANG_WHO, 0.95, 0.32, pz, false, false, { mode: "sit", expr: t < 71 ? "stern" : "nervous", blink: lidAt(t, 7), look: -1 }, {}));
      phoneFx(out, cam, -0.05, 0.86, pz + 0.35, pct, on, 0.9);
      break;
    }
    case 9: { // 17 August: the reading — and the last photo
      stand(out, cam, READER_WHO, PROK_AT[0], 0.55, PROK_AT[2], { expr: "stern", blink: lidAt(t, 21), look: 0 }, 1.02);
      const raise = smooth((f - 2540) / 80);
      stand(out, cam, MASCOT_WHO, 2.6, 0, -3.5, { expr: f >= FLASH_F && f < DIE_F ? "grin" : "smile", blink: lidAt(t, 3), look: -1 });
      phoneFx(out, cam, 2.6, phoneY(f), -3.5, pct, on, 1 + 0.25 * raise);
      if (f >= FLASH_F && f < FLASH_F + 16) {
        out.fx.push({ key: "burst9", cw: 300, ch: 300, draw: (p) => fxBurst(p, 0.5), x: 2.6 + cam.right.x * 0.5, y: phoneY(f), z: -3.6, w: 2.2, h: 2.2 });
      }
      crowdAt(out, cam, t, [[-3.4, -7.5], [-4.6, -4.6], [4.9, -3.4], [-2.2, -3.2], [2.1, -9.6], [-4.4, -8.2], [5.6, -7.8]], ["stern", "smile", "neutral", "smile_closed", "stern", "neutral", "smile"], 0.5);
      stand(out, cam, PEJUANG_WHO, -1.9, 0, -5.2, { expr: "smile", blink: lidAt(t, 7), look: 1 });
      break;
    }
    case 10: { // the phone is dead; the photo is not — the crowd waves him (and us) off
      stand(out, cam, MASCOT_WHO, M[0], 0, M[2], { expr: "smile_closed", blink: lidAt(t, 3), look: 0 });
      phoneFx(out, cam, M[0], 1.02, M[2], 0, false);
      stand(out, cam, PEJUANG_WHO, P[0], 0, P[2], { expr: "grin", blink: lidAt(t, 7), look: -1, wave: q(Math.sin(t * 7), 30) });
      crowdAt(out, cam, t, [[-3.4, -2.8], [-4.8, 0.6], [3.4, -1.2], [3.6, 2.6], [-2.6, 3.6]], ["laugh", "smile", "grin", "smile", "laugh"], 0.8);
      break;
    }
  }
  return out;
};
export { FPS };
