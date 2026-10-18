import assert from 'node:assert/strict';
import * as T from 'three';
import {buildBuddhaHall} from '../src/datacenter/buddha-hall.js';
const hall=buildBuddhaHall(),root=hall.root;root.updateMatrixWorld(true);
let draws=0,triangles=0,bytes=0;const resources=new Set(),textures=new Set();
for(const name of ['vairocana-daibutsu','flanking-bodhisattva-west','flanking-bodhisattva-east']){
 const g=root.getObjectByName(name);assert(g);const b=new T.Box3().setFromObject(g);assert(b.min.y>=.7499,'altar rests on the existing floor');assert(b.max.y<6.9,'sculpture stays in the altar/roof volume');
 const curls=g.getObjectByName('bronze-hair-curls');assert.equal(curls.count,483);const seen=new Set(),m=new T.Matrix4();for(let i=0;i<curls.count;i++){curls.getMatrixAt(i,m);assert(m.elements.every(Number.isFinite));const v=new T.Vector3().setFromMatrixPosition(m);seen.add(v.toArray().map(n=>n.toFixed(5)).join(','));}assert.equal(seen.size,483,'individual curl instances never overlap at duplicate positions');
}
const central=root.getObjectByName('vairocana-daibutsu');assert(central.getObjectByName('raised-right-hand'));assert(central.getObjectByName('open-left-hand'));
root.traverse(o=>{if(!o.isMesh)return;draws++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);resources.add(o.geometry);resources.add(o.material);assert(o.geometry.attributes.position.array.every(Number.isFinite));assert(o.geometry.attributes.normal.array.every(Number.isFinite));assert(o.geometry.attributes.uv&&o.geometry.attributes.color);for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;bytes+=o.geometry.index?.array.byteLength||0;if(o.material.bumpMap){assert(o.material.bumpMap.isDataTexture,'surface grain is generated, no reference photos');textures.add(o.material.bumpMap);}});
assert(draws<=28,'batching keeps draw calls below the former 31');assert(triangles<410000,'geometry detail stays bounded');assert(bytes<24000000,'indexed render buffers avoid large non-indexed copies');
const calls=new Map();for(const resource of [...resources,...textures]){calls.set(resource,0);resource.addEventListener('dispose',()=>calls.set(resource,calls.get(resource)+1));}hall.dispose();hall.dispose();assert([...calls.values()].every(n=>n===1),'each render resource disposed once, including procedural textures');
console.log(`PASS Buddha sculpt: three bounded altars, 483 unique curls each, finite textured/native geometry, ${draws} draws / ${triangles} triangles / ${(bytes/1048576).toFixed(1)} MiB render buffers, idempotent disposal.`);
