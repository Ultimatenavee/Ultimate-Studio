import fs from 'node:fs';
import assert from 'node:assert/strict';
import {lifeDirection,habitatFits,advanceLifeState} from '../src/datacenter/ragnarok-life.js';
import {capitalCanStand} from '../src/datacenter/sirin-navigation.js';
import {researchNavigation} from '../src/datacenter/sirin-research-quarter.js';
const root='web/assets/ragnarok-life/',manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));
const nav=researchNavigation(JSON.parse(fs.readFileSync('web/assets/sirin/ground-navigation.json')),JSON.parse(fs.readFileSync('web/assets/sirin/labs/layout.json')));
assert.equal(manifest.capital.length,50);assert.equal(Object.keys(manifest.assets).length,11);
for(const [id,m]of Object.entries(manifest.assets)){
 const png=fs.readFileSync(root+m.image);assert.equal(png.readUInt32BE(16),m.width*m.columns);assert.equal(png.readUInt32BE(20),m.height*m.rows);
 assert(m.anchor.every(Number.isFinite));assert(m.bodyHeight>0&&m.anchor[0]>0&&m.anchor[0]<1);
 for(const clips of Object.values(m.actions)){assert.equal(clips.length,8);for(const c of clips){assert(c.frames.length>0);assert(c.frameMs>=25);assert(c.frames.every(f=>Number.isInteger(f)&&f>=0&&f<m.frames));}}
 if(m.kind==='monster'){assert(m.source.includes('몬스터'));assert.equal(m.actions.walk.length,8);assert(m.frames>30,'original monster motion, not one still pose');}
}
assert.equal(lifeDirection(0,0),0);assert.equal(lifeDirection(0,Math.PI/2),2);assert.equal(lifeDirection(0,Math.PI),4);assert.equal(lifeDirection(0,-Math.PI/2),6);
for(const eps of [-.03,.03,-.02,.02])assert.equal(lifeDirection(0,Math.PI/8+eps,0),0,'no direction jitter near a boundary');
assert.equal(lifeDirection(0,Math.PI/8+.15,0),1,'switch after hysteresis threshold');
const triangles=[[[0,0],[2,0],[0,2]],[[2,0],[2,2],[0,2]]];assert(habitatFits(triangles,1,1,.5));assert(!habitatFits(triangles,.1,.1,.3));
for(const [index,p]of manifest.capital.entries()){
 assert(capitalCanStand(nav,p.x,p.z,.15),'original spawn clear of updated buildings: '+p.name);
 if(!p.habitat)continue;
 const state={...p,homeX:p.x,homeZ:p.z,radius:p.height*.28,roam:true,elapsed:0,seed:index,retryAt:0,target:null};let walked=0;
 for(let i=0;i<7200;i++){const old={x:state.x,z:state.z};advanceLifeState(state,1/60,(x,z,r)=>capitalCanStand(nav,x,z,r));if(state.moving){walked++;assert(capitalCanStand(nav,state.x,state.z,state.radius));assert(habitatFits(p.habitat,state.x,state.z,state.radius),'stay wholly on assigned grass');assert(Math.hypot(state.x-old.x,state.z-old.z)<=.42/60+1e-9);}assert(Math.hypot(state.x-p.x,state.z-p.z)<=1.31,'bounded park territory');}
 assert(walked>100,'monster actually wanders '+p.name);
}
console.log('PASS 50 valid occupants, original directional ACT atlases/timing, stable anchors, view hysteresis, and two minutes of bounded grass-only roaming without crossing buildings.');
