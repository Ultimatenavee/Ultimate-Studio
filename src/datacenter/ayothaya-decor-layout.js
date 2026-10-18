// Footprints are explicit and feed the same collision rules as the room furniture.
export const CITY_LANTERNS=[
 // Heights were sampled from terrain/deck geometry at all four base corners.
 // Temple promenade and courtyard; keep the portal approach clear.
 {"x":7.8,"z":-24.25,"y":-.05},
 {"x":16.2,"z":-24.25,"y":-.05},
 {"x":9.2,"z":-13,"y":0.1},
 {"x":15.05,"z":-13,"y":0.1},
 {"x":7.95,"z":-5,"y":0.05},
 {"x":15.55,"z":-4.5,"y":-0.05},
 {"x":8.2,"z":4.5,"y":0.05},
 {"x":15.3,"z":3.5,"y":0.005},
 {"x":1.5,"z":-23,"y":-0.5469},
 {"x":23.75,"z":-23,"y":-0.5469},
 {"x":2,"z":-33,"y":-0.05},
 {"x":23.25,"z":-33,"y":0},
 // Village paths and boardwalks.
 {"x":-18,"z":-3,"y":-0.9},
 {"x":-22,"z":3,"y":-0.825},
 {"x":-27,"z":5,"y":-0.825},
 {"x":-18,"z":8,"y":-0.8833},
 {"x":-11,"z":-6.5,"y":-0.5485},
 {"x":-11.5,"z":4.5,"y":-0.55},
 {"x":-24.1,"z":10.45,"y":-0.5485},
 {"x":-22,"z":16.7,"y":-0.55},
 // Market square and east avenue.
 {"x":-4.5,"z":-3,"y":0.05},
 {"x":3.8,"z":-3.5,"y":0.05},
 {"x":-3.5,"z":9.5,"y":0},
 {"x":6.5,"z":9,"y":-0.275},
 {"x":22,"z":-3,"y":-0.05},
 {"x":28,"z":-3,"y":-0.05},
 // Harbor decking and tavern island.
 {"x":-14.8,"z":13.45,"y":-0.55},
 {"x":-6.75,"z":13.85,"y":-0.5485},
 {"x":-1.25,"z":16.3,"y":-0.55},
 {"x":-1.25,"z":23,"y":-0.5485},
 {"x":6.1,"z":13.8,"y":-0.5485},
 {"x":12.8,"z":13.8,"y":-0.5485},
 {"x":18.15,"z":17.5,"y":-0.5485},
 {"x":24.25,"z":15.15,"y":-0.55},
 {"x":15.6,"z":25.75,"y":-0.6978},
 {"x":20.45,"z":26,"y":-0.7439},
 // Coverage gaps: northern paths, temple approach, south quay and west market.
 {x:-9,z:-17.75,y:.0833},
 {x:9,z:-30.5,y:0},
 {x:-14.25,z:-21.5,y:1.012},
 {x:-5.25,z:-32,y:-.15},
 {x:4.5,z:22.75,y:-.45},
 {x:-5.25,z:2.5,y:.05},
];
// Spans use already surveyed support pads, with at least 2.7 m headroom.
export const CITY_STRINGS=[
 {id:'L026',ends:[13,14],zone:'village'},
 {id:'L026',ends:[2,3],zone:'temple promenade'},
 {id:'L027',ends:[26,27],zone:'west harbor'},
 {id:'L027',ends:[30,31],zone:'east harbor'}
];
for(const [i,p]of CITY_LANTERNS.entries()){
 p.id=CITY_STRINGS.some(s=>s.ends.includes(i))?'post':i<2?'L013':'L047';
 p.radius=p.id==='L013'?.65:.36;
}
export const CITY_LIGHT_SOURCES=[
 ...CITY_LANTERNS.filter(p=>p.id!=='post').map(p=>({...p,lightY:p.y+(p.id==='L013'?.65:1.18)})),
 ...CITY_STRINGS.flatMap(s=>{const [a,b]=s.ends.map(i=>CITY_LANTERNS[i]);return Array.from({length:5},(_,i)=>{const t=(i+.5)/5;return {id:s.id,x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:a.y+(b.y-a.y)*t,lightY:Math.max(a.y,b.y)+3.3};});})
];
export const INDOOR_CHANDELIERS={
 lobby:[{id:'L241',x:-3.4,z:-3,y:3.35,height:1.2,ceiling:4.69},{id:'L241',x:3.4,z:-3,y:3.35,height:1.2,ceiling:4.69},{id:'L241',x:-3.4,z:5,y:3.35,height:1.2,ceiling:4.69},{id:'L241',x:3.4,z:5,y:3.35,height:1.2,ceiling:4.69}],
 museum:[{id:'L233',x:-39,z:-2.5,y:3.8,height:.85,ceiling:5.39},{id:'L233',x:-39,z:5.5,y:3.8,height:.85,ceiling:5.39}],
 datacenter:[{id:'L238',x:-6.8,z:6.7,y:2.85,height:.85,ceiling:4.15},{id:'L238',x:6.8,z:6.7,y:2.85,height:.85,ceiling:4.15}]
};
export const TEMPLE_DECOR=[
 {id:'buddha',x:0,z:-7.8,height:2.65,width:3},
 {id:'brazier',x:-2.5,z:-7.6,height:.85,width:.8},
 {id:'brazier',x:2.5,z:-7.6,height:.85,width:.8},
 {id:'urn',x:-7.25,z:-7.8,height:1.15,width:.8},
 {id:'urn',x:7.25,z:-7.8,height:1.15,width:.8},
 {id:'plant',x:-7.3,z:5.8,height:1.65,width:1.2},
 {id:'plant',x:7.3,z:5.8,height:1.65,width:1.2},
 {id:'temple-cabinet',x:-7.3,z:-3.8,height:1.65,width:1.1,yaw:Math.PI/2},
 {id:'temple-cabinet',x:7.3,z:-3.8,height:1.65,width:1.1,yaw:-Math.PI/2}
];
export const LAB_DECOR={
 museum:[
  {id:'lab-storage',x:-42.35,z:-8.4,height:1.85,width:1.3,depth:.56,yaw:Math.PI/2},
  {id:'lab-storage',x:-42.35,z:-6.9,height:1.85,width:1.3,depth:.56,yaw:Math.PI/2},
  {id:'verus-monitor',x:-42.4,z:-3.5,y:.95,height:1.15,width:1.55,depth:.7,yaw:Math.PI/2},
  {id:'lab-desk',x:-42.0,z:.5,height:.8,width:1.4,depth:1.15,yaw:Math.PI/2},
  {id:'lab-chair',x:-40.9,z:.5,height:.92,width:.55,depth:.55,yaw:-Math.PI/2},
  {id:'lab-storage',x:-42.35,z:3.5,height:1.85,width:1.3,depth:.56,yaw:Math.PI/2},
  {id:'lab-extinguisher',x:-42.15,z:7.7,height:.65,width:.64,depth:.52,yaw:Math.PI/2}
 ],
 datacenter:[
  {id:'lab-storage',x:7.7,z:-9.35,height:1.85,width:1.3,depth:.56},
  {id:'lab-storage',x:6.2,z:-9.35,height:1.85,width:1.3,depth:.56},
  {id:'werner-monitor',x:-6.4,z:-9.5,y:.95,height:1.2,width:1.65,depth:.52},
  {id:'lab-desk',x:-7.9,z:-3.0,height:.8,width:1.4,depth:1.15,yaw:Math.PI/2},
  {id:'lab-chair',x:-6.8,z:-3.0,height:.92,width:.55,depth:.55,yaw:-Math.PI/2},
  {id:'lab-storage',x:8.3,z:4.8,height:1.85,width:1.3,depth:.56,yaw:-Math.PI/2},
  {id:'lab-storage',x:8.3,z:6.3,height:1.85,width:1.3,depth:.56,yaw:-Math.PI/2},
  {id:'lab-extinguisher',x:7.7,z:8.9,height:.65,width:.64,depth:.52,yaw:Math.PI}
 ]
};
export const LAB_BENCHES={museum:[{x:-42.05,z:-3.5,width:2.4,depth:.8,yaw:Math.PI/2}],datacenter:[{x:-6.4,z:-8.95,width:2.8,depth:.85,yaw:0}]};
export const LAB_STAFF={museum:{x:-40.6,z:2.4},datacenter:{x:-7.85,z:-7.6}};
export function decorFootprint(p){const c=Math.abs(Math.cos(p.yaw||0)),s=Math.abs(Math.sin(p.yaw||0)),w=p.width,d=p.depth||w,rx=(w*c+d*s)/2+.08,rz=(w*s+d*c)/2+.08;return {minX:p.x-rx,maxX:p.x+rx,minZ:p.z-rz,maxZ:p.z+rz};}

