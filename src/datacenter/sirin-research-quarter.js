import * as T from 'three';

// Apply the new parcel plan to both collision and the minimap. Roofs and the
// elevated bridge deliberately do not close the public courtyards below them.
export function researchNavigation(original,layout){
 const nav={...original,colliders:[],footprints:[]},removed=new Set(layout.replaces);
 original.colliders.forEach((b,i)=>{const f=original.footprints[i];if(!removed.has(f.object)){nav.colliders.push(b);nav.footprints.push(f);}});
 for(const building of layout.buildings)building.colliders.forEach((b,i)=>{
  const poly=building.atriumPolygon&&i===building.colliders.length-1?building.atriumPolygon:[[b[0],b[2]],[b[1],b[2]],[b[1],b[3]],[b[0],b[3]]];
  nav.colliders.push(b);nav.footprints.push({object:building.id+'_'+i,polygons:[poly]});
 });
 return nav;
}

// The old city is GPU-instanced, so removing a parent by name is insufficient.
// Compact individual instances inside the new paved parcels; shared geometry
// and every instance elsewhere in the city remain intact.
export function installResearchQuarter(cityRoot,newRoot,layout){
 cityRoot.updateMatrixWorld(true);
 const matrix=new T.Matrix4(),world=new T.Matrix4(),box=new T.Box3(),size=new T.Vector3();
 let retiredMeshes=0,retiredInstances=0;
 const intersects=b=>layout.buildings.some(({parcel:p})=>b.max.x>p[0]&&b.min.x<p[1]&&b.max.z>p[2]&&b.min.z<p[3]);
 const replaced=new Set(layout.replaces);
 cityRoot.traverse(o=>{if(replaced.has(o.name)){o.visible=false;retiredMeshes++;}});
 const objects=[];cityRoot.traverseVisible(o=>{if(o.isMesh)objects.push(o);});
 for(const o of objects){
  if(/TERRAIN|GROUND|WATER/i.test(o.name))continue;
  o.geometry.computeBoundingBox();const bounds=o.geometry.boundingBox;
  const occupies=transform=>{box.copy(bounds).applyMatrix4(transform);box.getSize(size);return size.x<90&&size.z<70&&intersects(box);};
  if(o.isInstancedMesh){
   let kept=0;const count=o.count;
   for(let i=0;i<count;i++){
    o.getMatrixAt(i,matrix);world.multiplyMatrices(o.matrixWorld,matrix);
    if(occupies(world)){retiredInstances++;continue;}
    if(kept!==i){o.setMatrixAt(kept,matrix);if(o.instanceColor){const color=new T.Color();o.getColorAt(i,color);o.setColorAt(kept,color);}}
    kept++;
   }
   o.count=kept;o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;
   o.computeBoundingBox();o.computeBoundingSphere();
  }else if(occupies(o.matrixWorld)){o.visible=false;retiredMeshes++;}
 }
 cityRoot.add(newRoot);newRoot.name='SIRIN original research quarter';
 const emissive=new Map();let batches=0,triangles=0;
 newRoot.traverse(o=>{if(!o.isMesh)return;batches++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;
  for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.emissive?.getHex()>0)emissive.set(m,m.emissiveIntensity);
 });
 let night=false;
 return {
  setNight(value){night=!!value;for(const [m,strength]of emissive)m.emissiveIntensity=night?strength:strength*.12;},
  stats:()=>({buildings:layout.buildings.map(b=>b.id),retiredMeshes,retiredInstances,batches,triangles,night,parcels:layout.buildings.map(b=>b.parcel)}),
 };
}
