import {createTempleLanterns} from './ayothaya-selected-lights.js';
import {createRagnarokAvatar} from './ayothaya-avatar.js';
import {normalizeAyothayaBuildings} from './ayothaya-materials.js';
import {createAyothayaSky} from './ayothaya-atmosphere.js';
import {createRagnarokDecor} from './ayothaya-decor.js';
import {TEMPLE_DECOR} from './ayothaya-decor-layout.js';
import {WALK_EYE} from './ayothaya-navigation.js';
import {frameBounds,frameCityCover} from './ayothaya-camera.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {movement} from './navigation.js';
import {panOverview} from './overview-camera.js';
import {createJump} from './jump.js';
import {CITY_SCALE,CITY_SPAWN,CITY_RETURN,TEMPLE_GATE,LOBBY_SPAWN,LOBBY_RETURNS,decodeNavigation,gridSample,worldStep} from './ayothaya-navigation.js';

// The world is a view/controller; navigation and portal decisions live in pure modules.
export async function createAyothayaWorld(host,opts){
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','เมืองอโยธยาและโถงวัด 3D');host.append(canvas);
 const scene=new T.Scene();scene.background=new T.Color('#8eafba');
 const camera=new T.PerspectiveCamera(46,1,.03,600);camera.rotation.order='YXZ';
 const orbit=new OrbitControls(camera,canvas);orbit.minDistance=2;orbit.maxDistance=240;orbit.maxPolarAngle=Math.PI*.48;
 const ambient=new T.HemisphereLight('#fff6df','#657b94',1.45);scene.add(ambient);
 const sun=new T.DirectionalLight('#fff2d7',1.8);sun.position.set(-25,65,30);scene.add(sun);
 const city=new T.Group(),lobby=new T.Group();city.name='Ayothaya';lobby.name='Temple lobby';scene.add(city,lobby);
 const sky=createAyothayaSky(city),cityMaterials=new Map();let timeOfDay='day',decor,avatar,buildingColors,lanterns;let openingCover=false;
 const cameraBlockers=()=>{const list=[];(area==='city'?city:lobby).traverseVisible(o=>{if(o.isMesh&&!o.isSprite&&o.material?.side!==T.BackSide)list.push(o);});return list;};
 let ro=null,active=false,area='city',walking=false,disposed=false,dirty=true,rotate=false,motion=opts.motion!==false,speed=1,quality='balanced',frame=0,previous=0,perfAt=0,frames=0,drag=null,crouching=false,sitting=false,positionAt=0;
 const keys=new Set(),touch={forward:0,strafe:0},jump=createJump(),saved=new Map();
 const abort=new AbortController(),on=(target,event,fn,config={})=>target.addEventListener(event,fn,{...config,signal:abort.signal});
 const allocations=new Set();
 function mesh(geometry,material,x,y,z,parent=lobby){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o;}
 function box(w,h,d,x,y,z,color){return mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.85}),x,y,z);}
 function sign(text,color,width=4){
  const c=document.createElement('canvas');c.width=1024;c.height=160;const g=c.getContext('2d');g.fillStyle='#182b34';g.fillRect(0,0,1024,160);g.strokeStyle=color;g.lineWidth=6;g.strokeRect(5,5,1014,150);g.fillStyle=color;g.font='600 55px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,80,970);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;allocations.add(texture);
  return new T.Mesh(new T.PlaneGeometry(width,width*160/1024),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
 }
 function gate(x,z,yaw,text,color,parent=lobby,width=2.7,decorated=true){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=yaw;parent.add(g);
  const mat=new T.MeshStandardMaterial({color:'#ba9a58',roughness:.4,metalness:.4});
  for(const side of [-1,1])mesh(new T.BoxGeometry(.18,3.4,.24),mat,side*(width/2+.12),1.7,0,g);
  mesh(new T.BoxGeometry(width+.45,.18,.24),mat,0,3.4,0,g);
  const glow=mesh(new T.PlaneGeometry(width,3.3),new T.MeshBasicMaterial({color,transparent:true,opacity:.025,side:T.DoubleSide,depthWrite:false}),0,1.65,0,g);
  glow.name='Walk-through portal';const label=sign(text,color,Math.max(3.5,width+1));label.position.set(0,3.85,0);g.add(label);
  const ring=mesh(new T.RingGeometry(.9,1.03,48),new T.MeshBasicMaterial({color,side:T.DoubleSide}),0,.03,0,g);ring.rotation.x=-Math.PI/2;
  if(!decorated){for(const o of g.children.slice(0,3))o.visible=false;label.visible=false;}
  return g;
 }
 box(18,.25,20,0,-.15,0,'#d5c7ad');
 // Open central hall: left/right doors and a south return door, with no blocking doorway mesh.
 box(18,5,.3,0,2.5,-9.5,'#e0d3bc');
 for(const x of [-8.6,8.6])for(const z of [-5.5,5.5])box(.3,5,7.5,x,2.5,z,'#d5c7ad');
 for(const x of [-5.2,5.2])box(6.8,5,.3,x,2.5,9,'#d5c7ad');
 for(const x of [-6,6])for(const z of [-7,7]){box(.38,4.7,.38,x,2.35,z,'#8f5335');box(.65,.22,.65,x,.1,z,'#c3a267');}
 for(const x of [-4,0,4])box(.045,.008,18,x,.001,0,'#b5a484');
 for(const z of [-6,-2,2,6])box(17,.008,.045,0,.001,z,'#b5a484');
 const ceiling=box(18,.18,20,0,5,0,'#583b2c');
 const beams=[];
 for(const z of [-7,-3,1,5,8])beams.push(box(17.4,.22,.24,0,4.8,z,'#b08b4f'));
 // Low gold skirting and a red runner echo the temple exterior without obstructing walking.
 box(17,.18,.12,0,.09,-9.3,'#b08b4f');
 const runner=box(2.5,.012,12,0,.008,2.4,'#7b342f');
 for(const x of [-1.2,1.2])box(.04,.014,12,x,.009,2.4,'#ccb477');
 const title=sign('AYOTHAYA  /  TEMPLE HALL','#e5c77d',6);title.position.set(0,4.5,-9.25);lobby.add(title);
 const left=sign('←  DEVICE LIBRARY','#81d9e8',4.5);left.position.set(-4.8,3.65,-9.25);lobby.add(left);
 const right=sign('DATACENTER  →','#f1c67e',4.5);right.position.set(4.8,3.65,-9.25);lobby.add(right);
 gate(-7.8,0,Math.PI/2,'DEVICE LIBRARY','#81d9e8');
 gate(7.8,0,Math.PI/2,'DATACENTER','#f1c67e');
 gate(0,8.2,0,'AYOTHAYA  /  EXIT','#99dabd');
 const exteriorGate=gate(TEMPLE_GATE.x,TEMPLE_GATE.z,0,'TEMPLE HALL','#e8cd86',city,2.1,false);
 let nav;
 function setTime(value){timeOfDay=value==='night'?'night':'day';const night=timeOfDay==='night',outdoors=area==='city';sky.setNight(night);lanterns?.setNight(night);sky.update(camera,0,false);ambient.color.set(outdoors&&night?'#8bafff':'#fff6df');ambient.groundColor.set(outdoors&&night?'#263354':'#657b94');ambient.intensity=outdoors?(night?.85:1.45):1.6;sun.color.set(outdoors&&night?'#a4bcff':'#fff2d7');sun.intensity=outdoors?(night?.65:1.8):1.3;for(const [m,color]of cityMaterials)m.color.copy(color).multiply(outdoors&&night?new T.Color('#6b89c2'):new T.Color('#ffffff'));scene.background.set(outdoors?(night?'#101c3a':'#74bce8'):'#202e37');dirty=true;}

 try{
  const [gltf,json]=await Promise.all([
   new GLTFLoader().loadAsync('assets/ayothaya/ayothaya.glb',e=>opts.onProgress?.(e.total?Math.round(e.loaded/e.total*100):null)),
   fetch('assets/ayothaya/navigation.json').then(r=>{if(!r.ok)throw Error('โหลดเส้นทางเมืองไม่สำเร็จ');return r.json();})
  ]);
  buildingColors=normalizeAyothayaBuildings(gltf.scene);nav=decodeNavigation(json);gltf.scene.scale.setScalar(CITY_SCALE);city.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
  // Continue the source water beyond the exported map edge instead of showing a blue void.
  const water=gltf.scene.getObjectByName('water');
  if(water?.material?.map){const texture=water.material.map.clone();texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(1200,1200);texture.needsUpdate=true;
   const material=new T.MeshBasicMaterial({map:texture,color:'#ffffff',transparent:true,opacity:.565,depthWrite:false});cityMaterials.set(material,material.color.clone());
   const shape=new T.Shape([new T.Vector2(-600,-600),new T.Vector2(600,-600),new T.Vector2(600,600),new T.Vector2(-600,600)]);shape.holes.push(new T.Path([new T.Vector2(-40,-40),new T.Vector2(-40,40),new T.Vector2(40,40),new T.Vector2(40,-40)]));const sea=new T.Mesh(new T.ShapeGeometry(shape),material);sea.geometry.attributes.uv.array.forEach((v,i,a)=>a[i]=(v+600)/1200);sea.rotation.x=-Math.PI/2;sea.position.y=-1.025;sea.name='Ayothaya sea continuation';sea.userData.cameraIgnore=true;city.add(sea);const bedMaterial=new T.MeshBasicMaterial({color:'#76a47a'});cityMaterials.set(bedMaterial,bedMaterial.color.clone());const bed=new T.Mesh(sea.geometry,bedMaterial);bed.rotation.copy(sea.rotation);bed.position.y=-1.05;bed.userData.cameraIgnore=true;city.add(bed);
  }

  // Instance repeated static city props by shared geometry/material, retaining texture alpha.
  const groups=new Map();
  gltf.scene.traverse(o=>{if(o.isLight)o.visible=false;if(!o.isMesh||o.isSkinnedMesh)return;o.castShadow=false;o.receiveShadow=false;
   for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!cityMaterials.has(m))cityMaterials.set(m,m.color.clone());if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());if(m.alphaTest>0){m.transparent=false;m.depthWrite=true;}}
   const key=o.geometry.uuid+':'+(Array.isArray(o.material)?o.material.map(m=>m.uuid).join(','):o.material.uuid);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
  });
  for(const objects of groups.values())if(objects.length>2){const first=objects[0],batch=new T.InstancedMesh(first.geometry,first.material,objects.length);batch.name='Ayothaya repeated props';objects.forEach((o,i)=>{batch.setMatrixAt(i,o.matrixWorld);o.removeFromParent();});batch.computeBoundingSphere();city.add(batch);}
  exteriorGate.position.y=gridSample(nav,TEMPLE_GATE.x,TEMPLE_GATE.z)?.height||0;
  decor=await createRagnarokDecor();
  await Promise.all([decor.templeSurfaces(lobby),decor.props(lobby,TEMPLE_DECOR),decor.portal(city,TEMPLE_GATE.x,exteriorGate.position.y+.02,TEMPLE_GATE.z,1.9),decor.portal(lobby,-7.8,.02,0,2.6),decor.portal(lobby,7.8,.02,0,2.6),decor.portal(lobby,0,.02,8.2,2.6)]);
  lanterns=await createTempleLanterns(city,lobby);
  avatar=await createRagnarokAvatar(scene,{blockers:cameraBlockers});
  setTime(timeOfDay);
 }catch(error){dispose();throw error;}
 function ground(x,z){return area==='city'?(gridSample(nav,x,z)?.height||0):0;}
 function stopInput(){keys.clear();touch.forward=touch.strafe=0;drag=null;crouching=false;}
 function notify(){opts.onWalk?.(walking);opts.onArea?.(area);}
 function focus(){canvas.focus({preventScroll:true});}
 function setWalk(value){openingCover=false;stopInput();jump.reset();rotate=false;walking=value;ceiling.visible=walking;beams.forEach(o=>o.visible=walking);orbit.enabled=!walking;camera.fov=walking?70:46;
  if(walking){const pose=saved.get(area)||(area==='city'?CITY_SPAWN:LOBBY_SPAWN);camera.position.set(pose.x,ground(pose.x,pose.z)+WALK_EYE[area],pose.z);camera.rotation.set(0,pose.yaw||0,0,'YXZ');focus();}else overview();
  camera.updateProjectionMatrix();dirty=true;notify();
 }
 function overview(){openingCover=false;if(walking)saved.set(area,{x:camera.position.x,z:camera.position.z,yaw:camera.rotation.y});walking=false;stopInput();orbit.enabled=true;camera.fov=46;camera.updateProjectionMatrix();ceiling.visible=false;beams.forEach(o=>o.visible=false);const min=area==='city'?new T.Vector3(-40,-3,-40):new T.Vector3(-9,0,-10),max=area==='city'?new T.Vector3(40,12,40):new T.Vector3(9,5,10);frameBounds(camera,orbit.target,min,max);orbit.update();dirty=true;notify();}
 function show(next,{walk=true,from=null,returning=false}={}){if(walking)saved.set(area,{x:camera.position.x,z:camera.position.z,yaw:camera.rotation.y});area=next;city.visible=area==='city';lobby.visible=area==='lobby';setTime(timeOfDay);
  if(returning||area==='lobby'){const p=area==='city'?CITY_RETURN:LOBBY_RETURNS[from]||LOBBY_SPAWN;saved.set(area,{...p});}setWalk(walk);
 }
 function resize(refit=false){const r=host.getBoundingClientRect();camera.aspect=Math.max(r.width,1)/Math.max(r.height,1);camera.updateProjectionMatrix();renderer.setSize(Math.max(r.width,1),Math.max(r.height,1),false);if(refit&&!walking){const min=area==='city'?new T.Vector3(-40,-3,-40):new T.Vector3(-9,0,-10),max=area==='city'?new T.Vector3(40,12,40):new T.Vector3(9,5,10);if(openingCover&&area==='city')frameCityCover(camera,orbit.target);else frameBounds(camera,orbit.target,min,max);orbit.update();}dirty=true;}
 ro=new ResizeObserver(()=>resize(true));ro.observe(host);resize();
 const blocked=()=>!active||opts.blocked?.()||document.querySelector('dialog[open]');
 function zoom(f){openingCover=false;if(walking){if(avatar?.mode()==='third')avatar.zoom(f);else{camera.fov=T.MathUtils.clamp(camera.fov*f,25,85);camera.updateProjectionMatrix();}}else{const offset=camera.position.clone().sub(orbit.target);offset.setLength(T.MathUtils.clamp(offset.length()*f,orbit.minDistance,orbit.maxDistance));camera.position.copy(orbit.target).add(offset);orbit.update();}dirty=true;}
 on(canvas,'wheel',e=>{if(blocked()||!walking||e.deltaY===0)return;e.preventDefault();zoom(Math.exp(T.MathUtils.clamp(e.deltaY*(e.deltaMode===1?.016:e.deltaMode===2?.8:.001),-.25,.25)));},{passive:false});
 on(canvas,'pointerdown',e=>{if(blocked())return;focus();if(walking){drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}});
 on(canvas,'pointermove',e=>{if(blocked()||!walking||drag?.id!==e.pointerId)return;camera.rotation.y-=(e.clientX-drag.x)*.004;camera.rotation.x=T.MathUtils.clamp(camera.rotation.x-(e.clientY-drag.y)*.004,-1.3,1.3);drag.x=e.clientX;drag.y=e.clientY;dirty=true;});
 for(const e of ['pointerup','pointercancel','lostpointercapture'])on(canvas,e,()=>{drag=null;});
 on(canvas,'contextmenu',e=>{if(walking)e.preventDefault();});
 on(window,'keydown',e=>{if(blocked()||e.metaKey||e.ctrlKey&&!walking||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
  if(e.code==='Escape'){stopInput();return;}
  if(walking&&e.code==='Space'&&!e.target.closest?.('button,a')){e.preventDefault();if(!e.repeat)jump.trigger();}
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','ControlLeft','ControlRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
 });
 on(window,'keyup',e=>keys.delete(e.code));on(window,'blur',stopInput);on(document,'visibilitychange',()=>{stopInput();previous=0;});
 orbit.addEventListener('change',()=>{dirty=true;});
 function render(){if(active&&!disposed){const view=avatar?.update(camera,{walking,time:previous,eyeHeight:WALK_EYE[area],ground:ground(camera.position.x,camera.position.z),motion,sitting,crouching:crouching||keys.has('ControlLeft')||keys.has('ControlRight')})||camera;sky.update(view,previous,motion);lanterns?.update(view);renderer.render(scene,view);dirty=false;frames++;}}
 function tick(t){if(disposed)return;frame=requestAnimationFrame(tick);const dt=previous?Math.min((t-previous)/1000,.05):0;previous=t;if(!active||document.hidden)return;
  if(!blocked()){
   if(walking){const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+touch.forward,s=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+touch.strafe;
    const {dx,dz}=movement(f,s,camera.rotation.y,dt,keys.has('ShiftLeft')||keys.has('ShiftRight')),p=worldStep(area,nav,camera.position,dx*speed,dz*speed);camera.position.x=p.x;camera.position.z=p.z;
    const h=ground(p.x,p.z)+(sitting?WALK_EYE[area]*.55:crouching||keys.has('ControlLeft')||keys.has('ControlRight')?WALK_EYE[area]*.65:WALK_EYE[area])+jump.step(dt,area==='lobby'?2.5:50)*(area==='city'?.55:1);if(dx||dz||Math.abs(camera.position.y-h)>.001)dirty=true;camera.position.y=h;
    opts.onStep?.(dt,area,p.x,p.z);if(t-positionAt>120){positionAt=t;opts.onPosition?.(p.x,p.z,camera.rotation.y);}
   }else{const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),s=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);if(panOverview(camera,orbit.target,f,s,dt,keys.has('ShiftLeft')||keys.has('ShiftRight'))){orbit.update();dirty=true;}else if(rotate&&motion){const delta=camera.position.clone().sub(orbit.target).applyAxisAngle(new T.Vector3(0,1,0),dt*.08);camera.position.copy(orbit.target).add(delta);orbit.update();dirty=true;}}
  }
  sky.update(camera,t,motion);if(decor?.update(t,motion))dirty=true;if(area==='city'&&motion)dirty=true;
  if(walking&&avatar?.mode()==='third')dirty=true;if(dirty)render();if(t-perfAt>2000){opts.onPerformance?.({fps:Math.round(frames*1000/Math.max(t-perfAt,1)),calls:renderer.info.render.calls,quality,scale:1});frames=0;perfAt=t;}
 }
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);abort.abort();ro?.disconnect();orbit.dispose();avatar?.dispose();lanterns?.dispose();decor?.dispose();const gs=new Set(),ms=new Set(),ts=new Set(allocations);scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)gs.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 frame=requestAnimationFrame(tick);show('city',{walk:false});openingCover=true;resize(true);
 return {sit(v){sitting=!!v;stopInput();jump.reset();dirty=true;},openingView(){overview();openingCover=true;resize(true);},async appearance(base){await avatar?.appearance(base);dirty=true;},perspective(value){avatar?.setMode(value);dirty=true;},timeOfDay:setTime,visualStats:()=>({timeOfDay,eyeHeight:WALK_EYE[area],decor:decor?.stats(),avatar:avatar?.stats(),lanterns:lanterns?.stats(),buildingColors}),show,overview,walk:setWalk,isWalking:()=>walking,focusWalkInput:focus,pauseWalkInput:stopInput,renderReady:render,
  setActive(v){active=v;orbit.enabled=v&&!walking;stopInput();resize();dirty=true;},
  zoom,
  touch(f,s){touch.forward=f;touch.strafe=s;},crouch(v){crouching=v;},speed(v){speed=T.MathUtils.clamp(Number(v)||1,.5,2);},motion(v){motion=v;},
  quality(v){quality=v;renderer.setPixelRatio(Math.min(devicePixelRatio,['low','performance'].includes(v)?1:v==='high'?2:1.5));resize();},
  rotateOverview(){if(walking)overview();rotate=!rotate;return rotate;},stopPresentation(){rotate=false;},interruptPresentation(){rotate=false;},
  snapshot(){return {area,walking,timeOfDay,position:camera.position.toArray(),rotation:camera.rotation.toArray(),target:orbit.target.toArray(),fov:camera.fov,saved:[...saved]};},
  restore(v){if(!v)return;if(v.timeOfDay)setTime(v.timeOfDay);show(v.area,{walk:v.walking});saved.clear();for(const [k,p]of v.saved||[])saved.set(k,p);camera.position.fromArray(v.position);camera.rotation.fromArray(v.rotation);orbit.target.fromArray(v.target);camera.fov=v.fov;camera.updateProjectionMatrix();if(!walking)orbit.update();dirty=true;},
  dispose};
}
