import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {buildCampusExterior} from '../src/datacenter/campus-exterior.js';
import {CAMPUS_LAWNS,CAMPUS_TREES} from '../src/datacenter/campus-layout.js';
import {CAMPUS_GROUND_Y} from '../src/datacenter/campus-terrain.js';
import {pixelRatioBudget} from '../src/datacenter/render-budget.js';
const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(t,k)=>t[k]||(()=>{})})})};
try{
 const campus=buildCampusExterior(),root=campus.root;root.updateMatrixWorld(true);const ground=root.getObjectByName('campus-ground'),lawn=root.getObjectByName('garden-walkable-lawn');assert(ground&&!ground.isInstancedMesh);assert.equal(ground.receiveShadow,false,'large background turf retains its original inexpensive lighting');assert.equal(lawn.geometry.type,'PlaneGeometry','no coplanar slab top remains');
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);let samples=0;
 for(const p of CAMPUS_LAWNS)for(let i=0;i<11;i++)for(let j=0;j<9;j++){
  // Irrational offsets avoid shared triangle edges; every former water sample must
  // hit ONE grass surface, not two equal-depth faces with different colors.
  const x=p.x-p.width/2+p.width*(i+.381)/11,z=p.z-p.depth/2+p.depth*(j+.277)/9;ray.set(new T.Vector3(x,2,z),down);
  assert.equal(ray.intersectObject(ground,false).length,0,'base ground has a real hole under the lawn');const hits=ray.intersectObject(lawn,false);assert.equal(hits.length,1,'exactly one visible lawn plane');assert(Math.abs(hits[0].point.y-CAMPUS_GROUND_Y)<1e-6);samples++;
 }
 // Step across each seam: there is one surface on either side without cracks or offsets.
 for(const p of CAMPUS_LAWNS)for(const dx of [-.002,.002]){ray.set(new T.Vector3(p.x-p.width/2+dx,2,p.z+.371),down);const hits=ray.intersectObjects([ground,lawn],false);assert.equal(hits.length,1);assert(Math.abs(hits[0].point.y-CAMPUS_GROUND_Y)<1e-6);}
 const grove=root.getObjectByName('campus-sakura-grove'),trees=grove.children;assert.equal(trees.length,CAMPUS_TREES.length+1);assert(trees.every(t=>t.children.length===5));const f=trees.map(t=>t.getObjectByName('sakura-five-petal-blossoms'));assert(f.every(m=>m.count===22000),'same dense 22k balanced blossoms per tree');assert(f.every(m=>m.geometry===f[0].geometry&&m.material===f[0].material),'spatial partitions share geometry, textures and shader');assert.equal(new Set(f.map(m=>m.material.map)).size,1);
 const versions=trees.flatMap(t=>t.children.map(m=>[m,m.instanceMatrix.version]));const count=(cam,all=false)=>{cam.updateMatrixWorld(true);const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));let total=0;for(const t of trees)for(const m of t.children){if(!m.visible)continue;if(all||frustum.intersectsObject(m))total+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3*m.count;}return total;};
 const cases=[{name:'temple courtyard',eye:[-18,1.65,-15],target:[-18,4,-43.5]},{name:'rack toward garden',eye:[0,1.65,8],target:[0,2,20]},{name:'side lawn',eye:[20,1.65,0],target:[17,3,-14]}],results=[];
 for(const test of cases){const c=new T.PerspectiveCamera(60,16/9,.05,180);c.position.set(...test.eye);c.lookAt(...test.target);campus.update(100,false,c);const full=count(c,true),visible=count(c);assert(visible>0&&visible<full*.6,'off-screen tree work removed in '+test.name);results.push({view:test.name,wholeGrove:full,submitted:visible,reductionPercent:Math.round((1-visible/full)*100)});}
 const overview=new T.PerspectiveCamera(60,16/9,.05,400);overview.position.set(-17,110,130);overview.lookAt(-17,2,0);campus.update(200,false,overview);assert.equal(count(overview),count(overview,true),'whole-campus view retains every tree at unchanged quality');
 const shadow=new T.OrthographicCamera(-11,11,11,-11,.1,30);shadow.position.set(2,12,5);shadow.lookAt(0,0,0);assert(count(shadow)<count(shadow,true)*.2,'shadow pass also avoids drawing the whole grove');
 for(let i=0;i<20;i++){const c=new T.PerspectiveCamera(60,1,.05,180);c.position.set(i-10,1.65,14);c.lookAt(-18,4,-43.5);campus.update(300+i*100,true,c);}for(const [m,v]of versions)assert.equal(m.instanceMatrix.version,v,'walking/animation does not re-pack or upload static instance buffers');
 for(const q of ['balanced','high','ultra'])for(const size of [[390,844],[1920,1080],[3840,2160]])assert.equal(pixelRatioBudget(q,...size,1),1,'native sharpness remains intact');
 const scene=fs.readFileSync('src/datacenter/scene.js','utf8');assert(scene.includes('renderer.shadowMap.autoUpdate=false'),'startup avoids repeated static shadow passes');
 campus.dispose();console.log('PASS Garden fix: '+samples+' single-surface lawn samples and flush seams; full blossom counts/textures retained, static buffers unchanged during motion, shadow culling and unchanged resolution. Native submission estimates, not measured GPU FPS:',JSON.stringify(results));
}finally{globalThis.document=old;}
