import React from "react";
import { AbsoluteFill, Audio, Composition, registerRoot, staticFile } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { KappaShort, KAPPA_FRAMES } from "./videos/kappa/Kappa";

const BridgeWithAudio: React.FC = () => (
  <AbsoluteFill>
    <BridgeShort />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);

const KappaWithAudio: React.FC = () => (
  <AbsoluteFill>
    <KappaShort />
    <Audio src={staticFile("kappa-mix.wav")} />
  </AbsoluteFill>
);

const Root: React.FC = () => (
  <>
    <Composition
      id="BridgeShort"
      component={BridgeShort}
      durationInFrames={BRIDGE_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="BridgeShort720"
      component={BridgeShort}
      durationInFrames={BRIDGE_FRAMES}
      fps={30}
      width={720}
      height={1280}
    />
    <Composition
      id="BridgeFinal720"
      component={BridgeWithAudio}
      durationInFrames={BRIDGE_FRAMES}
      fps={30}
      width={720}
      height={1280}
    />
    <Composition
      id="BridgeFinal1080"
      component={BridgeWithAudio}
      durationInFrames={BRIDGE_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="KappaShort"
      component={KappaShort}
      durationInFrames={KAPPA_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="KappaShort720"
      component={KappaShort}
      durationInFrames={KAPPA_FRAMES}
      fps={30}
      width={720}
      height={1280}
    />
    <Composition
      id="KappaFinal720"
      component={KappaWithAudio}
      durationInFrames={KAPPA_FRAMES}
      fps={30}
      width={720}
      height={1280}
    />
    <Composition
      id="KappaFinal1080"
      component={KappaWithAudio}
      durationInFrames={KAPPA_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
registerRoot(Root);
