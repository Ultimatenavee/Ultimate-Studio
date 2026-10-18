import * as T from 'three';
// Camera-only presentation; never changes equipment, engineering data or saved projects.
export const DRONE_SHOTS=[
 {id:'library',title:'Device Library Hall',note:'เริ่มจาก Museum ก่อนบินเจาะแต่ละโซน · อุปกรณ์จาก Library เดียวกับ Studio',bounds:[-43,-9,-12,12],yaw:.08,duration:9},
 {id:'welcome',title:'Entrance & Welcome',note:'ทางเข้า พื้นที่ต้อนรับ และทางเดินเชื่อม Gallery',bounds:[-43,-36,-10,10],yaw:.18,duration:9},
 {id:'core',title:'Core / PE Routers',note:'ชมกลุ่มอุปกรณ์ Core และ PE · คลิกอุปกรณ์เพื่อดูข้อมูล',bounds:[-35.5,-26.5,-11.3,-3.5],yaw:-.16,duration:10},
 {id:'switch',title:'Switch Gallery',note:'อุปกรณ์ Enterprise และ Datacenter Switch จาก Library',bounds:[-26.5,-17.5,-11.3,-3.5],yaw:.14,duration:10},
 {id:'access',title:'Access / CPE / Security',note:'สำรวจ Router, CPE และ Firewall ที่มีในระบบ',bounds:[-17.5,-9,-11.3,-3.5],yaw:-.12,duration:10},
 {id:'fiber',title:'Fiber & Power',note:'ODF, Optical profiles และอุปกรณ์จ่ายไฟ · รายละเอียดอ้างอิงตาม Library',bounds:[-35.5,-9,-3.8,4],yaw:.08,duration:10},
 {id:'learning',title:'Learning & Technical Lounge',note:'พื้นที่เรียนรู้โครงข่าย Tools และมุมเอกสารเทคนิค',bounds:[-35.5,-9,4.5,11.4],yaw:.05,duration:9},
 {id:'datacenter',title:'Datacenter / Rack Design',note:'สำรวจ Rack ที่ใช้งานอยู่ · เปิด Device Library เพื่อเริ่มจัดวางอุปกรณ์',bounds:[-9,9,-10,10],yaw:-.15,duration:12},
 {id:'garden',title:'Japanese Stroll Garden',note:'สวนเดินชม · ซากุระ โคมหิน สนามหญ้า และมุมนั่งชมบ่อปลา · เดินออกประตู GARDEN / EXIT เพื่อสำรวจ',bounds:[-44,12,15,29.5],yaw:-.12,duration:13},
 {id:'temple',title:'Sakura & Timber Temple',note:'อาคารไม้ญี่ปุ่น หลังคากระเบื้องซ้อนชั้น และแนวสวนซากุระ · ฉากภายนอกสำหรับเดินชม',bounds:[-37,2,-53,-25],height:17,yaw:.03,duration:13},
 {id:'campus',title:'Ultimate Campus / Gardens',note:'สวนรอบอาคาร ทางเดินริมน้ำ และพื้นที่พักผ่อน · กลับเข้าโหมดเดินเพื่อชมอุปกรณ์ภายใน',bounds:[-53,27,-53,34],height:17,yaw:.15,duration:14}
];
export function dronePose(index,aspect=1,progress=0){
 const shot=DRONE_SHOTS[((index%DRONE_SHOTS.length)+DRONE_SHOTS.length)%DRONE_SHOTS.length],a=Math.max(.25,Number(aspect)||1),[minX,maxX,minZ,maxZ]=shot.bounds;
 const target=new T.Vector3((minX+maxX)/2,1.2,(minZ+maxZ)/2),yaw=shot.yaw+(T.MathUtils.clamp(progress,0,1)-.5)*.28,elevation=.96;
 const direction=new T.Vector3(Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation)),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right),tanV=Math.tan(46*Math.PI/360),tanH=tanV*a;
 let distance=0;for(const x of [minX,maxX])for(const y of [0,shot.height||5.5])for(const z of [minZ,maxZ]){const q=new T.Vector3(x,y,z).sub(target);distance=Math.max(distance,q.dot(direction)+Math.abs(q.dot(right))/tanH,q.dot(direction)+Math.abs(q.dot(up))/tanV);}
 // Keep overhead clearance and a modest caption/toolbar margin, without fitting a full-rotation sphere.
 distance=Math.max(distance*1.16,8/Math.sin(elevation));return {position:target.clone().addScaledVector(direction,distance),target,shot};
}
