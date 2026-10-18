import assert from 'node:assert/strict';
import * as T from 'three';
import {createSakuraTrees} from '../src/datacenter/sakura.js';

const input = [{x: -4, z: 0, height: 5.8, radius: 2.5}, {x: 4, z: 0, height: 5.5, radius: 2.4, base: .32}];
const snapshot = JSON.stringify(input), model = createSakuraTrees(input);
assert.equal(JSON.stringify(input), snapshot, 'planting positions are immutable');
assert.equal(model.stats().sakuraTrees, 2);
assert.equal(model.stats().spatialBatches,2,'one cullable group per tree');assert.equal(model.stats().drawGroups,10,'five material batches per tree, shared assets');
assert.equal(model.stats().blossoms, 44000, 'full-looking balanced crown');
const find = name => model.root.getObjectByName(name);
const flowers = find('sakura-five-petal-blossoms'), detail = find('sakura-near-detail-blossoms');
const wood = find('sakura-tapered-branches'), leaves = find('sakura-emerging-serrated-leaves');
assert(flowers && detail && wood && leaves);
assert.equal(flowers.geometry.index.count / 3, 2, 'far flowers stay two triangles each');
assert.equal(flowers.geometry.userData.petals, 5);
assert.equal(flowers.geometry.userData.cameraFacing, false);
assert.equal(detail.geometry.userData.petals, 5);
assert(detail.geometry.userData.cupped && detail.geometry.userData.pedicel);
assert.equal(flowers.material.transparent, false);
assert.equal(flowers.material.depthWrite, true);
assert(flowers.material.alphaTest > .3, 'hard cut-out writes real depth, no sorting artifacts');
const texture = flowers.material.map, pixels = texture.image.data;
const alpha = (x, y) => pixels[(Math.max(0, Math.min(127, Math.floor((y + 1) * 64))) * 128 + Math.max(0, Math.min(127, Math.floor((x + 1) * 64)))) * 4 + 3];
for (let i = 0; i < 5; i++) {
  const a = i * Math.PI * 2 / 5;
  assert(alpha(Math.cos(a) * .70, Math.sin(a) * .70) > 220, 'five real petal lobes in procedural mask');
  assert(alpha(Math.cos(a) * .94, Math.sin(a) * .94) < 50, 'petal tips have cherry-blossom notches');
  assert(alpha(Math.cos(a + Math.PI / 5) * .75, Math.sin(a + Math.PI / 5) * .75) < 50, 'transparent gaps separate petals');
}
assert.equal(alpha(0, 0), 255);
assert.equal(alpha(.95, .95), 0, 'no rectangular leaf cards visible around the blossom');
assert(texture.isDataTexture && wood.material.map.isDataTexture, 'offline local textures, no image reloads');
assert.equal(wood.geometry.parameters.openEnded, true, 'hidden branch end caps do not waste triangles');
assert(model.stats().branchSegments > 4000, 'interlocking woody ramification supports full crowns');
assert(model.bounds().min.toArray().every(Number.isFinite));
assert(model.bounds().max.y > 5.5);

const matrix = new T.Matrix4(), first = new T.Matrix4();
flowers.getMatrixAt(0, first);
const baseline = first.toArray();
for (const quality of ['low', 'performance', 'balanced', 'high', 'ultra']) {
  model.quality(quality);
  for(let p=0;p<input.length;p++){
    const flower=model.root.children[p].getObjectByName('sakura-five-petal-blossoms');
    flower.getMatrixAt(0,matrix);assert(Math.abs(matrix.elements[12]-input[p].x)<4);assert(matrix.elements.every(Number.isFinite));
    flower.getMatrixAt(flower.count-1,matrix);assert(Math.abs(matrix.elements[12]-input[p].x)<4);
  }
}
model.quality('balanced');
assert.equal(model.stats().blossoms, 44000);
const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>'};
flowers.material.onBeforeCompile(shader);
assert(shader.vertexShader.includes('USE_INSTANCING'));
assert(shader.vertexShader.includes('sakuraDensity'));
const near = new T.PerspectiveCamera(); near.position.set(-4, 2, 4);
const far = new T.PerspectiveCamera(); far.position.set(80, 8, 80);
model.update(0, true, near);
assert(detail.visible && model.stats().nearBlossoms === 1000);
model.update(100, true, near);
assert.equal(shader.uniforms.sakuraTime.value, .1);
const frozen = shader.uniforms.sakuraTime.value;
model.update(5000, false, near);
assert.equal(shader.uniforms.sakuraTime.value, frozen, 'animation off freezes the wind phase');
model.update(5100, true, near);
assert.equal(shader.uniforms.sakuraTime.value, .2, 'resume does not jump through paused wall time');
model.update(5200, false, far);
assert.equal(detail.visible, false, 'near detail LOD still updates when animation is off');
flowers.getMatrixAt(0, first);
assert.deepEqual(first.toArray(), baseline, 'flowers do not turn toward a changed camera');
model.quality('low'); model.update(5300, true, near);
assert.equal(detail.visible, false);
assert.equal(shader.uniforms.sakuraTime.value, .2);

// A small alpha-aware native projection guards against regression to sparse twig lights.
// It rasterizes the actual fixed 3D flower planes with their analytical mask (no GPU).
const one = createSakuraTrees([{x: 0, z: 0, height: 5.8, radius: 2.5}]);
const oneFlowers = one.root.getObjectByName('sakura-five-petal-blossoms');
const W = 260, H = 220, camera = new T.PerspectiveCamera(36, W / H, .1, 100);
camera.position.set(8, 4.2, 10); camera.lookAt(0, 3.6, 0); camera.updateMatrixWorld();
const occupancy = new Uint8Array(W * H), geometry = oneFlowers.geometry;
const local = Array.from({length: 4}, () => new T.Vector3());
const projected = Array.from({length: 4}, () => new T.Vector3());
for (let i = 0; i < oneFlowers.count; i++) {
  oneFlowers.getMatrixAt(i, matrix);
  for (let k = 0; k < 4; k++) {
    local[k].fromBufferAttribute(geometry.attributes.position, k);
    local[k].x *= 1.10; local[k].y *= 1.10;
    projected[k].copy(local[k]).applyMatrix4(matrix).project(camera);
    projected[k].x = (projected[k].x * .5 + .5) * W;
    projected[k].y = (-projected[k].y * .5 + .5) * H;
  }
  for (let tri = 0; tri < 6; tri += 3) {
    const ids = [0, 1, 2].map(k => geometry.index.getX(tri + k)), [a, b, c] = ids.map(k => projected[k]);
    const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(d) < .00001) continue;
    const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), x1 = Math.min(W - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
    const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), y1 = Math.min(H - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (occupancy[y * W + x]) continue;
      const u = ((b.y - c.y) * (x + .5 - c.x) + (c.x - b.x) * (y + .5 - c.y)) / d;
      const v = ((c.y - a.y) * (x + .5 - c.x) + (a.x - c.x) * (y + .5 - c.y)) / d, w = 1 - u - v;
      if (u < 0 || v < 0 || w < 0) continue;
      const uv = geometry.attributes.uv;
      const tx = Math.min(127, Math.max(0, Math.floor((u * uv.getX(ids[0]) + v * uv.getX(ids[1]) + w * uv.getX(ids[2])) * 128)));
      const ty = Math.min(127, Math.max(0, Math.floor((u * uv.getY(ids[0]) + v * uv.getY(ids[1]) + w * uv.getY(ids[2])) * 128)));
      if (pixels[(ty * 128 + tx) * 4 + 3] > 92) occupancy[y * W + x] = 1;
    }
  }
}
const projectedCenter = new T.Vector3(0, 4.3, 0).project(camera);
const cx = (projectedCenter.x * .5 + .5) * W, cy = (-projectedCenter.y * .5 + .5) * H;
let covered = 0, area = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x - cx) / 64) ** 2 + ((y - cy) / 33) ** 2 <= 1) {area++; covered += occupancy[y * W + x];}
const coverage = covered / area;
assert(coverage > .58, `blossoms fill a continuous crown, observed ${(coverage * 100).toFixed(1)}% alpha occupancy`);
one.dispose();

let meshDisposals = 0, geometryDisposals = 0, textureDisposals = 0;
flowers.addEventListener('dispose', () => meshDisposals++);
flowers.geometry.addEventListener('dispose', () => geometryDisposals++);
flowers.material.map.addEventListener('dispose', () => textureDisposals++);
model.dispose(); model.dispose();
assert.equal(meshDisposals, 1); assert.equal(geometryDisposals, 1); assert.equal(textureDisposals, 1);
assert.equal(model.update(6000, true, near), false);
const empty = createSakuraTrees([]); assert.equal(empty.stats().trees, 0); empty.dispose();
console.log(`PASS Sakura: research-based five-petal alpha masks, dense crown (${(coverage * 100).toFixed(1)}% native projection coverage), fixed twig-attached 3D flowers, nearby cupped detail, shared assets with cullable per-tree draws, all-tree quality tiers, offline textures, pause-aware motion and one-time disposal.`);
