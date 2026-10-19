import fs from 'node:fs';
import assert from 'node:assert/strict';
import {lifeDirection,habitatFits,advanceLifeState,lifeCanOccupy,updateNpcFacing} from '../src/datacenter/ragnarok-life.js';
import {capitalCanStand} from '../src/datacenter/sirin-navigation.js';
import {researchNavigation} from '../src/datacenter/sirin-research-quarter.js';
const root='web/assets/ragnarok-life/',manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));
const nav=researchNavigation(JSON.parse(fs.readFileSync('web/assets/sirin/ground-navigation.json')),JSON.parse(fs.readFileSync('web/assets/sirin/labs/layout.json')));
assert.equal(manifest.capital.length,120);assert.equal(Object.keys(manifest.assets).length,36);
assert.equal(manifest.capital.filter(p=>p.rank==='mvp').length,8);
assert.equal(manifest.capital.filter(p=>p.rank==='mini').length,11);
assert.equal(new Set(manifest.capital.filter(p=>p.name.startsWith('CITY_MONSTER_')).map(p=>p.zone)).size,14);
let textureBytes=0;
for(const [id,m]of Object.entries(manifest.assets)){
 const png=fs.readFileSync(root+m.image);textureBytes+=png.length;assert.equal(png.readUInt32BE(16),m.width*m.columns);assert.equal(png.readUInt32BE(20),m.height*m.rows);assert(m.width*m.columns<=4096&&m.height*m.rows<=4096,'mobile atlas dimensions');
 assert(m.anchor.every(Number.isFinite));assert(m.bodyHeight>0&&m.anchor[0]>0&&m.anchor[0]<1);
 for(const clips of Object.values(m.actions)){assert.equal(clips.length,8);for(const c of clips){assert(c.frames.length>0);assert(c.frameMs>=25);assert(c.frames.every(f=>Number.isInteger(f)&&f>=0&&f<m.frames));}}
 if(m.kind==='monster'){assert(m.source.includes('몬스터'));if(m.rank!=='mvp')assert.equal(m.actions.walk.length,8);assert(m.frames>1,'original monster motion, not one still pose');}
}
assert(textureBytes<4*1024*1024,'bounded shared atlas downloads');
const look={heading:0,baseHeading:0,attending:false};let previousHeading=0;
for(let i=0;i<120;i++){updateNpcFacing(look,1/60,{distance:4,bearing:Math.PI});assert(Math.abs(look.heading-previousHeading)<=1.15/60+1e-9,'bounded welcoming turn');previousHeading=look.heading;}
assert(look.attending);assert(look.heading>2.2);updateNpcFacing(look,.01,{distance:11,bearing:Math.PI});assert(look.attending,'attention does not flicker at radius');
for(let i=0;i<240;i++)updateNpcFacing(look,1/60,null);assert(Math.abs(look.heading)<1e-8,'returns to road-facing pose in overview');
assert.equal(lifeDirection(0,0),0);assert.equal(lifeDirection(0,Math.PI/2),2);assert.equal(lifeDirection(0,Math.PI),4);assert.equal(lifeDirection(0,-Math.PI/2),6);
for(const eps of [-.03,.03,-.02,.02])assert.equal(lifeDirection(0,Math.PI/8+eps,0),0,'no direction jitter near a boundary');
assert.equal(lifeDirection(0,Math.PI/8+.15,0),1,'switch after hysteresis threshold');
const triangles=[[[0,0],[2,0],[0,2]],[[2,0],[2,2],[0,2]]];assert(habitatFits(triangles,1,1,.5));assert(!habitatFits(triangles,.1,.1,.3));
for(const [index,p]of manifest.capital.entries()){
 assert(capitalCanStand(nav,p.x,p.z,.15),'original spawn clear of updated buildings: '+p.name);
 if(p.facingTarget){const target=Math.atan2(p.facingTarget[0]-p.x,p.facingTarget[1]-p.z);assert(Math.cos(p.heading-target)>.999,'NPC faces assigned public approach');}
 if(!p.habitat)continue;
 const state={...p,homeX:p.x,homeZ:p.z,radius:p.radius??p.height*.28,roam:p.roam!==false,elapsed:0,seed:index,retryAt:0,target:null};let walked=0;
 for(let i=0;i<7200;i++){const old={x:state.x,z:state.z};advanceLifeState(state,1/60,(x,z,r)=>capitalCanStand(nav,x,z,r));if(state.moving){walked++;assert(lifeCanOccupy(state,state.x,state.z,(x,z,r)=>capitalCanStand(nav,x,z,r)),'clear of surfaces, furniture and buildings');assert(Math.hypot(state.x-old.x,state.z-old.z)<=.42/60+1e-9);}assert(Math.hypot(state.x-p.x,state.z-p.z)<=1.31,'bounded neighborhood territory');}
 if(p.roam===false)assert.equal(walked,0,'large bosses keep their clear landmark position');else assert(walked>100,'monster actually wanders '+p.name);
}
console.log('PASS 120 occupants / 78 monsters, 14 new neighborhood habitats, 8 MVP + 11 mini bosses, road-facing NPCs and smooth attention, original ACTs and two minutes of safe furniture/surface-aware roaming.');
