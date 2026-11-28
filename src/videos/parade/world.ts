// The town square as one three.js scene: a stone plaza, a ring of toon houses, the clock
// tower with a swinging bell, the giant centenary cake (it wobbles; one cherry escapes),
// lamps, trees and benches. update(id, f, camera) poses everything for shot `id` —
// same contract as the bridge / kappa worlds.
import * as THREE from "three";
import { lam, V, kitClone, Kit } from "../bridge/build";
import { grassHD, cloudHD, ctex } from "../bridge/paint";
import { Pen } from "../bridge/toon";
import { LIGHTS, LOOK, LightPreset } from "../bridge/lights";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { FPS, SHOTS, CAKE_AT, camAt, bellAngle, cakeWob, cherryPos, ShotDef } from "./story";
import { stageP } from "./cast";

const discTex = () => ctex("sunDiscP", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHaloP", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** plaza paving: concentric stone rings + radial joints + a centre medallion */
const plazaTex = () => ctex("plazaP", 1024, 1024, (g) => {
  const p = new Pen(g);
  p.ell(512, 512, 512, 512, "#b9b0a0", 0);
  for (let r = 480; r > 60; r -= 52) { p.ell(512, 512, r, r, null, 5); const gr = g; gr.strokeStyle = "rgba(90,82,70,0.55)"; gr.lineWidth = 5; gr.beginPath(); gr.arc(512, 512, r, 0, Math.PI * 2); gr.stroke(); }
  const gr = g; gr.strokeStyle = "rgba(90,82,70,0.4)"; gr.lineWidth = 4;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; gr.beginPath(); gr.moveTo(512 + 70 * Math.cos(a), 512 + 70 * Math.sin(a)); gr.lineTo(512 + 505 * Math.cos(a), 512 + 505 * Math.sin(a)); gr.stroke(); }
  p.ell(512, 512, 66, 66, "#a33f35", 6);
  p.ell(512, 512, 40, 40, "#e8ddc4", 4);
});
/** clock face, hands at five to twelve — almost the centenary hour */
const clockTex = () => ctex("clockP", 512, 512, (g) => {
  const p = new Pen(g);
  p.ell(256, 256, 246, 246, "#f4ecd8", 14);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, x = 256 + 205 * Math.sin(a), y = 256 - 205 * Math.cos(a);
    p.ell(x, y, i % 3 === 0 ? 13 : 7, i % 3 === 0 ? 13 : 7, "#33302a", 0);
  }
  const hand = (ang: number, len: number, w: number) => {
    const gr = g; gr.strokeStyle = "#33302a"; gr.lineWidth = w; gr.lineCap = "round";
    gr.beginPath(); gr.moveTo(256, 256); gr.lineTo(256 + len * Math.sin(ang), 256 - len * Math.cos(ang)); gr.stroke();
  };
  hand((11.92 / 12) * Math.PI * 2, 128, 17);  // hour hand near twelve
  hand((56 / 60) * Math.PI * 2, 178, 12);     // minute hand at 56
  p.ell(256, 256, 17, 17, "#a33f35", 0);
});

function quadUpP(x0: number, x1: number, z0: number, z1: number, u: number, v: number, y: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
const rnd = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

const houseProfile = (w: number, wall: number, peak: number, depth: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, wall); s.lineTo(0, peak); s.lineTo(-w / 2, wall); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
};
const roofProfile = (w: number, wall: number, peak: number, depth: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 - 0.45, wall - 0.12); s.lineTo(w / 2 + 0.45, wall - 0.12); s.lineTo(0, peak + 0.42); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: depth + 0.7, bevelEnabled: false });
  g.translate(0, 0, -(depth + 0.7) / 2);
  return g;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#b8d0ec", 25, 300);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private bellPivot = new THREE.Group();
  private cakeGroup = new THREE.Group();
  private cherry = new THREE.Mesh();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light rig (same construction as the bridge / kappa worlds) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 140 + (i % 4) * 32;
      m.position.set(Math.cos(a) * d, 130 + (i % 4) * 36, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- ground: grass + the stone plaza ----
    const grass = new THREE.Mesh(quadUpP(-170, 170, -170, 170, 80, 80, -0.02), lam("grassHD", () => ({ map: grassHD() })));
    grass.receiveShadow = true; R.add(grass);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(17, 64), lam("plazaP", () => ({ map: plazaTex() })));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.0; plaza.receiveShadow = true; R.add(plaza);
    const rim = new THREE.Mesh(new THREE.RingGeometry(17, 17.7, 64), lam("rimP", () => ({ color: "#8f8674" })));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 0.002; rim.receiveShadow = true; R.add(rim);

    // ---- houses around the square ----
    const bodyCols = ["#e8d9b8", "#dfc2a0", "#e5cfae", "#d9b48f", "#ecdcc0", "#e0bfa5", "#e8d9b8", "#dfc2a0", "#e5cfae", "#d9b48f", "#ecdcc0", "#e0bfa5"];
    const roofCols = ["#a3512f", "#8f4a34", "#b05a35", "#96502f", "#a3512f", "#8f4a34", "#b05a35", "#96502f", "#a3512f", "#8f4a34", "#b05a35", "#96502f"];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.13;
      if (Math.abs(a - Math.PI * 1.5) < 0.3 || Math.abs(a - Math.PI * 0.0) < 0.01) { /* tower gap handled below */ }
      const r = 29 + rnd(i, 3) * 3;
      const x = r * Math.sin(a), z = r * Math.cos(a);
      if (z < -20 && Math.abs(x) < 8) continue; // the tower stands here
      const w = 6.5 + rnd(i, 4) * 2, wall = 3.4 + rnd(i, 5) * 1.2, peak = wall + 2.2, dep = 5.5;
      const house = new THREE.Group();
      const body = new THREE.Mesh(houseProfile(w, wall, peak, dep), lam(`houseB${i % 4}`, () => ({ color: bodyCols[i] })));
      const roof = new THREE.Mesh(roofProfile(w, wall, peak, dep), lam(`houseR${i % 3}`, () => ({ color: roofCols[i] })));
      house.add(body, roof);
      const winM = lam("winP", () => ({ color: "#3d5266" }));
      for (const [wx, wy] of [[-w / 4, 1.6], [w / 4, 1.6], [-w / 4, 2.7], [w / 4, 2.7]] as const) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.05), winM);
        win.position.set(wx, wy, dep / 2 + 0.02); house.add(win);
      }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), lam("doorP", () => ({ color: "#6e4a2c" })));
      door.position.set(0, 0.95, dep / 2 + 0.02); house.add(door);
      house.position.set(x, 0, z);
      house.rotation.y = Math.atan2(-x, -z) + Math.PI;
      house.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
      R.add(house);
    }

    // ---- the clock tower at the back of the square ----
    const tower = new THREE.Group();
    const stoneM = lam("stoneP", () => ({ color: "#b3a68f" }));
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(4.4, 10.6, 4.4), stoneM); shaft.position.y = 5.3; tower.add(shaft);
    const clock = new THREE.Mesh(new THREE.CircleGeometry(1.55, 40), new THREE.MeshBasicMaterial({ map: clockTex(), color: 0xf2ead6 }));
    clock.position.set(0, 8.4, 2.21); clock.layers.set(NOINK); tower.add(clock);
    const clockBack = new THREE.Mesh(new THREE.CircleGeometry(1.62, 40), lam("clockBP", () => ({ color: "#6b5f49" })));
    clockBack.position.set(0, 8.4, 2.19); tower.add(clockBack);
    for (const [px, pz] of [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]] as const) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.6, 0.42), stoneM);
      post.position.set(px, 11.9, pz); tower.add(post);
    }
    const troof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 4), lam("troofP", () => ({ color: "#4d5a68" })));
    troof.position.y = 14.4; troof.rotation.y = Math.PI / 4; tower.add(troof);
    // the bell, hanging in the open belfry
    this.bellPivot.position.set(0, 13.1, 0);
    const bellM = lam("bellP", () => ({ color: "#c9a227" }));
    const bellTop = new THREE.Mesh(new THREE.SphereGeometry(0.82, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), bellM);
    bellTop.position.y = -0.75; bellTop.scale.y = 1.15;
    const bellSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 1.02, 0.62, 20, 1, true), bellM);
    bellSkirt.position.y = -1.28;
    const bellLip = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.09, 8, 24), bellM);
    bellLip.rotation.x = Math.PI / 2; bellLip.position.y = -1.58;
    this.bellPivot.add(bellTop, bellSkirt, bellLip);
    tower.add(this.bellPivot);
    tower.position.set(0, 0, -21);
    tower.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    R.add(tower);

    // ---- the centenary cake on its table ----
    const tableM = lam("tableP", () => ({ color: "#7a5a38" }));
    const ttop = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 2.7), tableM);
    ttop.position.set(CAKE_AT[0], 0.96, CAKE_AT[2]); R.add(ttop);
    for (const [lx, lz] of [[-1.15, -1.15], [1.15, -1.15], [-1.15, 1.15], [1.15, 1.15]] as const) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.92, 0.14), tableM);
      leg.position.set(CAKE_AT[0] + lx, 0.46, CAKE_AT[2] + lz); R.add(leg);
    }
    this.cakeGroup.position.set(CAKE_AT[0], 1.02, CAKE_AT[2]);
    const tiers: [number, string][] = [[1.05, "#fff1dc"], [0.8, "#f6c3d4"], [0.55, "#fff1dc"]];
    tiers.forEach(([r, col], i) => {
      const tier = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.03, 0.34, 28), lam(`tier${i}`, () => ({ color: col })));
      tier.position.y = 0.17 + i * 0.34;
      tier.castShadow = true; tier.receiveShadow = true;
      this.cakeGroup.add(tier);
    });
    const cherryM = lam("cherryP", () => ({ color: "#c22e2e" }));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), cherryM);
      c.position.set(0.38 * Math.cos(a), 1.06, 0.38 * Math.sin(a));
      this.cakeGroup.add(c);
    }
    R.add(this.cakeGroup);
    this.cherry = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), cherryM);
    this.cherry.castShadow = true;
    R.add(this.cherry);

    // ---- lamps, benches, trees ----
    const lampM = lam("lampP", () => ({ color: "#2f4a3c" }));
    const bulbM = lam("bulbP", () => ({ color: "#ffe9a8" }));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = 15.2 * Math.sin(a), z = 15.2 * Math.cos(a);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.4, 8), lampM);
      pole.position.set(x, 1.7, z); pole.castShadow = true; R.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), bulbM);
      bulb.position.set(x, 3.55, z); R.add(bulb);
    }
    const benchM = lam("benchP", () => ({ color: "#8a6844" }));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.35;
      const x = 18.6 * Math.sin(a), z = 18.6 * Math.cos(a);
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.55), benchM);
      b.position.set(x, 0.5, z); b.rotation.y = Math.atan2(-x, -z) + Math.PI;
      b.castShadow = true; b.receiveShadow = true; R.add(b);
    }
    const put = (name: string, x: number, z: number, h: number, yaw = 0) => {
      const o = kitClone(kit, name, h);
      if (!o) return;
      o.position.set(x, 0, z); o.rotation.y = yaw;
      o.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
      R.add(o);
    };
    const trees: [string, number, number, number][] = [
      ["tree_oak", -20, -12, 8.5], ["tree_default", 21, -10, 7.5], ["tree_detailed", -23, 4, 9],
      ["tree_fat", 24, 6, 8], ["tree_cone", -13, -24, 8.5], ["tree_oak", 14, -25, 8],
      ["tree_default", -25, -6, 7], ["tree", 25, -4, 9],
    ];
    trees.forEach(([n, x, z, h], i) => put(n, x, z, h, rnd(i, 9) * 3));
    for (let i = 0; i < 8; i++) {
      const a = rnd(i, 5) * Math.PI * 2, r = 20 + rnd(i, 6) * 4;
      put(i % 2 ? "plant_bushLarge" : "plant_bush", Math.cos(a) * r, Math.sin(a) * r, 1.1 + rnd(i, 7) * 0.7, rnd(i, 8) * 3);
    }
  }

  /** camera-relative sun, frozen per shot (the bridge world's recipe) */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(L.az), el = THREE.MathUtils.degToRad(L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 60);
    this.sun.position.copy(focus).addScaledVector(sunDir, 160); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 380; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => { untone(h, su["c" + i].value); });
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- the animated set pieces ----
    this.bellPivot.rotation.z = THREE.MathUtils.degToRad(bellAngle(t));
    this.cakeGroup.rotation.z = THREE.MathUtils.degToRad(cakeWob(t));
    if (t < 47.91) {
      // the runaway cherry rides the wobbling cake until it escapes
      const wob = THREE.MathUtils.degToRad(cakeWob(t));
      const lx = 0.35, ly = 1.10;
      this.cherry.position.set(
        CAKE_AT[0] + lx * Math.cos(wob) - ly * Math.sin(wob),
        1.02 + lx * Math.sin(wob) + ly * Math.cos(wob),
        CAKE_AT[2] + 0.3);
    } else {
      const p = cherryPos(t);
      this.cherry.position.set(p[0], p[1], p[2]);
      this.cherry.rotation.z = -((t - 48.45) * 2.2);
    }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stageP(id, t, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
