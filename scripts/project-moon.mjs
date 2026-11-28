import * as THREE from "three";
import { camAt, SHOTS, MOON_DIR } from "../src/videos/moon/story.ts";
const W = 1280, H = 720;
const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 1500);
const v = new THREE.Vector3();
function proj(shotId, f, p, label) {
  const c = camAt(shotId, f);
  cam.position.set(...c.pos); cam.fov = c.fov; cam.updateProjectionMatrix();
  cam.lookAt(...c.look); cam.updateMatrixWorld();
  v.set(p[0], p[1], p[2]).project(cam);
  const inside = Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 ? "IN " : "OUT";
  console.log(`S${shotId} f${f} ${label.padEnd(18)} ndc(${v.x.toFixed(2)}, ${v.y.toFixed(2)}) ${inside}`);
}
const moonPt = (shotId, f) => {
  const c = camAt(shotId, f);
  const d = new THREE.Vector3(...MOON_DIR[shotId]).normalize();
  return [c.pos[0] + d.x * 100, c.pos[1] + d.y * 100, c.pos[2] + d.z * 100];
};
proj(1, 100, [0, 1.0, 0.8], "car");
proj(1, 100, [-0.62, 1.9, 0.8], "mascot head");
proj(1, 100, moonPt(1, 100), "MOON");
proj(2, 450, [0, 1.25, 0.8], "cabin");
proj(2, 450, [-0.62, 1.9, 0.8], "mascot head");
proj(3, 620, [-1.2, 3.4, -7.5], "hero tree top");
proj(3, 620, [0, 1.0, 0.8], "car");
proj(3, 850, [-30, 6, -85], "mountains");
proj(3, 850, moonPt(3, 850), "MOON");
proj(4, 1300, [0, 1.0, 0.8], "car");
proj(4, 1300, moonPt(4, 1300), "MOON");
proj(4, 1300, [7.5, 7.6, -26], "label 384.400");
proj(4, 1450, [-6.5, 1.6, 0.8], "ghost car point");
proj(5, 1700, moonPt(5, 1700), "MOON");
proj(5, 1700, [0, 1.0, 0.8], "car");
proj(7, 2700, [0, 1.0, 0.8], "car");
proj(7, 2700, moonPt(7, 2700), "MOON");
proj(4, 1450, [-5.2, 1.6, 0.8], "ghost car point v2");
proj(7, 2850, moonPt(7, 2850), "MOON end");
proj(7, 2700, moonPt(7, 2700), "MOON mid v2");
