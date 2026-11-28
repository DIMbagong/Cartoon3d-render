// Chibi big-head flat characters in the "konon" story style: front-facing,
// thick outlines, simple shapes. Drawn as SVG, viewBox 0 0 400 560, ground y=560.
import React from "react";

export type Eyes = "open" | "happy" | "shock" | "stern" | "closed" | "dizzy" | "side";
export type Mouth = "smile" | "open" | "flat" | "wavy" | "grin";

const INK = "#26303a";

export const Cucumber: React.FC<{ size?: number; rot?: number }> = ({ size = 64, rot = 0 }) => (
  <svg viewBox="0 0 40 120" width={size * 0.34} height={size} style={{ transform: `rotate(${rot}deg)`, display: "block" }}>
    <rect x="6" y="4" width="28" height="112" rx="14" fill="#3f9e4d" stroke={INK} strokeWidth="4" />
    <rect x="14" y="12" width="5" height="96" rx="2.5" fill="#7cc957" opacity="0.8" />
    <circle cx="26" cy="30" r="2.4" fill="#2c7a38" /><circle cx="24" cy="58" r="2.4" fill="#2c7a38" />
    <circle cx="27" cy="86" r="2.4" fill="#2c7a38" /><circle cx="13" cy="72" r="2" fill="#2c7a38" />
  </svg>
);

const MascotEyes: React.FC<{ eyes: Eyes }> = ({ eyes }) => {
  // viewer-left eye = his RIGHT eye (red), viewer-right = his LEFT (pale green)
  const one = (cx: number, iris: string) => {
    if (eyes === "happy" || eyes === "closed")
      return <path d={`M ${cx - 17} 200 Q ${cx} ${eyes === "happy" ? 182 : 192} ${cx + 17} 200`} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />;
    if (eyes === "shock")
      return <g><circle cx={cx} cy="196" r="16" fill="#fff" stroke={INK} strokeWidth="5" /><circle cx={cx} cy="198" r="5" fill={INK} /></g>;
    if (eyes === "dizzy")
      return <path d={`M ${cx - 13} 186 L ${cx + 13} 206 M ${cx + 13} 186 L ${cx - 13} 206`} stroke={INK} strokeWidth="6" strokeLinecap="round" />;
    const look = eyes === "side" ? 5 : 0;
    const lid = eyes === "stern" ? 0.62 : 1;
    return (
      <g>
        <ellipse cx={cx} cy="196" rx="17" ry={21 * lid} fill="#fff" stroke={INK} strokeWidth="5" />
        <circle cx={cx + look} cy={198} r="11" fill={iris} stroke={INK} strokeWidth="3" />
        <circle cx={cx + look} cy={198} r="5.5" fill={INK} />
        <circle cx={cx + look - 3.5} cy={192} r="3.4" fill="#fff" />
      </g>
    );
  };
  return <g>{one(160, "#d43a2f")}{one(240, "#a9d97c")}</g>;
};

const MascotMouth: React.FC<{ mouth: Mouth }> = ({ mouth }) => {
  if (mouth === "open") return <ellipse cx="200" cy="246" rx="11" ry="14" fill="#8a3b2e" stroke={INK} strokeWidth="4" />;
  if (mouth === "flat") return <line x1="184" y1="244" x2="216" y2="244" stroke={INK} strokeWidth="6" strokeLinecap="round" />;
  if (mouth === "wavy") return <path d="M 176 246 q 8 -8 16 0 q 8 8 16 0 q 8 -8 16 0" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />;
  if (mouth === "grin") return <path d="M 176 236 Q 200 262 224 236 Q 200 246 176 236 Z" fill="#8a3b2e" stroke={INK} strokeWidth="4" />;
  return <path d="M 180 238 Q 200 256 220 238" fill="none" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />;
};

export const Mascot: React.FC<{
  eyes?: Eyes; mouth?: Mouth; bow?: number; armUp?: boolean; holdCuke?: boolean; walk?: number;
}> = ({ eyes = "open", mouth = "smile", bow = 0, armUp = false, holdCuke = false, walk = 0 }) => {
  const legSwing = walk ? Math.sin(walk * Math.PI * 2) * 10 : 0;
  return (
    <svg viewBox="-100 0 600 560" style={{ display: "block", width: "100%", height: "100%" }}>
      {/* legs + shoes (outside the bow group) */}
      <g transform={`rotate(${legSwing} 178 470)`}><rect x="166" y="462" width="24" height="72" rx="11" fill="#333a4d" /><ellipse cx="176" cy="540" rx="21" ry="11" fill="#5a3b2a" stroke={INK} strokeWidth="4" /></g>
      <g transform={`rotate(${-legSwing} 222 470)`}><rect x="210" y="462" width="24" height="72" rx="11" fill="#333a4d" /><ellipse cx="224" cy="540" rx="21" ry="11" fill="#5a3b2a" stroke={INK} strokeWidth="4" /></g>
      {/* upper body bows around the hips */}
      <g transform={`rotate(${bow} 200 478)`}>
        {/* left arm */}
        <g transform="rotate(7 118 320)"><rect x="104" y="308" width="27" height="122" rx="13" fill="#274b8f" stroke={INK} strokeWidth="4.5" /><circle cx="118" cy="436" r="13" fill="#ffd9b8" stroke={INK} strokeWidth="4" /></g>
        {/* right arm (can raise) */}
        <g transform={armUp ? "rotate(-138 282 320)" : "rotate(-7 282 320)"}>
          <rect x="269" y="308" width="27" height="122" rx="13" fill="#274b8f" stroke={INK} strokeWidth="4.5" />
          <circle cx="283" cy="436" r="13" fill="#ffd9b8" stroke={INK} strokeWidth="4" />
          {holdCuke ? <g transform="translate(268 428) rotate(-10)"><Cucumber size={88} /></g> : null}
        </g>
        {/* body */}
        <rect x="128" y="292" width="144" height="192" rx="58" fill="#274b8f" stroke={INK} strokeWidth="5" />
        <circle cx="200" cy="348" r="7.5" fill="#e8c45a" /><circle cx="200" cy="392" r="7.5" fill="#e8c45a" /><circle cx="200" cy="436" r="7.5" fill="#e8c45a" />
        {/* head */}
        <circle cx="98" cy="196" r="17" fill="#ffd9b8" stroke={INK} strokeWidth="4.5" />
        <circle cx="302" cy="196" r="17" fill="#ffd9b8" stroke={INK} strokeWidth="4.5" />
        <circle cx="200" cy="192" r="102" fill="#ffd9b8" stroke={INK} strokeWidth="5.5" />
        {/* hair cap with fringe */}
        <path d="M 99 188 A 101 101 0 0 1 301 188 L 301 158 Q 272 128 244 152 Q 228 108 198 138 Q 168 106 148 146 Q 118 122 108 158 Q 99 168 99 188 Z" fill="#2b7de0" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <ellipse cx="126" cy="232" rx="14" ry="7.5" fill="#ff9d9d" opacity="0.55" />
        <ellipse cx="274" cy="232" rx="14" ry="7.5" fill="#ff9d9d" opacity="0.55" />
        {eyes === "stern" || eyes === "side" ? <g stroke={INK} strokeWidth="6" strokeLinecap="round"><line x1="140" y1="158" x2="178" y2="166" /><line x1="260" y1="158" x2="222" y2="166" /></g> : null}
        <MascotEyes eyes={eyes} />
        <MascotMouth mouth={mouth} />
      </g>
    </svg>
  );
};

const KappaEyes: React.FC<{ eyes: Eyes }> = ({ eyes }) => {
  const one = (cx: number) => {
    if (eyes === "happy" || eyes === "closed")
      return <path d={`M ${cx - 15} 192 Q ${cx} ${eyes === "happy" ? 176 : 186} ${cx + 15} 192`} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />;
    if (eyes === "shock")
      return <g><circle cx={cx} cy="188" r="14" fill="#fff" stroke={INK} strokeWidth="5" /><circle cx={cx} cy="190" r="4.5" fill={INK} /></g>;
    if (eyes === "dizzy")
      return <path d={`M ${cx - 12} 178 L ${cx + 12} 198 M ${cx + 12} 178 L ${cx - 12} 198`} stroke={INK} strokeWidth="6" strokeLinecap="round" />;
    return <g><ellipse cx={cx} cy="188" rx="10.5" ry="15" fill={INK} /><circle cx={cx - 3} cy="182" r="3.4" fill="#fff" /></g>;
  };
  return (
    <g>
      {eyes === "stern" ? <g stroke={INK} strokeWidth="6.5" strokeLinecap="round"><line x1="146" y1="158" x2="182" y2="170" /><line x1="254" y1="158" x2="218" y2="170" /></g> : null}
      {one(164)}{one(236)}
    </g>
  );
};

export const Kappa: React.FC<{
  eyes?: Eyes; dish?: number; bow?: number; sumo?: number; beakOpen?: boolean;
}> = ({ eyes = "open", dish = 1, bow = 0, sumo = 0, beakOpen = false }) => {
  // sumo: 0 idle, 1 left leg raised, 2 right leg raised (stomp swap)
  const spread = sumo ? 16 : 0;
  return (
    <svg viewBox="-100 0 600 560" style={{ display: "block", width: "100%", height: "100%" }}>
      {/* legs */}
      {sumo === 1 ? (
        <g><rect x="150" y="440" width="26" height="60" rx="12" fill="#57a639" stroke={INK} strokeWidth="4.5" transform="rotate(-38 163 460)" />
        <ellipse cx="128" cy="428" rx="20" ry="10" fill="#57a639" stroke={INK} strokeWidth="4" /></g>
      ) : (
        <g><rect x="156" y="462" width="26" height="66" rx="12" fill="#57a639" stroke={INK} strokeWidth="4.5" transform={`translate(${-spread} 0)`} />
        <ellipse cx={166 - spread} cy="536" rx="22" ry="10" fill="#57a639" stroke={INK} strokeWidth="4" /></g>
      )}
      {sumo === 2 ? (
        <g><rect x="224" y="440" width="26" height="60" rx="12" fill="#57a639" stroke={INK} strokeWidth="4.5" transform="rotate(38 237 460)" />
        <ellipse cx="272" cy="428" rx="20" ry="10" fill="#57a639" stroke={INK} strokeWidth="4" /></g>
      ) : (
        <g><rect x="218" y="462" width="26" height="66" rx="12" fill="#57a639" stroke={INK} strokeWidth="4.5" transform={`translate(${spread} 0)`} />
        <ellipse cx={234 + spread} cy="536" rx="22" ry="10" fill="#57a639" stroke={INK} strokeWidth="4" /></g>
      )}
      <g transform={`rotate(${bow} 200 478)`}>
        {/* shell behind body */}
        <ellipse cx="200" cy="382" rx="108" ry="104" fill="#7a5a34" stroke={INK} strokeWidth="5" />
        <ellipse cx="200" cy="382" rx="88" ry="86" fill="#8f6b3e" />
        {/* arms */}
        <g transform="rotate(9 108 330)"><rect x="94" y="318" width="26" height="112" rx="13" fill="#57a639" stroke={INK} strokeWidth="4.5" /><circle cx="108" cy="436" r="12" fill="#63b245" stroke={INK} strokeWidth="4" /></g>
        <g transform="rotate(-9 292 330)"><rect x="280" y="318" width="26" height="112" rx="13" fill="#57a639" stroke={INK} strokeWidth="4.5" /><circle cx="293" cy="436" r="12" fill="#63b245" stroke={INK} strokeWidth="4" /></g>
        {/* body */}
        <ellipse cx="200" cy="388" rx="86" ry="94" fill="#57a639" stroke={INK} strokeWidth="5" />
        <ellipse cx="200" cy="408" rx="54" ry="60" fill="#a8d97c" stroke={INK} strokeWidth="3.5" />
        {/* head */}
        <circle cx="200" cy="182" r="96" fill="#63b245" stroke={INK} strokeWidth="5.5" />
        {/* sara dish */}
        <ellipse cx="200" cy="94" rx="60" ry="17" fill="#e8e4da" stroke={INK} strokeWidth="5" />
        <ellipse cx="200" cy="93" rx="47" ry="11.5" fill={dish > 0.05 ? "#9fd8ef" : "#c9ced4"} stroke={INK} strokeWidth="3" />
        {dish > 0.05 ? <ellipse cx="186" cy="90" rx="14" ry="3.6" fill="#d8f2fc" opacity="0.9" /> : null}
        <ellipse cx="128" cy="224" rx="13" ry="7" fill="#3e8f2f" opacity="0.5" />
        <ellipse cx="272" cy="224" rx="13" ry="7" fill="#3e8f2f" opacity="0.5" />
        <KappaEyes eyes={eyes} />
        {/* beak */}
        <path d={beakOpen ? "M 176 218 Q 200 208 224 218 Q 222 244 200 250 Q 178 244 176 218 Z" : "M 178 220 Q 200 212 222 220 Q 219 238 200 241 Q 181 238 178 220 Z"}
          fill="#f2b13c" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
};
