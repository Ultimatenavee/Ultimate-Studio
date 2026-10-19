import * as T from 'three';

const BASE='assets/ragnarok-life/',SECTOR=Math.PI/4;
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
// RO: south/front=0, west=2, north/back=4, east=6. Quantize with
// hysteresis so a still camera at a sector boundary cannot flicker directions.
export function lifeDirection(heading,bearing,previous){
 const relative=angle(bearing-heading);
 if(Number.isInteger(previous)&&Math.abs(angle(relative-previous*SECTOR))<=SECTOR*.5+.09)return previous;
 return ((Math.round(relative/SECTOR)%8)+8)%8;
}
export function habitatFits(triangles,x,z,r){
 const edges=[[0,x-r,true],[0,x+r,false],[1,z-r,true],[1,z+r,false]];let covered=0;
 for(const triangle of triangles||[]){let poly=triangle;
  for(const [axis,edge,greater]of edges){const next=[];for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],ia=greater?a[axis]>=edge:a[axis]<=edge,ib=greater?b[axis]>=edge:b[axis]<=edge;
   if(ia)next.push(a);if(ia!==ib){const t=(edge-a[axis])/(b[axis]-a[axis]);next.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }poly=next;if(!poly.length)break;}
  covered+=Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
 }return Math.abs(covered-4*r*r)<1e-5;
}
export function lifeCanOccupy(state,x,z,canStand){
 const r=state.radius;
 return canStand(x,z,r)&&habitatFits(state.habitat,x,z,r)&&!(state.obstacles||[]).some(b=>{
  const dx=x-Math.max(b[0],Math.min(b[2],x)),dz=z-Math.max(b[1],Math.min(b[3],z));return dx*dx+dz*dz<r*r;
 });
}
export function updateNpcFacing(state,dt,observer){
 // NPCs welcome nearby walkers, with entry/exit hysteresis and a bounded turn
 // speed. Overview/drone cameras never command their physical facing direction.
 state.attending=!!observer&&observer.distance<(state.attending?12:10);
 const target=state.attending?observer.bearing:state.baseHeading,delta=angle(target-state.heading);
 state.heading=angle(state.heading+Math.sign(delta)*Math.min(Math.abs(delta),dt*1.15));
}
export function advanceLifeState(state,dt,canStand){
 state.elapsed+=dt;state.moving=false;
 if(!state.roam)return;
 const active=(state.elapsed+state.phase)%12;
 if(active<4||active>9){state.target=null;return;}
 const safe=(x,z)=>lifeCanOccupy(state,x,z,canStand);
 if(!state.target&&state.elapsed>=state.retryAt){
  for(let i=0;i<12;i++){const seed=++state.seed+state.phase,a=seed*2.399963,r=.5+(Math.sin(seed*7.13)+1)*.4,x=state.homeX+Math.sin(a)*r,z=state.homeZ+Math.cos(a)*r;
   if(safe(x,z)){state.target={x,z};break;}
  }state.retryAt=state.elapsed+1;
 }
 if(!state.target)return;
 const dx=state.target.x-state.x,dz=state.target.z-state.z,d=Math.hypot(dx,dz);
 if(d<.06){state.target=null;return;}
 const distance=Math.min(d,dt*.42),x=state.x+dx/d*distance,z=state.z+dz/d*distance;
 // Test every small step, not only the endpoint: no crossing a wall or lawn edge.
 if(!safe(x,z)){state.target=null;state.retryAt=state.elapsed+1;return;}
 state.x=x;state.z=z;state.heading=Math.atan2(dx,dz);state.moving=distance>0;
}
export async function createRagnarokLife(){
 const response=await fetch(BASE+'manifest.json?v=city-life-v2');if(!response.ok)throw Error('Ragnarok life manifest unavailable');
 const manifest=await response.json(),loader=new T.TextureLoader(),textures=new Map(),actors=[],batches=new Map(),cameraPosition=new T.Vector3(),observerPosition=new T.Vector3(),worldPosition=new T.Vector3(),matrix=new T.Matrix4();
 const shadowGeometry=new T.CircleGeometry(.5,16);shadowGeometry.rotateX(-Math.PI/2);
 const shadowMaterial=new T.MeshBasicMaterial({color:'#11232a',transparent:true,opacity:.22,depthWrite:false,toneMapped:false});
 let previousTime=null,disposed=false,retired=0;
 const texture=id=>{if(!textures.has(id))textures.set(id,loader.loadAsync(BASE+manifest.assets[id].image+'?v=city-life-v2').then(t=>{t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=false;t.minFilter=t.magFilter=T.NearestFilter;return t;}));return textures.get(id);};
 async function actor(parent,id,options={}){
  id=manifest.aliases[id]||id;const meta=manifest.assets[id];if(!meta)throw Error('Unknown Ragnarok occupant: '+id);
  const source=await texture(id);if(disposed)return null;
  const map=source.clone();map.repeat.set(1/meta.columns,1/meta.rows);map.needsUpdate=true;
  const material=new T.SpriteMaterial({map,transparent:true,alphaTest:.1,depthWrite:false,toneMapped:false});
  const sprite=new T.Sprite(material),height=options.height||1.65;sprite.name='RO actor: '+id;sprite.center.fromArray(meta.anchor);sprite.scale.set(height*meta.width/meta.bodyHeight,height*meta.height/meta.bodyHeight,1);sprite.userData.cameraIgnore=true;
  const state={...options,x:options.x||0,z:options.z||0,y:options.y||0,homeX:options.x||0,homeZ:options.z||0,heading:options.heading||0,baseHeading:options.heading||0,elapsed:0,phase:options.phase||0,seed:0,retryAt:0,target:null,roam:meta.kind==='monster'&&!!meta.actions.walk&&!!options.habitat&&options.roam!==false,radius:options.radius??height*.28,moving:false,attending:false};
  sprite.position.set(state.x,state.y+.018,state.z);parent.add(sprite);
  if(!batches.has(parent)){const mesh=new T.InstancedMesh(shadowGeometry,shadowMaterial,256);mesh.count=0;mesh.name='RO occupant ground shadows';mesh.userData.cameraIgnore=true;mesh.frustumCulled=false;parent.add(mesh);batches.set(parent,mesh);}
  const batch=batches.get(parent),index=batch.count++;const record={id,meta,map,material,sprite,state,batch,index,direction:null,frame:-1,action:'idle'};actors.push(record);updateShadow(record);
  return sprite;
 }
 function updateShadow(a){const {state:s}=a;matrix.makeScale(s.radius*2.8,1,s.radius*1.6);matrix.setPosition(s.x,s.y+.012,s.z);a.batch.setMatrixAt(a.index,matrix);a.batch.instanceMatrix.needsUpdate=true;}
 async function capital(parent,original,canStand){
  await Promise.all(manifest.capital.map(p=>actor(parent,p.id,{...p,canStand})));
  // GLB optimization instanced the original citizens; retire by their dedicated
  // sprite materials, including unnamed instanced nodes, after all atlases load.
  original.traverse(o=>{if(!o.isMesh)return;const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.some(m=>m?.name?.startsWith('SPR_'))){o.visible=false;retired++;}});
 }
 function update(time,motion,camera,observer){
  if(disposed||!camera)return false;
  const dt=previousTime===null?0:Math.max(0,Math.min((time-previousTime)/1000,.06));previousTime=time;
  camera.getWorldPosition(cameraPosition);observer?.getWorldPosition(observerPosition);let changed=false;
  for(const a of actors){const {state:s,meta}=a;let visible=true;for(let p=a.sprite.parent;p;p=p.parent)if(!p.visible){visible=false;break;}if(!visible)continue;
   if(motion&&dt)advanceLifeState(s,dt,s.canStand||(()=>true));
   if(a.sprite.position.x!==s.x||a.sprite.position.z!==s.z){a.sprite.position.set(s.x,s.y+.018,s.z);updateShadow(a);changed=true;}
   a.sprite.getWorldPosition(worldPosition);const dx=cameraPosition.x-worldPosition.x,dz=cameraPosition.z-worldPosition.z;
   if(meta.kind==='npc'&&motion&&dt){const ox=observerPosition.x-worldPosition.x,oz=observerPosition.z-worldPosition.z;updateNpcFacing(s,dt,observer?{distance:Math.hypot(ox,oz),bearing:Math.atan2(ox,oz)}:null);}
   // An overhead camera has no useful bearing; keep the last stable direction.
   const direction=dx*dx+dz*dz<.001?(a.direction??0):lifeDirection(s.heading,Math.atan2(dx,dz),a.direction);
   const kind=s.moving&&meta.actions.walk?'walk':'idle',clip=meta.actions[kind][direction],frame=clip.frames[Math.floor((s.elapsed+s.phase)*1000/clip.frameMs)%clip.frames.length];
   if(frame!==a.frame||direction!==a.direction){a.map.offset.set(frame%meta.columns/meta.columns,1-(Math.floor(frame/meta.columns)+1)/meta.rows);a.frame=frame;a.direction=direction;changed=true;}a.action=kind;
  }return changed;
 }
 return {actor,capital,update,stats:()=>({count:actors.length,retiredStaticBatches:retired,shadowBatches:batches.size,actors:actors.map(a=>({name:a.state.name||a.sprite.name,id:a.id,kind:a.meta.kind,rank:a.state.rank||null,zone:a.state.zone||null,position:[a.state.x,a.state.y,a.state.z],home:[a.state.homeX,a.state.homeZ],direction:a.direction,action:a.action,frame:a.frame,anchor:a.meta.anchor,heading:a.state.heading,baseHeading:a.state.baseHeading,facingTarget:a.state.facingTarget||null,attending:a.state.attending,roaming:a.state.roam,moving:a.state.moving}))}),
  dispose(){if(disposed)return;disposed=true;for(const a of actors){a.sprite.removeFromParent();a.map.dispose();a.material.dispose();}for(const b of batches.values()){b.removeFromParent();b.dispose();}shadowGeometry.dispose();shadowMaterial.dispose();for(const p of textures.values())p.then(t=>t.dispose());actors.length=0;batches.clear();}
 };
}
