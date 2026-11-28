// GitHub Actions entry: the konon compositions with audio forced OFF.
// The Actions renderers have no mix WAVs in public/ (renders are silent by
// design; audio is muxed locally), and Remotion's asset pass downloads any
// mounted <Audio> src — a missing file fails the job. Wrapping the
// compositions with silent=true here avoids the props-through-renderer path.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { KappaKonon, KONON_FRAMES } from "./konon/KappaKonon";
import { CicakKonon, CICAK_FRAMES } from "./konon/CicakKonon";
import { KitsuneAnime, ANIME_FRAMES } from "./anime/KitsuneAnime";

const KappaSilent: React.FC = () => <KappaKonon silent />;
const CicakSilent: React.FC = () => <CicakKonon silent />;
const KitsuneSilent: React.FC = () => <KitsuneAnime silent />;

const Root: React.FC = () => (
  <>
    <Composition
      id="KappaKonon720"
      component={KappaSilent}
      durationInFrames={KONON_FRAMES}
      fps={30}
      width={720}
      height={1280}
    />
    <Composition
      id="KitsuneAnime720"
      component={KitsuneSilent}
      durationInFrames={ANIME_FRAMES}
      fps={30}
      width={720}
      height={1280}
    />
    <Composition
      id="CicakKonon720"
      component={CicakSilent}
      durationInFrames={CICAK_FRAMES}
      fps={30}
      width={720}
      height={1280}
    />
  </>
);
registerRoot(Root);
