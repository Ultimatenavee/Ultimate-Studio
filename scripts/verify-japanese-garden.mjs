import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {buildJapaneseGarden} from '../src/datacenter/japanese-garden.js';
import {GARDEN_TREES,GARDEN_PAVILION,GARDEN_BASIN} from '../src/datacenter/garden-layout.js';
import {campusBounds,campusObstacles,outdoorCeiling} from '../src/datacenter/campus-navigation.js';
import {canStand,walkStep} from '../src/datacenter/navigation.js';
import {planWalkPath} from '../src/datacenter/museum-navigation.js';
const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
try{
 const garden=buildJapaneseGarden();garden.root.updateMatrixWorld(true);const stats=garden.stats();assert.equal(GARDEN_TREES.length,6);assert(GARDEN_TREES.every(t=>t.species==='sakura'));assert.equal(stats.koi,8);assert(stats.gardenDraws<38,'batched landscape draw budget');
 for(const name of ['raked-gravel-ripples','azumaya-pavilion-roof','tsukubai-water-basin','garden-lantern-roofs','garden-lantern-foundations','garden-boulders','garden-bamboo-screen','garden-tobi-ishi-walk'])assert(garden.root.getObjectByName(name),name);
 {const foundation=garden.root.getObjectByName('garden-lantern-foundations'),feet=garden.root.getObjectByName('garden-lantern-feet'),matrix=new T.Matrix4();foundation.getMatrixAt(0,matrix);const top=new T.Box3().setFromBufferAttribute(foundation.geometry.attributes.position).applyMatrix4(matrix).max.y;feet.getMatrixAt(0,matrix);const bottom=new T.Box3().setFromBufferAttribute(feet.geometry.attributes.position).applyMatrix4(matrix).min.y;assert(Math.abs(top-bottom)<1e-6,'lantern feet rest on stone foundations');const bamboo=garden.root.getObjectByName('garden-bamboo-screen');bamboo.getMatrixAt(0,matrix);assert(new T.Box3().setFromBufferAttribute(bamboo.geometry.attributes.position).applyMatrix4(matrix).min.y<-.31,'bamboo stakes enter the pond bed instead of floating');}
 garden.root.traverse(o=>{if(o.geometry){for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v));}if(o.isInstancedMesh){const m=new T.Matrix4();for(let i=0;i<o.count;i+=Math.max(1,Math.floor(o.count/90))){o.getMatrixAt(i,m);assert(m.elements.every(Number.isFinite));}}});
 garden.quality('balanced');const koi=garden.root.getObjectByName('decorative-pond-koi'),read=()=>Array.from(koi.instanceMatrix.array);garden.update(0,true);garden.update(1000,true);const moved=read();assert.notDeepEqual(moved,Array.from(new Float32Array(moved.length)));garden.update(2000,false);assert.deepEqual(read(),moved,'Animation off freezes fish');garden.update(90000,false);garden.update(90001,true);assert(Math.max(...read().map((v,i)=>Math.abs(v-moved[i])))<.001,'resume cannot teleport to wall-clock phase');garden.update(90100,true);assert.notDeepEqual(read(),moved,'resume advances decorative fish');
 const boxes=campusObstacles(),bounds=campusBounds();for(const target of [{x:GARDEN_PAVILION.x,z:GARDEN_PAVILION.z},{x:GARDEN_BASIN.x-1.3,z:GARDEN_BASIN.z},{x:-23,z:-26}]){assert(canStand(target.x,target.z,boxes,bounds));const path=planWalkPath({x:-39,z:14},target,boxes,bounds);assert(path.length,'garden destination reachable from exit');let p={x:-39,z:14};for(const q of path){const next=walkStep(p,q.x-p.x,q.z-p.z,boxes,bounds);assert(Math.hypot(next.x-q.x,next.z-q.z)<1e-6);p=next;}}
 assert(!canStand(GARDEN_BASIN.x,GARDEN_BASIN.z,boxes,bounds),'basin collision matches model');assert.equal(outdoorCeiling(GARDEN_PAVILION.x,GARDEN_PAVILION.z),2.72);assert.equal(outdoorCeiling(0,14),100);
 let disposed=0;koi.addEventListener('dispose',()=>disposed++);garden.dispose();garden.dispose();assert.equal(disposed,1);assert.equal(garden.update(91000,true),false);
 const refs=JSON.parse(fs.readFileSync('research/japanese-garden-v89.json'));assert(refs.sources.length>=3);assert(refs.sources.every(s=>s.url.startsWith('https://')));
 console.log('PASS Japanese garden: finite batched geometry, researched elements, animation pause/resume, walkable pavilion/basin routes, solid obstacles, roof clearance and disposal. Native math only; browser/GPU appearance untested.');
}finally{globalThis.document=previous;}
