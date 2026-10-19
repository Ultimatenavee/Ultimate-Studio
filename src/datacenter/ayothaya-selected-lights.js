import {createStaticLightField,createFixedGlows} from './static-city-lighting.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CITY_LANTERNS,CITY_STRINGS,INDOOR_CHANDELIERS} from './ayothaya-decor-layout.js';

// Original GRF models; the catalogue records the exact source of each selection.
async function fixtures(scene,ids){
 const sources=new Map(await Promise.all([...new Set(ids)].map(async id=>[id,(await new GLTFLoader().loadAsync('assets/ayothaya/light-catalog/'+id+'.glb')).scene])));
 const roots=[],emitters=[],lights=[],models={},boxGeometries=new Map();let enabled=false;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const c=canvas.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff8d9');g.addColorStop(.18,'#ffd88bc0');g.addColorStop(.48,'#ffac3c40');g.addColorStop(1,'#ffac3c00');c.fillStyle=g;c.fillRect(0,0,64,64);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const stone=new T.MeshStandardMaterial({color:'#a89b86',roughness:1}),timber=new T.MeshStandardMaterial({color:'#62452d',roughness:.9}),metal=new T.MeshStandardMaterial({color:'#493c30',metalness:.6,roughness:.55});
 function own(o,parent){parent.add(o);roots.push(o);return o;}
 function box(parent,w,h,d,x,y,z,material=stone){const key=[w,h,d].join(',');if(!boxGeometries.has(key))boxGeometries.set(key,new T.BoxGeometry(w,h,d));const m=new T.Mesh(boxGeometries.get(key),material);m.position.set(x,y,z);return own(m,parent);}
 function model(id,parent,x,y,z,measure,axis='y',yaw=0){
  const o=sources.get(id).clone(true),b=new T.Box3().setFromObject(o),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3()),scale=measure/size[axis];
  const root=new T.Group();root.name='Ragnarok light '+id;root.userData.lightAsset=id;o.scale.multiplyScalar(scale);o.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);root.add(o);root.position.set(x,y,z);root.rotation.y=yaw;own(root,parent);models[id]=(models[id]||0)+1;return root;
 }
 function glow(parent,x,y,z,size=.35,color='#ffce88',intensity=13,pointLight=false){
  const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));sprite.position.set(x,y,z);sprite.scale.set(size,size,1);sprite.userData.cameraIgnore=true;own(sprite,parent);
  if(pointLight){const light=new T.PointLight(color,intensity,9,2);light.position.set(x,y,z);light.userData.fixedIntensity=intensity;parent.add(light);lights.push(light);}
  emitters.push({parent,position:sprite.position.clone(),sprite,color,intensity});
 }
 function chandelier(parent,p){model(p.id,parent,p.x,p.y,p.z,p.height);const top=p.y+p.height,length=p.ceiling-top;
  if(length>0){const chain=new T.Mesh(new T.CylinderGeometry(.012,.012,length,6),metal);chain.position.set(p.x,top+length/2,p.z);own(chain,parent);}
  box(parent,.18,.045,.18,p.x,p.ceiling,p.z,metal);
  glow(parent,p.x,p.y+p.height*.45,p.z,.55,p.id==='L238'?'#e6c0ff':'#ffd89b',16,true);
 }
 function setNight(v){enabled=!!v;for(const e of emitters)e.sprite.visible=enabled;for(const l of lights){l.visible=enabled;l.intensity=enabled?l.userData.fixedIntensity:0;}}
 function visible(parent){for(let p=parent;p;p=p.parent)if(!p.visible)return false;return true;}
 function update(){} // Fixed lights and fields never follow the camera.
 function batch(parent){parent.updateMatrixWorld(true);const groups=new Map(),inverse=parent.matrixWorld.clone().invert();for(const root of roots.filter(o=>o.parent===parent))root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;const key=o.geometry.uuid+o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});for(const row of groups.values()){if(row.length<2)continue;const m=new T.InstancedMesh(row[0].geometry,row[0].material,row.length);m.name='Ragnarok static light fixtures';row.forEach((o,i)=>{m.setMatrixAt(i,o.matrixWorld.clone().premultiply(inverse));o.removeFromParent();});m.computeBoundingSphere();own(m,parent);}}
 function stats(){return {count:emitters.length,models:{...models},lit:enabled?emitters.length:0,activeLights:lights.filter(l=>visible(l)&&l.intensity>0).length};}
 function dispose(){const gs=new Set(boxGeometries.values()),ms=new Set([stone,timber,metal]),ts=new Set([texture]);for(const o of [...roots,...lights,...sources.values()]){o.removeFromParent();o.traverse(n=>{if(n.isInstancedMesh)n.dispose();if(n.geometry)gs.add(n.geometry);for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[]){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}});}gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());}
 return {model,glow,box,own,chandelier,stone,timber,batch,setNight,update,stats,dispose};
}

export async function createTempleLanterns(city,lobby){
 const extension=await fetch('assets/ayothaya/lighting-extension.json?v=fixed-v1').then(r=>{if(!r.ok)throw Error('Ayothaya lighting unavailable');return r.json();});
 const f=await fixtures(city.parent,['L047','L107','L026','L027','L013','L241']);
 for(const p of CITY_LANTERNS){
  if(p.id==='post')continue;
  if(p.id==='L013'){
   f.box(city,1.1,.08,1.1,p.x,p.y+.04,p.z);f.model(p.id,city,p.x,p.y+.08,p.z,.52);
   f.glow(city,p.x,p.y+.66,p.z,.55,'#ffaf5b',16);
  }else if(p.id==='L107'){
   f.model(p.id,city,p.x,p.y+.02,p.z,2.8);
   // Centres of the two lantern housings in the normalized L107 geometry.
   for(const [x,y] of [[-.187,2.56],[.303,1.88]])f.glow(city,p.x+x,p.y+y+.02,p.z,.24,'#ffd498',10);
  }else{
   f.box(city,.72,.12,.72,p.x,p.y+.06,p.z);f.model(p.id,city,p.x,p.y+.12,p.z,1.6);
   f.glow(city,p.x,p.y+1.18,p.z,.3);
  }
 }
 for(const s of CITY_STRINGS){
  const [a,b]=s.ends.map(i=>CITY_LANTERNS[i]),span=Math.hypot(b.x-a.x,b.z-a.z),top=Math.max(a.y,b.y)+3.8;
  for(const p of [a,b]){f.box(city,.72,.16,.72,p.x,p.y+.08,p.z);f.box(city,.13,top-p.y,.13,p.x,(top+p.y)/2,p.z,f.timber);}
  f.model(s.id,city,(a.x+b.x)/2,top-span*.127232,(a.z+b.z)/2,span,'x',-Math.atan2(b.z-a.z,b.x-a.x));
  for(let i=0;i<5;i++){const t=(i+.5)/5;f.glow(city,a.x+(b.x-a.x)*t,top-span*.078,a.z+(b.z-a.z)*t,.28,s.id==='L027'?['#ffbb77','#a1e4ff','#ffc9e6','#b8e99a','#ffd98b'][i]:'#ffdd9e',5);}
 }
 for(const p of extension.added){f.model(p.id,city,p.x,p.y,p.z,p.height);f.glow(city,p.x,p.y+p.height*.66,p.z,.38);}
 INDOOR_CHANDELIERS.lobby.forEach(p=>f.chandelier(lobby,p));f.batch(city);f.batch(lobby);const field=createStaticLightField(city,extension.sources,{radius:16,height:8});f.setNight(false);
 return {setNight(v){f.setNight(v);field.setNight(v);},update:f.update,stats:()=>({...f.stats(),city:extension.sources.length,added:extension.added.length,supports:CITY_LANTERNS.length,field:field.stats()}),dispose(){field.dispose();f.dispose();}};
}

export async function createInteriorChandeliers(scene,library,datacenter){
 const f=await fixtures(scene,['L233','L238']);
 INDOOR_CHANDELIERS.museum.forEach(p=>f.chandelier(library,p));INDOOR_CHANDELIERS.datacenter.forEach(p=>f.chandelier(datacenter,p));f.setNight(true);return f;
}

export async function createCapitalLanterns(capital,layout){
 const f=await fixtures(capital,layout.added.map(p=>p.id));
 for(const p of layout.added)f.model(p.id,capital,p.x,p.y,p.z,p.height);
 f.batch(capital);const glows=createFixedGlows(capital,layout.emitters),field=createStaticLightField(capital,layout.sources,{bounds:[-180,180,-180,180],radius:layout.field_radius,height:15});
 return {updateTransform:field.updateTransform,setNight(v){glows.setNight(v);field.setNight(v);},stats:()=>({lamps:layout.sources.length,added:layout.added.length,models:f.stats().models,glows:glows.stats(),field:field.stats()}),dispose(){field.dispose();glows.dispose();f.dispose();}};
}
