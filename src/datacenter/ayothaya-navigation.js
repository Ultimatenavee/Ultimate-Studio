import {EAST_GATE,insidePortal,capitalPortalAt} from './sirin-navigation.js';
import {TEMPLE_DECOR,CITY_LANTERNS,decorFootprint} from './ayothaya-decor-layout.js';
export const WALK_EYE={city:1.05,capital:1.5,lobby:1.5,interior:1.5};
const lobbyDecorBoxes=TEMPLE_DECOR.map(decorFootprint);
// Pure navigation rules. GAT coordinates and heights match the exported glTF.
export const CITY_SCALE=.05;
export const CITY_SPAWN={x:12,z:-22,yaw:0};
export const TEMPLE_GATE={x:12,z:-29.45,width:2.2,depth:1.15};
export const CITY_RETURN={x:12,z:-27.3,yaw:Math.PI};
export const LOBBY_SPAWN={x:0,z:5.5,yaw:0};
export const LOBBY_RETURNS={museum:{x:-5.6,z:0,yaw:-Math.PI/2},datacenter:{x:5.6,z:0,yaw:Math.PI/2}};
export const AREA_NAMES={city:'เมืองอโยธยา',capital:'มหานครศิริน · SIRIN',lobby:'โถงกลางวัด',museum:'Device Library',datacenter:'Datacenter'};
export const AYOTHAYA_DESTINATIONS=[
 {id:'capital',number:'05',name:'มหานครศิริน · SIRIN',note:'วาร์ปฝั่งขวาอโยธยา · เมืองใหม่และย่านเทคโนโลยี',color:'#81e6ed'},
 {id:'city',number:'01',name:'เมืองอโยธยา',note:'เดินสำรวจเมืองและท่าเรือ',color:'#82baac'},
 {id:'lobby',number:'02',name:'โถงกลางวัด',note:'ซ้าย Device Library · ขวา Datacenter',color:'#d6b570'},
 {id:'museum',number:'03',name:'Device Library',note:'ห้องฝั่งซ้าย · สำรวจอุปกรณ์และโมเดล',color:'#76c9dc'},
 {id:'datacenter',number:'04',name:'Datacenter',note:'ห้องฝั่งขวา · ออกแบบ Rack และจัดวางอุปกรณ์',color:'#d8ad71'}
];
export function portalAt(area,x,z){
 if(area==='city'&&insidePortal(EAST_GATE,x,z))return 'capital';
 if(area==='capital')return capitalPortalAt(x,z);
 if(area==='city'&&Math.abs(x-TEMPLE_GATE.x)<TEMPLE_GATE.width/2&&Math.abs(z-TEMPLE_GATE.z)<TEMPLE_GATE.depth/2)return 'lobby';
 if(area==='lobby'){
  if(x< -7.2&&Math.abs(z)<1.35)return 'museum';
  if(x>7.2&&Math.abs(z)<1.35)return 'datacenter';
  if(z>7.6&&Math.abs(x)<1.5)return 'city';
 }
 if(area==='museum'&&Math.abs(x+39)<1.45&&z>10.65)return 'lobby';
 if(area==='datacenter'&&Math.abs(x)<1.45&&z>8.7)return 'lobby';
 return null;
}
export function createPortalLatch(){
 let remaining=0,busy=false;
 return {
  tick(dt,area,x,z,walking){remaining=Math.max(0,remaining-dt);return walking&&!busy&&remaining===0?portalAt(area,x,z):null;},
  begin(){if(busy)return false;busy=true;return true;},
  finish(){busy=false;remaining=.75;},
  get busy(){return busy;}
 };
}
export function decodeNavigation(json){
 const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const types=decode(json.types),raw=decode(json.heights),view=new DataView(raw.buffer),heights=new Float32Array(raw.length/4);
 for(let i=0;i<heights.length;i++)heights[i]=view.getFloat32(i*4,true);
 if(types.length!==json.width*json.height||heights.length!==types.length*4)throw Error('Invalid Ayothaya navigation data');
 return {...json,types,heights};
}
export function gridSample(nav,x,z){
 const gx=x/nav.cell+nav.width/2,gz=nav.height/2-z/nav.cell,col=Math.floor(gx),row=Math.floor(gz);
 if(col<0||row<0||col>=nav.width||row>=nav.height)return null;
 const index=row*nav.width+col,u=gx-col,v=gz-row,h=index*4;
 const south=nav.heights[h]*(1-u)+nav.heights[h+1]*u,north=nav.heights[h+2]*(1-u)+nav.heights[h+3]*u;
 return {index,type:nav.types[index],height:south*(1-v)+north*v};
}
export function cityCanStand(nav,x,z,radius=.1){
 if(!nav.surfacePolicy&&CITY_LANTERNS.some(p=>Math.abs(x-p.x)<p.radius+radius&&Math.abs(z-p.z)<p.radius+radius))return false;
 return [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].every(([dx,dz])=>{
  const s=gridSample(nav,x+dx,z+dz);return s&&[0,3,6].includes(s.type);
 });
}
export function worldStep(area,nav,position,dx,dz,stopAt){
 let {x,z}=position;if(stopAt?.(x,z))return {x,z};const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));
 const stand=(a,b)=>area==='city'?cityCanStand(nav,a,b):lobbyCanStand(a,b);
 for(let i=0;i<n;i++){if(stand(x+dx/n,z))x+=dx/n;if(stand(x,z+dz/n))z+=dz/n;if(stopAt?.(x,z))break;}
 return {x,z};
}

export const lobbyCanStand=(a,b)=>Math.abs(a)<8.25&&Math.abs(b)<8.55&&!lobbyDecorBoxes.some(r=>a>r.minX-.15&&a<r.maxX+.15&&b>r.minZ-.15&&b<r.maxZ+.15)&&![-6,6].some(px=>[-7,7].some(pz=>Math.abs(a-px)<.42&&Math.abs(b-pz)<.42));
