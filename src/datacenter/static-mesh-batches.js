import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Bake immobile decoration into material/cell batches. Keep interactive objects,
// text, transparency, existing instances and moving ancestors independently addressable.
export function batchStaticMeshes(root,{isStatic,ownGeometry,cellSize=8}){
 root.updateMatrixWorld(true);const rows=new Map(),center=new T.Vector3();let before=0,after=0,combined=0;
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.name||o.userData.museumAction||o.userData.museumDeviceId||Array.isArray(o.material)||o.material.transparent||!isStatic(o))return;
  o.geometry.computeBoundingBox();o.geometry.boundingBox.getCenter(center).applyMatrix4(o.matrixWorld);const attrs=Object.keys(o.geometry.attributes).sort().join(','),key=[o.material.uuid,o.castShadow,o.receiveShadow,attrs,Math.floor(center.x/cellSize),Math.floor(center.z/cellSize)].join('|');const list=rows.get(key)||[];list.push(o);rows.set(key,list);before++;
 });
 for(const list of rows.values()){
  if(list.length<2){after++;continue;}
  const parts=list.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);return g;});
  const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  if(!geometry){after+=list.length;continue;}
  ownGeometry(geometry);const batch=new T.Mesh(geometry,list[0].material);batch.name='museum-static-cell';batch.castShadow=list[0].castShadow;batch.receiveShadow=list[0].receiveShadow;batch.userData.sourceParts=list.length;batch.matrixAutoUpdate=false;geometry.computeBoundingBox();geometry.computeBoundingSphere();root.add(batch);list.forEach(o=>o.removeFromParent());after++;combined+=list.length;
 }
 return {before,after,combined};
}
