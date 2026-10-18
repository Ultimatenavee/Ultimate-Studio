import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {buildMuseumWorld} from '../src/datacenter/museum-world.js';
const models=JSON.parse(fs.readFileSync('src/datacenter/devices.json')),optics=JSON.parse(fs.readFileSync('src/datacenter/museum-optics.json'));
const prior=globalThis.document;class Surface{getContext(){return new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(t,k)=>t[k]||(()=>{})})}addEventListener(){}removeEventListener(){}set src(v){}}
globalThis.document={createElement:()=>new Surface(),createElementNS:()=>new Surface()};
try{
 const world=buildMuseumWorld({models,optics}),camera=new T.PerspectiveCamera(70,1338/638,.05,180);let time=0;
 for(const d of world.displays.filter(d=>d.model.geometry?.kind==='cable')){
  world.activate(d.id);world.loadModel(d);world.root.updateMatrixWorld(true);
  const asset=d.group.children.find(o=>o.userData.cableSupport),target=asset.getWorldPosition(new T.Vector3());
  camera.position.set(d.x-.65,1.65,1.8);camera.lookAt(d.x-.6,1.25,.3);camera.updateMatrixWorld(true);
  const screen=target.clone().project(camera),aim=new T.Vector2(screen.x,screen.y);
  if(d.page===0)assert.notEqual(world.nearest(camera.position)?.id,d.id,'reproduce a different device being physically nearer');
  assert.equal(world.aim(camera,aim)?.id,d.id,'pointer ray selects '+d.id+' including gaps inside its coil');
  const follow=camera.clone();follow.position.z+=3.4;follow.position.y+=.7;follow.lookAt(target);follow.updateMatrixWorld(true);
  world.update(camera,time+=50,true,true,new T.Vector2(),follow);
  assert.equal(world.lightingState().focusedId,d.id,'third-person crosshair uses the follow camera while reach uses the player');
  for(let i=0;i<140;i++)world.update(camera,time+=50,true,true,aim);
  assert.equal(world.lightingState().focusedId,d.id,'cursor overrides proximity hysteresis');assert.equal(d.motion.lift,.2);assert.equal(d.motion.turn,Math.PI*2);
  assert.equal(world.aim(camera,aim)?.id,d.id,'raised/rotating model retains stable hover target');
  const hold={...d.motion};for(let i=0;i<20;i++)world.update(camera,time+=50,false,true,aim);assert.deepEqual(d.motion,hold,'Animation off freezes pointer-triggered motion');
  for(let i=0;i<20;i++)world.update(camera,time+=50,true,false,aim);assert.equal(d.motion.lift,0);assert.equal(d.motion.turn,0);
  camera.lookAt(target);camera.updateMatrixWorld(true);assert.equal(world.aim(camera,new T.Vector2())?.id,d.id,'locked center crosshair selects the same device');
 }
 for(const d of world.displays.filter(d=>d.optical&&d.page===0&&d.shelfRow===1)){
  world.activate(d.id);world.loadModel(d);world.root.updateMatrixWorld(true);const asset=d.group.children.find(o=>o.userData.detailed),target=asset.getWorldPosition(new T.Vector3());camera.position.set(d.x,1.65,1.8);camera.lookAt(target);camera.updateMatrixWorld(true);
  assert.equal(world.aim(camera,new T.Vector2())?.id,d.id,'all seven tilted rear slots are targetable from the aisle');
  assert.equal(asset.rotation.x,Math.PI/4,'real model, not just its tray, tilts toward the user');
  // Actual model heads are visible: labels, front tray and retaining lip cannot block them.
  const geometry=[];world.root.traverse(o=>{if(o.isMesh&&o.material.visible!==false&&!o.material.transparent)geometry.push(o);});
  const shells=[];asset.traverse(o=>{if(o.name==='optic-metal-shell')shells.push(o);});
  for(const shell of shells){const point=shell.getWorldPosition(new T.Vector3()),ray=new T.Raycaster(camera.position,point.clone().sub(camera.position).normalize(),0,camera.position.distanceTo(point)-.001),blocked=ray.intersectObjects(geometry,false).filter(hit=>{for(let p=hit.object;p;p=p.parent)if(p===d.group||p===world.roof||!p.visible)return false;return true;});assert(!blocked.length,'rear module head is visible from the aisle: '+d.id+(blocked[0]?' blocked by '+blocked[0].object.name:''));}

 }
 world.dispose();
}finally{globalThis.document=prior;}
console.log('PASS Museum cursor/crosshair targeting overrides a closer neighboring device; all six cable variants rise, rotate, pause, settle and keep stable targets; all seven rear slots face forward at45 degrees.');
