import * as T from 'three';
export const SIRIN_DRONE_SHOTS=[
 {title:'มหานครศิริน',note:'ภาพเปิดเมือง · ประตูใต้และแกนกลาง',position:[180,150,250],target:[0,8,0]},
 {title:'ย่านการค้าและชุมชน',note:'ถนนสายหลัก · บ้านเรือนและพื้นที่สีเขียว',position:[-130,100,175],target:[-65,6,60]},
 {title:'Device Library',note:'วิทยาเขตฝั่งตะวันตก · ประตูเข้าสู่ Hall',position:[-170,95,-30],target:[-73,12,-72]},
 {title:'แกนวัฒนธรรมแห่งเมือง',note:'งานสถาปัตยกรรมไทยและย่านเหนือ',position:[-65,125,-210],target:[0,12,-110]},
 {title:'Datacenter Campus',note:'แล็บและศูนย์ข้อมูลฝั่งตะวันออก',position:[185,110,-130],target:[73,12,-73]},
 {title:'Lotus Nexus',note:'จัตุรัสวิจัย · อาคารไทยอนาคต A / B / C',position:[205,100,75],target:[0,15,0]}
];
export const SIRIN_SHOT_SECONDS=16;
const positions=new T.CatmullRomCurve3(SIRIN_DRONE_SHOTS.map(s=>new T.Vector3(...s.position)),true,'centripetal');
const targets=new T.CatmullRomCurve3(SIRIN_DRONE_SHOTS.map(s=>new T.Vector3(...s.target)),true,'centripetal');
export function sirinDronePose(elapsed,aspect=1){
 const total=SIRIN_DRONE_SHOTS.length*SIRIN_SHOT_SECONDS,t=((elapsed%total)+total)%total/total,target=targets.getPoint(t),position=positions.getPoint(t);
 // Portrait devices retain the subject without changing the route or heading.
 position.sub(target).multiplyScalar(Math.max(1,.95/Math.max(.25,aspect))).add(target);
 return {position,target,index:Math.floor(t*SIRIN_DRONE_SHOTS.length),fov:48};
}
