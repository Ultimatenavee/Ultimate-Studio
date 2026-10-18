import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {buildGardenSurrounds} from '../src/datacenter/garden-surrounds.js';
import {buildCampusExterior} from '../src/datacenter/campus-exterior.js';
import {CAMPUS_FENCE,CAMPUS_LAWNS,CAMPUS_POOLS,CAMPUS_TREES} from '../src/datacenter/campus-layout.js';
import {GARDEN_POCKETS} from '../src/datacenter/garden-layout.js';
import {campusObstacles,campusBounds,groundHeight} from '../src/datacenter/campus-navigation.js';
import {canStand,walkStep} from '../src/datacenter/navigation.js';
import {planWalkPath} from '../src/datacenter/museum-navigation.js';
const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(t,k)=>t[k]||(()=>{})})})};
try{
 const s=buildGardenSurrounds(),stats=s.stats();assert.equal(stats.fenceSides,4);assert.equal(stats.lawnAreas,2);assert(stats.pockets>=30);assert(stats.draws<20,'shared geometry limits decoration draw calls');s.root.updateMatrixWorld(true);
 const matrix=new T.Matrix4(),position=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3(),f=CAMPUS_FENCE,boards=s.root.getObjectByName('garden-cedar-boards'),seen=new Set();for(let i=0;i<boards.count;i++){boards.getMatrixAt(i,matrix);matrix.decompose(position,q,scale);assert(position.y-scale.y/2<0,'fence boards enter their lower rail');for(const [name,d]of [['west',Math.abs(position.x-f.minX)],['east',Math.abs(position.x-f.maxX)],['north',Math.abs(position.z-f.minZ)],['south',Math.abs(position.z-f.maxZ)]])if(d<.001)seen.add(name);}assert.equal(seen.size,4,'cedar boards wrap every outer edge');
 const turf=s.root.getObjectByName('garden-walkable-lawn');assert.equal(turf.count,2);for(let i=0;i<2;i++){turf.getMatrixAt(i,matrix);matrix.decompose(position,q,scale);assert(Math.abs(position.x-CAMPUS_LAWNS[i].x)<1e-5);assert(Math.abs(new T.Box3().setFromBufferAttribute(turf.geometry.attributes.position).applyMatrix4(matrix).max.y-groundHeight(position.x,position.z))<1e-5,'lawn surface matches walk camera ground, no retained water height');}
 for(const name of ['garden-groundcover-beds','garden-sedge-clumps','garden-flower-leaves','garden-azalea-blossoms','garden-fallen-petals'])assert(s.root.getObjectByName(name),name);
 s.root.traverse(o=>{if(o.geometry)assert(o.geometry.attributes.position.array.every(Number.isFinite));if(o.isInstancedMesh)for(let i=0;i<o.count;i+=Math.max(1,Math.floor(o.count/20))){o.getMatrixAt(i,matrix);assert(matrix.elements.every(Number.isFinite));}});
 const grass=s.root.getObjectByName('garden-lawn-grass'),full=grass.userData.fullCount;s.quality('low');assert(grass.count<full/4);s.quality('ultra');assert.equal(grass.count,full);
 const obstacles=campusObstacles(),bounds=campusBounds();for(const target of [{x:19,z:0},{x:-32,z:-22}]){assert(canStand(target.x,target.z,obstacles,bounds),'former water surface is traversable');const path=planWalkPath({x:-39,z:14},target,obstacles,bounds);assert(path.length);let p={x:-39,z:14};for(const q of path){const next=walkStep(p,q.x-p.x,q.z-p.z,obstacles,bounds);assert(Math.hypot(next.x-q.x,next.z-q.z)<1e-5);p=next;}}
 assert.equal(CAMPUS_POOLS.length,1);assert.deepEqual(CAMPUS_POOLS[0],{x:-17,z:23,width:54,depth:10});assert(!canStand(-17,23,obstacles,bounds),'retained koi pond stays solid');for(const p of GARDEN_POCKETS)assert(!((p.x>-43&&p.x<9)&&Math.abs(p.z)<12),'planting pockets remain outside work areas');
 const campus=buildCampusExterior();assert(campus.root.getObjectByName('japanese-timber-temple'));assert(campus.root.getObjectByName('campus-sakura-grove'));assert(!campus.root.getObjectByName('campus-pavilion-glass'));assert(!campus.root.getObjectByName('campus-shrub-leaves'),'perimeter hedge removed');assert.equal(campus.stats().trees,CAMPUS_TREES.length+1);let pond=0;campus.root.traverse(o=>{if(o.name==='campus-reflecting-pool')pond++});assert.equal(pond,1);campus.dispose();
 let disposed=0;boards.addEventListener('dispose',()=>disposed++);s.dispose();s.dispose();assert.equal(disposed,1);
 assert(JSON.parse(fs.readFileSync('research/garden-v91.json')).sources.length>=1);
 console.log('PASS Sakura garden integration: four cedar fence sides, two flush walkable lawns with real routes, koi pond preserved, 32 landscaped pockets, grass LOD, finite geometry, temple replacing glazing, no boundary hedge and one-time disposal. Native geometry/navigation only.');
}finally{globalThis.document=previous;}
