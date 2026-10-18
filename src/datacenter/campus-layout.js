// Shared metre-scale footprints for the rendered grounds and walking collisions.
export const CAMPUS_TREES=[...[-42,-34,-26,-18,-10,-2,7].flatMap(x=>[{x,z:30},{x:x+1,z:-28}]),...[-17,-8,1,10,20].flatMap(z=>[{x:-49,z},{x:17,z}]),{x:-43,z:17},{x:-28,z:17},{x:7,z:16},...[-38,-30,-4,4].map((x,i)=>({x,z:i===1?-19:-21,height:4.6,radius:2.25}))];
// The front koi pond is retained; the two former reflecting basins are walkable lawn.
export const CAMPUS_POOLS=[{x:-17,z:23,width:54,depth:10}];
export const CAMPUS_LAWNS=[{x:-17,z:-21,width:54,depth:8},{x:19,z:0,width:9,depth:25}];
export const CAMPUS_FENCE={minX:-52.8,maxX:26.8,minZ:-32.8,maxZ:33.8,height:1.85};
export const CAMPUS_DECK={minX:-40.8,maxX:-25.64,minZ:15.5,maxZ:29.5};
// Landscape envelopes share the same pond/deck footprint as rendering and walking.
export const CAMPUS_TREE_BEDS=CAMPUS_TREES.map(t=>{
 const planter=t.x>CAMPUS_DECK.minX&&t.x<CAMPUS_DECK.maxX&&t.z>CAMPUS_DECK.minZ&&t.z<CAMPUS_DECK.maxZ;
 const bed={x:t.x,z:t.z,rx:planter?.44:1.7,rz:planter?.44:1.6,base:planter?-.02:-.31,height:planter?.12:.33,planter};
 if(planter)return bed;
 const exclusions=[...CAMPUS_POOLS.map(p=>({minX:p.x-p.width/2,maxX:p.x+p.width/2,minZ:p.z-p.depth/2,maxZ:p.z+p.depth/2,padding:.55})),{...CAMPUS_DECK,padding:.14}];
 for(const r of exclusions){
  if(t.x+bed.rx<=r.minX-r.padding||t.x-bed.rx>=r.maxX+r.padding||t.z+bed.rz<=r.minZ-r.padding||t.z-bed.rz>=r.maxZ+r.padding)continue;
  const dx=Math.max(r.minX-t.x,t.x-r.maxX)-r.padding,dz=Math.max(r.minZ-t.z,t.z-r.maxZ)-r.padding;
  if(dx>0&&dx/bed.rx>dz/bed.rz)bed.rx=Math.min(bed.rx,dx);else if(dz>0)bed.rz=Math.min(bed.rz,dz);
 }
 return bed;
});
// [x, z, supporting floor height]. Keep the corner lounge inside the stone terrace.
export const CAMPUS_SEATING=[[-36,22,-.02],[-29,22,-.02],[10.6,14,-.07]];
export const CAMPUS_EXITS={museum:{x:-39,z:12,width:3.2},datacenter:{x:0,z:10,width:3.2}};
export function buildingAt(x,z){return x>=-43&&x<-9&&Math.abs(z)<=12?'museum':x>=-9&&x<=9&&Math.abs(z)<=10?'datacenter':'outdoor';}
export const inBuilding=(x,z)=>buildingAt(x,z)!=='outdoor';
