import {templeGroundHeight,templeObstacles,TEMPLE_VISIT,inTemple} from './temple-visit.js';
import {CAMPUS_TREE_BEDS,CAMPUS_POOLS,CAMPUS_DECK,CAMPUS_SEATING,CAMPUS_FENCE,buildingAt} from './campus-layout.js';
import {gardenObstacles,GARDEN_PAVILION} from './garden-layout.js';
export const outdoorCeiling=(x,z)=>Math.abs(x-GARDEN_PAVILION.x)<2.6&&Math.abs(z-GARDEN_PAVILION.z)<2.2?2.72:inTemple(x,z)?6:100;
export const campusBounds=()=>({width:80,depth:67,regions:[{minX:-53,maxX:27,minZ:-33,maxZ:34},{minX:-24,maxX:-12,minZ:-37.8,maxZ:-30.8},{minX:-33.3,maxX:-2.7,minZ:-49.8,maxZ:-36.9}]});
const box=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
function subtract(rect,cut){const x0=Math.max(rect.minX,cut.minX),x1=Math.min(rect.maxX,cut.maxX),z0=Math.max(rect.minZ,cut.minZ),z1=Math.min(rect.maxZ,cut.maxZ);if(x0>=x1||z0>=z1)return [rect];return [{...rect,maxX:x0},{...rect,minX:x1},{minX:x0,maxX:x1,minZ:rect.minZ,maxZ:z0},{minX:x0,maxX:x1,minZ:z1,maxZ:rect.maxZ}].filter(b=>b.maxX>b.minX&&b.maxZ>b.minZ);}
export function campusObstacles(){
 // Glass is solid except the Museum/DC connecting portal and the two garden doors.
 const walls=[box(-26,-12,34,.16),box(-43,0,.16,24),box(-41.8,12,2.4,.16),box(-23.2,12,28.4,.16),box(-9,-6.85,.16,10.3),box(-9,6.85,.16,10.3),box(0,-10,18,.16),box(9,0,.16,20),box(-5.3,10,7.4,.16),box(5.3,10,7.4,.16)];
 const pools=CAMPUS_POOLS.flatMap(p=>subtract(box(p.x,p.z,p.width+.85,p.depth+.85),CAMPUS_DECK));
 const plants=CAMPUS_TREE_BEDS.map(t=>box(t.x,t.z,t.planter?1.04:.68,t.planter?1.04:.68));
 const seats=CAMPUS_SEATING.flatMap(([x,z])=>[box(x,z-.9,1.8,.86),box(x,z+1,1.8,.86),box(x,z,1.25,.6)]);
 const bollards=[];for(let x=-44;x<=12;x+=4)for(const z of [15.3,-15.3])bollards.push(box(x,z,.15,.15));for(const x of [-46.7,12.7])for(let z=-13;z<=13;z+=5)bollards.push(box(x,z,.15,.15));
 const f=CAMPUS_FENCE,left=TEMPLE_VISIT.gateX-TEMPLE_VISIT.gateWidth/2,right=TEMPLE_VISIT.gateX+TEMPLE_VISIT.gateWidth/2,fence=[box((f.minX+left)/2,f.minZ,left-f.minX,.18),box((right+f.maxX)/2,f.minZ,f.maxX-right,.18),box((f.minX+f.maxX)/2,f.maxZ,f.maxX-f.minX,.18),box(f.minX,(f.minZ+f.maxZ)/2,.18,f.maxZ-f.minZ),box(f.maxX,(f.minZ+f.maxZ)/2,.18,f.maxZ-f.minZ)];
 return [...walls,...pools,...plants,...seats,...bollards,...fence,...templeObstacles(),...gardenObstacles(),box(-42,26.4,2.2,.2)];
}
function flatGroundHeight(x,z){
 const temple=templeGroundHeight(x,z);if(temple!==null)return temple;
 if(buildingAt(x,z)!=='outdoor')return 0;
 if(x>=CAMPUS_DECK.minX&&x<=CAMPUS_DECK.maxX&&z>=CAMPUS_DECK.minZ&&z<=CAMPUS_DECK.maxZ)return -.02;
 if(Math.abs(x)<1.65&&z>9.9&&z<12.5||Math.abs(x+39)<1.65&&z>11.9&&z<13)return -.02;
 if(x>=-47&&x<=13&&(Math.abs(z-14)<=2||Math.abs(z+14)<=2)||Math.abs(x+45)<=2&&Math.abs(z)<=16||Math.abs(x-11)<=2&&Math.abs(z)<=16)return -.07;
 if(x>=-48&&x<=14&&(Math.abs(z-30.3)<=1.15||Math.abs(z+27)<=1.15))return -.08;
 return -.31;
}

export function groundHeight(x,z){
 const base=flatGroundHeight(x,z);if(buildingAt(x,z)!=='outdoor')return base;
 let surface=base;for(const t of CAMPUS_TREE_BEDS){const r=Math.pow((x-t.x)/t.rx,2)+Math.pow((z-t.z)/t.rz,2);if(r<1)surface=Math.max(surface,t.base+t.height*Math.sqrt(1-r));}return surface;
}
