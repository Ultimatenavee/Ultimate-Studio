import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodeNavigation,cityCanStand,worldStep,portalAt,CITY_SPAWN} from '../src/datacenter/ayothaya-navigation.js';
import {EAST_GATE,EAST_RETURN,CAPITAL_GATE,CAPITAL_SPAWN,CAPITAL_ROOMS,CAPITAL_RETURNS,capitalCanStand,capitalStep} from '../src/datacenter/sirin-navigation.js';
import {ayothayaMap} from '../src/datacenter/ayothaya-map.js';
const ay=decodeNavigation(JSON.parse(fs.readFileSync('web/assets/ayothaya/navigation.json'))),nav=JSON.parse(fs.readFileSync('web/assets/sirin/navigation.json'));
for(const p of [EAST_GATE,EAST_RETURN])assert(cityCanStand(ay,p.x,p.z));
let p={...EAST_RETURN};for(let n=0;n<90&&!portalAt('city',p.x,p.z);n++)p=worldStep('city',ay,p,.04,0);
assert.equal(portalAt('city',p.x,p.z),'capital');assert.equal(portalAt('city',EAST_RETURN.x,EAST_RETURN.z),null);
for(const p of [CAPITAL_GATE,CAPITAL_SPAWN,...Object.values(CAPITAL_ROOMS),...Object.values(CAPITAL_RETURNS)])assert(capitalCanStand(nav,p.x,p.z));
for(const p of [CAPITAL_SPAWN,...Object.values(CAPITAL_RETURNS)])assert.equal(portalAt('capital',p.x,p.z),null);
p={...CAPITAL_SPAWN};for(let n=0;n<300&&!portalAt('capital',p.x,p.z);n++)p=capitalStep(nav,p,-.04,0);
assert.equal(portalAt('capital',p.x,p.z),'city');
for(const [room,spawn]of Object.entries(CAPITAL_RETURNS)){p={...spawn};for(let n=0;n<160&&!portalAt('capital',p.x,p.z);n++)p=capitalStep(nav,p,0,-.04);assert.equal(portalAt('capital',p.x,p.z),room);}
// Flood-fill real walkable cells: the old town spawn reaches the east gate,
// and the new west gate reaches both building entrances without teleporting.
function reachable(start,goals,canStand,step,limit){
 const key=(x,z)=>`${x},${z}`,origin=[Math.round(start.x/step),Math.round(start.z/step)],queue=[origin],seen=new Set([key(...origin)]);
 for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,k=key(a,b);if(Math.abs(a)>limit||Math.abs(b)>limit||seen.has(k)||!canStand(a*step,b*step))continue;seen.add(k);queue.push([a,b]);}}
 for(const p of goals)assert(seen.has(key(Math.round(p.x/step),Math.round(p.z/step))),'Walkable route to '+JSON.stringify(p));
}
reachable(CITY_SPAWN,[EAST_GATE],(x,z)=>cityCanStand(ay,x,z),.25,160);
reachable(CAPITAL_SPAWN,[CAPITAL_GATE,...Object.values(CAPITAL_ROOMS)],(x,z)=>capitalCanStand(nav,x,z),.5,360);
assert(!capitalCanStand(nav,181,0));assert(!capitalCanStand(nav,0,0),'Central tower is solid');
assert(!/NaN|undefined/.test(ayothayaMap('capital').svg));
console.log('PASS real-map routes, east/west round trip, room entrances, safe arrivals, map bounds and solid buildings.');
