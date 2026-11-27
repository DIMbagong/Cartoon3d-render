// Continuous render benchmark / segment renderer.
// usage: CHROME_PATH=<chrome> REMOTION_TMP=<dir> GL_MODE=swangle node scripts/render.mjs <from> <to> <scale> <out.mp4> [concurrency]
import fs from "node:fs";
if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.TMPDIR = process.env.REMOTION_TMP;
}
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import path from "node:path";
const [from, to, scale, out, conc = "1"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_PATH;
const chromiumOptions = { gl: process.env.GL_MODE || "swangle" };
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.tsx"),
  publicDir: path.resolve("public"),
});
const composition = await selectComposition({ serveUrl, id: process.env.COMP_ID || "BridgeShort", browserExecutable, chromiumOptions });
// WARM-UP FIX (2026-11-27): the first 2 frames of every fresh render job come
// out as plain background (three.js scene not drawn yet) — proven by the full
// QA scan of run 45996443627 (20 blue frames, 2 at the head of each segment).
// Render 2 frames earlier than the segment start, then drop the first 2
// frames of the output, so every kept frame is real scene content.
// Segment 0 starts at frame 0, so it renders [0..to] and still drops its
// first 2 frames: the assembled video therefore starts at composition
// frame 2 (total 2023 frames instead of 2025; first 67 ms of the opening
// wide shot are sacrificed as warm-up).
const fromN = Number(from);
const toN = Number(to);
const renderFrom = Math.max(0, fromN - 2);
const rawOut = out.replace(/\.mp4$/i, ".raw.mp4");
const t0 = Date.now();
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: rawOut,
  frameRange: [renderFrom, toN],
  scale: Number(scale),
  browserExecutable,
  chromiumOptions,
  concurrency: Number(conc),
  timeoutInMilliseconds: 240000,
  onProgress: ({ renderedFrames }) => {
    if (renderedFrames % 15 === 0) {
      const s = (Date.now() - t0) / 1000;
      console.log(`frames ${renderedFrames} elapsed ${s.toFixed(0)}s fps ${(renderedFrames / s).toFixed(2)}`);
    }
  },
});
execFileSync(
  "ffmpeg",
  ["-y", "-v", "error", "-i", rawOut, "-vf", "trim=start_frame=2,setpts=PTS-STARTPTS", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", out],
  { stdio: "inherit" }
);
fs.rmSync(rawOut, { force: true });
const kept = toN - fromN + 1 - (fromN === 0 ? 2 : 0);
const s = (Date.now() - t0) / 1000;
console.log(`DONE ${kept} frames kept (rendered ${renderFrom}-${toN}, dropped first 2) in ${s.toFixed(0)}s`);
