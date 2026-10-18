import {packDeviceTexture} from './texture-assets.js';
import {createOpticalModel,opticalDimensions} from './optical-model.js';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// Device dimensions are separate from the engineering catalog. Unknown surfaces remain blank.
export function dimensions(model){if(model.category==='optic')return opticalDimensions(model);const d=model.physical?.dimensionsMm;return {width:(d?.width||440)/1000,height:(d?.height||model.rackProfile?.heightMm||model.u*44.45)/1000,depth:(d?.depth||450)/1000,verified:!!(d?.width&&d?.depth&&d?.height)}}
export function createDeviceModel(model,{invalidate=()=>{},detail=true,textureCache=null,preserveFaceColors=false,loadingManager=undefined}={}){
 if(model.category==='optic')return createOpticalModel(model,{detail});
 const refiners=[];const pending=[];const group=new T.Group(),textures=new Set(),geometries=new Set(),materials=new Set();let disposed=false;
 const dim=dimensions(model),{width:w,height:h,depth:d}=dim;
 const metal=new T.MeshStandardMaterial({color:0x879095,metalness:.68,roughness:.33});materials.add(metal);
 if(detail){const data=new Uint8Array(128*16*4);for(let y=0;y<16;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,v=170+((y*37+x*3)%25);data[i]=data[i+1]=data[i+2]=v;data[i+3]=255}const grain=new T.DataTexture(data,128,16);grain.needsUpdate=true;grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(3,12);textures.add(grain);metal.bumpMap=grain;metal.bumpScale=.00008;}
 const box=(ww,hh,dd,x,y,z,material=metal,rounded=false)=>{const geo=rounded?new RoundedBoxGeometry(ww,hh,dd,2,Math.min(.002,hh/5)):new T.BoxGeometry(ww,hh,dd);geometries.add(geo);const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m};
 box(w,h,d,0,0,0,metal,detail);
 // Subtle chassis seam, without inventing vents, modules or sockets.
 const seam=new T.MeshStandardMaterial({color:0x394248,metalness:.5,roughness:.5});materials.add(seam);
 box(w*.99,.0008,d*.985,0,h/2-.001,0,seam);
 const loader=new T.TextureLoader(loadingManager);
 for(const [side,info]of Object.entries(model.images||{})){
  if(!['front','rear'].includes(side)||!info.src)continue;
  const cacheKey=info.src+JSON.stringify(info.frame||[]);let tex=textureCache?.get(cacheKey);if(!tex){let resolve;pending.push(new Promise(r=>resolve=r));tex=loader.load(info.src,loaded=>{packDeviceTexture(loaded,info);resolve(true);if(disposed&&!textureCache){tex.dispose();return}invalidate()},undefined,()=>{resolve(false);invalidate()});if(textureCache)textureCache.set(cacheKey,tex);else textures.add(tex);}tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  if(!tex.userData.framePacked&&info.width&&info.height&&info.frame){const [x,y,fw,fh]=info.frame;tex.repeat.set(fw/info.width,fh/info.height);tex.offset.set(x/info.width,1-(y+fh)/info.height)}
  const material=preserveFaceColors?new T.MeshBasicMaterial({map:tex,toneMapped:false}):new T.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:.00015,roughness:.6,metalness:.12});material.userData.referenceColors=preserveFaceColors;materials.add(material);
  const segments=detail?Math.min(160,Math.max(32,Math.round(w/h*20))):1;const geo=new T.PlaneGeometry(w,h,segments,detail?Math.max(12,Math.round(segments*h/w)):1);geometries.add(geo);const face=new T.Mesh(geo,material);face.name='physical-face-'+side;face.position.z=(side==='rear'?-1:1)*(d/2+(detail?.0016:.0006));if(side==='rear')face.rotation.y=Math.PI;group.add(face);
  if(detail){let finished=false;refiners.push(()=>{if(finished||disposed)return true;const image=tex.image;if(!image?.width||!image?.height)return false;finished=true;try{const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d',{willReadFrequently:true}),frame=tex.userData.framePacked?[0,0,image.width,image.height]:info.frame||[0,0,image.width,image.height];ctx.drawImage(image,...frame,0,0,256,128);const pixels=ctx.getImageData(0,0,256,128).data,positions=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<positions.count;i++){const x=Math.min(255,Math.max(0,Math.round(uv.getX(i)*255))),y=Math.min(127,Math.max(0,Math.round((1-uv.getY(i))*127))),at=(y*256+x)*4,luma=(pixels[at]*.2126+pixels[at+1]*.7152+pixels[at+2]*.0722)/255;positions.setZ(i,-.0012*(1-luma));}positions.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();group.userData.surfaceRelief='image-derived approximate, not calibrated connector geometry';invalidate();}catch{}return true;});}
 }
 // Only declared/verified socket anchors become selectable 3D connectors.
 for(const a of model.physical?.anchors||[]){if(!a.verified)continue;const m=new T.MeshStandardMaterial({color:a.kind==='power'?0x22282b:0x254348,metalness:.6,roughness:.3});materials.add(m);const socket=box(a.width||.014,a.height||.01,.004,a.x,a.y,a.z,m);socket.userData.anchor=a;}
 if(detail&&dim.verified&&model.physical?.rackMount===true){for(const side of [-1,1]){box(.016,h,.002,side*(w/2+.008),0,d/2-.003);for(const y of [-h*.32,h*.32]){const geo=new T.CylinderGeometry(.002,.002,.0018,10);geometries.add(geo);const screw=new T.Mesh(geo,seam);screw.rotation.x=Math.PI/2;screw.position.set(side*(w/2+.008),y,d/2-.001);group.add(screw)}}}
 group.userData.dimensions=dim;
 return {group,dimensions:dim,refine:()=>{let done=true;for(const fn of refiners)if(fn()===false)done=false;return done;},ready:Promise.all(pending).then(v=>v.every(Boolean)),dispose(){if(disposed)return;disposed=true;textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}};
}
