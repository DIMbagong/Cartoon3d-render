// Night-drive world for the Moon explainer: a car cruising a country road
// under a full Moon. The world scrolls past the stationary car in parallax
// layers — roadside trees and lamps at full speed, houses at 0.55x, mountains
// at 0.04x — while the Moon and stars are re-pinned to the camera every frame
// and never move at all. That contrast is the whole lesson, staged literally.
import * as THREE from "three";
import { lam, V, Kit } from "../bridge/build";
import { ctex } from "../bridge/paint";
import { LIGHTS, LOOK, LightPreset } from "../bridge/lights";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import {
  FPS, SHOTS, ShotDef, camAt, SPEED, LABELS, LINE_TREE, LINE_MOON, LINE_MOON2,
  HERO_TREE_T0, HERO_TREE_X0, HERO_TREE_Z, MOON_DIR,
} from "./story";
import { stageK } from "./cast";

const wrap = (v: number, r: number) => (((v % r) + r) % r) - r / 2;
const rnd = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

const radialTex = (inner: string, outer: string) => ctex(`rad|${inner}`, 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const moonTex = () => ctex("moonSurf", 512, 512, (g) => {
  g.fillStyle = "#e9eef7"; g.fillRect(0, 0, 512, 512);
  const gr = g.createRadialGradient(190, 180, 60, 256, 256, 300);
  gr.addColorStop(0, "rgba(255,255,255,0.25)"); gr.addColorStop(1, "rgba(120,135,170,0.35)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) {
    const x = 60 + rnd(i, 1) * 390, y = 60 + rnd(i, 2) * 390, r = 12 + rnd(i, 3) * 34;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = `rgba(148,163,190,${0.16 + rnd(i, 4) * 0.16})`; g.fill();
    g.beginPath(); g.arc(x - r * 0.18, y - r * 0.18, r * 0.82, 0, Math.PI * 2);
    g.fillStyle = "rgba(255,255,255,0.10)"; g.fill();
  }
});
const labelTex = (text: string, accent: boolean) => ctex(`label|${text}`, 1024, 256, (g) => {
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

interface Scroller { o: THREE.Object3D; baseX: number; k: number; range: number }
const pine = (h: number) => {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, h * 0.3, 6), lam("pineTrunk", () => ({ color: "#2c2018" })));
  trunk.position.y = h * 0.15; g.add(trunk);
  const fol = lam("pineFol", () => ({ color: "#17382b" }));
  for (let i = 0; i < 3; i++) {
    const r = h * (0.34 - i * 0.075), y = h * (0.32 + i * 0.21);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.42, 8), fol);
    cone.position.y = y + h * 0.18; g.add(cone);
  }
  return g;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#1c2c4e", 30, 260);
  private sunCache = new Map<number, THREE.Vector3>();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  private roadTex: THREE.Texture;
  private car = new THREE.Group();
  private wheels: THREE.Group[] = [];
  private scrollers: Scroller[] = [];
  private heroTree: THREE.Group;
  private moonGroup = new THREE.Group();
  private moonDisc: THREE.Mesh;
  private starGroup = new THREE.Group();
  private labels: { mesh: THREE.Mesh; a: number; b: number }[] = [];
  private dots: THREE.Sprite[] = [];
  private ghost: THREE.Mesh;

  constructor(_kit: Kit) {
    const R = this.root;
    // ---- sky + light rig (same construction as the bridge/kappa worlds) ----
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
    this.hemi = new THREE.HemisphereLight("#aebfdf", "#1a2030", 0.34);
    this.sun = new THREE.DirectionalLight("#cfe0ff", 1.15);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.2);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);

    // ---- stars (pinned to the camera: zero parallax, like the Moon) ----
    {
      const n = 380, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = rnd(i, 31) * Math.PI * 2, e = 0.06 + rnd(i, 32) * 1.35, r = 950;
        pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: new THREE.Color(1.5, 1.6, 1.9), size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false; pts.layers.set(NOINK);
      this.starGroup.add(pts); R.add(this.starGroup);
    }

    // ---- the Moon (disc + halo), re-pinned to the camera every frame ----
    this.moonDisc = new THREE.Mesh(new THREE.CircleGeometry(55, 40),
      new THREE.MeshBasicMaterial({ map: moonTex(), transparent: true, fog: false, depthWrite: false }));
    this.moonDisc.layers.set(NOINK);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex("rgba(190,205,240,0.55)", "rgba(190,205,240,0)"), color: new THREE.Color(0.9, 0.95, 1.15), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(330); halo.layers.set(NOINK);
    this.moonGroup.add(halo, this.moonDisc);
    this.moonGroup.frustumCulled = false;
    R.add(this.moonGroup);

    // ---- ground + road ----
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), lam("nightGround", () => ({ color: "#131e33" })));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; R.add(ground);
    this.roadTex = ctex("roadNight", 512, 512, (g) => {
      g.fillStyle = "#252b3a"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${rnd(i, 41) * 0.05})`; g.fillRect(rnd(i, 42) * 512, rnd(i, 43) * 512, 2, 2); }
      g.fillStyle = "#cfd6e4"; g.fillRect(0, 14, 512, 9); g.fillRect(0, 489, 512, 9);
      g.fillStyle = "#e8c85a"; g.fillRect(26, 248, 220, 15);
    });
    this.roadTex.wrapS = this.roadTex.wrapT = THREE.RepeatWrapping;
    this.roadTex.repeat.set(60, 1);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(500, 7.4), new THREE.MeshBasicMaterial({ map: this.roadTex }));
    road.rotation.x = -Math.PI / 2; road.position.y = 0.01; R.add(road);

    // ---- the car ----
    {
      const body = lam("carBody", () => ({ color: "#d94f30" }));
      const dark = lam("carDark", () => ({ color: "#8f2f1c" }));
      const lower = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.62, 1.62), body); lower.position.y = 0.62;
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 1.5), body); nose.position.set(1.95, 0.52, 0);
      const farPanel = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.62, 0.06), dark); farPanel.position.set(-0.15, 1.22, -0.72);
      const glassFar = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.46), lam("carGlass", () => ({ color: "#a9cdea" }))); glassFar.position.set(-0.15, 1.24, -0.68);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 1.52), dark); roof.position.set(-0.15, 1.57, 0);
      const pillarF = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.06), dark); pillarF.position.set(0.78, 1.22, 0.72);
      const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.06), dark); pillarR.position.set(-1.08, 1.22, 0.72);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.1, 0.06), dark); sill.position.set(-0.15, 0.95, 0.72);
      this.car.add(lower, nose, farPanel, glassFar, roof, pillarF, pillarR, sill);
      const wheelM = lam("carWheel", () => ({ color: "#14161c" })), hubM = lam("carHub", () => ({ color: "#cfd6e4" }));
      for (const [wx, wz] of [[1.25, 0.82], [1.25, -0.82], [-1.25, 0.82], [-1.25, -0.82]] as const) {
        const wg = new THREE.Group(); wg.position.set(wx, 0.37, wz);
        const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.24, 18), wheelM); tyre.rotation.x = Math.PI / 2;
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 12), hubM); hub.rotation.x = Math.PI / 2;
        wg.add(tyre, hub); this.wheels.push(wg); this.car.add(wg);
      }
      const glowT = radialTex("rgba(255,233,168,1)", "rgba(255,233,168,0)");
      for (const hz of [0.5, -0.5]) {
        const lampDisc = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.2), fog: false }));
        lampDisc.position.set(2.33, 0.66, hz); lampDisc.rotation.y = Math.PI / 2; this.car.add(lampDisc);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: new THREE.Color(1.5, 1.25, 0.7), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.position.set(2.42, 0.66, hz); glow.scale.setScalar(1.1); this.car.add(glow);
        const beam = new THREE.Mesh(new THREE.ConeGeometry(0.65, 2.4, 14, 1, true),
          new THREE.MeshBasicMaterial({ color: "#ffdf9e", transparent: true, opacity: 0.028, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
        beam.rotation.z = Math.PI / 2; beam.position.set(3.5, 0.6, hz); this.car.add(beam);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.35, 0.25), fog: false }));
        tail.position.set(-1.78, 0.7, hz); this.car.add(tail);
      }
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6),
        new THREE.MeshBasicMaterial({ map: radialTex("rgba(0,0,0,0.42)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false }));
      blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; this.car.add(blob);
      this.car.position.set(0, 0, 0.8);
      R.add(this.car);
    }

    // ---- parallax scenery layers ----
    const addScroll = (o: THREE.Object3D, baseX: number, z: number, k: number, range: number, y = 0) => {
      o.position.set(baseX, y, z); R.add(o); this.scrollers.push({ o, baseX, k, range });
    };
    for (let i = 0; i < 13; i++) addScroll(pine(2.6 + rnd(i, 51) * 1.3), -75 + i * 12.5 + rnd(i, 52) * 4, -7.5 - rnd(i, 53) * 1.6, 1, 162);
    for (let i = 0; i < 6; i++) { // lamp posts, warm pools of light
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.4, 6), lam("lampPole", () => ({ color: "#232a3a" }))); pole.position.y = 1.7; g.add(pole);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex("rgba(255,205,120,1)", "rgba(255,205,120,0)"), color: new THREE.Color(1.7, 1.25, 0.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.position.y = 3.45; glow.scale.setScalar(2.0); g.add(glow);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 0.9), fog: false }));
      bulb.position.y = 3.42; g.add(bulb);
      addScroll(g, -78 + i * 26 + rnd(i, 54) * 5, -6.3, 1, 156);
    }
    for (let i = 0; i < 4; i++) { // houses with lit windows, mid layer
      const g = new THREE.Group();
      const bodyH = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.6, 3.4), lam("houseBody", () => ({ color: "#1d2742" }))); bodyH.position.y = 1.3; g.add(bodyH);
      const roofH = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.7, 4), lam("houseRoof", () => ({ color: "#141c30" }))); roofH.position.y = 3.45; roofH.rotation.y = Math.PI / 4; g.add(roofH);
      for (const wx of [-1.2, 1.1]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.35, 0.75), fog: false }));
        win.position.set(wx, 1.35, 1.71); g.add(win);
      }
      addScroll(g, -120 + i * 62 + rnd(i, 55) * 14, -17 - rnd(i, 56) * 3, 0.55, 260);
    }
    for (let i = 0; i < 3; i++) { // mountain silhouettes, far layer
      const m = new THREE.Mesh(new THREE.ConeGeometry(30 + i * 7, 13 + i * 3.5, 5), lam("mountain", () => ({ color: "#1b2a4a" })));
      addScroll(m, -180 + i * 150, -78 - i * 9, 0.04, 430, (13 + i * 3.5) / 2 - 0.5);
    }
    for (let i = 0; i < 8; i++) { // near bushes sweeping past the camera
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.55 + rnd(i, 57) * 0.4, 10, 8), lam("bushNight", () => ({ color: "#12251e" })));
      b.scale.y = 0.7;
      addScroll(b, -60 + i * 15 + rnd(i, 58) * 5, 5.6, 1, 124, 0.3);
    }
    this.heroTree = pine(3.6);
    this.heroTree.position.set(HERO_TREE_X0, 0, HERO_TREE_Z);
    R.add(this.heroTree);

    // ---- diagram labels ----
    for (const def of LABELS) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.w / 4),
        new THREE.MeshBasicMaterial({ map: labelTex(def.text, !!def.accent), transparent: true, depthWrite: false, fog: false }));
      mesh.position.set(...def.pos); mesh.visible = false; mesh.layers.set(NOINK); mesh.renderOrder = 6;
      this.labels.push({ mesh, a: def.a, b: def.b });
      R.add(mesh);
    }

    // ---- sight-line dots + the "10 km ago" ghost marker ----
    const dotT = radialTex("rgba(255,240,190,1)", "rgba(255,240,190,0)");
    for (let i = 0; i < 84; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotT, color: new THREE.Color(1.8, 1.6, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      s.scale.setScalar(0.17); s.visible = false; s.layers.set(NOINK);
      this.dots.push(s); R.add(s);
    }
    this.ghost = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.3, 0.9), transparent: true, opacity: 0.85, fog: false }));
    this.ghost.position.set(-5.2, 1.6, 0.8); this.ghost.visible = false;
    R.add(this.ghost);
  }

  /** camera-relative moonlight, frozen per shot (same recipe as the bridge world) */
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

  private layDots(from: THREE.Vector3, to: THREE.Vector3, start: number, count: number) {
    for (let i = 0; i < count; i++) {
      const s = this.dots[start + i], u = count === 1 ? 0 : i / (count - 1);
      s.position.lerpVectors(from, to, u);
      s.visible = true;
    }
  }

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
    this.sun.position.copy(focus).addScaledVector(sunDir, 160); this.sun.target.position.copy(focus);
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky + fog ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    // ---- Moon + stars: pinned to the camera (zero parallax — the lesson) ----
    const md = MOON_DIR[id] ?? MOON_DIR[1];
    const mDir = this.v.set(md[0], md[1], md[2]).normalize();
    this.moonGroup.position.copy(cam.position).addScaledVector(mDir, 880);
    this.moonDisc.lookAt(cam.position);
    this.starGroup.position.copy(cam.position);
    // ---- scroll the world past the car ----
    const d = t * SPEED;
    this.roadTex.offset.x = (d / (500 / 60)) % 1;
    for (const sc of this.scrollers) sc.o.position.x = wrap(sc.baseX - d * sc.k, sc.range);
    this.heroTree.position.x = HERO_TREE_X0 - (t - HERO_TREE_T0) * SPEED;
    this.heroTree.visible = f >= 500 && f < 780;
    for (const w of this.wheels) w.rotation.z = -d / 0.37;
    this.car.position.y = 0.015 * Math.sin(t * 27) + 0.008 * Math.sin(t * 41);
    this.car.rotation.z = 0.004 * Math.sin(t * 23);
    // ---- labels ----
    for (const lb of this.labels) {
      lb.mesh.visible = f >= lb.a && f < lb.b;
      if (lb.mesh.visible) lb.mesh.quaternion.copy(cam.quaternion);
    }
    // ---- sight lines ----
    for (const s2 of this.dots) s2.visible = false;
    this.ghost.visible = false;
    const eye = new THREE.Vector3(-0.3, 1.95, 0.85);
    if (f >= LINE_TREE[0] && f < LINE_TREE[1]) {
      this.layDots(eye, new THREE.Vector3(this.heroTree.position.x, 3.3, HERO_TREE_Z), 0, 22);
    }
    if (f >= LINE_MOON[0] && f < LINE_MOON[1]) {
      const from = new THREE.Vector3(0, 1.8, 0.85);
      const to = from.clone().addScaledVector(new THREE.Vector3().subVectors(this.moonGroup.position, from).normalize(), 55);
      this.layDots(from, to, 22, 30);
    }
    if (f >= LINE_MOON2[0] && f < LINE_MOON2[1]) {
      this.ghost.visible = true;
      const from = new THREE.Vector3(-5.2, 1.7, 0.85);
      const to = from.clone().addScaledVector(new THREE.Vector3().subVectors(this.moonGroup.position, from).normalize(), 55);
      this.layDots(from, to, 52, 30);
    }
    // ---- cast + effects (same application as the bridge/kappa worlds) ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stageK(id, t, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = "#ffffff";
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
      a.mesh.castShadow = false;
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
