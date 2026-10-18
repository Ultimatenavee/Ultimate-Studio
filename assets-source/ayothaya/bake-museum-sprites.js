// Offline capture only. The hall never imports or executes this renderer.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createDeviceModel} from '../../src/datacenter/device-model.js';
import {rackDisplayModel,rackRotation} from '../../src/datacenter/device-orientation.js';
import models from '../../src/datacenter/devices.json';
import optics from '../../src/datacenter/museum-optics.json';
window.bakeMuseum=async()=>{
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(384,384);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x7e8b93,2));const key=new T.DirectionalLight(0xfff6e3,3);key.position.set(3,5,5);scene.add(key);const fill=new T.DirectionalLight(0xd6edff,1.5);fill.position.set(-3,1,-2);scene.add(fill);
 const camera=new T.OrthographicCamera(-1,1,1,-1,.001,100),atlas=document.createElement('canvas');atlas.width=3072;atlas.height=2048;const ctx=atlas.getContext('2d'),scratch=document.createElement('canvas');scratch.width=scratch.height=384;const sc=scratch.getContext('2d',{willReadFrequently:true}),frames={};let index=0;
 async function capture(id,group,dispose){
  scene.add(group);group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(group),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),r=size.length()*.6;
  camera.left=camera.bottom=-r;camera.right=camera.top=r;camera.position.copy(center).add((id==='ro:verus-monitor'?new T.Vector3(0,0,1):new T.Vector3(.9,.6,1.7)).normalize().multiplyScalar(r*3));camera.lookAt(center);camera.updateProjectionMatrix();renderer.render(scene,camera);
  sc.clearRect(0,0,384,384);sc.drawImage(renderer.domElement,0,0);const pixels=sc.getImageData(0,0,384,384).data;let x0=384,y0=384,x1=0,y1=0;
  for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(pixels[(y*384+x)*4+3]>8){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<x0||y1<y0)throw Error('Empty capture: '+id);const w=x1-x0+1,h=y1-y0+1,s=248/Math.max(w,h),dw=Math.round(w*s),dh=Math.round(h*s),x=index%12*256+4,y=Math.floor(index/12)*256+4;
  ctx.drawImage(scratch,x0,y0,w,h,x,y,dw,dh);frames[id]={x,y,width:dw,height:dh,aspect:w/h};index++;group.removeFromParent();dispose?.();
 }
 for(const m of [...models,...optics]){const resource=createDeviceModel(m.category==='optic'?m:rackDisplayModel(m),{detail:true,preserveFaceColors:true});await resource.ready;resource.refine?.();if(m.category!=='optic')resource.group.rotation.y=rackRotation(m);await capture(m.id,resource.group,()=>resource.dispose());}
 const loader=new GLTFLoader();for(const id of ['plant','verus-monitor','lab-extinguisher']){const gltf=await loader.loadAsync('assets/ayothaya/decor/'+id+'.glb');await capture('ro:'+id,gltf.scene);}
 renderer.dispose();return {png:atlas.toDataURL('image/png').split(',')[1],manifest:{version:1,width:atlas.width,height:atlas.height,source:'Local device models/catalog imagery and Ragnarok decor GLBs; offline orthographic capture',frames}};
};
