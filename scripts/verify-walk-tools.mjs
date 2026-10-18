import assert from 'node:assert/strict';
import fs from 'node:fs';
import {movement,sprintMultiplier,nearestWalkPoint,walkStep} from '../src/datacenter/navigation.js';
import {ayothayaMap} from '../src/datacenter/ayothaya-map.js';
import {worldStep,portalAt,decodeNavigation,cityCanStand} from '../src/datacenter/ayothaya-navigation.js';
import {capitalStep} from '../src/datacenter/sirin-navigation.js';
for(let n=1;n<=20;n++){const w=movement(1,1,.7,.05),r=movement(1,1,.7,.05,true,n);assert(Math.abs(Math.hypot(r.dx,r.dz)/Math.hypot(w.dx,w.dz)-n)<1e-10);}
assert.equal(sprintMultiplier(99),20);assert.equal(sprintMultiplier(-5),1);for(const v of [NaN,null,'',undefined,'bad'])assert.equal(sprintMultiplier(v),3);
for(const area of ['city','capital','lobby','museum','datacenter']){const map=ayothayaMap(area);for(const [x,z]of [[0,0],[12,-20],[-39,5]]){const p=map.point(x,z),q=map.unpoint(p.x,p.y);assert(Math.abs(q.x-x)<1e-10&&Math.abs(q.z-z)<1e-10);}}
assert.deepEqual(nearestWalkPoint(2,3,()=>true),{x:2,z:3});assert.equal(nearestWalkPoint(NaN,1,()=>true),null);assert.equal(nearestWalkPoint(0,0,()=>false,2),null);const q=nearestWalkPoint(0,0,(x,z)=>x>2&&Math.abs(z)<1);assert(q.x>2&&Math.abs(q.z)<1);
const wall=[{minX:.5,maxX:.55,minZ:-10,maxZ:10}];assert(walkStep({x:0,z:0},1.8,0,wall,{width:20,depth:20}).x<.5);
const nav=decodeNavigation(JSON.parse(fs.readFileSync('web/assets/ayothaya/navigation.json'))),p=worldStep('city',nav,{x:25.5,z:-4},3.6,0,(x,z)=>!!portalAt('city',x,z));assert.equal(portalAt('city',p.x,p.z),'capital');assert(cityCanStand(nav,p.x,p.z));
const cn=JSON.parse(fs.readFileSync('web/assets/sirin/navigation.json')),c=capitalStep(cn,{x:-167,z:0},-6,0,(x,z)=>!!portalAt('capital',x,z));assert.equal(portalAt('capital',c.x,c.z),'city');
for(let i=0;i<30;i++)assert.deepEqual(capitalStep(cn,c,-3.6,0,(x,z)=>!!portalAt('capital',x,z)),c,'waiting for warp cooldown cannot advance past the trigger');
console.log('PASS 1–20x movement, normalization/clamps, map inverses in five areas, safe destination search, thin-wall collision and swept high-speed portal entry.');
