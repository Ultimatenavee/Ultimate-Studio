import assert from 'node:assert/strict';
import * as T from 'three';
import {buildCampusExterior} from '../src/datacenter/campus-exterior.js';
import {CAMPUS_POOLS,CAMPUS_DECK,CAMPUS_TREE_BEDS} from '../src/datacenter/campus-layout.js';
import {groundHeight} from '../src/datacenter/campus-navigation.js';
const prior=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(t,k)=>t[k]||(()=>{})})})};
try{
 const campus=buildCampusExterior();campus.quality('ultra');const root=campus.root;root.updateMatrixWorld(true);
 const bounds=(name,exact=false)=>{const mesh=root.getObjectByName(name);assert(mesh,name);mesh.geometry.computeBoundingBox();const list=[],matrix=new T.Matrix4(),vertex=new T.Vector3();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);let b=mesh.geometry.boundingBox.clone().applyMatrix4(matrix);if(exact){b=new T.Box3();for(let n=0;n<mesh.geometry.attributes.position.count;n++)b.expandByPoint(vertex.fromBufferAttribute(mesh.geometry.attributes.position,n).applyMatrix4(matrix));}list.push(b);}return list;};
 const pond=CAMPUS_POOLS[0],water=new T.Box3(new T.Vector3(pond.x-pond.width/2,-1,pond.z-pond.depth/2),new T.Vector3(pond.x+pond.width/2,20,pond.z+pond.depth/2)),coping=bounds('campus-pool-coping');
 const land=['campus-tree-moss-beds','garden-groundcover-beds','garden-sedge-clumps','garden-flower-stems','garden-flower-leaves','garden-azalea-blossoms','garden-lawn-grass'];let checked=0;
 for(const name of land)for(const b of bounds(name)){assert(!b.intersectsBox(water),name+' stays out of the water');assert(coping.every(c=>!b.intersectsBox(c)),name+' clears the pond coping');checked++;}
 const stones=bounds('garden-shore-stones',true);for(const b of stones){assert(b.min.x>=water.min.x+.1599&&b.max.x<=water.max.x-.1599&&b.min.z>=water.min.z+.1599&&b.max.z<=water.max.z-.1599,'whole rotated stone stays inside the pond, clear of coping');assert(Math.abs(b.min.y+.345)<1e-6,'shore rocks are embedded in the pond bed rather than floating');}
 const moss=bounds('garden-moss-islands');assert.equal(moss.filter(b=>b.intersectsBox(water)).length,1,'one supported planted island, no loose grass disks floating in the water');
 const deck=new T.Box3(new T.Vector3(CAMPUS_DECK.minX,-.5,CAMPUS_DECK.minZ),new T.Vector3(CAMPUS_DECK.maxX,2,CAMPUS_DECK.maxZ)),beds=bounds('campus-tree-moss-beds');
 for(let i=0;i<beds.length;i++){const b=CAMPUS_TREE_BEDS[i];if(b.planter){assert(Math.abs(groundHeight(b.x,b.z)-(b.base+b.height))<1e-6);assert(b.rx<.52&&b.rz<.52,'deck soil stays inside a metal planter');}else assert(!beds[i].intersectsBox(deck),'ground moss does not protrude through the deck');}
 campus.dispose();console.log('PASS Landscape clearance: '+checked+' actual planting envelopes outside pond/coping, '+stones.length+' rotated stones clear of the edge and resting on the bed, one planted island, deck tree planter and synchronized walking heights.');
}finally{globalThis.document=prior;}
