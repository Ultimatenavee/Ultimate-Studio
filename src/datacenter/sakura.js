import * as T from 'three';
import {instancePartition} from './spatial-instances.js';

// Yoshino/Akebono-inspired late-bloom cherry, researched before modelling.
// Each distant flower is an alpha-cut, fixed 3D surface on a woody twig; nearby
// flowers add cupped native petal geometry and pedicels. No camera-facing tree sprites.
// Botanical references and deliberate scale/LOD adaptations: research/sakura-v91.json.
const FULL_BLOSSOMS = 32000;
const FULL_NATIVE = 1400;
const FULL_LEAVES = 360;
const BUDGETS = {
  low: [6500, 65, 1.65, 0],
  performance: [10000, 100, 1.42, 0],
  balanced: [22000, 220, 1.10, 500],
  high: [28000, 300, 1.03, 900],
  ultra: [FULL_BLOSSOMS, FULL_LEAVES, 1, FULL_NATIVE]
};
const UP = new T.Vector3(0, 1, 0);

function blossomGeometry() {
  const positions = [], colors = [];
  function triangle(a, b, c, ca, cb = ca, cc = ca) {
    for (const [v, color] of [[a, ca], [b, cb], [c, cc]]) {
      positions.push(...v);
      colors.push(...color);
    }
  }
  const inner = [.95, .57, .66], edge = [1, .96, .96], middle = [1, .83, .88];
  const polar = (r, a, z) => [Math.cos(a) * r, Math.sin(a) * r, z];
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    const base = polar(.105, a, 1.89), left = polar(.64, a - .38, 1.88);
    const leftTip = polar(.98, a - .14, 1.99), notch = polar(.86, a, 1.995);
    const rightTip = polar(.98, a + .14, 1.99), right = polar(.64, a + .38, 1.88);
    triangle(base, left, leftTip, inner, middle, edge);
    triangle(base, leftTip, notch, inner, edge, edge);
    triangle(base, notch, rightTip, inner, edge, edge);
    triangle(base, rightTip, right, inner, edge, middle);
    // Pink receptacle and fine golden stamens remain real geometry at close range.
    triangle([0, 0, 1.905], polar(.17, a, 1.915), polar(.17, a + Math.PI * 2 / 5, 1.915), inner);
    triangle(polar(.12, a, 1.92), polar(.30, a - .035, 2), polar(.30, a + .035, 2), [.88, .64, .24]);
  }
  // The origin is the twig attachment. A slender three-sided pedicel joins the cup.
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3, b = (i + 1) * Math.PI * 2 / 3;
    const p = polar(.027, a, 0), q = polar(.027, b, 0);
    const r = polar(.038, a, 1.85), s = polar(.038, b, 1.85);
    triangle(p, q, r, [.32, .42, .22]);
    triangle(q, s, r, [.32, .42, .22]);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  g.userData = {petals: 5, notched: true, cupped: true, pedicel: true};
  return g;
}

function emergingLeafGeometry() {
  const positions = [], colors = [];
  const edge = [];
  // Alternating teeth on an ovate blade; leaf base at x=0, acuminate tip at x=1.
  for (let i = 0; i <= 12; i++) {
    const x = i / 12, w = Math.sin(Math.PI * x) * .30 * (i % 2 ? .86 : 1);
    edge.push([x, w, .10 * Math.sin(Math.PI * x)]);
  }
  for (let i = 12; i >= 0; i--) {
    const x = i / 12, w = Math.sin(Math.PI * x) * -.30 * (i % 2 ? .86 : 1);
    edge.push([x, w, .10 * Math.sin(Math.PI * x)]);
  }
  const center = [.44, 0, .15];
  for (let i = 0; i < edge.length - 1; i++) {
    for (const p of [center, edge[i], edge[i + 1]]) {
      positions.push(...p);
      const light = .70 + p[0] * .30;
      colors.push(light, light, light);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

export function createSakuraTrees(treePositions = []) {
  const root = new T.Group();
  root.name = 'campus-sakura-grove';
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const geo = g => (geometries.add(g), g), mat = m => (materials.add(m), m);
  let seed = 910031, disposed = false, currentQuality = 'balanced';
  let previous = null, last = -Infinity, animationTime = 0;
  const rnd = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
  const range = (a, b) => a + (b - a) * rnd();
  const temp = new T.Object3D(), matrix = new T.Matrix4(), color = new T.Color();
  const branches = [], plants = [], wind = {value: 0}, density = {value: 1.15};

  // A local DataTexture keeps offline loading deterministic and does not require DOM canvas.
  const barkPixels = new Uint8Array(128 * 256 * 4);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4;
    const grain = Math.sin(x * .24 + Math.sin(y * .035) * 2) * 8 + rnd() * 12;
    const row = y % 19;
    const lenticel = row < 2 && Math.sin(x * .16 + Math.floor(y / 19) * 4.7) > .05;
    barkPixels[i] = 107 + grain + (lenticel ? 54 : 0);
    barkPixels[i + 1] = 78 + grain + (lenticel ? 49 : 0);
    barkPixels[i + 2] = 70 + grain + (lenticel ? 42 : 0);
    barkPixels[i + 3] = 255;
  }
  const bark = new T.DataTexture(barkPixels, 128, 256);
  bark.colorSpace = T.SRGBColorSpace;
  bark.wrapS = bark.wrapT = T.RepeatWrapping;
  bark.magFilter = T.LinearFilter;
  bark.minFilter = T.LinearMipmapLinearFilter;
  bark.generateMipmaps = true;
  bark.needsUpdate = true;
  textures.add(bark);
  // An analytically painted individual blossom: five notched petals, blush at the
  // receptacle and fine golden stamens. Alpha testing preserves correct depth and
  // shadows without blending/sorting. The plane is fixed to its twig, not the camera.
  const blossomPixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const index = (y * 128 + x) * 4, px = (x + .5 - 64) / 64, py = (y + .5 - 64) / 64;
    const radius = Math.hypot(px, py), angle = Math.atan2(py, px);
    let inside = radius < .15, coverage = inside ? 1 : 0;
    for (let petal = 0; petal < 5; petal++) {
      const a = petal * Math.PI * 2 / 5, u = px * Math.cos(a) + py * Math.sin(a), v = -px * Math.sin(a) + py * Math.cos(a);
      if (u <= .055 || u >= .985) continue;
      const t = (u - .055) / .93, width = Math.pow(Math.sin(t * Math.PI), .62) * .34;
      const notch = u > .855 + Math.abs(v) * 1.1;
      if (Math.abs(v) < width && !notch) {inside = true; coverage = Math.max(coverage, Math.min(1, (width - Math.abs(v)) * 170));}
    }
    if (!inside) continue;
    const blush = Math.max(0, 1 - radius * 1.6), vein = Math.max(0, Math.sin(angle * 20 + radius * 5)) * blush * 8;
    blossomPixels[index] = 255;
    blossomPixels[index + 1] = 247 - blush * 74 - vein;
    blossomPixels[index + 2] = 249 - blush * 50;
    // Narrow radial anthers are visible on the individual surface at close range.
    if (radius > .11 && radius < .32 && Math.abs(Math.sin(angle * 9)) < .10) {
      blossomPixels[index] = 226; blossomPixels[index + 1] = 178; blossomPixels[index + 2] = 68;
    }
    blossomPixels[index + 3] = coverage * 255;
  }
  const blossomTexture = new T.DataTexture(blossomPixels, 128, 128);
  blossomTexture.colorSpace = T.SRGBColorSpace;
  blossomTexture.magFilter = T.LinearFilter;
  blossomTexture.minFilter = T.LinearMipmapLinearFilter;
  blossomTexture.generateMipmaps = true;
  blossomTexture.needsUpdate = true;
  textures.add(blossomTexture);
  const woodMaterial = mat(new T.MeshStandardMaterial({color: 0xa1847b, map: bark, bumpMap: bark, bumpScale: .0017, roughness: .80}));
  const cardMaterial = mat(new T.MeshStandardMaterial({color: 0xffffff, map: blossomTexture, alphaTest: .36, transparent: false, depthWrite: true, side: T.DoubleSide, roughness: .78}));
  const flowerMaterial = mat(new T.MeshStandardMaterial({color: 0xffffff, vertexColors: true, side: T.DoubleSide, roughness: .76, metalness: 0}));
  const leafMaterial = mat(new T.MeshStandardMaterial({color: 0xffffff, vertexColors: true, side: T.DoubleSide, roughness: .83}));
  cardMaterial.forceSinglePass = flowerMaterial.forceSinglePass = leafMaterial.forceSinglePass = true;
  for (const [m, flowers] of [[cardMaterial, true], [flowerMaterial, true], [leafMaterial, false]]) {
    m.onBeforeCompile = shader => {
      shader.uniforms.sakuraTime = wind;
      shader.uniforms.sakuraDensity = density;
      shader.vertexShader = 'uniform float sakuraTime;\nuniform float sakuraDensity;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  float phase=instanceMatrix[3].x*.63+instanceMatrix[3].z*.47;
  ${flowers ? 'transformed.xy*=sakuraDensity;' : ''}
  float attachment=${flowers ? 'clamp(position.z/2.,0.,1.)' : 'position.x'};
  transformed.z+=sin(sakuraTime*1.05+phase+position.x)*${flowers ? '.15' : '.055'}*attachment*attachment;
#endif`);
    };
    m.customProgramCacheKey = () => m === cardMaterial ? 'uts-sakura-alpha-cut-flower-v1' : flowers ? 'uts-sakura-cupped-flower-v1' : 'uts-sakura-serrate-leaf-v1';
  }

  function branch(a, b, radius, tint) {
    const direction = b.clone().sub(a), length = direction.length();
    if (length < .0001) return;
    temp.position.copy(a).add(b).multiplyScalar(.5);
    temp.quaternion.setFromUnitVectors(UP, direction.divideScalar(length));
    temp.scale.set(radius, length, radius);
    temp.updateMatrix();
    branches.push({matrix: temp.matrix.clone(), tint: tint ?? range(.84, 1.14)});
  }
  function curvedBranch(a, b, radius, rise = .08, segments = 3) {
    let lastPoint = a;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments, point = a.clone().lerp(b, t);
      point.y += Math.sin(t * Math.PI) * rise;
      branch(lastPoint, point, radius * (1 - t * .55));
      lastPoint = point;
    }
  }
  function twig(plant, a, b) {
    const direction = b.clone().sub(a), length = direction.length();
    if (length < .01) return;
    curvedBranch(a, b, .0055, .018, 2);
    plant.twigs.push({start: a.clone(), direction: direction.normalize(), length});
  }

  for (const [index, input] of treePositions.entries()) {
    if (!Number.isFinite(input.x) || !Number.isFinite(input.z)) continue;
    // Seed each tree by position, so a neighbouring planting does not change its form.
    seed = (910031 ^ Math.round(input.x * 997) ^ Math.round(input.z * 1543)) >>> 0;
    const height = Number.isFinite(input.height) ? Math.max(1, input.height) : 5.25 + range(0, .85);
    const radius = Number.isFinite(input.radius) ? Math.max(.55, input.radius) : 2.35 + range(0, .35);
    const base = Number.isFinite(input.base) ? input.base : .02;
    const p = {x: input.x, z: input.z, height, radius, base, phase: range(0, Math.PI * 2), twigs: [], scaffold: [], seed, index};
    p.branchStart=branches.length;plants.push(p);
    const trunk = [];
    for (let i = 0; i <= 7; i++) {
      const u = i / 7;
      trunk.push(new T.Vector3(p.x + Math.sin(u * 2.4 + p.phase) * .23 * u, base + height * .70 * u, p.z + Math.cos(u * 3 + p.phase) * .17 * u));
      if (i) branch(trunk[i - 1], trunk[i], .19 * Math.pow(.79, i - 1));
    }
    for (let i = 0; i < 5; i++) {
      const a = p.phase + i * 1.2566;
      branch(new T.Vector3(p.x + Math.cos(a) * .33, base - .018, p.z + Math.sin(a) * .33), trunk[1], .047);
    }
    // Tiered, asymmetric limbs give a spreading crown rather than a conical Christmas tree.
    for (let limb = 0; limb < 8; limb++) {
      const angle = p.phase + limb * 2.399963, lower = limb < 3;
      const start = trunk[lower ? 3 : 4 + limb % 2];
      const reach = radius * (lower ? range(.64, .78) : range(.52, .75));
      const tip = new T.Vector3(p.x + Math.cos(angle) * reach, base + height * (lower ? range(.58, .66) : range(.74, .83)), p.z + Math.sin(angle) * reach);
      curvedBranch(start, tip, lower ? .069 : .054, height * .045, 4);
      p.scaffold.push(tip, start.clone().lerp(tip, .65));
      for (let fork = 0; fork < 5; fork++) {
        const u = .28 + fork * .16, a = angle + (fork % 2 ? 1 : -1) * range(.47, 1.05);
        const from = start.clone().lerp(tip, u), extension = radius * range(.25, .42);
        const end = from.clone().add(new T.Vector3(Math.cos(a) * extension, height * range(.055, .16), Math.sin(a) * extension));
        curvedBranch(from, end, .018 + (1 - u) * .006, .07, 3);
        p.scaffold.push(end);
        for (let shoot = 0; shoot < 4; shoot++) {
          const theta = a + (shoot - 1.5) * .55, attach = from.clone().lerp(end, .33 + shoot * .21);
          const reach = radius * range(.12, .21), top = attach.clone().add(new T.Vector3(Math.cos(theta) * reach, height * range(.008, .067), Math.sin(theta) * reach));
          twig(p, attach, top);
        }
      }
    }
    // Soft upper crown and interior sprays stop the canopy becoming a hollow outer ring.
    for (let i = 0; i < 12; i++) {
      const angle = p.phase + i * 2.399963, start = trunk[5 + i % 3];
      const tip = start.clone().add(new T.Vector3(Math.cos(angle) * radius * range(.21, .45), height * range(.1, .22), Math.sin(angle) * radius * range(.21, .45)));
      curvedBranch(start, tip, .014, .05, 3);
      for (let j = 0; j < 3; j++) {
        const a = angle + (j - 1) * .9;
        twig(p, start.clone().lerp(tip, .4 + j * .3), tip.clone().add(new T.Vector3(Math.cos(a) * .33, range(-.04, .16), Math.sin(a) * .33)));
      }
    }
    // Interlocking fine boughs cover the broad rounded crown, including its middle.
    // Each bough grows from the nearest existing woody scaffold; there are no floating
    // random crown particles. A low-discrepancy shell avoids isolated pom-pom clumps.
    for (let i = 0; i < 150; i++) {
      const v = -.48 + 1.48 * ((i + .5) / 150), a = p.phase + i * 2.399963;
      const radial = radius * Math.sqrt(1 - v * v) * range(.84, 1.03);
      const center = new T.Vector3(p.x + Math.cos(a) * radial, base + height * (.70 + v * .25), p.z + Math.sin(a) * radial);
      let from = p.scaffold[0], nearest = Infinity;
      for (const point of p.scaffold) {const distance = point.distanceToSquared(center); if (distance < nearest) {nearest = distance; from = point;}}
      curvedBranch(from, center, .0065, .035, 2);
      for (let j = 0; j < 5; j++) {
        const theta = a + j * 2.399963, reach = range(.21, .40);
        const anchor = from.clone().lerp(center, .78 + j * .055);
        const tip = center.clone().add(new T.Vector3(Math.cos(theta) * reach, range(-.12, .20), Math.sin(theta) * reach));
        twig(p, anchor, tip);
      }
    }
    p.branchEnd=branches.length;
  }

  function batch(g, m, count, name) {
    const object = new T.InstancedMesh(g, m, count);
    object.name = name;
    object.castShadow = object.receiveShadow = true;
    root.add(object);
    return object;
  }
  // End caps are hidden inside the next fork or floral spray; omit their triangles.
  let wood = batch(geo(new T.CylinderGeometry(.72, 1, 1, 7, 1, true)), woodMaterial, branches.length, 'sakura-tapered-branches');
  branches.forEach((b, i) => {wood.setMatrixAt(i, b.matrix); wood.setColorAt(i, color.setScalar(b.tint));});
  const surfaceGeometry = geo(new T.PlaneGeometry(2, 2));
  surfaceGeometry.translate(0, 0, 1.92);
  surfaceGeometry.userData = {petals: 5, notched: true, alphaCut: true, cameraFacing: false};
  let flowers = batch(surfaceGeometry, cardMaterial, plants.length * FULL_BLOSSOMS, 'sakura-five-petal-blossoms');
  let nativeFlowers = batch(geo(blossomGeometry()), flowerMaterial, plants.length * FULL_NATIVE, 'sakura-near-detail-blossoms');
  nativeFlowers.visible = false;
  let leaves = batch(geo(emergingLeafGeometry()), leafMaterial, plants.length * FULL_LEAVES, 'sakura-emerging-serrated-leaves');
  flowers.userData.perTreeFull = FULL_BLOSSOMS;
  leaves.userData.perTreeFull = FULL_LEAVES;
  const flowerColors = [0xffd2de, 0xffe5ea, 0xf9bacd, 0xffe8ed, 0xf8c5d3, 0xffdbe4];
  const leafColors = [0x8a9456, 0x9da55b, 0xa18a55, 0x7a8b51];
  const zAxis = new T.Vector3(), xAxis = new T.Vector3(), yAxis = new T.Vector3(), lateral = new T.Vector3();
  const boundsByTree = plants.map(() => new T.Box3());

  function placeFlower(p, n, index, target = flowers) {
    // Every 3–5 nearby flowers share a spur position along the woody twig.
    const cluster = Math.floor(n / 4), member = n % 4;
    const twig = p.twigs[(cluster * 67 + Math.floor(cluster / p.twigs.length)) % p.twigs.length];
    const u = .11 + .88 * ((cluster * .61803398875) % 1), azimuth = cluster * 2.399963 + p.phase;
    lateral.crossVectors(twig.direction, UP).normalize();
    const side = member % 2 ? 1 : -1;
    temp.position.copy(twig.start).addScaledVector(twig.direction, twig.length * u);
    // Pedicels start on the twig surface and open outwards/downwards in a small corymb.
    temp.position.addScaledVector(lateral, side * .004).addScaledVector(twig.direction, (member - 1.5) * .011);
    zAxis.set(Math.cos(azimuth + member * 1.57), range(-.65, .85), Math.sin(azimuth + member * 1.57)).normalize();
    xAxis.crossVectors(UP, zAxis).normalize();
    if (xAxis.lengthSq() < .01) xAxis.set(1, 0, 0);
    yAxis.crossVectors(zAxis, xAxis).normalize();
    matrix.makeBasis(xAxis, yAxis, zAxis);
    temp.quaternion.setFromRotationMatrix(matrix);
    const scale = range(.036, .049) * (.93 + .07 * Math.sin(n * .19));
    temp.scale.set(scale, scale * range(.9, 1.1), scale);
    temp.updateMatrix();
    target.setMatrixAt(index, temp.matrix);
    target.setColorAt(index, color.setHex(flowerColors[(n + p.index) % flowerColors.length]));
    boundsByTree[p.order].expandByPoint(temp.position);
  }
  // Interleaving lets a single prefix draw reduction retain flowers on EVERY tree.
  plants.forEach((p, i) => {p.order = i; seed = p.seed; p.flowerSeed = seed;});
  for (let n = 0; n < FULL_NATIVE; n++) for (const p of plants) {
    seed = p.flowerSeed;
    placeFlower(p, n, n * plants.length + p.order, nativeFlowers);
    p.flowerSeed = seed;
  }
  for (let n = 0; n < FULL_BLOSSOMS; n++) for (const p of plants) {
    seed = p.flowerSeed;
    placeFlower(p, n + FULL_NATIVE, n * plants.length + p.order);
    p.flowerSeed = seed;
  }
  for (let n = 0; n < FULL_LEAVES; n++) for (const p of plants) {
    seed = p.flowerSeed;
    const twig = p.twigs[(n * 37) % p.twigs.length], u = .25 + .75 * ((n * .61803398875) % 1);
    temp.position.copy(twig.start).addScaledVector(twig.direction, twig.length * u);
    temp.rotation.set(-Math.PI / 2 + range(-.35, .4), p.phase + n * 2.399963, range(-.45, .45));
    const scale = range(.065, .12);
    temp.scale.set(scale, scale * range(.8, 1.15), scale);
    temp.updateMatrix();
    const i = n * plants.length + p.order;
    leaves.setMatrixAt(i, temp.matrix);
    leaves.setColorAt(i, color.setHex(leafColors[n % leafColors.length]));
    p.flowerSeed = seed;
  }
  // Soft contact darkening is a single shared draw, never an opaque circular canopy.
  const shadowPixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = (y * 64 + x) * 4, r = Math.hypot(x - 31.5, y - 31.5) / 32;
    shadowPixels[i] = 20; shadowPixels[i + 1] = 25; shadowPixels[i + 2] = 20;
    shadowPixels[i + 3] = Math.max(0, 1 - r) ** 1.8 * 75;
  }
  const shadowTexture = new T.DataTexture(shadowPixels, 64, 64);
  shadowTexture.magFilter = T.LinearFilter;
  shadowTexture.needsUpdate = true;
  textures.add(shadowTexture);
  let shadows = batch(geo(new T.PlaneGeometry(1, 1)), mat(new T.MeshBasicMaterial({map: shadowTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1})), plants.length, 'sakura-ground-contact');
  shadows.castShadow = shadows.receiveShadow = false;
  plants.forEach((p, i) => {temp.position.set(p.x, p.base + .004, p.z); temp.rotation.set(-Math.PI / 2, 0, 0); temp.scale.set(p.radius * 1.6, p.radius * 1.45, 1); temp.updateMatrix(); shadows.setMatrixAt(i, temp.matrix);});
  for (const mesh of [wood, flowers, nativeFlowers, leaves, shadows]) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (mesh.count) {mesh.computeBoundingBox(); mesh.computeBoundingSphere();}
  }
  root.userData.species = 'Prunus × yedoensis (Yoshino / Akebono inspired)';
  root.userData.plantBounds = boundsByTree.map((b, i) => ({x: plants[i].x, z: plants[i].z, min: b.min.toArray(), max: b.max.toArray()}));
  // The former campus-wide bounds submitted every tree in every view. Static
  // per-tree partitions preserve the exact original samples and shared assets;
  // visibility is evaluated by Three without copying buffers during movement.
  const clusters=plants.map((p,i)=>{
    const group=new T.Group();group.name='sakura-tree-'+i;group.matrixAutoUpdate=false;group.userData.plant={x:p.x,z:p.z};
    const b=instancePartition(wood,p.branchEnd-p.branchStart,n=>p.branchStart+n),f=instancePartition(flowers,FULL_BLOSSOMS,n=>n*plants.length+i),d=instancePartition(nativeFlowers,FULL_NATIVE,n=>n*plants.length+i),l=instancePartition(leaves,FULL_LEAVES,n=>n*plants.length+i),s=instancePartition(shadows,1,()=>i);
    group.add(b,f,d,l,s);root.add(group);return {p,group,wood:b,flowers:f,detail:d,leaves:l,shadow:s};
  });
  for(const mesh of [wood,flowers,nativeFlowers,leaves,shadows]){root.remove(mesh);mesh.dispose();}
  wood=flowers=nativeFlowers=leaves=shadows=null;
  const branchSegments=branches.length;branches.length=0;for(const p of plants){p.twigs.length=0;p.scaffold.length=0;}
  function quality(value) {
    currentQuality = BUDGETS[value] ? value : 'balanced';
    const [blossoms, leafCount, scale, nativeCount] = BUDGETS[currentQuality];
    for(const c of clusters){c.flowers.count=blossoms;c.detail.count=nativeCount;if(!nativeCount)c.detail.visible=false;c.leaves.count=leafCount;}
    density.value = scale;
  }
  quality('balanced');
  return {
    root,
    quality,
    bounds: () => new T.Box3().setFromObject(root),
    stats: () => ({trees: plants.length, sakuraTrees: plants.length, blossoms: clusters.reduce((n,c)=>n+c.flowers.count,0), nearBlossoms:clusters.reduce((n,c)=>n+(c.detail.visible?c.detail.count:0),0), leaves:clusters.reduce((n,c)=>n+c.leaves.count,0), blossomPetals: 5, branchSegments, drawGroups: clusters.length*5, spatialBatches:clusters.length, quality: currentQuality, animationTime}),
    update(time, motion, camera) {
      const dt = previous === null ? 0 : Math.min(100, Math.max(0, time - previous));
      previous = time;
      if (disposed) return false;
      // Close detail belongs only to nearby trees. Both camera and shadow
      // frusta cull the remaining per-tree batches, even with animation paused.
      let detailChanged=false;
      for(const c of clusters){const near=Boolean(c.detail.count&&camera&&Math.hypot(camera.position.x-c.p.x,camera.position.z-c.p.z)<18);if(c.detail.visible!==near)detailChanged=true;c.detail.visible=near;}
      if (!motion || currentQuality === 'low' || currentQuality === 'performance') return detailChanged;
      if (camera && Math.hypot(camera.position.x + 17, camera.position.z) > 105) return detailChanged;
      animationTime += dt;
      if (time - last < 66) return detailChanged;
      last = time;
      wind.value = animationTime / 1000;
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      root.traverse(o => {if (o.isInstancedMesh) o.dispose();});
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      textures.forEach(t => t.dispose());
    }
  };
}
