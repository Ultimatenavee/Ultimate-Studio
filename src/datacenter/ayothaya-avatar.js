import * as T from 'three';

// The original camera remains the player's collision/interaction pose. This separate
// render camera follows it, so changing perspective cannot teleport or alter a warp.
export async function createRagnarokAvatar(scene,{blockers=()=>[]}={}){
 let [meta,map]=await Promise.all([fetch('assets/ayothaya/avatar/novice.json').then(r=>{if(!r.ok)throw Error('Avatar metadata unavailable');return r.json();}),new T.TextureLoader().loadAsync('assets/ayothaya/avatar/novice.png')]);
 map.colorSpace=T.SRGBColorSpace;map.generateMipmaps=false;map.minFilter=T.NearestFilter;map.magFilter=T.NearestFilter;map.repeat.set(1/meta.columns,1/meta.rows);
 const material=new T.SpriteMaterial({map,transparent:true,alphaTest:.1,depthWrite:false,toneMapped:false});
 const avatar=new T.Sprite(material);avatar.name='Player: Ragnarok Novice';avatar.center.set(.5,2/meta.height);avatar.visible=false;scene.add(avatar);
 const shadow=new T.Mesh(new T.CircleGeometry(.23,24),new T.MeshBasicMaterial({color:'#101722',transparent:true,opacity:.25,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.visible=false;scene.add(shadow);
 const follow=new T.PerspectiveCamera(),previous=new T.Vector3(),ray=new T.Raycaster(),target=new T.Vector3(),offset=new T.Vector3();
 let mode='first',initialized=false,heading=0,lastTime=0,elapsed=0,frame=0,action=4,moving=false,distance=0,zoomScale=1,renderCamera=null,appearanceBase='assets/ayothaya/avatar/novice',loadRevision=0,disposed=false;
 async function appearance(base){
  if(base===appearanceBase)return;const revision=++loadRevision;
  const online=base.startsWith('ro-outfit:')?await (await import('./online-wardrobe.js')).onlineOutfitAssets(base):null;const [nextMeta,nextMap]=await Promise.all([online?online.meta:fetch(base+'.json').then(r=>{if(!r.ok)throw Error('โหลดข้อมูลชุดไม่สำเร็จ');return r.json();}),new T.TextureLoader().loadAsync(online?.url||base+'.png')]);
  if(disposed||revision!==loadRevision){nextMap.dispose();return;}
  nextMap.colorSpace=T.SRGBColorSpace;nextMap.generateMipmaps=false;nextMap.minFilter=nextMap.magFilter=T.NearestFilter;nextMap.repeat.set(1/nextMeta.columns,1/nextMeta.rows);
  map.dispose();map=nextMap;meta=nextMeta;material.map=map;material.needsUpdate=true;avatar.center.set(...(meta.anchor||[.5,2/meta.height]));appearanceBase=base;elapsed=0;
 }
 function setMode(value){mode=value==='third'?'third':'first';initialized=false;avatar.visible=shadow.visible=false;}
 function update(camera,{walking,time=0,eyeHeight=1.5,ground=0,motion=true,crouching=false,sitting=false}={}){
  const dt=Math.max(0,Math.min((time-lastTime)/1000,.08));lastTime=time;
  const dx=camera.position.x-previous.x,dz=camera.position.z-previous.z;
  moving=!sitting&&initialized&&Math.hypot(dx,dz)>.0001&&Math.hypot(dx,dz)<1;
  if(!initialized||Math.hypot(dx,dz)>=1)heading=camera.rotation.y;else if(moving)heading=Math.atan2(-dx,-dz);
  previous.copy(camera.position);initialized=true;
  avatar.visible=shadow.visible=walking&&mode==='third';renderCamera=camera;
  if(!avatar.visible)return camera;
  const height=eyeHeight*1.04*(!sitting&&crouching?.68:1),base=sitting?ground:Math.max(ground,camera.position.y-eyeHeight*(crouching?.65:1));
  avatar.position.set(camera.position.x,base+.018,camera.position.z);const pixels=meta.bodyHeight||meta.height;avatar.scale.set(height*meta.width/pixels,height*meta.height/pixels,1);
  shadow.position.set(camera.position.x,ground+.025,camera.position.z);shadow.scale.setScalar(eyeHeight/1.5);
  // RO directions: south/front=0, west=2, north/back=4, east=6.
  const direction=((Math.round(4-(heading-camera.rotation.y)/(Math.PI/4))%8)+8)%8;
  const next=(sitting&&meta.actions.length>=24?16:moving?8:0)+direction;if(next!==action){action=next;elapsed=0;}else elapsed+=dt*1000;
  // RO idle frames 1/2 are optional head-look poses, not a looping idle animation.
  const clip=meta.actions[action];frame=clip.start+(motion&&moving?Math.floor(elapsed/clip.frameMs)%clip.count:0);
  map.offset.set((frame%meta.columns)/meta.columns,1-(Math.floor(frame/meta.columns)+1)/meta.rows);
  target.copy(camera.position);target.y=base+height*(sitting?.36:.65);
  const pitch=T.MathUtils.clamp(.28-camera.rotation.x,-.12,.85),length=(eyeHeight<1.2?2.8:3.4)*zoomScale;
  offset.set(Math.sin(camera.rotation.y)*Math.cos(pitch),Math.sin(pitch),Math.cos(camera.rotation.y)*Math.cos(pitch)).multiplyScalar(length);
  ray.set(target,offset.clone().normalize());ray.near=.05;ray.far=length;
  const hit=ray.intersectObjects(blockers(),false).find(h=>{const m=h.object.material;return h.object.visible&&(!m?.transparent||m.opacity>.35)&&!h.object.userData.cameraIgnore;});
  distance=hit?Math.max(.18,hit.distance-.22):length;
  follow.copy(camera,false);follow.position.copy(target).addScaledVector(offset.normalize(),distance);follow.position.y=Math.max(ground+.25,follow.position.y);follow.lookAt(target.clone().add(new T.Vector3(0,height*.32,0)));follow.updateMatrixWorld(true);
  avatar.material.opacity=T.MathUtils.smoothstep(distance,.25,.8);shadow.visible=avatar.material.opacity>.2;renderCamera=follow;return follow;
 }
 return {setMode,update,appearance,zoom(f){if(Number.isFinite(f)&&f>0)zoomScale=T.MathUtils.clamp(zoomScale*f,.4,3);},camera:()=>renderCamera,mode:()=>mode,stats:()=>({mode,visible:avatar.visible,action,frame,moving,sitting:action>=16,distance,zoomScale,height:avatar.scale.y*(meta.bodyHeight||meta.height)/meta.height,appearance:appearanceBase,position:avatar.position.toArray()}),dispose(){disposed=true;loadRevision++;avatar.removeFromParent();shadow.removeFromParent();map.dispose();material.dispose();shadow.geometry.dispose();shadow.material.dispose();}};
}
