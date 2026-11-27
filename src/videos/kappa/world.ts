// The swamp pond as one three.js scene: grass banks, a still pond with the bridge engine's
// water shader, reeds and trees from the shared Kenney kit, lily pads, rocks, a warning sign,
// drifting mist and (at dusk) fireflies. update(id, f, camera) poses everything for shot `id`
// at frame f — same contract as the bridge world.
import * as THREE from "three";
import { lam, V, kitClone, Kit } from "../bridge/build";
import { grassHD, waterNear, waterFar, cloudHD, ctex } from "../bridge/paint";
import { Pen } from "../bridge/toon";
import { LIGHTS, LOOK, LightPreset } from "../bridge/lights";
import { TONE, CHAR, LFB, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { FPS, SHOTS, SIGN_AT, camAt, dimAt, ShotDef } from "./story";
import { stageK } from "./cast";

const discTex = () => ctex("sunDiscK", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHaloK", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
const mistTex = () => ctex("mistK", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,0.85)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** warning sign face: wooden board, a kappa head inside a red prohibition ring */
const signTex = () => ctex("kappaSign", 512, 384, (g) => {
  const p = new Pen(g);
  p.poly([[8, 8], [504, 8], [504, 376], [8, 376]], "#9a7448", 10);
  p.ell(256, 192, 118, 118, "#63b245", 0);                    // kappa head
  p.ell(256, 96, 62, 20, "#e6edf0", 7);                        // the dish
  p.ell(256, 94, 44, 13, "#79c7e3", 0);                        // its water
  p.poly([[228, 218], [284, 218], [256, 248]], "#eec95e", 6); // beak
  p.dot(214, 176, 11); p.dot(298, 176, 11);                    // eyes
  p.ell(256, 192, 148, 148, null, 17);                         // red ring (stroke only)
  const gr = g; gr.strokeStyle = "#c22e2e"; gr.lineWidth = 17;
  gr.beginPath(); gr.arc(256, 192, 148, 0, Math.PI * 2); gr.stroke();
  gr.beginPath(); gr.moveTo(256 - 105, 192 + 105); gr.lineTo(256 + 105, 192 - 105); gr.stroke();
});

function quadUpK(x0: number, x1: number, z0: number, z1: number, u: number, v: number, y: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
const rnd = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#b8d0ec", 25, 300);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private mists: THREE.Mesh[] = [];
  private flies: THREE.Sprite[] = [];
  private flyBase: THREE.Vector3[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light rig (same construction as the bridge world) ----
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

    // ---- ground: grass everywhere, sandy bank ring, pond bed ----
    const grass = new THREE.Mesh(quadUpK(-160, 160, -160, 160, 80, 80, 0), lam("grassHD", () => ({ map: grassHD() })));
    grass.receiveShadow = true; R.add(grass);
    const bank = new THREE.Mesh(new THREE.RingGeometry(7.3, 11.2, 56), lam("bankK", () => ({ color: "#c9ae7c" })));
    bank.rotation.x = -Math.PI / 2; bank.position.y = 0.012; bank.receiveShadow = true; R.add(bank);
    const bedM = new THREE.Mesh(new THREE.CircleGeometry(7.7, 48), lam("bedK", () => ({ color: "#274435" })));
    bedM.rotation.x = -Math.PI / 2; bedM.position.y = 0.004; bedM.scale.set(1, 0.86, 1); R.add(bedM);

    // ---- pond water (the bridge engine's water shader) ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "pond1";
    const water = new THREE.Mesh(new THREE.CircleGeometry(7.7, 48), waterM);
    water.rotation.x = -Math.PI / 2; water.position.y = 0.02; water.scale.set(1, 0.86, 1);
    water.receiveShadow = true; R.add(water);
    const foam = new THREE.Mesh(new THREE.RingGeometry(7.28, 7.68, 56),
      new THREE.MeshBasicMaterial({ color: "#dff3ee", transparent: true, opacity: 0.35, depthWrite: false }));
    foam.rotation.x = -Math.PI / 2; foam.position.y = 0.032; foam.scale.set(1, 0.86, 1); foam.layers.set(NOINK); R.add(foam);

    // ---- vegetation + rocks from the shared kit ----
    const put = (name: string, x: number, z: number, h: number, yaw = 0) => {
      const o = kitClone(kit, name, h);
      if (!o) return;
      o.position.set(x, 0, z); o.rotation.y = yaw;
      o.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
      R.add(o);
    };
    for (let i = 0; i < 42; i++) { // reed / grass tufts around the rim
      const a = (i / 42) * Math.PI * 2 + rnd(i, 1) * 0.12, r = 8.1 + rnd(i, 2) * 1.7;
      put(i % 3 ? "grass_large" : "grass", Math.cos(a) * r, Math.sin(a) * r * 0.88, 0.55 + rnd(i, 3) * 0.5, rnd(i, 4) * 3);
    }
    for (let i = 0; i < 9; i++) { // bushes mid-ground
      const a = rnd(i, 5) * Math.PI * 2, r = 11.5 + rnd(i, 6) * 5;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 6 && Math.abs(x) < 9) continue; // keep the camera side open
      put(i % 2 ? "plant_bushLarge" : "plant_bush", x, z, 1.1 + rnd(i, 7) * 0.8, rnd(i, 8) * 3);
    }
    const trees: [string, number, number, number][] = [
      ["tree_oak", -13, -7, 8.5], ["tree_default", 12.5, -9, 7.5], ["tree_detailed", -9, -14, 9],
      ["tree_fat", 16, -3, 8], ["tree-high-round", -17, 1, 9.5], ["tree_cone", 9, -16, 8.5],
      ["tree_oak", 19, 5, 8], ["tree_default", -15, 7.5, 7], ["tree", 6, -20, 9], ["tree_detailed", -6, -19, 8],
    ];
    trees.forEach(([n, x, z, h], i) => put(n, x, z, h, rnd(i, 9) * 3));
    for (const [x, z] of [[3.4, -3.2], [-4.6, -1.8], [5.8, 1.8]] as const) put("lily_large", x, z, 0.5); // lily pads on the pond
    const rockM = lam("rockK", () => ({ color: "#8d9299" }));
    for (const [x, z, s] of [[-8.6, 3.4, 1.3], [9.4, 4.6, 0.9], [-6.2, 7.8, 0.7], [11.8, -1.5, 1.6]] as const) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockM);
      rock.position.set(x, s * 0.4, z); rock.rotation.set(rnd(x, 1) * 2, rnd(z, 2) * 2, 0);
      rock.castShadow = true; rock.receiveShadow = true; R.add(rock);
    }

    // ---- the warning sign at the bank path ----
    const sign = new THREE.Group();
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.0),
      new THREE.MeshBasicMaterial({ map: signTex(), alphaTest: 0.5, color: 0xe6e6e6 }));
    board.layers.set(NOINK);
    board.position.set(0, 1.55, -0.04);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.41, 1.06, 0.06), lam("woodK", () => ({ color: "#7a5a38" })));
    back.position.set(0, 1.55, 0);
    sign.add(board, back);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.0, 0.11), back.material);
      post.position.set(sx * 0.5, 1.0, 0.03); sign.add(post);
    }
    sign.position.set(SIGN_AT[0], 0, SIGN_AT[2]);
    sign.rotation.y = 0.5; // angled toward the path / default camera side
    sign.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    R.add(sign);

    // ---- mist cards + fireflies ----
    const mistM = mistTex();
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: mistM, transparent: true, opacity: 0.10 + 0.03 * (i % 2), depthWrite: false, fog: false }));
      const a = i * 1.9 + 0.6;
      m.position.set(Math.cos(a) * 6.4, 0.75 + 0.28 * (i % 3), Math.sin(a) * 5.4);
      m.scale.set(7 + i, 2.2 + 0.4 * i, 1);
      m.layers.set(NOINK); m.renderOrder = 4;
      this.mists.push(m); R.add(m);
    }
    const flyT = discTex();
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flyT, color: new THREE.Color(1.6, 1.3, 0.5), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      const a = rnd(i, 21) * Math.PI * 2, r = 3 + rnd(i, 22) * 6;
      const base = new THREE.Vector3(Math.cos(a) * r, 0.5 + rnd(i, 23) * 1.1, Math.sin(a) * r * 0.8 + 2);
      this.flyBase.push(base);
      s.position.copy(base); s.scale.setScalar(0.14);
      s.layers.set(NOINK);
      this.flies.push(s); R.add(s);
    }
  }

  /** camera-relative sun, frozen per shot (same recipe as the bridge world) */
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
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light], dim = dimAt(f);
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig, dimmed on the dark-side beat ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L), dk = 1 - 0.62 * dim;
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI * (1 - 0.4 * dim);
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI * dk;
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
    K.sky.c.forEach((h, i) => { untone(h, su["c" + i].value); if (dim > 0) su["c" + i].value.multiplyScalar(1 - 0.45 * dim); });
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color);
    if (dim > 0) this.fog.color.lerp(new THREE.Color("#46586e"), dim * 0.7);
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
    // ---- water colours ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // ---- mist drift + fireflies ----
    for (let i = 0; i < this.mists.length; i++) {
      const m = this.mists[i];
      m.position.x += Math.sin(t * 0.07 + i * 2.1) * 0.0016;
      m.quaternion.copy(cam.quaternion);
      (m.material as THREE.MeshBasicMaterial).opacity = (0.10 + 0.03 * (i % 2)) * (1 + 0.8 * dim);
    }
    const flyOn = id === 8 ? 1 : dim > 0.25 ? dim : 0;
    for (let i = 0; i < this.flies.length; i++) {
      const s = this.flies[i], b = this.flyBase[i];
      s.visible = flyOn > 0;
      if (s.visible) {
        s.position.set(b.x + Math.sin(t * 0.6 + i * 1.7) * 0.5, b.y + Math.sin(t * 0.9 + i * 2.3) * 0.22, b.z + Math.cos(t * 0.5 + i) * 0.5);
        (s.material as THREE.SpriteMaterial).opacity = flyOn * (0.55 + 0.45 * Math.sin(t * 2.4 + i * 2.9));
      }
    }
    // ---- cast + effects (same application as the bridge world) ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stageK(id, t, { pos: cam.position, right });
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

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
