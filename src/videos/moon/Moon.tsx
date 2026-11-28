// "Kenapa Bulan Terlihat Mengikuti Kita Saat Naik Mobil?": a 16:9 night-drive explainer in the bridge engine's
// flat-characters-in-a-3D-toon-world style. Same post chain as the bridge short:
// InkPass -> lens blur (DOF per shot) -> bloom -> NEUTRAL tone -> colour grade.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { loadKit } from "../bridge/world";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur, GrainEffect } from "../bridge/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../bridge/grade";
import { Kit } from "../bridge/build";
import { TOTAL, SHOTS, layersAt, dofAt } from "./story";

export const MOON_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("moon kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
  }), [camera, scene]);
  useEffect(() => () => { try { fx.ink.dispose?.(); } catch { /* crossfade unmount */ } }, [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  fx.grain.seed = f;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => {
  // Canvas MUST match the composition size: a fixed 1080x1920 canvas inside a
  // 720x1280 composition is captured as a 1.5x top-left crop (measured
  // 2026-11-28: subjects staged by projection vanished / shifted ~+0.5 ndc).
  const { width, height } = useVideoConfig();
  return (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={width} height={height} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
  );
};

const useFont = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("moon font"));
  useEffect(() => {
    const face = new FontFace("Baloo2", `url(${staticFile("fonts/baloo2-700.woff2")})`, { weight: "700" });
    face.load().then(() => { (document as unknown as { fonts: FontFaceSet }).fonts.add(face); setReady(true); continueRender(handle); })
      .catch(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
};

export const MoonShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  const fontReady = useFont();
  if (!kit || !fontReady) return null;
  const titleO = interpolate(f, [10, 26, 94, 110], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const endO = interpolate(f, [2690, 2725], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#101c36" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />)}
      {titleO > 0 ? (
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 0 54px 64px", opacity: titleO }}>
          <div style={{ fontFamily: "Baloo2, sans-serif", fontSize: 57, lineHeight: 1.05, color: "#ffffff", textShadow: "0 3px 0 #1f2a44, 0 6px 22px rgba(0,0,0,0.55)" }}>
            KENAPA BULAN<br />MENGIKUTI KITA?
          </div>
          <div style={{ fontFamily: "Baloo2, sans-serif", fontSize: 25, color: "#ffd93b", marginTop: 10, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
            Paralaks gerak — sains di perjalanan malam
          </div>
        </AbsoluteFill>
      ) : null}
      {endO > 0 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: endO }}>
          <div style={{ textAlign: "center", background: "rgba(8,14,30,0.72)", border: "3px solid rgba(255,217,59,0.85)", borderRadius: 28, padding: "34px 54px" }}>
            <div style={{ fontFamily: "Baloo2, sans-serif", fontSize: 50, color: "#ffffff", lineHeight: 1.1 }}>BULAN TIDAK MENGIKUTI KITA</div>
            <div style={{ fontFamily: "Baloo2, sans-serif", fontSize: 29, color: "#cfe0ff", marginTop: 8 }}>jaraknya saja yang terlalu jauh</div>
            <div style={{ fontFamily: "Baloo2, sans-serif", fontSize: 25, color: "#ffd93b", marginTop: 16 }}>Coba buktikan malam ini dari jendela mobil!</div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
