import {createWardrobe,savedAppearance} from './ayothaya-wardrobe.js';
import {WALK_EYE} from './ayothaya-navigation.js';
import {createScene as createInterior} from './scene.js';
import {createAyothayaWorld} from './ayothaya-world.js';
import {AREA_NAMES,createPortalLatch} from './ayothaya-navigation.js';
import {ayothayaMap} from './ayothaya-map.js';

// Keeps the existing rack editor and device museum intact behind room portals.
export async function createScene(host,opts){
 let area='city',world,interior,disposed=false,ready=false,timeOfDay='day',perspective='first',sitting=false,wardrobe;
 try{timeOfDay=localStorage.getItem('uts-ayothaya-sky')==='night'?'night':'day';}catch{}

 const gate=createPortalLatch(),isIndoor=()=>area==='museum'||area==='datacenter';
 const outdoorHost=document.createElement('div'),indoorHost=document.createElement('div');
 for(const node of [outdoorHost,indoorHost]){node.className='ayothaya-surface';host.append(node);}
 indoorHost.style.visibility='hidden';indoorHost.style.pointerEvents='none';
 const fade=document.createElement('div');fade.className='ayothaya-fade';fade.setAttribute('role','status');fade.setAttribute('aria-live','polite');fade.hidden=true;host.append(fade);
 const place=document.createElement('div');place.className='ayothaya-place';place.innerHTML='<b></b><span></span><button type="button">กลับโถงกลาง</button>';host.append(place);
 const back=place.querySelector('button');back.onclick=()=>warp(area==='lobby'?'city':'lobby');
 const skyButton=document.createElement('button');skyButton.type='button';skyButton.className='ayothaya-sky-toggle';host.append(skyButton);
 function setTime(value){timeOfDay=value==='night'?'night':'day';world?.timeOfDay(timeOfDay);skyButton.textContent=timeOfDay==='night'?'☾ กลางคืน':'☀ กลางวัน';skyButton.setAttribute('aria-label','สลับท้องฟ้ากลางวันและกลางคืน');skyButton.setAttribute('aria-pressed',String(timeOfDay==='night'));try{localStorage.setItem('uts-ayothaya-sky',timeOfDay);}catch{}}
 skyButton.onclick=()=>{setTime(timeOfDay==='night'?'day':'night');current().focusWalkInput();};
 const cameraModes=document.createElement('div');cameraModes.className='ayothaya-camera-modes';cameraModes.setAttribute('role','group');cameraModes.setAttribute('aria-label','มุมมองการเดิน');host.append(cameraModes);
 for(const [value,label]of [['first','◉ First Person'],['third','♙ บุคคลที่สาม']]){const b=document.createElement('button');b.type='button';b.dataset.perspective=value;b.textContent=label;b.title=value==='first'?'มองผ่านสายตาตัวละคร':'เห็นตัวละครและชุดที่สวมใส่';b.onclick=()=>{if(!ready||gate.busy)return;setPerspective(value,{start:true});current().focusWalkInput();};cameraModes.append(b);}
 const sitButton=document.createElement('button');sitButton.type='button';sitButton.className='ayothaya-sit-toggle';sitButton.textContent='นั่ง · Ins';sitButton.hidden=true;host.append(sitButton);
 function setSit(value){sitting=!!value;world?.sit(sitting);interior?.sit(sitting);sitButton.textContent=sitting?'ยืน · Ins':'นั่ง · Ins';sitButton.setAttribute('aria-pressed',String(sitting));host.dataset.sitting=String(sitting);}
 sitButton.onclick=()=>{if(ready&&!gate.busy&&current().isWalking()){setSit(!sitting);current().focusWalkInput();}};
 const postureInput=new AbortController();
 window.addEventListener('keydown',e=>{if(!ready||gate.busy||!current().isWalking()||document.querySelector('dialog[open]')||e.target.closest?.('input,textarea,select,[contenteditable=true]')||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==='Insert'){e.preventDefault();if(!e.repeat)setSit(!sitting);}
  else if(sitting&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))setSit(false);
 },{capture:true,signal:postureInput.signal});
 function setPerspective(value,{start=false}={}){perspective=value==='third'?'third':'first';world?.perspective(perspective);interior?.perspective(perspective);cameraModes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.perspective===perspective)));if(start&&!current().isWalking())current().walk(true);host.dataset.perspective=perspective;const label=document.getElementById('walkViewLabel');if(label)label.textContent=perspective==='third'?'THIRD PERSON':'FIRST PERSON';sitButton.hidden=!current().isWalking();}
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function announce(){
  opts.onMuseumZone?.(area==='museum'?'library':area==='datacenter'?'datacenter':'outdoor');
  sitButton.hidden=!(isIndoor()?interior:world)?.isWalking();opts.onArea?.(area);place.querySelector('b').textContent=AREA_NAMES[area];
  place.querySelector('span').textContent=area==='city'?'เดินเข้าประตูวัดใหญ่เพื่อวาร์ป':area==='lobby'?'ซ้าย Device Library · ขวา Datacenter · ด้านหลังออกเมือง':'เดินเข้าประตู EXIT เพื่อกลับโถงกลาง';
  back.hidden=area==='city';back.textContent=area==='lobby'?'กลับเมือง':'กลับโถงกลาง';
 }
 function visibility(){
  const indoors=isIndoor();outdoorHost.style.visibility=indoors?'hidden':'visible';outdoorHost.style.pointerEvents=indoors?'none':'auto';indoorHost.style.visibility=indoors?'visible':'hidden';indoorHost.style.pointerEvents=indoors?'auto':'none';
  world?.setActive(!indoors&&!gate.busy);interior?.setActive(indoors&&!gate.busy);host.dataset.area=area;
 }
 function activateInterior(next){
  if(!interior)return;world.pauseWalkInput();area=next;interior.interiorRoom(next);visibility();opts.onWalk?.(interior.isWalking());announce();
 }
 async function travel(next,walking=true,zone){
  setSit(false);const from=area;
  if(next==='museum'||next==='datacenter'){
   activateInterior(next);await interior.visitZone(zone||(next==='museum'?'welcome':'datacenter'),walking);
  }else{
   interior?.pauseWalkInput();interior?.stopTour();interior?.cancelDeviceDrag();interior?.placement(false);opts.onCancelPlace?.();area=next;visibility();world.show(next,{walk:walking,from,returning:from==='lobby'&&next==='city'});
  }
  announce();
 }
 async function warp(next){
  if(disposed||!ready||!gate.begin())return false;
  const previous=api.snapshot();world.pauseWalkInput();interior.pauseWalkInput();visibility();
  fade.hidden=false;fade.replaceChildren();const spiral=document.createElement('i');spiral.className='ayothaya-warp-burst';spiral.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent='กำลังเข้าสู่ '+AREA_NAMES[next];fade.append(spiral,label);fade.classList.add('is-active');
  try{
   await delay(matchMedia('(prefers-reduced-motion: reduce)').matches?0:360);
   if(disposed)return false;
   await travel(next,true);
   await delay(180);
   return true;
  }catch(error){
   await api.restore(previous);opts.onHint?.('วาร์ปไม่สำเร็จ กรุณาลองอีกครั้ง');console.warn('Ayothaya portal:',error);return false;
  }finally{
   gate.finish();fade.classList.remove('is-active');fade.hidden=true;
   if(!disposed){visibility();(isIndoor()?interior:world).focusWalkInput();}
  }
 }
 const onStep=(dt,map,x,z)=>{const next=gate.tick(dt,map,x,z,true);if(next)void warp(next);};
 const interiorOpts={...opts,indoorOnly:true,eyeHeight:WALK_EYE.interior};
 // Inactive renderers never update UI or consume input in the other map.
 for(const [key,value]of Object.entries(opts))if(key.startsWith('on')&&typeof value==='function'&&!['onAssets','onMuseumReady'].includes(key))interiorOpts[key]=(...args)=>{if(isIndoor())return value(...args);};
 const indoorWalk=interiorOpts.onWalk;interiorOpts.onWalk=value=>{if(isIndoor()){if(!value)setSit(false);sitButton.hidden=!value;indoorWalk?.(value);}};
 interiorOpts.onPosition=(x,z,yaw)=>{if(!isIndoor())return;opts.onPosition?.(x,z,yaw);onStep(.12,area,x,z);};
 try{
  world=await createAyothayaWorld(outdoorHost,{
   motion:opts.motion,blocked:()=>gate.busy,onProgress:p=>opts.onHint?.(p===null?'กำลังโหลดเมืองอโยธยา…':`กำลังโหลดเมืองอโยธยา ${p}%`),onStep,
   onWalk:value=>{if(!isIndoor()){if(!value)setSit(false);sitButton.hidden=!value;opts.onWalk?.(value);}},onArea:()=>{if(ready&&!isIndoor())announce();},
   onPosition:(x,z,yaw)=>{if(!isIndoor())opts.onPosition?.(x,z,yaw);},onPerformance:p=>{if(!isIndoor())opts.onPerformance?.(p);}
  });
  interior=await createInterior(indoorHost,interiorOpts);interior.setActive(false);await interior.ensureMuseum();interior.interiorRoom('datacenter');
 }catch(error){world?.dispose();interior?.dispose();outdoorHost.remove();indoorHost.remove();fade.remove();place.remove();skyButton.remove();cameraModes.remove();sitButton.remove();postureInput.abort();throw error;}
 const current=()=>isIndoor()?interior:world;
 const api=new Proxy({
  sit(value){if(current().isWalking())setSit(value);},touch(f,s){if((f||s)&&sitting)setSit(false);current().touch(f,s);},
  async appearance(base){await Promise.all([world.appearance(base),interior.appearance(base)]);},perspective:(value)=>setPerspective(value),timeOfDay:setTime,visualStats:()=>({timeOfDay,perspective,sitting,world:world.visualStats(),interior:interior.visualStats()}),currentArea:()=>area,mapView:()=>ayothayaMap(area),
  async visitCampus(id,walking=false){if(gate.busy)return false;const next=({campus:'city',garden:'city',temple:'lobby'})[id]||id;if(!AREA_NAMES[next])return false;await travel(next,walking);return true;},
  visitTemple:()=>gate.busy?false:travel('lobby',true),visitZone:(id,walking=true)=>gate.busy?false:travel(id==='datacenter'?'datacenter':'museum',walking,id),
  async focusExhibit(id){if(area!=='museum')await travel('museum',true);return interior.focusExhibit(id);},
  async tour(){await travel('museum',true);return interior.tour();},
  openingView(){setSit(false);world.openingView();announce();},overview(){setSit(false);current().overview();announce();},walk(v){if(!v)setSit(false);current().walk(v);announce();},isWalking:()=>current().isWalking(),
  ensureMuseum:()=>interior.ensureMuseum(),assetsReady:()=>interior.assetsReady(),renderReady:()=>current().renderReady(),
  select(...args){if(area!=='datacenter')activateInterior('datacenter');return interior.select(...args);},
  view(...args){if(area!=='datacenter')activateInterior('datacenter');return interior.view(...args);},
  layout(...args){if(area!=='datacenter')activateInterior('datacenter');return interior.layout(...args);},
  placement(value){if(value&&area!=='datacenter')activateInterior('datacenter');return interior.placement(value);},
  speed(v){world.speed(v);interior.speed(v);},quality(v){world.quality(v);interior.quality(v);},motion(v){world.motion(v);interior.motion(v);},
  pauseWalkInput(){world.pauseWalkInput();interior.pauseWalkInput();},
  startDrone:()=>travel('city',false).then(()=>world.rotateOverview()),stopDrone(){world.stopPresentation();interior.stopDrone();},
  rotateOverview(){const result=current().rotateOverview();opts.onRotate?.(!!result);return result;},
  stopPresentation(){world.stopPresentation();interior.stopPresentation();opts.onRotate?.(false);},interruptPresentation(){world.interruptPresentation();interior.interruptPresentation();},
  snapshot:()=>({ayothaya:true,area,timeOfDay,perspective,sitting,world:world.snapshot(),interior:interior.snapshot()}),
  async restore(v){if(!v)return;setSit(false);if(!v.ayothaya){activateInterior('datacenter');await interior.restore(v);return;}if(v.timeOfDay)setTime(v.timeOfDay);setPerspective(v.perspective||'first');area=v.area;interior.interiorRoom(area==='museum'?'museum':'datacenter');await interior.restore(v.interior);world.restore(v.world);if(v.sitting&&current().isWalking())setSit(true);visibility();announce();opts.onWalk?.(current().isWalking());},
  dispose(){if(disposed)return;disposed=true;wardrobe?.dispose();world.dispose();interior.dispose();outdoorHost.remove();indoorHost.remove();fade.remove();place.remove();skyButton.remove();cameraModes.remove();sitButton.remove();postureInput.abort();},
 },{get(target,key){if(key in target)return target[key];const navigation=['zoom','touch','crouch','focusWalkInput'];const owner=navigation.includes(key)?current():interior;const value=owner[key];return typeof value==='function'?value.bind(owner):value;}});
 wardrobe=createWardrobe(host,{apply:async base=>{await api.appearance(base);setPerspective('third',{start:true});},pause:()=>api.pauseWalkInput()});
 const saved=savedAppearance();if(saved?.base)try{const metadata=await fetch(saved.base+'.json').then(r=>r.json());if(metadata.version!==4&&saved.appearance){const response=await fetch('/api/ayothaya/wardrobe/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(saved.appearance)});if(!response.ok)throw Error('Outfit migration failed');const updated=await response.json();await api.appearance(updated.base);try{localStorage.setItem('uts-ayothaya-appearance',JSON.stringify(updated));}catch{}}else await api.appearance(saved.base);}catch{opts.onHint?.('โหลดชุดที่บันทึกไว้ไม่ได้ ใช้ Novice ชั่วคราว');}
 ready=true;setTime(timeOfDay);setPerspective(perspective);visibility();announce();opts.onHint?.('เดินเข้าประตูวัดใหญ่เพื่อเข้าสู่ Device Library และ Datacenter');return api;
}
