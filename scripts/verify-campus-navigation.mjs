import assert from 'node:assert/strict';
import fs from 'node:fs';
import {campusBounds,campusObstacles,groundHeight} from '../src/datacenter/campus-navigation.js';
import {buildingAt} from '../src/datacenter/campus-layout.js';
import {canStand,walkStep} from '../src/datacenter/navigation.js';
import {museumObstacles,exhibitionLayout} from '../src/datacenter/museum-layout.js';
import {planWalkPath} from '../src/datacenter/museum-navigation.js';
const models=JSON.parse(fs.readFileSync('src/datacenter/devices.json')),optics=JSON.parse(fs.readFileSync('src/datacenter/museum-optics.json'));
const boxes=[...campusObstacles(),...museumObstacles(exhibitionLayout(models,optics))],bounds=campusBounds();
for(const [x,insideZ,outsideZ]of [[0,8,14],[-39,9.5,14]]){
 const outside=walkStep({x,z:insideZ},0,outsideZ-insideZ,boxes,bounds);assert(Math.abs(outside.z-outsideZ)<1e-6,'walk through the visible garden door');
 const inside=walkStep(outside,0,insideZ-outsideZ,boxes,bounds);assert(Math.abs(inside.z-insideZ)<1e-6,'same door permits returning indoors');
}
for(const [start,dx,dz]of [[{x:7,z:9},0,4],[{x:8,z:3},3,0],[{x:-42,z:0},-3,0],[{x:-42,z:11},0,4]]){
 const p=walkStep(start,dx,dz,boxes,bounds);assert(Math.hypot(p.x-start.x,p.z-start.z)<2,'glass wall blocks walking/tunneling');
}
assert(!canStand(0,23,boxes,bounds),'pond is solid navigation boundary');assert(canStand(19,0,boxes,bounds),'former side water is walkable lawn');assert(canStand(-32,-22,boxes,bounds),'former rear water is walkable lawn');assert(!canStand(-17,-21,boxes,bounds),'raked stone garden remains protected');
assert(canStand(-33,24,boxes,bounds),'deck bridges water');assert(!canStand(-36,22,boxes,bounds),'outdoor table is solid');assert(!canStand(-43,17,boxes,bounds),'tree trunk is solid');
const bridge=walkStep({x:-32,z:16},0,13.5,boxes,bounds);assert(Math.abs(bridge.z-29.5)<1e-6,'deck reaches outer promenade without invisible water blocker');
for(const target of [{x:0,z:14},{x:-39,z:14},{x:-32,z:30},{x:11,z:-14},{x:-45,z:-14},{x:19,z:0},{x:-32,z:-22}]){
 const route=planWalkPath({x:-39,z:9.5},target,boxes,bounds);assert(route.length,'continuous exterior route to '+JSON.stringify(target));let p={x:-39,z:9.5};
 for(const q of route){const next=walkStep(p,q.x-p.x,q.z-p.z,boxes,bounds);assert(Math.hypot(next.x-q.x,next.z-q.z)<1e-5,'path uses actual collision-safe movement');p=next;}
}
assert.equal(buildingAt(0,8),'datacenter');assert.equal(buildingAt(-39,9.5),'museum');assert.equal(buildingAt(-39,14),'outdoor');
assert.equal(groundHeight(0,8),0);assert.equal(groundHeight(-33,24),-.02);assert.equal(groundHeight(0,14),-.07);
for(const p of [{x:-52.8,z:0},{x:26.8,z:0},{x:-35,z:-32.8},{x:-17,z:33.8}])assert(!canStand(p.x,p.z,boxes,bounds),'all four visible fence sides stop movement');
assert(!canStand(28,0,boxes,bounds),'campus boundary remains finite');
console.log('PASS Outdoor walking: both doors and return trips, glass collision, deck/pond/furniture/tree boundaries, connected promenade routes, safe ground heights and finite campus extent.');
