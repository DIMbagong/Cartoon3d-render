// Stills for pure-2D compositions. usage: node scripts/anime-stills.mjs <CompId> <outPrefix> <f,f,...>
import fs from "node:fs";
fs.mkdirSync(process.env.TMPDIR || "/tmp", { recursive: true });
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [compId, prefix, frames] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.tsx"), publicDir: path.resolve("public") });
const composition = await selectComposition({
  serveUrl, id: compId,
  browserExecutable: process.env.CHROME_PATH,
  chromiumOptions: { gl: "swangle" },
});
for (const f of frames.split(",").map(Number)) {
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: 0.5 });
  console.log("still", f);
}
