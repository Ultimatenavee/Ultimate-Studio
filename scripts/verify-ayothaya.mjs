import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CITY_SPAWN,CITY_RETURN,LOBBY_SPAWN,LOBBY_RETURNS,TEMPLE_GATE,portalAt,createPortalLatch,decodeNavigation,gridSample,cityCanStand,worldStep} from '../src/datacenter/ayothaya-navigation.js';
import {ayothayaMap} from '../src/datacenter/ayothaya-map.js';
import {frameBounds} from '../src/datacenter/ayothaya-camera.js';
import * as T from 'three';
import {TEMPLE_DECOR,LAB_DECOR,LAB_BENCHES,decorFootprint} from '../src/datacenter/ayothaya-decor-layout.js';
import {normalizeAyothayaBuildings} from '../src/datacenter/ayothaya-materials.js';
import {canStand} from '../src/datacenter/navigation.js';
const nav=decodeNavigation(JSON.parse(fs.readFileSync('web/assets/ayothaya/navigation.json')));
assert.equal(nav.width,320);assert.equal(nav.height,320);
for(const p of [CITY_SPAWN,CITY_RETURN,TEMPLE_GATE])assert(cityCanStand(nav,p.x,p.z),'spawn / gate must be on actual walkable GAT cells');
// Walk all the way from spawn up the real temple approach, without teleporting or bypassing collision.
let p={...CITY_SPAWN};for(let i=0;i<1000&&!portalAt('city',p.x,p.z);i++)p=worldStep('city',nav,p,0,-.04);
assert.equal(portalAt('city',p.x,p.z),'lobby');assert(Math.abs(gridSample(nav,p.x,p.z).height-.4)<.15,'temple steps use GAT elevation');
assert.equal(portalAt('city',CITY_RETURN.x,CITY_RETURN.z),null);
for(const spawn of [LOBBY_SPAWN,...Object.values(LOBBY_RETURNS)])assert.equal(portalAt('lobby',spawn.x,spawn.z),null,'arrival must lie outside the trigger');
assert.equal(portalAt('lobby',-7.7,0),'museum');assert.equal(portalAt('lobby',7.7,0),'datacenter');assert.equal(portalAt('lobby',0,8),'city');
assert.equal(portalAt('museum',-39,10.8),'lobby');assert.equal(portalAt('datacenter',0,9),'lobby');
assert.equal(portalAt('lobby',-7.7,3),null,'side wall is not a portal');
assert.equal(portalAt('city',-39,11),null,'interior coordinates cannot trigger inside the city');
const gate=createPortalLatch();assert.equal(gate.tick(.1,'lobby',7.7,0,false),null,'overview never warps');assert(gate.begin());assert(!gate.begin(),'reentrant warp is blocked');assert.equal(gate.tick(5,'city',12,-29.45,true),null);gate.finish();assert.equal(gate.tick(.2,'city',12,-29.45,true),null);assert.equal(gate.tick(.6,'city',12,-29.45,true),'lobby');
const blocked=Array.from(nav.types).findIndex(t=>t===1),x=(blocked%nav.width-nav.width/2+.5)*nav.cell,z=(nav.height/2-Math.floor(blocked/nav.width)-.5)*nav.cell;assert(!cityCanStand(nav,x,z));
assert.equal(gridSample(nav,500,500),null);const stopped=worldStep('lobby',nav,{x:8,z:0},10,0);assert(stopped.x>=8&&stopped.x<8.25);assert.equal(stopped.z,0);
for(const area of ['city','lobby','museum','datacenter']){const map=ayothayaMap(area);assert(!/NaN|undefined/.test(map.svg));assert(map.svg.includes('campusMapPlayer'));assert.equal(map.zone(),area);}
const bytes=fs.readFileSync('web/assets/ayothaya/ayothaya.glb');assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));assert(gltf.meshes.length>100);assert(gltf.materials.filter(m=>m.alphaMode==='MASK').length>50,'roof/ropes/railings keep cutout alpha');
assert(fs.existsSync('web/assets/ayothaya/minimap.png'));
for(const aspect of [.45,1,1.7,2.5])for(const [min,max]of [[[-40,-3,-40],[40,12,40]],[[-9,0,-10],[9,5,10]],[[-43,0,-12],[-9,5.5,12]]]){
 const camera=new T.PerspectiveCamera(46,aspect,.03,600),target=new T.Vector3();frameBounds(camera,target,new T.Vector3(...min),new T.Vector3(...max));camera.updateMatrixWorld(true);
 for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]]){const projected=new T.Vector3(x,y,z).project(camera);assert(Math.abs(projected.x)<1&&Math.abs(projected.y)<1,'overview must fit the whole scene at every aspect');}
}
console.log('PASS Ayothaya: actual GAT traversal/elevation and blocked cells; all six portal directions, safe arrivals, no warp in overview, no reentry; map views and GLB alpha integrity.');

// The imported furniture must not turn the hall routes into dead ends.
for(const [start,dx,dz,target]of [[LOBBY_SPAWN,0,-.04,null],[{x:0,z:0},-.04,0,'museum'],[{x:0,z:0},.04,0,'datacenter'],[{x:0,z:0},0,.04,'city']]){
 let p={...start};for(let i=0;i<205&&!portalAt('lobby',p.x,p.z);i++)p=worldStep('lobby',nav,p,dx,dz);
 if(target)assert.equal(portalAt('lobby',p.x,p.z),target);
}
for(const prop of TEMPLE_DECOR){const p=worldStep('lobby',nav,{x:prop.x,z:prop.z+prop.width/2+1},0,-2);assert(p.z>prop.z+prop.width/2,'cannot walk into imported temple prop');}
for(const area of ['museum','datacenter']){const boxes=LAB_DECOR[area].map(decorFootprint),bounds={width:120,depth:40};for(const p of LAB_DECOR[area])assert(!canStand(p.x,p.z,boxes,bounds));}
const manifest=JSON.parse(fs.readFileSync('web/assets/ayothaya/decor/manifest.json'));
for(const [id,s]of Object.entries(manifest.sprites)){const png=fs.readFileSync('web/assets/ayothaya/decor/'+id+'.png');assert.equal(png.readUInt32BE(16),s.width*s.columns);assert.equal(png.readUInt32BE(20),s.height*s.rows);assert(s.frameMs>0&&s.frames<=s.columns*s.rows);}
for(const id of Object.keys(manifest.models)){const b=fs.readFileSync('web/assets/ayothaya/decor/'+id+'.glb');assert.equal(b.toString('ascii',0,4),'glTF');const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert(!j.images.some(i=>i.uri),'decor is self-contained');assert(j.meshes.length>0);}
console.log('PASS Ragnarok decor: unobstructed three-way hall routes, furniture collisions, original ACT atlas dimensions/timing and self-contained GLB models.');

// Collision follows rotated workbenches; service bays stay outside the main aisles.
for(const area of ['museum','datacenter']){
 const boxes=[...LAB_DECOR[area],...LAB_BENCHES[area]].map(decorFootprint),center=area==='museum'?-39:0;
 for(let z=-9;z<=9;z+=.2)assert(canStand(center,z,boxes,{width:120,depth:40}),'main lab aisle remains clear');
 for(const p of LAB_BENCHES[area])assert(!canStand(p.x,p.z,boxes,{width:120,depth:40}),'service bench blocks walking');
}
// Material correction must preserve cutouts and not alter other users of a shared material.
const root=new T.Group(),building=new T.Group();building.name='아요타야\\궁외벽04.rsm';root.add(building);
const map=new T.Texture(),source=new T.MeshStandardMaterial({map,alphaTest:.45,side:T.DoubleSide});
const roof=new T.Mesh(new T.PlaneGeometry(),source),other=new T.Mesh(new T.PlaneGeometry(),source);building.add(roof);root.add(other);
normalizeAyothayaBuildings(root);assert(roof.material.isMeshBasicMaterial);assert.equal(roof.material.alphaTest,.45);assert.equal(roof.material.map,map);assert.equal(roof.material.side,T.DoubleSide);assert.equal(other.material,source);
const avatar=JSON.parse(fs.readFileSync('web/assets/ayothaya/avatar/novice.json')),atlas=fs.readFileSync('web/assets/ayothaya/avatar/novice.png');
assert.equal(avatar.actions.length,24);assert.equal(atlas.readUInt32BE(16),avatar.width*avatar.columns);assert.equal(atlas.readUInt32BE(20),avatar.height*avatar.rows);
let end=0;for(const action of avatar.actions){assert.equal(action.start,end);assert(action.count>0&&action.frameMs>0);end+=action.count;}assert.equal(end,avatar.frames);assert(end<=avatar.columns*avatar.rows);
console.log('PASS Avatar atlas actions and dimensions; painted gatehouse cutouts/shared materials; rotated lab bench collisions and main aisles.');
