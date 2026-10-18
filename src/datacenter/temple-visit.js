export const TEMPLE_VISIT={x:-18,z:-39.6,floor:.75,radius:2.8,gateX:-18,gateWidth:6};
export const inTemple=(x,z)=>x>-32.7&&x<-3.3&&z>-49&&z<-37.1;
export const nearPrayer=(x,z)=>Math.hypot(x-TEMPLE_VISIT.x,z-TEMPLE_VISIT.z)<=TEMPLE_VISIT.radius;
export function twoDigitBlessing(random=Math.random){return String(Math.min(99,Math.max(0,Math.floor(random()*100)))).padStart(2,'0');}
export function templeGroundHeight(x,z){
 if(x>=-33.45&&x<=-2.55&&z>=-49.95&&z<=-37.05)return .75;
 if(Math.abs(x+18)<=5.2){if(z>=-37.1&&z<=-36.2)return .75;let y=null;for(let s=0;s<7;s++){const center=-43.5+8.75-s*.195,depth=3.1-s*.39;if(z>=center-depth/2&&z<=center+depth/2)y=Math.max(y??-.31,-.31+.15*(s+1));}if(y!==null)return y;}
 if(Math.abs(x+18)<3&&z>=-33.25&&z<=-30.8)return -.28;
 return null;
}
const box=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
export function templeObstacles(){return [box(-32.7,-43.5,.25,12),box(-3.3,-43.5,.25,12),box(-18,-49,.25+29,.25),box(-28.5,-37.9,8.2,.25),box(-7.5,-37.9,8.2,.25),box(-18,-45.5,6.7,4.3),box(-25.6,-45.6,4,3.6),box(-10.4,-45.6,4,3.6),...Array.from({length:8},(_,i)=>box(-18-14.4+i*28.8/7,-37.9,.65,.65))];}
