// Structural/geometry QA of the actual shipped GLBs using Three's GLTFLoader.
// Node stubs only image decode; PNG payload integrity is checked separately.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:128,height:128,close(){}});
const metrics={};
for(const kind of (process.argv.includes('--detail-only')?['detail']:['detail','walking'])){
 const data=await fs.readFile(`${process.env.BUDDHA_ASSET_DIR||'web/assets/sculpt'}/buddha-${kind}.glb`);assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(8),data.length);
 const json=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));assert(json.asset.generator.includes('Blender'),'real Blender-authored export');assert(!(json.images||[]).some(i=>i.uri),'normal image embedded locally');assert(json.buffers.every(b=>!b.uri),'no remote dependencies');
 for(const im of (json.images||[])){const binOffset=20+data.readUInt32LE(12)+8,view=json.bufferViews[im.bufferView],png=data.subarray(binOffset+(view.byteOffset||0),binOffset+(view.byteOffset||0)+view.byteLength);assert.equal(png.subarray(1,4).toString(),'PNG');}
 const gltf=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');const root=gltf.scene;root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(root);assert(b.min.y>=-.005&&b.max.y<6.1);assert(b.max.x-b.min.x>3.8&&b.max.x-b.min.x<4.8);
 let triangles=0,draws=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;draws++;const g=o.geometry;for(const a of Object.values(g.attributes)){assert(a.array.every(Number.isFinite));bytes+=a.array.byteLength;}assert(g.attributes.normal&&g.attributes.uv&&g.attributes.color);triangles+=(g.index?.count||g.attributes.position.count)/3;assert(o.material.isMeshStandardMaterial);});
 const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});const find=s=>meshes.find(o=>o.name.includes(s));
 let authored=false;root.traverse(o=>{if(String(o.userData.revision)==='108')authored=true;});assert(authored,'the new authored mesh revision must be shipped, not the old recolored asset');
 const headSize=new T.Box3().setFromObject(find('head')).getSize(new T.Vector3()),bodySize=new T.Box3().setFromObject(find('body')).getSize(new T.Vector3());assert(headSize.x>1.2&&headSize.x<1.45,'refined oval head and attached ear silhouette');assert(bodySize.x>3.8,'separate new folded leg volumes replace the old narrow pillow');assert(find('hand-blessing').userData.wrist[0]<-1.45,'the authored hand/forearm placement is the new geometry');
 for(const name of ['head','body','hair','gold']){const o=find(name);assert(o.material.normalMap,'embedded microfinish survives glTF export');assert(o.material.normalScale.x>0&&o.material.normalScale.x<.5,'surface detail stays subtle');}
 const faceZ=(x,y)=>new T.Raycaster(new T.Vector3(x,y,2),new T.Vector3(0,0,-1)).intersectObject(find('head'))[0]?.point.z;assert(Math.abs(faceZ(-.16,4.25)-faceZ(.16,4.25))<.004,'balanced facial planes');assert(!new T.Raycaster(new T.Vector3(1.2,3.38,2),new T.Vector3(0,0,-1)).intersectObject(find('body')).length,'shoulder silhouette does not protrude above the sloping neck line');
 const field=find('field'),fieldHit=new T.Raycaster(new T.Vector3(1.4,3,2),new T.Vector3(0,0,-1)).intersectObject(field)[0];assert(fieldHit&&fieldHit.face.normal.clone().transformDirection(field.matrixWorld).z>.99,'new flat gilt backing faces the visitor');
 for(const [part,y]of [['head',4.30],['body',2.9],['body',1.2]]){const o=find(part);assert(o);const h=new T.Raycaster(new T.Vector3(0,y,2),new T.Vector3(0,0,-1)).intersectObject(o)[0];assert(h&&h.point.z>0,'solid face/chest/lap must survive sculpt fusion and front culling');assert(h.face.normal.clone().transformDirection(o.matrixWorld).z>.35);}
 for(const pose of ['blessing','cupped']){const o=find('hand-'+pose);assert(o);const {wrist,palm_normal:n,finger_direction:f}=o.userData;assert(wrist&&n&&f);const normal=new T.Vector3(...n),point=new T.Vector3(...wrist).addScaledVector(new T.Vector3(...f),.22),ray=new T.Raycaster(point.addScaledVector(normal,1),normal.clone().negate()),h=ray.intersectObject(o)[0];assert(h,'palm present at its authored anatomical location');assert(h.face.normal.clone().transformDirection(o.matrixWorld).dot(normal)>.65,'palm orientation must remain outward');assert(pose==='blessing'?n[2]>.99:n[1]>.99);}
 assert(draws<=12);assert(triangles<(kind==='detail'?750000:250000));assert(data.length<(kind==='detail'?26000000:10000000));metrics[kind]={triangles,draws,MiB:+(data.length/1048576).toFixed(2),bufferMiB:+(bytes/1048576).toFixed(2)};
}
if(metrics.walking)assert(metrics.walking.triangles<metrics.detail.triangles*.5);console.log('PASS actual Blender GLBs:',JSON.stringify(metrics));
