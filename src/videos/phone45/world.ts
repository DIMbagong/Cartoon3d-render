// An old Jakarta street, 1945, as one three.js scene: a dirt road between
// colonial-era houses, a gardu ronda (the night-talk spot), a communal kitchen,
// and the proclamation house with its porch and the red-and-white flag.
// update(id, f, camera) poses everything for shot `id` — the bridge contract.
import * as THREE from "three";
import { lam, V, kitClone, Kit } from "../bridge/build";
import { grassHD, cloudHD, ctex } from "../bridge/paint";
import { Pen } from "../bridge/toon";
import { LIGHTS, LOOK, LightPreset } from "../bridge/lights";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { FPS, SHOTS, LABELS, PORCH_AT, DAPUR_AT, FLAG_AT, camAt, ShotDef } from "./story";
import { stage45 } from "./cast";

const discTex = () => ctex("sunDisc45", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo45", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** worn dirt road: brown earth, wheel ruts, scattered stones */
const roadTex = () => ctex("road45", 512, 512, (g) => {
  const p = new Pen(g);
  p.poly([[0, 0], [512, 0], [512, 512], [0, 512]], "#8a6f4d");
  for (let i = 0; i < 2600; i++) {
    const x = (Math.sin(i * 39.7) * 0.5 + 0.5) * 512, y = (Math.sin(i * 17.3 + 2) * 0.5 + 0.5) * 512;
    p.ell(x, y, 2.2, 1.4, i % 3 ? "#7d6444" : "#97805c", 0);
  }
  p.poly([[118, 0], [150, 0], [150, 512], [118, 512]], "#755c3c");
  p.poly([[362, 0], [394, 0], [394, 512], [362, 512]], "#755c3c");
});
const labelTex = (text: string, accent: boolean) => ctex(`label45|${text}`, 1024, 256, (g) => {
  g.clearRect(0, 0, 1024, 256);
  g.beginPath(); g.roundRect(10, 38, 1004, 180, 42);
  g.fillStyle = "rgba(8,14,30,0.80)"; g.fill();
  g.lineWidth = accent ? 10 : 5; g.strokeStyle = accent ? "#ffd93b" : "rgba(210,225,255,0.5)"; g.stroke();
  let size = 108;
  g.textAlign = "center"; g.textBaseline = "middle";
  do { g.font = `700 ${size}px 'DejaVu Sans', sans-serif`; size -= 6; } while (g.measureText(text).width > 940 && size > 40);
  g.fillStyle = accent ? "#ffd93b" : "#eef3ff";
  g.fillText(text, 512, 132);
});
const flagTex = () => ctex("flag45", 512, 340, (g) => {
  g.fillStyle = "#c22e2e"; g.fillRect(0, 0, 512, 170);
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 170, 512, 170);
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
const makeHouse = (w: number, wall: number, peak: number, dep: number, bodyCol: string, roofCol: string, seed: number) => {
  const house = new THREE.Group();
  const body = new THREE.Mesh(houseProfile(w, wall, peak, dep), lam(`h45b${seed % 4}`, () => ({ color: bodyCol })));
  const roof = new THREE.Mesh(roofProfile(w, wall, peak, dep), lam(`h45r${seed % 3}`, () => ({ color: roofCol })));
  house.add(body, roof);
  const winM = lam("win45", () => ({ color: "#3d4450" }));
  for (const [wx, wy] of [[-w / 4, 1.7], [w / 4, 1.7], [-w / 4, 2.8], [w / 4, 2.8]] as const) {
    if (wy > wall - 0.5) continue;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), winM);
    win.position.set(wx, wy, dep / 2 + 0.02); house.add(win);
  }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), lam("door45", () => ({ color: "#5e4630" })));
  door.position.set(0, 1.0, dep / 2 + 0.02); house.add(door);
  house.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  return house;
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
  private cloudMaps: Record<"day" | "golden" | "night", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private labels: { mesh: THREE.Mesh; a: number; b: number }[] = [];
  private flag = new THREE.Mesh();
  private beam = new THREE.Group();
  private lampGlows: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light rig (the bridge world's construction) ----
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
    this.cloudMaps = {
      day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)),
      golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)),
      night: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.night.cloud)),
    };
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 140 + (i % 4) * 32;
      m.position.set(Math.cos(a) * d, 130 + (i % 4) * 36, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- ground: grass + the dirt road running away to the proclamation house ----
    const grass = new THREE.Mesh(quadUpP(-170, 170, -170, 170, 80, 80, -0.02), lam("grassHD", () => ({ map: grassHD() })));
    grass.receiveShadow = true; R.add(grass);
    const road = new THREE.Mesh(quadUpP(-5, 5, -70, 45, 1, 14, 0), lam("road45", () => ({ map: roadTex() })));
    road.receiveShadow = true; R.add(road);

    // ---- houses along both sides of the street ----
    const bodyCols = ["#ece1c8", "#e2d2ae", "#f0e6d2", "#dcc7a2", "#e8dcbc", "#dfcfae"];
    const roofCols = ["#6e4a38", "#5d4034", "#77503a", "#66503c"];
    let hi = 0;
    for (const sideX of [-11, 11]) {
      for (let j = 0; j < 5; j++) {
        const z = 14 - j * 9.5 + rnd(hi, 3) * 1.6;
        if (sideX < 0 && z < -2 && z > -11) { hi++; continue; } // the gardu + kitchen gap
        const w = 6.8 + rnd(hi, 4) * 1.6, wall = 3.3 + rnd(hi, 5) * 1.0, peak = wall + 2.1;
        const house = makeHouse(w, wall, peak, 5.5, bodyCols[hi % 6], roofCols[hi % 4], hi);
        house.position.set(sideX, 0, z);
        house.rotation.y = sideX < 0 ? Math.PI / 2 : -Math.PI / 2;
        R.add(house); hi++;
      }
    }

    // ---- the proclamation house, centred at the end of the street ----
    const phouse = makeHouse(10.5, 4.4, 6.8, 6, "#f2ead6", "#5d4034", 9);
    phouse.position.set(0, 0, -19.5);
    R.add(phouse);
    const woodM = lam("wood45", () => ({ color: "#7a5a38" }));
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.55, 2.6), woodM);
    deck.position.set(0, 0.275, -13.4); deck.castShadow = true; deck.receiveShadow = true; R.add(deck);
    for (const px of [-3.3, 3.3]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.5, 0.18), woodM);
      post.position.set(px, 1.8, -12.3); post.castShadow = true; R.add(post);
    }
    const proof = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.14, 3.0), lam("proof45", () => ({ color: "#8a4a34" })));
    proof.position.set(0, 3.1, -13.4); proof.castShadow = true; R.add(proof);

    // ---- the flag: red over white, on a bamboo pole by the porch ----
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 5.6, 8), lam("pole45", () => ({ color: "#9a8256" })));
    pole.position.set(FLAG_AT[0], 2.8, FLAG_AT[2]); pole.castShadow = true; R.add(pole);
    this.flag = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.5), new THREE.MeshBasicMaterial({ map: flagTex(), side: THREE.DoubleSide, fog: false }));
    this.flag.position.set(FLAG_AT[0] + 1.17, 4.75, FLAG_AT[2]);
    this.flag.layers.set(NOINK);
    R.add(this.flag);

    // ---- the gardu ronda at PORCH_AT: deck, posts, roof, an oil lamp ----
    const gz = PORCH_AT[2];
    const gdeck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.32, 2.4), woodM);
    gdeck.position.set(0, 0.16, gz); gdeck.castShadow = true; gdeck.receiveShadow = true; R.add(gdeck);
    for (const [px, pz] of [[-1.65, -1.05], [1.65, -1.05], [-1.65, 1.05], [1.65, 1.05]] as const) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.5, 0.14), woodM);
      post.position.set(px, 1.55, gz + pz); post.castShadow = true; R.add(post);
    }
    const groof = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.12, 2.9), lam("groof45", () => ({ color: "#77503a" })));
    groof.position.set(0, 2.86, gz); groof.castShadow = true; R.add(groof);
    const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, 0.55) });
    const lamp1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), lampM);
    lamp1.position.set(1.5, 2.2, gz + 0.9); lamp1.layers.set(NOINK); R.add(lamp1); this.lampGlows.push(lamp1);
    const lamp2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), lampM);
    lamp2.position.set(3.1, 2.2, -12.4); lamp2.layers.set(NOINK); R.add(lamp2); this.lampGlows.push(lamp2);

    // ---- the communal kitchen: two great pots over a fire ----
    const potM = lam("pot45", () => ({ color: "#3c3f45" }));
    for (const [px, pz] of [[DAPUR_AT[0], DAPUR_AT[2]], [DAPUR_AT[0] - 1.7, DAPUR_AT[2] - 0.8]] as const) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.72, 14), potM);
      pot.position.set(px, 0.52, pz); pot.castShadow = true; R.add(pot);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), potM);
      lid.position.set(px, 0.86, pz); R.add(lid);
      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.5, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.9, 0.25) }));
      fire.position.set(px, 0.22, pz); fire.layers.set(NOINK); R.add(fire);
    }
    const ktable = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.1), woodM);
    ktable.position.set(DAPUR_AT[0] + 0.4, 0.78, DAPUR_AT[2] + 2.2); ktable.castShadow = true; R.add(ktable);

    // ---- the phone's flashlight beam (shot 4) + its pool of light ----
    const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.35, 0.9), transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 1.35, 4.6, 18, 1, true), beamMat);
    cone.position.set(0.42, 0.82, -2.2); cone.rotation.x = Math.PI / 2 - 0.32;
    cone.layers.set(NOINK);
    const poolDisc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 0.95, 0.55), transparent: true, opacity: 0.20, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    poolDisc.rotation.x = -Math.PI / 2; poolDisc.position.set(0.42, 0.04, -4.3); poolDisc.layers.set(NOINK);
    this.beam.add(cone, poolDisc);
    this.beam.visible = false;
    R.add(this.beam);

    // ---- battery labels ----
    for (const def of LABELS) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.w / 4),
        new THREE.MeshBasicMaterial({ map: labelTex(def.text, !!def.accent), transparent: true, depthWrite: false, fog: false }));
      mesh.position.set(...def.pos); mesh.visible = false; mesh.layers.set(NOINK); mesh.renderOrder = 6;
      this.labels.push({ mesh, a: def.a, b: def.b });
      R.add(mesh);
    }

    // ---- trees behind the houses ----
    const put = (name: string, x: number, z: number, h: number, yaw = 0) => {
      const o = kitClone(kit, name, h);
      if (!o) return;
      o.position.set(x, 0, z); o.rotation.y = yaw;
      o.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
      R.add(o);
    };
    const trees: [string, number, number, number][] = [
      ["tree_oak", -19, -14, 9], ["tree_default", 19, -16, 8], ["tree_detailed", -20, 6, 9.5],
      ["tree_fat", 20, 8, 8.5], ["tree_cone", -17, -26, 9], ["tree_oak", 17, -27, 8.5],
      ["tree_default", -21, -4, 7.5], ["tree", 21, -5, 9],
    ];
    trees.forEach(([n, x, z, h], i) => put(n, x, z, h, rnd(i, 9) * 3));
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
    // ---- set pieces ----
    this.flag.rotation.y = 0.35 * Math.sin(t * 2.1) + 0.15 * Math.sin(t * 3.7);
    this.beam.visible = id === 4;
    for (const lb of this.labels) {
      lb.mesh.visible = f >= lb.a && f < lb.b;
      if (lb.mesh.visible) lb.mesh.quaternion.copy(cam.quaternion);
    }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage45(id, t, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : s.light === "night" ? "#aebfdf" : "#ffffff";
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
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }
}
