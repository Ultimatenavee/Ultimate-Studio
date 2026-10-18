// Parse the exact new shipped neural assets, rather than testing the removed
// procedural head/hand object names. Anatomy is reviewed in Blender renders.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const metrics={};
for(const kind of(process.argv.includes('--detail-only')?['detail']:['detail','walking'])){
 const data=await fs.readFile(`${process.env.BUDDHA_ASSET_DIR||'assets-source/sculpt/neural-v109'}/buddha-${kind}.glb`);
 assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(8),data.length);
 const json=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));assert(json.asset.generator.includes('Blender'));assert(json.buffers.every(b=>!b.uri));assert(!(json.images||[]).some(i=>i.uri));
 const root=(await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'')).scene;root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());assert(Math.abs(bounds.min.y)<.001);assert(Math.abs(size.y-5.6)<.001);assert(size.x>3.3&&size.x<3.5);assert(size.z>3.2&&size.z<3.4);
 let triangles=0,draws=0,revision=false;root.traverse(o=>{if(!o.isMesh)return;draws++;const g=o.geometry;for(const a of Object.values(g.attributes))assert(a.array.every(Number.isFinite));assert(g.attributes.normal&&g.attributes.color);triangles+=(g.index?.count||g.attributes.position.count)/3;assert(o.material.isMeshStandardMaterial&&o.material.vertexColors);assert(Math.abs(o.material.metalness-.64)<.001);assert(Math.abs(o.material.roughness-.4)<.001);if(o.userData.revision===109&&o.userData.construction?.includes('Hunyuan3D-2 neural mesh'))revision=true;});
 assert(revision,'actual new neural geometry and provenance, not the old procedural mesh');
 for(const y of[1.6,3.2,4.5])for(const direction of[-1,1]){const hits=new T.Raycaster(new T.Vector3(0,y,10*direction),new T.Vector3(0,0,-direction)).intersectObject(root,true);assert(hits.length,'base/lap, body and head must have actual front and back surfaces');assert(hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld).z*direction>0,'front/back culling and normal orientation');}
 assert.equal(draws,1);assert.equal(triangles,kind==='detail'?620000:140000);assert(data.length<(kind==='detail'?21000000:5000000));metrics[kind]={triangles,draws,MiB:+(data.length/1048576).toFixed(2)};
}
if(metrics.walking)assert(metrics.walking.triangles<metrics.detail.triangles*.25);console.log('PASS actual new neural Blender GLBs:',JSON.stringify(metrics));
