import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {createOpticalModel,opticalDimensions} from '../src/datacenter/optical-model.js';
import {opticalExhibits,opticMatches,OPTIC_FAMILIES,OPTIC_COUNTER} from '../src/datacenter/optics-layout.js';
import {buildMuseumWorld} from '../src/datacenter/museum-world.js';
const optics=JSON.parse(fs.readFileSync('src/datacenter/museum-optics.json')),authored=JSON.parse(fs.readFileSync('src/datacenter/optics-catalog.json'));
assert.deepEqual(optics,authored,'build keeps the researched catalog');assert.equal(new Set(optics.map(m=>m.id)).size,optics.length);
for(const id of ['ct','lx','sx','lr','sr','lr4','sr4','lr100','sr100'])assert(optics.some(m=>m.id==='optic-'+id),'legacy optical IDs retained');
const original=JSON.stringify(optics),shapeKinds=new Set(),layout=opticalExhibits(optics);
for(const m of optics){assert(/^https:\/\//.test(m.source));assert.equal(m.geometry.source,m.source);assert(m.sku&&m.connector&&m.reachM>0);assert(m.physical.dimensionsMm);shapeKinds.add(m.geometry.kind);const resource=createOpticalModel(m),bounds=new T.Box3().setFromObject(resource.group),size=bounds.getSize(new T.Vector3());assert([size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0));
 if(m.geometry.kind==='cable'){
  const support=resource.group.userData.cableSupport;assert.equal(support.mode,'gravity-settled-on-tray');
  assert(Math.abs((bounds.min.y+bounds.max.y)/2)<1e-8,'assembly centered for tray placement');
  let tube,heads=0,boots=0;resource.group.traverse(o=>{if(o.name==='optic-captive-'+m.form)tube=o;if(o.name==='optic-cable-head')heads++;if(o.name==='optic-strain-relief')boots++;});
  assert.equal(heads,2);assert.equal(boots,2);assert(tube,'one continuous jacket between heads');
  for(const [t,end] of [[0,0],[1,1]])assert(tube.geometry.parameters.path.getPoint(t).distanceTo(new T.Vector3(...support.boots[end]))<1e-8,'jacket connects to actual boot');
  const middle=tube.geometry.parameters.path.getPoint(.5);assert(middle.y<support.boots[0][1],'unsupported lead settles down to coil');
  assert(support.coilPoints.every(p=>Math.abs(p[1]-support.radius)<1e-8),'coil rests on the support plane');
  assert(size.y<.02,'no vertical flying coil');
 }
 if(m.geometry.kind!=='cable'){const d=opticalDimensions(m);for(const [axis,key]of [['x','width'],['y','height'],['z','depth']])assert(Math.abs(size[axis]-d[key])<1e-7,m.id+' matches manufacturer envelope');}
 const display=layout.find(d=>d.id===m.id);assert(size.x*display.exhibitScale<display.width,m.id+' fits compartment width');assert(size.z*display.exhibitScale<display.depth,m.id+' fits compartment depth');
 if(m.geometry.kind==='simplex-lc')assert.equal(m.strands,1);if(m.geometry.kind==='mpo')assert.equal(m.strands,8);resource.dispose();resource.dispose();
}
assert.deepEqual([...shapeKinds].sort(),['cable','duplex-lc','mpo','rj45','simplex-lc']);
assert.equal(new Set(layout.map(d=>d.displayFamily)).size,OPTIC_FAMILIES.length);assert(layout.every(d=>d.x>OPTIC_COUNTER.x-OPTIC_COUNTER.width/2&&d.x<OPTIC_COUNTER.x+OPTIC_COUNTER.width/2));
for(const speed of [1,10,40,100])assert(optics.some(m=>opticMatches(m,{speed:String(speed)})));
for(const reach of [10000,20000,40000,80000])assert(optics.some(m=>opticMatches(m,{reach:String(reach)})));
assert(optics.some(m=>opticMatches(m,{media:'SMF',strands:'1'})));assert(optics.some(m=>opticMatches(m,{media:'SMF',strands:'2'})));assert(optics.some(m=>opticMatches(m,{media:'MMF',strands:'2'})));
assert(!optics.some(m=>opticMatches(m,{speed:'40',media:'MMF',reach:'80000'})),'no invented 40G MMF 80km combination');assert(!optics.some(m=>opticMatches(m,{form:'DAC',media:'SMF'})));
assert(!opticMatches({category:'switch'},{speed:'10'}));assert.throws(()=>createOpticalModel({id:'missing',form:'SFP'}),/requires manufacturer/);
const prior=globalThis.document;class Surface{getContext(){return new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(t,k)=>t[k]||(()=>{})})}addEventListener(){}removeEventListener(){}set src(v){}}
globalThis.document={createElement:()=>new Surface(),createElementNS:()=>new Surface()};
try{const devices=JSON.parse(fs.readFileSync('src/datacenter/devices.json'));const world=buildMuseumWorld({models:devices,optics});const odf=world.displays.find(d=>d.zone==='fiber'&&!d.optical);assert(odf);world.page('fiber',3);assert(odf.group.visible,'optical paging leaves ODF exhibition visible');assert(!world.pickables.some(m=>m.userData.museumDeviceId==='optic-lx'),'hidden page cannot be selected');const target=world.displays.find(d=>d.optical&&d.page===3);assert(world.pickables.some(m=>m.userData.museumDeviceId===target.id),'current page is selectable');world.activate('optic-lx');assert(world.pickables.some(m=>m.userData.museumDeviceId==='optic-lx'));assert(odf.group.visible);
 assert(!world.root.getObjectByName('optics-vendor-reference'),'SFP backboard has no device photos');
 for(const family of OPTIC_FAMILIES)assert(world.pickables.some(p=>p.userData.museumAction==='optics:'+family),'family sign still opens its filter');
 let time=0;
 for(const cable of world.displays.filter(d=>d.model.geometry?.kind==='cable')){
  world.activate(cable.id);world.loadModel(cable);
  const cableObject=cable.group.children.find(o=>o.userData.cableSupport),camera=new T.PerspectiveCamera();camera.position.set(cable.x,1.65,cable.z+.12);camera.lookAt(cable.x,cable.podiumY,cable.z);
  for(let i=0;i<140;i++)world.update(camera,time+=50,true,true);
  assert.equal(world.lightingState().focusedId,cable.id);assert.equal(cable.motion.lift,.2,'DAC/AOC rises like other devices');assert.equal(cable.motion.turn,Math.PI*2,'one full rotation per approach');assert(!cable.focusRing.visible,'keep cable focus ring hidden');
  const held={...cable.motion};for(let i=0;i<20;i++)world.update(camera,time+=50,false,true);assert.deepEqual(cable.motion,held,'Animation off pauses cable presentation');
  for(let i=0;i<20;i++)world.update(camera,time+=50,true,true);assert.deepEqual(cable.motion,held,'remaining nearby does not restart a lap');
  for(let i=0;i<20;i++)world.update(camera,time+=50,true,false);assert.equal(cable.motion.lift,0,'leaving settles to tray');assert.equal(cable.motion.turn,0,'original orientation restored');
  assert.equal(cableObject.rotation.x,cable.shelfPitch,'specimen follows the sloped tray');assert(Math.abs(cableObject.position.y-cable.restY)<1e-8&&Math.abs(cableObject.position.z-cable.restZ)<1e-8,'settled cable returns to its tray pose');
 }
 world.dispose();}finally{globalThis.document=prior;}
assert.equal(JSON.stringify(optics),original,'presentation leaves specs untouched');
console.log('PASS Researched optics: '+optics.length+' cited SKUs, preserved IDs, manufacturer envelopes, five connector geometries, two-fiber vs parallel distinction, no fabricated media/reach combinations, seven shared showcase compartments, independent paging and immutable data.');
