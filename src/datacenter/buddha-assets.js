import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Independent from sculpture construction: lazy assets, distance/quality choice,
// and ownership of late asynchronous results. No traffic or engineering data.
const URLS=Object.freeze({walking:'/assets/sculpt/buddha-walking.glb?v=108',detail:'/assets/sculpt/buddha-detail.glb?v=108'});
const defaultLoad=url=>new GLTFLoader().loadAsync(url);
export function createBuddhaAssets({parent,fallback,load=defaultLoad}){
 let disposed=false,quality='balanced',near=false,dirty=false,active=null;
 const records=new Map(),pending=new Map(),errors=new Set(),point=new T.Vector3();
 function release(scene){const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}});scene.removeFromParent();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>{t.dispose();t.source?.data?.close?.();});}
 function wanted(){return near&&!['low','performance'].includes(quality)?'detail':'walking';}
 function show(){const next=records.get(wanted())||records.get('walking');if(!next)return;for(const r of records.values())r.visible=r===next;fallback.visible=false;if(active!==next){active=next;dirty=true;}}
 function request(kind){
  if(disposed||records.has(kind)||pending.has(kind)||errors.has(kind))return;
  const task=Promise.resolve().then(()=>load(URLS[kind])).then(result=>{
   const scene=result.scene||result;if(disposed){release(scene);return;}
   scene.name='blender-daibutsu-'+kind;scene.position.copy(fallback.position);scene.quaternion.copy(fallback.quaternion);scene.scale.copy(fallback.scale);
   scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});parent.add(scene);scene.updateMatrixWorld(true);scene.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});records.set(kind,scene);show();
   // Coarse first for a prompt arrival; detail is requested only near the altar.
   if(kind==='walking'&&wanted()==='detail')request('detail');
  }).catch(()=>{if(!disposed)errors.add(kind);}).finally(()=>pending.delete(kind));
  pending.set(kind,task);
 }
 request('walking');
 return {
  quality(value){quality=value;show();if(records.has('walking')&&wanted()==='detail')request('detail');},
  update(camera){if(disposed)return false;fallback.updateWorldMatrix(true,false);fallback.getWorldPosition(point);const d=camera?.position?.distanceTo(point)??Infinity;near=near?d<13:d<11;show();if(records.has('walking')&&wanted()==='detail')request('detail');const changed=dirty;dirty=false;return changed;},
  stats:()=>({active:active?.name||'native-fallback',loaded:[...records.keys()],loading:[...pending.keys()],failed:[...errors]}),
  async settled(){while(pending.size)await Promise.all([...pending.values()]);},
  dispose(){if(disposed)return;disposed=true;records.forEach(release);records.clear();}
 };
}
