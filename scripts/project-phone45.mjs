// Framing check for the 1945 phone short: project key staging points through
// each shot's camera (phone45/story.ts camAt) and report NDC + height fraction.
import * as THREE from "three";
import { camAt, SHOTS, MASCOT_AT, PEJUANG_AT, PORCH_AT, DAPUR_AT, PROK_AT, FLAG_AT } from "../src/videos/phone45/story.ts";

const W = 720, H = 1280;
const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
const v = new THREE.Vector3();
function proj(shotId, f, p, label) {
  const c = camAt(shotId, f);
  cam.position.set(...c.pos);
  cam.fov = c.fov;
  cam.updateProjectionMatrix();
  cam.lookAt(...c.look);
  cam.updateMatrixWorld();
  v.set(p[0], p[1], p[2]).project(cam);
  const dist = cam.position.distanceTo(new THREE.Vector3(...p));
  const hFrac = (2 * Math.atan(0.75 / dist)) / (2 * Math.atan(THREE.MathUtils.degToRad(c.fov) / 2));
  const inside = Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 ? "IN " : "OUT";
  console.log(`shot ${shotId} f${f} ${label.padEnd(22)} ndc(${v.x.toFixed(2)}, ${v.y.toFixed(2)}) dist ${dist.toFixed(1)}m hFrac ${hFrac.toFixed(2)} ${inside}`);
}
proj(1, 100, [0, 1.2, 0], "mascot");
proj(1, 100, [0.45, 1.1, 0], "phone");
proj(1, 100, [0, 3.7, -3], "label 100%");
proj(1, 100, [-4.6, 1.2, -3.4], "warga L");
proj(1, 100, [0, 1.2, -13.2], "prok house");
proj(2, 600, [0, 1.2, 0], "mascot");
proj(2, 600, [PEJUANG_AT[0], 1.2, PEJUANG_AT[2]], "pejuang");
proj(2, 600, [-4.4, 1.2, 0.8], "crowd L");
proj(2, 600, [4.8, 1.2, 1.8], "crowd R");
proj(3, 900, [0, 1.2, 0], "mascot");
proj(3, 900, [0.45, 2.0, 0], "phone high");
proj(4, 1200, [0, 1.2, 0], "mascot lead");
proj(4, 1200, [0.9, 1.2, -5.7], "squad tail");
proj(4, 1200, [0.42, 0.1, -4.3], "light pool");
proj(5, 1450, [-0.85, 1.3, -6], "mascot sit");
proj(5, 1450, [0.95, 1.3, -6], "pejuang sit");
proj(5, 1450, [0, 2.45, -6], "label 58%");
proj(6, 1750, [DAPUR_AT[0] + 1.7, 1.2, DAPUR_AT[2] + 1.2], "mascot dapur");
proj(6, 1750, [DAPUR_AT[0], 0.9, DAPUR_AT[2]], "pots");
proj(6, 1750, [-6.8, 1.2, -2.4], "warga dapur");
proj(7, 1980, [0, 1.2, 0], "mascot");
proj(7, 1980, [0, 3.0, -1.5], "label 25%");
proj(8, 2130, [-0.85, 1.3, -6], "mascot sit");
proj(8, 2130, [0.95, 1.3, -6], "pejuang sit");
proj(9, 2400, [0, 2.0, -13.2], "reader");
proj(9, 2400, [2.6, 1.2, -3.5], "mascot photo"); proj(9, 2600, [2.6, 1.3, -3.5], "mascot close L11"); proj(9, 2600, [2.6, 2.13, -3.5], "phone raised");
proj(9, 2400, [FLAG_AT[0] + 1.17, 4.75, FLAG_AT[2]], "flag");
proj(9, 2400, [-5.2, 1.2, -8.8], "crowd far L");
proj(9, 2400, [-3.6, 3.8, -7], "label 1%");
proj(10, 2900, [0, 1.2, 0], "mascot");
proj(10, 2900, [4.4, 1.2, -1.8], "crowd R");
proj(10, 3050, [0, 1.2, -2], "mascot wide");
for (const s of SHOTS) console.log(`shot ${s.id}: f${s.a}-${s.b} ${s.light}`);
