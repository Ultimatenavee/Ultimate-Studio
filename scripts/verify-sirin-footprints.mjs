import fs from 'node:fs';
import assert from 'node:assert/strict';
import {capitalCanStand,capitalStep} from '../src/datacenter/sirin-navigation.js';
import {ayothayaMap} from '../src/datacenter/ayothaya-map.js';
const nav=JSON.parse(fs.readFileSync('web/assets/sirin/ground-navigation.json'));
assert.equal(nav.footprints.length,nav.colliders.length);
const old={...nav,footprints:undefined};
// The open paved corner beside the Verus lab in the user's reference image.
for(const [x,z]of [[96,-50],[96,-60],[90,-62],[86,-62],[50,-90],[94,-94]]){
 assert(!capitalCanStand(old,x,z),'reproduce old envelope blockage');
 assert(capitalCanStand(nav,x,z),'open lab perimeter '+[x,z]);
}
let p={x:96,z:-44};p=capitalStep(nav,p,0,-18);assert.equal(p.x,96);assert(Math.abs(p.z+62)<.001);
p=capitalStep(nav,p,-10,0);assert(Math.abs(p.x-86)<.001,'walk around the concave corner');
for(const [x,z]of [[73,-73],[-73,-72],[0,0],[-75,-141]])assert(!capitalCanStand(nav,x,z),'actual building remains solid');
p=capitalStep(nav,{x:73,z:-40},0,-40);assert(p.z>-50,'high-speed motion cannot cross lab wall');
assert(!capitalCanStand(nav,180,0));
const map=ayothayaMap('capital',nav.colliders.map((b,i)=>({minX:b[0],maxX:b[1],minZ:b[2],maxZ:b[3],polygons:nav.footprints[i].polygons})));
assert(map.svg.includes('<polygon points='),'minimap follows the actual outline');
assert(!/NaN|undefined/.test(map.svg));
console.log('PASS formerly blocked lab corners, continuous walking, solid buildings, sprint collision and accurate minimap outlines.');
