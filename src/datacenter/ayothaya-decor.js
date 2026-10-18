import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const BASE='assets/ayothaya/decor/';
export async function createRagnarokDecor(){
 const response=await fetch(BASE+'manifest.json');if(!response.ok)throw Error('Ragnarok decoration manifest unavailable');
 const manifest=await response.json(),loader=new T.TextureLoader(),modelLoader=new GLTFLoader(),textures=new Map(),models=new Map(),roots=[],animated=[];
 const texture=id=>{if(!textures.has(id))textures.set(id,loader.loadAsync(BASE+id+'.png').then(t=>{t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=!manifest.sprites[id];t.minFilter=t.generateMipmaps?T.LinearMipmapLinearFilter:T.LinearFilter;t.magFilter=T.LinearFilter;return t;}));return textures.get(id);};
 const model=id=>{if(!models.has(id))models.set(id,modelLoader.loadAsync(BASE+id+'.glb').then(g=>g.scene));return models.get(id);};
 async function sprite(id,height,additive=false){
  const t=await texture(id),m=manifest.sprites[id];t.repeat.set(1/m.columns,1/m.rows);t.offset.set(0,1-1/m.rows);
  const material=new T.SpriteMaterial({map:t,transparent:true,depthWrite:false,alphaTest:additive?0:.025,toneMapped:false,blending:additive?T.AdditiveBlending:T.NormalBlending});
  const s=new T.Sprite(material);s.center.set(.5,0);s.scale.set(height*m.width/m.height,height,1);s.name='RO sprite: '+id;
  if(m.frames>1&&!animated.some(a=>a.id===id))animated.push({id,t,m,frame:-1});return s;
 }
 async function portal(parent,x,y,z,height=2){
  const root=new T.Group();root.position.set(x,y,z);root.name='Ragnarok animated warp';parent.add(root);roots.push(root);
  const [s,beam]=await Promise.all([sprite('portal',height),sprite('warp-light',height*1.2,true)]);
  s.material.opacity=.85;beam.material.opacity=.35;root.add(s,beam);
  const ring=new T.Mesh(new T.RingGeometry(height*.24,height*.28,48),new T.MeshBasicMaterial({color:'#7adfff',transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;root.add(ring);
  return root;
 }
 async function props(parent,items){
  await Promise.all(items.map(async p=>{const source=await model(p.id),object=source.clone(true),group=new T.Group();group.name='RO prop: '+p.id;group.add(object);
   const bounds=new T.Box3().setFromObject(object),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
   const scale=Math.min(p.height/Math.max(size.y,.001),p.width/Math.max(p.depth?size.x:Math.max(size.x,size.z),.001),p.depth?p.depth/Math.max(size.z,.001):Infinity);object.scale.multiplyScalar(scale);object.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
   group.rotation.y=p.yaw||0;group.position.set(p.x,p.y||0,p.z);parent.add(group);roots.push(group);
  }));
 }
 async function person(parent,id,x,z,height=1.45){const s=await sprite(id,height);s.position.set(x,0,z);parent.add(s);roots.push(s);return s;}
 function labWorkspace(parent,benches,label){
  const metal=new T.MeshStandardMaterial({color:'#637d8c',metalness:.4,roughness:.6}),top=new T.MeshStandardMaterial({color:'#253c48',roughness:.85}),trim=new T.MeshStandardMaterial({color:'#b2c7d1',metalness:.5,roughness:.4});
  for(const p of benches){const g=new T.Group();g.position.set(p.x,0,p.z);g.rotation.y=p.yaw||0;parent.add(g);roots.push(g);
   const box=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;};
   box(p.width,.08,p.depth,0,.86,0,top);
   for(const x of [-p.width/2+.25,p.width/2-.25]){box(.44,.8,p.depth-.08,x,.4,0,metal);for(const y of [.25,.49,.73]){box(.4,.012,.025,x,y,p.depth/2-.025,trim);box(.16,.025,.03,x,y-.07,p.depth/2,trim);}}
   // A service mat and closed instrument case rest directly on the bench.
   box(.72,.01,.48,.2,.907,.02,new T.MeshStandardMaterial({color:'#4c8b89',roughness:1}));box(.42,.17,.3,-.65,.985,0,metal);
   box(p.width,.055,.08,0,.16,-p.depth/2+.08,trim);
   // Physical shelf and bracket under the imported control panel; no floating equipment.
   box(1.7,.05,.38,0,.925,-p.depth/2-.05,metal);
   for(const x of [-.6,.6]){box(.045,.36,.045,x,.72,-p.depth/2-.20,trim);box(.045,.045,.35,x,.55,-p.depth/2-.04,trim);}
   const cv=document.createElement('canvas');cv.width=768;cv.height=96;const ctx=cv.getContext('2d');ctx.fillStyle='#183541';ctx.fillRect(0,0,768,96);ctx.fillStyle='#b7e9ec';ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillText(label,384,60);
   const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(p.width,.3),new T.MeshBasicMaterial({map:tx}));sign.position.set(0,2.5,-p.depth/2+.04);g.add(sign);
   // Continuous wall service duct and vertical drop, mounted behind the desk.
   box(p.width,.12,.13,0,2.2,-p.depth/2+.06,metal);box(.08,1.24,.12,p.width/2-.12,1.54,-p.depth/2+.06,metal);
  }
 }
 async function templeSurfaces(parent){
  const [wood,mural,carpet]=await Promise.all(['temple-wood','temple-mural','temple-carpet'].map(texture));
  wood.wrapS=wood.wrapT=T.RepeatWrapping;wood.repeat.set(6,7);wood.anisotropy=4;
  carpet.wrapT=T.MirroredRepeatWrapping;carpet.repeat.set(1,8);carpet.anisotropy=4;
  const floor=new T.Mesh(new T.PlaneGeometry(17.1,18.1),new T.MeshStandardMaterial({map:wood,roughness:.85,color:'#f4e1c0'}));floor.rotation.x=-Math.PI/2;floor.position.set(0,.018,-.1);parent.add(floor);roots.push(floor);
  // Select the original red mural quadrant in UV space; retain its original pixels.
  mural.repeat.set(.5,.5);mural.offset.set(.5,0);
  for(const x of [-4.2,4.2]){const panel=new T.Mesh(new T.PlaneGeometry(3.4,2.5),new T.MeshBasicMaterial({map:mural,color:'#f4dda9'}));panel.position.set(x,1.9,-9.31);parent.add(panel);roots.push(panel);}
  const rug=new T.Mesh(new T.PlaneGeometry(2.5,11.8),new T.MeshStandardMaterial({map:carpet,roughness:1,color:'#d5a383'}));rug.rotation.x=-Math.PI/2; rug.position.set(0,.032,2.4);parent.add(rug);roots.push(rug);
 }
 return {portal,props,person,templeSurfaces,labWorkspace,
  update(time,motion){let changed=false;for(const a of animated){const frame=motion?Math.floor(time/a.m.frameMs)%a.m.frames:Math.floor(a.m.frames/2);if(frame===a.frame)continue;a.frame=frame;a.t.offset.set((frame%a.m.columns)/a.m.columns,1-(Math.floor(frame/a.m.columns)+1)/a.m.rows);changed=true;}return changed;},
  stats:()=>({props:roots.filter(r=>r.name.startsWith('RO prop')).length,portals:roots.filter(r=>r.name==='Ragnarok animated warp').length,sprites:roots.filter(r=>r.isSprite).length,frames:animated.map(a=>({id:a.id,frame:a.frame}))}),
  dispose(){const gs=new Set(),ms=new Set(),ts=new Set();for(const root of roots){root.removeFromParent();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){ms.add(m);for(const t of Object.values(m))if(t?.isTexture)ts.add(t);}});}gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());for(const p of textures.values())p.then(t=>{if(!ts.has(t))t.dispose();});roots.length=0;}
 };
}
