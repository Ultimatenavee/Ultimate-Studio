// Japanese-inspired stroll garden. Coordinates share the existing walkable campus.
export const GARDEN_TREES=[
 {x:-43,z:17,species:'sakura',height:4.4,radius:2.2,existing:true},
 {x:-28,z:17,species:'sakura',height:4.2,radius:2.1,existing:true},
 {x:7,z:16,species:'sakura',height:4.8,radius:2.4,existing:true},
 {x:17,z:10,species:'sakura',height:4.5,radius:2.3,existing:true},
 {x:17,z:-8,species:'sakura',height:4.7,radius:2.4,existing:true},
 {x:-8.2,z:23.3,species:'sakura',height:4.5,radius:2.3,base:.32}
];
// Low, layered planting groups fill the margins while the lawns and promenades stay open.
export const GARDEN_POCKETS=[
 ...[-44,-35,-26,-17,-8,1,10].map((x,i)=>({x,z:32.2,width:4.2,depth:1.8,phase:i})),
 ...[-44,-35,-28,-23.5,-8,1,10].map((x,i)=>({x,z:-30.9,width:4.2,depth:1.5,phase:i+2})),
 ...[-24,-13,-3,7,27].flatMap((z,i)=>[{x:-51,z,width:1.6,depth:4,phase:i},{x:24.8,z,width:2.4,depth:4,phase:i+1}]),
 {x:-40,z:-23.7,width:5.4,depth:1.6,phase:2},{x:-29,z:-24.2,width:4.6,depth:1.5,phase:1},{x:-5,z:-24.2,width:5.8,depth:1.6,phase:4},{x:6,z:-18,width:4.7,depth:1.5,phase:3},
 {x:20.9,z:-14.2,width:4.2,depth:2,phase:4},{x:20.9,z:16,width:4.3,depth:2.6,phase:3},
 {x:-47.2,z:22,width:2.8,depth:4.2,phase:2},{x:13.4,z:24,width:3,depth:4,phase:1}
];
export const DRY_GARDEN={x:-17,z:-21,width:13,depth:5.6};
export const GARDEN_PAVILION={x:-37.3,z:25.7,width:5.2,depth:4.4};
export const GARDEN_BASIN={x:-27.4,z:25.9};
export const GARDEN_LANTERNS=[{x:-23,z:18.8,scale:1},{x:-2,z:26.5,scale:.85},{x:19,z:-10.5,scale:.85},{x:-22,z:-22.8,scale:.72}];
export const GARDEN_ROCKS=[[-8.7,23.3,1.4,1.75,1.2],[-10.3,24.1,1.55,.8,1.1],[-6.2,22.6,.95,1.15,.9],[-18.8,-21,1.1,1.5,.85],[-17.3,-20.5,1.4,.65,1.05],[-15.9,-21.6,.75,1,.7]];
export function gardenPath(){return Array.from({length:43},(_,i)=>({x:-38.5+i*.91,z:14.1+Math.sin(i*.3)*.5,angle:Math.sin(i*.3)*.12}));}
export function gardenObstacles(){const p=GARDEN_PAVILION,b=GARDEN_BASIN,box=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});return [...[-1,1].flatMap(x=>[-1,1].map(z=>box(p.x+x*2.35,p.z+z*1.95,.16,.16))),box(p.x,p.z+1.5,4.1,.6),box(b.x,b.z,1.1,1.1),box(b.x-.85,b.z,.18,.18),box(DRY_GARDEN.x,DRY_GARDEN.z,DRY_GARDEN.width+.18,DRY_GARDEN.depth+.18),...GARDEN_ROCKS.map(([x,z,w,h,d])=>box(x,z,w*1.65,d*1.65)),...GARDEN_LANTERNS.map(l=>box(l.x,l.z,l.scale*1.1,l.scale*1.1))];}
