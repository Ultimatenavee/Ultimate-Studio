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
 assert.equal(w.stats().imageExhibits,89);const sources=new Set();
 for(const d of w.displays){assert(d.preview?.isMesh&&!d.preview.isSprite,d.id);assert.equal(d.preview.userData.imageId,d.model.id);sources.add(d.preview.material.map.source);assert(d.preview.scale.x<=d.width);w.loadModel(d);}
 const d=w.displays[0];w.activate(d.id);camera.position.set(d.x,1.5,d.z+1.8);camera.lookAt(d.x,d.podiumY+.2,d.z);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);const target=d.hit.getWorldPosition(new T.Vector3()).project(camera),cursor=new T.Vector2(target.x,target.y);w.update(camera,10000,true,true,cursor);for(let i=1;i<=45;i++)w.update(camera,10000+i*40,true,true,cursor);assert(d.motion.lift>.18,'hover lifts the image');assert(d.motion.turn>.1,'hover rotates the image');assert.equal(d.preview.position.y,d.podiumY+.04+d.motion.lift);const idle=w.displays.find(r=>r!==d);assert.equal(idle.motion.lift,0,'unpointed devices stay at rest');for(let i=1;i<=25;i++)w.update(camera,12000+i*40,true,true,new T.Vector2(9,9));assert.equal(d.motion.lift,0,'leaving the pointer settles equipment');assert.equal(d.motion.turn,0);const q=d.preview.quaternion.clone();camera.rotation.y+=.3;w.update(camera,14000,true,true,new T.Vector2(9,9));assert(d.preview.quaternion.equals(q),'camera rotation cannot turn fixed equipment');assert.equal(sources.size,1,'all device cards share one atlas source');assert.equal(w.stats().loaded,0,'explicit focus cannot populate hallway with models');
 for(const quality of ['low','performance','balanced','high','ultra']){w.quality(quality);for(const d of w.displays){w.activate(d.id);camera.position.set(d.x,1.5,d.z+1.2);camera.lookAt(d.x,d.podiumY,d.z);w.update(camera,performance.now()+5000,true,true,new T.Vector2());}assert.equal(w.stats().loaded,0);assert.equal(w.stats().refinementPending,0);w.root.traverse(o=>{if(o.isLight)assert(!o.castShadow);assert(!o.isRectAreaLight);});}
 assert.equal(JSON.stringify({models,optics}),before,'equipment specifications and identity remain untouched');w.dispose();w.dispose();
 console.log('PASS hybrid laboratory: 89 atlas sprites, original catalogue identity, all pages/quality presets/focus remain model-free, no gallery shadow or area-light passes, safe disposal.');
}finally{globalThis.document=prior;}
