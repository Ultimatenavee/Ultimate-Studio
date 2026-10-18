import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {buildMuseumWorld} from '../src/datacenter/museum-world.js';
const models=JSON.parse(fs.readFileSync('src/datacenter/devices.json')),optics=JSON.parse(fs.readFileSync('src/datacenter/museum-optics.json')),manifest=JSON.parse(fs.readFileSync('src/datacenter/museum-sprites.json'));
const before=JSON.stringify({models,optics});for(const m of [...models,...optics]){const f=manifest.frames[m.id];assert(f&&f.width>0&&f.height>0);assert(f.x+f.width<=manifest.width&&f.y+f.height<=manifest.height);}
const prior=globalThis.document;class Surface{getContext(){return new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(t,k)=>t[k]||(()=>{})})}addEventListener(){}removeEventListener(){}set src(v){}}
globalThis.document={createElement:()=>new Surface(),createElementNS:()=>new Surface()};
try{
 const w=buildMuseumWorld({models,optics,indoorOnly:true}),camera=new T.PerspectiveCamera(70,1.7,.05,180);w.root.updateMatrixWorld(true);
 assert.equal(w.stats().imageExhibits,0);assert.equal(w.stats().presentation,'models');
 const active=()=>w.displays.filter(d=>d.group.visible);
 const asset=d=>d.group.children.find(o=>o.userData.museumModel);
 const assertSolid=d=>{const a=asset(d);assert(a,d.id+' has a real 3D model');assert(!d.preview,'no flat equipment pictures');const size=new T.Box3().setFromObject(a).getSize(new T.Vector3());assert(size.x>0&&size.y>0&&size.z>0,d.id+' has three physical dimensions');assert.equal(a.userData.detailed,false,'walkthrough keeps lightweight geometry');};
 active().forEach(assertSolid);assert.equal(w.stats().loaded,active().length);
 const d=w.displays[0];w.activate(d.id);camera.position.set(d.x,1.5,d.z+1.8);camera.lookAt(d.x,d.podiumY+.2,d.z);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);const target=d.hit.getWorldPosition(new T.Vector3()).project(camera),cursor=new T.Vector2(target.x,target.y);w.update(camera,10000,true,true,cursor);for(let i=1;i<=45;i++)w.update(camera,10000+i*40,true,true,cursor);assert(d.motion.lift>.18,'hover lifts the whole 3D device');assert(d.motion.turn>.1,'hover rotates the whole device');assert.equal(asset(d).position.y,d.restY+d.motion.lift);const idle=w.displays.find(r=>r!==d);assert.equal(idle.motion.lift,0,'unpointed devices stay at rest');for(let i=1;i<=25;i++)w.update(camera,12000+i*40,true,true,new T.Vector2(9,9));assert.equal(d.motion.lift,0,'leaving pointer settles equipment');assert.equal(d.motion.turn,0);const q=asset(d).quaternion.clone();camera.rotation.y+=.3;w.update(camera,14000,true,true,new T.Vector2(9,9));assert(asset(d).quaternion.equals(q),'camera rotation cannot turn fixed equipment');
 for(const quality of ['low','performance','balanced','high','ultra']){w.quality(quality);for(const d of w.displays){w.activate(d.id);assertSolid(d);}assert.equal(w.stats().loaded,active().length,'hidden pages release their geometry');assert(w.stats().loaded<60,'bounded active-page population');assert.equal(w.stats().refinementPending,0);w.root.traverse(o=>{if(o.isLight)assert(!o.castShadow);assert(!o.isRectAreaLight);});}
 const decor=[];w.root.traverse(o=>{if(o.userData.imageId==='ro:verus-monitor')decor.push(o);});assert.equal(decor.length,2);const turns=decor.map(o=>o.quaternion.clone());camera.rotation.y+=1;w.update(camera,15000,true,true,new T.Vector2(9,9));decor.forEach((o,i)=>assert(o.quaternion.equals(turns[i]),'front-facing monitors stay fixed'));
 assert.equal(JSON.stringify({models,optics}),before,'equipment specifications and identity remain untouched');w.dispose();w.dispose();
 console.log('PASS laboratory: all active devices have 3D volume, hover/settle and fixed orientation preserved, hidden pages disposed, lightweight geometry in all quality modes, no gallery shadows/area lights, safe disposal.');
}finally{globalThis.document=prior;}
