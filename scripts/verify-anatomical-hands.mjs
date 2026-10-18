import assert from 'node:assert/strict';
import * as T from 'three';
import {createHandGeometry} from '../src/datacenter/anatomical-hand.js';
import {buildBuddhaHall} from '../src/datacenter/buddha-hall.js';
for(const [pose,detail]of [['blessing',true],['blessing',false],['cupped',true],['cupped',false],['relaxed',false]])for(const mirror of [false,true]){
 const g=createHandGeometry({pose,detail,mirror}),p=g.attributes.position,idx=g.index.array,edges=new Map(),adj=Array.from({length:p.count},()=>new Set());let volume=0;
 for(let i=0;i<idx.length;i+=3){const ids=Array.from(idx.slice(i,i+3)),v=ids.map(k=>new T.Vector3().fromBufferAttribute(p,k));assert(v.every(v=>v.toArray().every(Number.isFinite)));const area=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).length();assert(area>1e-12,'no collapsed triangles after quantization');volume+=v[0].dot(v[1].clone().cross(v[2]))/6;for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);adj[a].add(b);adj[b].add(a);}}
 assert([...edges.values()].every(n=>n===2),'hand is watertight, including thumb saddle and finger webs');assert(volume>0,'mirrored hands keep outward triangle winding');const seen=new Set([0]),queue=[0];for(let i=0;i<queue.length;i++)for(const j of adj[queue[i]])if(!seen.has(j)){seen.add(j);queue.push(j);}assert.equal(seen.size,p.count,'palm, thumb and all fingers are one connected surface');
 const peaks=[-Infinity,-Infinity,-Infinity,-Infinity];for(let i=0;i<p.count;i++){const x=p.getX(i)*(mirror?-1:1),y=p.getY(i);if(y<.24||x<-.19||x>.18)continue;const digit=x<-.09?0:x<-.003?1:x<.083?2:3;peaks[digit]=Math.max(peaks[digit],y);}if(pose!=='cupped'){assert(peaks[2]>peaks[1]+.012&&peaks[1]>peaks[3]+.008&&peaks[3]>peaks[0]+.035,'middle, ring, index and little finger have anatomical lengths');}
 const hit=new T.Raycaster(new T.Vector3(0,0,1),new T.Vector3(0,0,-1)).intersectObject(new T.Mesh(g,new T.MeshBasicMaterial()))[0];assert(hit&&hit.face.normal.z>0,'palm front survives back-face culling');g.dispose();
}
const hall=buildBuddhaHall(),main=hall.root.getObjectByName('vairocana-daibutsu');hall.root.updateMatrixWorld(true);
for(const name of ['raised-right-hand','open-left-hand']){const h=main.getObjectByName(name),origin=h.localToWorld(new T.Vector3(0,0,1)),dir=new T.Vector3(0,0,-1).transformDirection(h.matrixWorld),hit=new T.Raycaster(origin,dir).intersectObject(main,true)[0];assert(hit,'baked sculpture palm remains visible');const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);assert(normal.dot(dir)<-.7,'baked left hand must not turn inside out');assert(h.scale.x>0,'handedness is baked with corrected winding, not a reflected group');}
const rootHall=hall.root;
// The screenshot showed both attendant hands pointing right. Assert their actual
// world frames, including thumbs, instead of treating visibility as correct pose.
for(const figure of ['flanking-bodhisattva-west','flanking-bodhisattva-east']){
 const g=rootHall.getObjectByName(figure),right=g.getObjectByName('open-right-hand'),left=g.getObjectByName('open-left-hand');
 assert(right&&left);assert(right.userData.fingersDirection[0]>.999&&left.userData.fingersDirection[0]<-.999,'attendant fingers point inward toward the lap, never both to one side');
 for(const h of [right,left]){
  assert(h.userData.palmNormal[1]>.999,'both resting palms face upward');assert.equal(h.userData.handPose,'relaxed','attendants rest their fingers instead of reusing the strongly cupped main hand');
  const asset=createHandGeometry({pose:'relaxed',detail:false,mirror:h===left}),tip=asset.userData.tips.find(t=>t.name==='middle').position,point=h.localToWorld(new T.Vector3(...tip)),wrist=g.localToWorld(new T.Vector3(...h.userData.wrist));
  assert((point.x-wrist.x)*(h===left?-1:1)>.25,'actual middle-finger geometry points inward');const normal=new T.Vector3(0,1,0),hit=new T.Raycaster(point.clone().addScaledVector(normal,.12),normal.clone().negate()).intersectObject(g,true)[0];assert(hit&&hit.distance<.15,'a rendered fingertip is present at the oriented hand landmark');asset.dispose();
 }
}
console.log('PASS Anatomical hands: ten closed connected variants, outward mirrored winding, anatomical lengths, front-culling, baked palms and opposite inward-facing attendant hand frames.');
hall.dispose();
